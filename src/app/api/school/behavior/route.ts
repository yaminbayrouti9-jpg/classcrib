import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import BehaviorPoint from "@/models/BehaviorPoint";
import User from "@/models/User";
import School from "@/models/School";
import Transaction from "@/models/Transaction";
import Notification from "@/models/Notification";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as { role?: string }).role !== "SchoolAdmin") {
    return NextResponse.json({ error: "School administrator access required." }, { status: 403 });
  }
  const schoolId = (session.user as { schoolId?: string }).schoolId;
  if (!schoolId) return NextResponse.json({ error: "School is not assigned to this account." }, { status: 403 });
  await dbConnect();
  const pending = await BehaviorPoint.find({ school: schoolId, status: "Pending" })
    .populate("student", "username displayName")
    .populate("teacher", "username displayName")
    .populate("class", "name")
    .sort({ createdAt: 1 })
    .lean();
  return NextResponse.json({ pending });
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
  const { recordId, decision } = body as Record<string, unknown>;
  if (typeof recordId !== "string" || !mongoose.isValidObjectId(recordId) || !["approve", "reject"].includes(String(decision))) {
    return NextResponse.json({ error: "Provide a pending record and approve/reject decision." }, { status: 400 });
  }

  await dbConnect();
  const mongoSession = await mongoose.startSession();
  try {
    await mongoSession.withTransaction(async () => {
      const record = await BehaviorPoint.findOne({ _id: recordId, school: schoolId, status: "Pending" }).session(mongoSession);
      if (!record) throw new Error("NOT_PENDING");
      if (decision === "reject") {
        record.status = "Rejected";
        record.rejectedBy = new mongoose.Types.ObjectId(adminId);
        await record.save({ session: mongoSession });
        return;
      }

      const school = await School.findById(schoolId).select("settings.behavior").session(mongoSession);
      const student = await User.findOne({ _id: record.student, school: schoolId, role: "Student" }).session(mongoSession);
      if (!school || !student) throw new Error("STUDENT_MISSING");
      const rules = school.settings.behavior;
      const requestedCoins = record.points < 0
        ? -Math.abs(record.points) * rules.coinsPerNegativePoint
        : record.points * rules.coinsPerPositivePoint;
      if (requestedCoins < 0) {
        const updated = await User.findOneAndUpdate(
          { _id: student._id, coins: { $gte: Math.abs(requestedCoins) } },
          { $inc: { coins: requestedCoins } },
          { new: true, session: mongoSession },
        );
        if (!updated) throw new Error("INSUFFICIENT_COINS");
      } else if (requestedCoins > 0) {
        await User.updateOne({ _id: student._id }, { $inc: { coins: requestedCoins } }, { session: mongoSession });
      }
      record.status = "Approved";
      record.approvedBy = new mongoose.Types.ObjectId(adminId);
      record.coinDelta = requestedCoins;
      await record.save({ session: mongoSession });
      if (requestedCoins !== 0) {
        await Transaction.create([{
          user: student._id,
          amount: requestedCoins,
          type: requestedCoins > 0 ? "Income" : "Expense",
          category: "Reward",
          description: `Approved behaviour award: ${record.reason}`,
          reason: record.reason,
          awardedBy: record.teacher,
          recipient: student._id,
        }], { session: mongoSession });
      }
      await Notification.create([{
        recipient: student._id,
        sender: adminId,
        type: "Reward",
        title: "Behaviour award approved",
        message: `${record.points} points: ${record.reason}`,
        link: "/achievements",
      }], { session: mongoSession });
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error && error.message === "NOT_PENDING") return NextResponse.json({ error: "This request is no longer pending." }, { status: 409 });
    if (error instanceof Error && error.message === "STUDENT_MISSING") return NextResponse.json({ error: "Student is no longer in this school." }, { status: 409 });
    if (error instanceof Error && error.message === "INSUFFICIENT_COINS") return NextResponse.json({ error: "Student balance is too low to approve the configured coin deduction." }, { status: 409 });
    console.error("Behaviour approval failed:", error);
    return NextResponse.json({ error: "Approval update failed; no partial changes were committed." }, { status: 500 });
  } finally {
    await mongoSession.endSession();
  }
}
