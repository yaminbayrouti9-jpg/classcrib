import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import BehaviorPoint from "@/models/BehaviorPoint";
import Class from "@/models/Class";
import School from "@/models/School";
import User from "@/models/User";
import Transaction from "@/models/Transaction";
import Notification from "@/models/Notification";
import ParentLink from "@/models/ParentLink";
import { sendSchoolEmail } from "@/lib/email";

type TeacherSession = { id: string; role?: string };

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  const actor = session?.user as TeacherSession | undefined;
  if (!actor || actor.role !== "Teacher") return NextResponse.json({ error: "Teacher access required." }, { status: 403 });

  const body: unknown = await req.json();
  if (!body || typeof body !== "object") return NextResponse.json({ error: "Invalid behaviour award." }, { status: 400 });
  const { action = "award", classId, studentId, category, points, reason, idempotencyKey, recordId } =
    body as Record<string, unknown>;

  await dbConnect();
  if (action === "reverse") {
    if (typeof recordId !== "string" || !mongoose.isValidObjectId(recordId) ||
        typeof reason !== "string" || reason.trim().length < 5 || reason.trim().length > 500 ||
        typeof idempotencyKey !== "string" || idempotencyKey.length < 16 || idempotencyKey.length > 128) {
      return NextResponse.json({ error: "A record, reversal reason, and unique request key are required." }, { status: 400 });
    }
    const mongoSession = await mongoose.startSession();
    try {
      await mongoSession.withTransaction(async () => {
        const original = await BehaviorPoint.findOne({ _id: recordId, teacher: actor.id, status: "Approved", reversedAt: null }).session(mongoSession);
        if (!original) throw new Error("RECORD_NOT_REVERSIBLE");
        const targetClass = await Class.findOne({ _id: original.class, teacher: actor.id }).session(mongoSession);
        if (!targetClass) throw new Error("CLASS_ACCESS_REVOKED");
        original.reversedAt = new Date();
        original.reversedBy = new mongoose.Types.ObjectId(actor.id);
        await original.save({ session: mongoSession });

        const reverseCoins = -original.coinDelta;
        if (reverseCoins < 0) {
          const updated = await User.findOneAndUpdate(
            { _id: original.student, school: original.school, coins: { $gte: -reverseCoins } },
            { $inc: { coins: reverseCoins } },
            { new: true, session: mongoSession },
          );
          if (!updated) throw new Error("INSUFFICIENT_COINS_TO_REVERSE");
        } else if (reverseCoins > 0) {
          await User.updateOne({ _id: original.student, school: original.school }, { $inc: { coins: reverseCoins } }, { session: mongoSession });
        }
        await BehaviorPoint.create([{
          school: original.school,
          class: original.class,
          student: original.student,
          teacher: actor.id,
          category: `Reversal: ${original.category}`,
          points: -original.points,
          reason: reason.trim(),
          coinDelta: reverseCoins,
          idempotencyKey,
          reversalOf: original._id,
          status: "Approved",
        }], { session: mongoSession });
        if (reverseCoins !== 0) {
          await Transaction.create([{
            user: original.student,
            amount: reverseCoins,
            type: reverseCoins > 0 ? "Income" : "Expense",
            category: "Reward",
            description: `Behaviour point reversal: ${reason.trim()}`,
            reason: reason.trim(),
            awardedBy: actor.id,
            recipient: original.student,
          }], { session: mongoSession });
        }
      });
      return NextResponse.json({ success: true });
    } catch (error) {
      if ((error as { code?: number })?.code === 11000) return NextResponse.json({ error: "This reversal request was already processed." }, { status: 409 });
      if (error instanceof Error && error.message === "RECORD_NOT_REVERSIBLE") return NextResponse.json({ error: "This behaviour record is not available for reversal." }, { status: 404 });
      if (error instanceof Error && error.message === "CLASS_ACCESS_REVOKED") return NextResponse.json({ error: "You no longer manage this class." }, { status: 403 });
      if (error instanceof Error && error.message === "INSUFFICIENT_COINS_TO_REVERSE") return NextResponse.json({ error: "The student does not have enough coins to reverse the original deduction." }, { status: 409 });
      console.error("Behaviour reversal failed:", error);
      return NextResponse.json({ error: "Reversal failed; no partial changes were committed." }, { status: 500 });
    } finally {
      await mongoSession.endSession();
    }
  }

  if (action !== "award" ||
      typeof classId !== "string" || !mongoose.isValidObjectId(classId) ||
      typeof studentId !== "string" || !mongoose.isValidObjectId(studentId) ||
      typeof category !== "string" || category.trim().length < 1 || category.length > 80 ||
      !Number.isSafeInteger(points) || Number(points) === 0 || Math.abs(Number(points)) > 100 ||
      typeof reason !== "string" || reason.trim().length < 5 || reason.trim().length > 500 ||
      typeof idempotencyKey !== "string" || idempotencyKey.length < 16 || idempotencyKey.length > 128) {
    return NextResponse.json({ error: "Provide a valid class, student, category, non-zero whole point value, reason, and request key." }, { status: 400 });
  }
  const targetClass = await Class.findOne({ _id: classId, teacher: actor.id }).select("school students");
  if (!targetClass?.school || !targetClass.students.some((id) => id.toString() === studentId)) {
    return NextResponse.json({ error: "Student must belong to a school class you teach." }, { status: 403 });
  }
  const [school, student] = await Promise.all([
    School.findById(targetClass.school).select("settings.behavior"),
    User.findOne({ _id: studentId, school: targetClass.school, role: "Student" }).select("_id coins team"),
  ]);
  if (!school || !student) return NextResponse.json({ error: "School or student record not found." }, { status: 404 });
  const behaviorRules = school.settings.behavior;
  const allowedCategory = behaviorRules.categories.some((item: { name: string }) => item.name === category.trim());
  if (!allowedCategory) return NextResponse.json({ error: "Choose a behaviour category configured by your school." }, { status: 400 });

  const mongoSession = await mongoose.startSession();
  let approvalRequired = false;
  let coinDelta = 0;
  try {
    await mongoSession.withTransaction(async () => {
      const serializedStudent = await User.findOneAndUpdate(
        { _id: student._id, school: school._id },
        { $inc: { behaviorPointLockVersion: 1 } },
        { new: true, session: mongoSession },
      ).select("_id");
      if (!serializedStudent) throw new Error("STUDENT_NOT_FOUND");
      const startOfDay = new Date();
      startOfDay.setUTCHours(0, 0, 0, 0);
      const [dailyTotals] = await BehaviorPoint.aggregate([
        {
          $match: {
            student: student._id,
            status: "Approved",
            reversalOf: { $exists: false },
            reversedAt: null,
            createdAt: { $gte: startOfDay },
          },
        },
        { $group: {
          _id: null,
          points: { $sum: { $abs: "$points" } },
          deductions: { $sum: { $cond: [{ $lt: ["$coinDelta", 0] }, { $abs: "$coinDelta" }, 0] } },
          bonuses: { $sum: { $cond: [{ $gt: ["$coinDelta", 0] }, "$coinDelta", 0] } },
        } },
      ]).session(mongoSession);
      const pointsCapExceeded = Math.abs(Number(points)) > behaviorRules.maxPointsPerEntry ||
        (dailyTotals?.points || 0) + Math.abs(Number(points)) > behaviorRules.pointsPerStudentPerDay;
      if (pointsCapExceeded && behaviorRules.adminApprovalAboveCap) {
        approvalRequired = true;
        await BehaviorPoint.create([{
          school: school._id,
          class: targetClass._id,
          student: student._id,
          teacher: actor.id,
          category: category.trim(),
          points: Number(points),
          reason: reason.trim(),
          coinDelta: 0,
          idempotencyKey,
          status: "Pending",
        }], { session: mongoSession });
        await Notification.insertMany(await User.find({ school: school._id, role: "SchoolAdmin" }).distinct("_id").then((adminIds) =>
          adminIds.map((adminId) => ({
            recipient: adminId,
            sender: actor.id,
            type: "System",
            title: "Behaviour award requires approval",
            message: `A ${points}-point behaviour award requires review.`,
            link: "/school-admin",
          }))
        ), { session: mongoSession });
        return;
      }
      if (pointsCapExceeded) throw new Error("POINTS_DAILY_LIMIT");

      const requestedCoins = Number(points) < 0
        ? -Math.abs(Number(points)) * behaviorRules.coinsPerNegativePoint
        : Number(points) * behaviorRules.coinsPerPositivePoint;
      const dailyCoinUsage = requestedCoins < 0 ? dailyTotals?.deductions || 0 : dailyTotals?.bonuses || 0;
      const exceedsCoinLimit = requestedCoins < 0 &&
        dailyCoinUsage + Math.abs(requestedCoins) > behaviorRules.dailyCoinDeductionCap;
      if (exceedsCoinLimit && behaviorRules.adminApprovalAboveCap) {
        approvalRequired = true;
        await BehaviorPoint.create([{
          school: school._id,
          class: targetClass._id,
          student: student._id,
          teacher: actor.id,
          category: category.trim(),
          points: Number(points),
          reason: reason.trim(),
          coinDelta: 0,
          idempotencyKey,
          status: "Pending",
        }], { session: mongoSession });
        await Notification.insertMany(await User.find({ school: school._id, role: "SchoolAdmin" }).distinct("_id").then((adminIds) =>
          adminIds.map((adminId) => ({
            recipient: adminId,
            sender: actor.id,
            type: "System",
            title: "Behaviour coin deduction requires approval",
            message: "A behaviour award exceeds the daily coin deduction cap.",
            link: "/school-admin",
          }))
        ), { session: mongoSession });
        return;
      }
      if (exceedsCoinLimit) throw new Error("COIN_DAILY_LIMIT");

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
      coinDelta = requestedCoins;
      await BehaviorPoint.create([{
        school: school._id,
        class: targetClass._id,
        student: student._id,
        teacher: actor.id,
        category: category.trim(),
        points: Number(points),
        reason: reason.trim(),
        coinDelta: requestedCoins,
        idempotencyKey,
        status: "Approved",
      }], { session: mongoSession });
      if (requestedCoins !== 0) {
        await Transaction.create([{
          user: student._id,
          amount: requestedCoins,
          type: requestedCoins > 0 ? "Income" : "Expense",
          category: "Reward",
          description: `Behaviour award: ${reason.trim()}`,
          reason: reason.trim(),
          awardedBy: actor.id,
          recipient: student._id,
        }], { session: mongoSession });
      }
      await Notification.create([{
        recipient: student._id,
        sender: actor.id,
        type: "Reward",
        title: "Behaviour points updated",
        message: `${points} points: ${reason.trim()}`,
        link: "/achievements",
      }], { session: mongoSession });
    });
  } catch (error) {
    if ((error as { code?: number })?.code === 11000) return NextResponse.json({ error: "This behaviour request has already been processed." }, { status: 409 });
    if (error instanceof Error && error.message === "POINTS_DAILY_LIMIT") return NextResponse.json({ error: "School behaviour point limit reached for today." }, { status: 429 });
    if (error instanceof Error && error.message === "COIN_DAILY_LIMIT") return NextResponse.json({ error: "School behaviour coin limit reached for today." }, { status: 429 });
    if (error instanceof Error && error.message === "INSUFFICIENT_COINS") return NextResponse.json({ error: "Student does not have enough coins for the configured deduction." }, { status: 409 });
    if (error instanceof Error && error.message === "STUDENT_NOT_FOUND") return NextResponse.json({ error: "Student record no longer exists." }, { status: 404 });
    console.error("Behaviour award failed:", error);
    return NextResponse.json({ error: "Behaviour award failed; no partial changes were committed." }, { status: 500 });
  } finally {
    await mongoSession.endSession();
  }

  if (!approvalRequired) {
    const links = await ParentLink.find({ student: student._id, alerts: true }).populate("parent", "email").lean();
    for (const link of links) {
      const parentEmail = (link.parent as unknown as { email?: string } | null)?.email;
      if (!parentEmail) continue;
      try {
        await sendSchoolEmail({
          to: parentEmail,
          subject: "A behaviour point update was recorded",
          html: `<p>A behaviour point update was recorded for your child. Reason: ${reason.trim().replace(/[&<>"]/g, "")}.</p>`,
        });
      } catch (error) {
        console.error("Parent behaviour alert email failed:", error);
      }
    }
  }
  return NextResponse.json({ success: true, requiresApproval: approvalRequired, coinDelta });
}
