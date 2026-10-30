import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import Transaction from "@/models/Transaction";
import Notification from "@/models/Notification";
import Class from "@/models/Class";
import IdempotencyKey from "@/models/IdempotencyKey";
import RewardApproval from "@/models/RewardApproval";
import School from "@/models/School";
import { getLevelFromXp } from "@/lib/leveling";
import mongoose from "mongoose";

const DEFAULT_REWARD_RULE = {
  coinsPerAward: 500,
  xpPerAward: 1000,
  coinsPerStudentPerDay: 1000,
  xpPerStudentPerDay: 2000,
};

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== 'Teacher') {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const body = await req.json();
    const { studentIds, classId, coins, xp, badge, reason, idempotencyKey } = body;
    const taskType = body.taskType || "Homework";
    const teacherId = (session.user as any).id as string;

    if (!Array.isArray(studentIds) || studentIds.length === 0 || studentIds.length > 100 ||
        studentIds.some((id: unknown) => typeof id !== "string" || !mongoose.isValidObjectId(id))) {
      return NextResponse.json({ error: "Select between 1 and 100 valid students." }, { status: 400 });
    }
    if (new Set(studentIds).size !== studentIds.length) {
      return NextResponse.json({ error: "Duplicate student IDs are not allowed." }, { status: 400 });
    }
    if (!Number.isSafeInteger(coins) || coins < 0 || !Number.isSafeInteger(xp) || xp < 0 || (coins === 0 && xp === 0)) {
      return NextResponse.json({ error: "Coins and XP must be non-negative whole numbers, and at least one must be positive." }, { status: 400 });
    }
    if (typeof reason !== "string" || reason.trim().length < 5 || reason.trim().length > 500) {
      return NextResponse.json({ error: "A reason of 5 to 500 characters is required." }, { status: 400 });
    }
    if (!["Homework", "Green", "Physical", "Activity"].includes(taskType)) {
      return NextResponse.json({ error: "Choose a valid assignment type." }, { status: 400 });
    }
    if (badge !== undefined && badge !== null &&
        (typeof badge !== "object" || typeof badge.label !== "string" || badge.label.length > 80 ||
         typeof badge.icon !== "string" || badge.icon.length > 80 ||
         typeof badge.color !== "string" || badge.color.length > 40)) {
      return NextResponse.json({ error: "Badge details are invalid." }, { status: 400 });
    }
    if (typeof idempotencyKey !== "string" || idempotencyKey.length < 16 || idempotencyKey.length > 128) {
      return NextResponse.json({ error: "A valid request key is required. Please retry the award." }, { status: 400 });
    }
    if (!mongoose.isValidObjectId(classId)) {
      return NextResponse.json({ error: "A valid class is required." }, { status: 400 });
    }

    await dbConnect();
    const targetClass = await Class.findOne({ _id: classId, teacher: teacherId }).select("_id school students");
    if (!targetClass) return NextResponse.json({ error: "Class not found or you do not own it." }, { status: 403 });
    const classStudentIds = new Set(targetClass.students.map((id: mongoose.Types.ObjectId) => id.toString()));
    if (studentIds.some((id: string) => !classStudentIds.has(id))) {
      return NextResponse.json({ error: "Every selected student must belong to this class." }, { status: 403 });
    }
    const school = targetClass.school ? await School.findById(targetClass.school).select("settings.rewardsByTaskType") : null;
    const ruleKey = taskType.toLowerCase() as "homework" | "green" | "physical" | "activity";
    const rewardRule = school?.settings.rewardsByTaskType?.[ruleKey] ?? DEFAULT_REWARD_RULE;
    const exceedsAwardCap = coins > rewardRule.coinsPerAward || xp > rewardRule.xpPerAward;
    if (exceedsAwardCap && reason.trim().length < 20) {
      return NextResponse.json({ error: "Awards above the normal range need a detailed reason of at least 20 characters." }, { status: 400 });
    }

    const mongoSession = await mongoose.startSession();
    let approvalRequestId: mongoose.Types.ObjectId | null = null;
    try {
      await mongoSession.withTransaction(async () => {
        const startOfDay = new Date();
        startOfDay.setUTCHours(0, 0, 0, 0);
        const dailyAwards = await Transaction.aggregate([
          { $match: { user: { $in: studentIds.map((id: string) => new mongoose.Types.ObjectId(id)) }, source: { $in: ["teacher-award", "assignment-reward"] }, createdAt: { $gte: startOfDay } } },
          { $group: { _id: "$user", coins: { $sum: "$amount" }, xp: { $sum: "$xpAmount" } } },
        ]).session(mongoSession);
        const dailyTotals = new Map(dailyAwards.map((item) => [item._id.toString(), item]));
        const exceedsDailyCap = (studentIds as string[]).some((studentId) => {
          const current = dailyTotals.get(studentId);
          return (current?.coins || 0) + coins > rewardRule.coinsPerStudentPerDay ||
            (current?.xp || 0) + xp > rewardRule.xpPerStudentPerDay;
        });
        if (exceedsAwardCap || exceedsDailyCap) {
          if (!school) throw new Error("SCHOOL_APPROVAL_UNAVAILABLE");
          const [request] = await RewardApproval.create([{
            school: school._id,
            class: targetClass._id,
            teacher: teacherId,
            students: studentIds,
            coins,
            xp,
            taskType,
            badge,
            reason: reason.trim(),
            idempotencyKey,
            status: "Pending",
          }], { session: mongoSession });
          approvalRequestId = request._id;
          const admins = await User.find({ school: school._id, role: "SchoolAdmin" }).distinct("_id").session(mongoSession);
          if (admins.length) {
            await Notification.insertMany(admins.map((adminId) => ({
              recipient: adminId,
              sender: teacherId,
              title: "Teacher reward requires approval",
              message: `A ${coins}-coin / ${xp}-XP award for ${studentIds.length} students is awaiting review.`,
              type: "System",
              link: "/school-admin",
            })), { session: mongoSession });
          }
          return;
        }
        await IdempotencyKey.create([{
          key: idempotencyKey,
          actor: teacherId,
          operation: "teacher-reward",
        }], { session: mongoSession });

        for (const studentId of studentIds as string[]) {
          const updated = await User.findByIdAndUpdate(
            studentId,
            { $inc: { coins, xp } },
            { new: true, session: mongoSession }
          );
          if (!updated) throw new Error("A selected student no longer exists.");

          const correctLevel = getLevelFromXp(updated.xp || 0);
          if (updated.level !== correctLevel) {
            await User.updateOne({ _id: studentId }, { $set: { level: correctLevel } }, { session: mongoSession });
          }
          if (badge) {
            await User.updateOne({ _id: studentId }, {
              $push: { badges: { label: badge.label, icon: badge.icon, color: badge.color, awardedAt: new Date() } },
            }, { session: mongoSession });
          }
          await Transaction.create([{
            user: studentId,
            amount: coins,
            xpAmount: xp,
            type: "Income",
            description: reason.trim(),
            reason: reason.trim(),
            category: "Reward",
            source: "teacher-award",
            awardedBy: teacherId,
            awardedAt: new Date(),
          }], { session: mongoSession });
          await Notification.create([{
            recipient: studentId,
            sender: teacherId,
            title: "New Reward Received!",
            message: `You've been awarded ${coins} coins and ${xp} XP. Reason: ${reason.trim()}`,
            type: "Reward",
            link: "/achievements",
          }], { session: mongoSession });
        }
      });
    } finally {
      await mongoSession.endSession();
    }

    if (approvalRequestId) {
      return NextResponse.json({ success: true, requiresApproval: true, requestId: approvalRequestId }, { status: 202 });
    }
    return NextResponse.json({ success: true, count: studentIds.length });
  } catch (error: any) {
    if (error?.code === 11000) {
      return NextResponse.json({ error: "This reward request has already been processed." }, { status: 409 });
    }
    if (error instanceof Error && error.message === "SCHOOL_APPROVAL_UNAVAILABLE") {
      return NextResponse.json({ error: "This award exceeds current limits, but the class has no school administrator to approve it." }, { status: 422 });
    }
    console.error("Reward API Error:", error);
    return NextResponse.json({ error: "Failed to award students. No partial reward was committed." }, { status: 500 });
  }
}
