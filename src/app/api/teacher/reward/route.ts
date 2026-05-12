import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import Transaction from "@/models/Transaction";
import Notification from "@/models/Notification";
import { getLevelFromXp } from "@/lib/leveling";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any).role !== 'Teacher') {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await dbConnect();
  const { studentIds, coins, xp, badge, reason } = await req.json();

  if (!studentIds || !Array.isArray(studentIds) || studentIds.length === 0) {
    return NextResponse.json({ error: "No students selected" }, { status: 400 });
  }

  try {
    const results = await Promise.all(studentIds.map(async (studentId) => {
      const student = await User.findById(studentId);
      if (!student) return null;

      // Update student stats
      student.coins += (Number(coins) || 0);
      student.xp += (Number(xp) || 0);
      
      // Update Level
      student.level = getLevelFromXp(student.xp);

      if (badge) {
        student.badges.push({
          label: badge.label,
          icon: badge.icon,
          color: badge.color,
          awardedAt: new Date()
        });
      }

      const updatedStudent = await student.save();

      // Create Transaction for coins if any
      if (coins > 0) {
        await Transaction.create({
          user: studentId,
          amount: coins,
          type: 'Income',
          description: reason || `Reward from teacher: ${badge?.label || 'Bonus'}`,
          category: 'Reward'
        });
      }

      // Create Notification
      await Notification.create({
        recipient: studentId,
        title: "New Reward Received! 🎉",
        message: `You've been awarded ${coins} coins, ${xp} XP${badge ? ` and the ${badge.label} badge` : ''} by your teacher. Reason: ${reason || 'Great work!'}`,
        type: 'Reward',
        link: '/achievements'
      });

      return updatedStudent;
    }));

    return NextResponse.json({ success: true, count: results.filter(r => r !== null).length });
  } catch (error: any) {
    console.error("Reward API Error:", error);
    return NextResponse.json({ error: "Failed to award students" }, { status: 500 });
  }
}
