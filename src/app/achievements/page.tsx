import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import { redirect } from "next/navigation";
import { serialize } from "@/lib/serialize";
import AchievementsView from "@/components/student/AchievementsView";
import { getLevelFromXp } from "@/lib/leveling";

export default async function AchievementsPage() {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    redirect("/login");
  }

  await dbConnect();
  const userId = (session.user as any).id;
  
  const user = await User.findById(userId).lean();

  if (!user) {
    redirect("/login");
  }

  const userRank = await User.countDocuments({ role: 'Student', xp: { $gt: user.xp || 0 } }).then(c => c + 1);
  const correctLevel = getLevelFromXp(user.xp || 0);
  
  // Count completed tasks
  const Transaction = (await import("@/models/Transaction")).default;
  const tasksCompleted = await Transaction.countDocuments({ 
    user: userId, 
    category: 'Task',
    type: 'Income'
  });

  const userWithRank = { 
    ...user, 
    rank: userRank,
    level: correctLevel,
    tasksCompleted
  };

  return (
    <div className="min-h-screen">
      <AchievementsView user={serialize(userWithRank)} />
    </div>
  );
}
