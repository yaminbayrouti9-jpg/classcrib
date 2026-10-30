import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import RewardApproval from "@/models/RewardApproval";
import User from "@/models/User";
import Class from "@/models/Class";
import Transaction from "@/models/Transaction";
import Notification from "@/models/Notification";
import { getLevelFromXp } from "@/lib/leveling";
import Submission from "@/models/Submission";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as { role?: string }).role !== "SchoolAdmin") {
    return NextResponse.json({ error: "School administrator access required." }, { status: 403 });
  }
  const schoolId = (session.user as { schoolId?: string }).schoolId;
  if (!schoolId) return NextResponse.json({ error: "School is not assigned to this account." }, { status: 403 });
  await dbConnect();
  const requests = await RewardApproval.find({ school: schoolId, status: "Pending" })
    .populate("teacher", "username displayName")
    .populate("class", "name")
    .populate("students", "username displayName")
    .sort({ createdAt: 1 })
    .lean();
  const studentIds = await User.find({ school: schoolId, role: "Student" }).distinct("_id");
  const cursorId = new URL(req.url).searchParams.get("before");
  const baseHistoryFilter = {
    user: { $in: studentIds },
    source: { $in: ["teacher-award", "assignment-reward"] },
  };
  const cursor = cursorId && mongoose.isValidObjectId(cursorId)
    ? await Transaction.findOne({ ...baseHistoryFilter, _id: cursorId }).select("_id createdAt").lean()
    : null;
  if (cursorId && !cursor) return NextResponse.json({ error: "Invalid reward history cursor." }, { status: 400 });
  const historyFilter = cursor
    ? {
      ...baseHistoryFilter,
      $or: [
        { createdAt: { $lt: cursor.createdAt } },
        { createdAt: cursor.createdAt, _id: { $lt: cursor._id } },
      ],
    }
    : baseHistoryFilter;
  const historyPage = await Transaction.find(historyFilter)
    .populate("user", "username displayName")
    .populate("awardedBy", "username displayName")
    .select("user awardedBy amount xpAmount reason description source createdAt")
    .sort({ createdAt: -1, _id: -1 })
    .limit(51)
    .lean();
  return NextResponse.json({
    requests,
    history: historyPage.slice(0, 50),
    hasMoreHistory: historyPage.length > 50,
  });
}

export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as { role?: string }).role !== "SchoolAdmin") {
    return NextResponse.json({ error: "School administrator access required." }, { status: 403 });
  }
  const adminId = (session.user as { id: string }).id;
  const schoolId = (session.user as { schoolId?: string }).schoolId;
  if (!schoolId) return NextResponse.json({ error: "School is not assigned to this account." }, { status: 403 });
  const body: unknown = await req.json();
  if (!body || typeof body !== "object") return NextResponse.json({ error: "Invalid approval request." }, { status: 400 });
  const { requestId, decision } = body as Record<string, unknown>;
  if (typeof requestId !== "string" || !mongoose.isValidObjectId(requestId) ||
      !["approve", "reject"].includes(String(decision))) {
    return NextResponse.json({ error: "Provide a reward request and approve/reject decision." }, { status: 400 });
  }

  await dbConnect();
  const mongoSession = await mongoose.startSession();
  try {
    await mongoSession.withTransaction(async () => {
      const request = await RewardApproval.findOne({ _id: requestId, school: schoolId, status: "Pending" }).session(mongoSession);
      if (!request) throw new Error("NOT_PENDING");
      if (decision === "reject") {
        if (request.source === "assignment" && request.submission) {
          const submission = await Submission.findOneAndUpdate(
            { _id: request.submission, status: "Approved", rewardStatus: "PendingApproval" },
            { $set: { rewardStatus: "Rejected" } },
            { new: true, session: mongoSession },
          );
          if (!submission) throw new Error("SUBMISSION_NOT_PENDING");
          await Notification.create([{
            recipient: submission.student,
            sender: adminId,
            type: "Verification",
            title: "Assignment reward not approved",
            message: "Your assignment was approved, but its reward was not approved by the school administrator.",
            link: "/tasks",
          }], { session: mongoSession });
        }
        request.status = "Rejected";
        request.decidedBy = new mongoose.Types.ObjectId(adminId);
        request.decidedAt = new Date();
        await request.save({ session: mongoSession });
        return;
      }

      const targetClass = await Class.findOne({ _id: request.class, school: schoolId }).select("students").session(mongoSession);
      if (!targetClass || (request.students as mongoose.Types.ObjectId[]).some((studentId) => !targetClass.students.some((classStudent) => classStudent.toString() === studentId.toString()))) {
        throw new Error("CLASS_MEMBERSHIP_CHANGED");
      }
      const assignmentSubmission = request.source === "assignment" && request.submission
        ? await Submission.findOne({ _id: request.submission, status: "Approved", rewardStatus: "PendingApproval" }).session(mongoSession)
        : null;
      if (request.source === "assignment" && !assignmentSubmission) throw new Error("SUBMISSION_NOT_PENDING");
      for (const studentId of request.students as mongoose.Types.ObjectId[]) {
        const student = await User.findOneAndUpdate(
          { _id: studentId, school: schoolId, role: "Student" },
          { $inc: { coins: request.coins, xp: request.xp } },
          { new: true, session: mongoSession },
        );
        if (!student) throw new Error("STUDENT_MISSING");
        const level = getLevelFromXp(student.xp || 0);
        if (student.level !== level) {
          await User.updateOne({ _id: student._id }, { $set: { level } }, { session: mongoSession });
        }
        if (request.badge && typeof request.badge === "object") {
          await User.updateOne({ _id: student._id }, { $push: { badges: { ...request.badge, awardedAt: new Date() } } }, { session: mongoSession });
        }
        await Transaction.create([{
          user: student._id,
          amount: request.coins,
          xpAmount: request.xp,
          type: "Income",
          description: request.reason,
          reason: request.reason,
          category: request.source === "assignment" ? "Task" : "Reward",
          source: request.source === "assignment" ? "assignment-reward" : "teacher-award",
          awardedBy: request.teacher,
          awardedAt: new Date(),
        }], { session: mongoSession });
        await Notification.create([{
          recipient: student._id,
          sender: request.teacher,
          title: "New reward approved",
          message: `You've been awarded ${request.coins} coins and ${request.xp} XP. Reason: ${request.reason}`,
          type: "Reward",
          link: "/achievements",
        }], { session: mongoSession });
      }
      if (assignmentSubmission) {
        assignmentSubmission.rewardStatus = "Awarded";
        await assignmentSubmission.save({ session: mongoSession });
      }
      request.status = "Approved";
      request.decidedBy = new mongoose.Types.ObjectId(adminId);
      request.decidedAt = new Date();
      await request.save({ session: mongoSession });
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error && error.message === "NOT_PENDING") return NextResponse.json({ error: "This reward request is no longer pending." }, { status: 409 });
    if (error instanceof Error && error.message === "CLASS_MEMBERSHIP_CHANGED") return NextResponse.json({ error: "Selected students are no longer in the requested class." }, { status: 409 });
    if (error instanceof Error && error.message === "STUDENT_MISSING") return NextResponse.json({ error: "A student is no longer in your school." }, { status: 409 });
    if (error instanceof Error && error.message === "SUBMISSION_NOT_PENDING") return NextResponse.json({ error: "The assignment reward is no longer pending." }, { status: 409 });
    console.error("Reward approval failed:", error);
    return NextResponse.json({ error: "Approval update failed; no partial rewards were committed." }, { status: 500 });
  } finally {
    await mongoSession.endSession();
  }
}
