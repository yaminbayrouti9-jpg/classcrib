import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import Task from "@/models/Task";
import Workspace from "@/models/Workspace";
import Class from "@/models/Class";
import Submission from "@/models/Submission";
import Transaction from "@/models/Transaction";
import StudentDashboard from "@/components/student/StudentDashboard";
import TeacherDashboard from "@/components/teacher/TeacherDashboard";
import { redirect } from "next/navigation";
import { serialize } from "@/lib/serialize";
import { generateMixChallenge } from "@/lib/challenges";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    redirect("/login");
  }

  const userName = session?.user?.name || "Explorer";
  const userId = (session.user as any).id;

  await dbConnect();
  
  const userRecord: any = await User.findById(userId).lean();
  if (!userRecord) {
    redirect("/logout");
  }

  const role = userRecord.role;

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  if (role === "Teacher") {
    const workspaces = await Class.find({ teacher: userId })
      .populate("students", "username xp level coins")
      .lean();
    
    const workspaceIds = workspaces.map(ws => ws._id);
    
    const workspacesWithTasks = await Promise.all(workspaces.map(async (ws) => {
      const [recentTask, taskCount] = await Promise.all([
        Task.findOne({ class: ws._id }).sort({ createdAt: -1 }).select("title").lean(),
        Task.countDocuments({ class: ws._id })
      ]);
      return { ...ws, recentTask, taskCount };
    }));

    // Calculate Top Students across all workspaces
    const allStudents = workspaces.reduce((acc: any[], ws: any) => {
      return [...acc, ...(ws.students || [])];
    }, []);
    
    // Remove duplicates if a student is in multiple workspaces
    const uniqueStudents = Array.from(new Map(allStudents.map(s => [s._id.toString(), s])).values())
      .sort((a: any, b: any) => (b.xp || 0) - (a.xp || 0))
      .slice(0, 3);

    const submissionsLastWeek = await Submission.find({
      class: { $in: workspaceIds },
      createdAt: { $gte: sevenDaysAgo }
    }).select("createdAt").lean();

    const activityPulse = [0, 0, 0, 0, 0, 0, 0];
    submissionsLastWeek.forEach(s => {
      const dayIndex = Math.floor((new Date(s.createdAt).getTime() - sevenDaysAgo.getTime()) / (1000 * 3600 * 24));
      if (dayIndex >= 0 && dayIndex < 7) {
        activityPulse[dayIndex]++;
      }
    });

    const recentActivity = await Submission.find({ 
      class: { $in: workspaceIds },
      status: "Pending" 
    })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('student', 'username')
      .populate('task', 'title')
      .lean();

    const [pendingVerifications, approvedSubmissions] = await Promise.all([
      Submission.countDocuments({ class: { $in: workspaceIds }, status: "Pending" }),
      Submission.countDocuments({ class: { $in: workspaceIds }, status: "Approved" })
    ]);

    const possibleTaskCount = workspacesWithTasks.reduce((acc: number, curr: any) => 
      acc + (curr.taskCount * (curr.students?.length || 0)), 0
    );

    const avgCompletion = possibleTaskCount > 0 
      ? Math.round((approvedSubmissions / possibleTaskCount) * 100) 
      : 0;

    // Teacher Growth Data (All students' XP per week)
    const fourWeeksAgo = new Date();
    fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28);
    
    const teacherGrowthSubmissions = await Submission.find({ 
      class: { $in: workspaceIds }, 
      status: 'Approved', 
      verifiedAt: { $gte: fourWeeksAgo } 
    }).populate('task', 'xp').lean();

    const growthData = [
      { name: 'Week 1', xp: 0 },
      { name: 'Week 2', xp: 0 },
      { name: 'Week 3', xp: 0 },
      { name: 'Week 4', xp: 0 },
    ];

    teacherGrowthSubmissions.forEach((s: any) => {
      const weekIndex = Math.floor((new Date(s.verifiedAt).getTime() - fourWeeksAgo.getTime()) / (1000 * 3600 * 24 * 7));
      if (weekIndex >= 0 && weekIndex < 4) {
        growthData[weekIndex].xp += (s.task?.xp || 0);
      }
    });

    // Calculate Trends
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);

    // 1. Student Trend
    const recentStudentsCount = allStudents.filter((s: any) => 
      s.createdAt && new Date(s.createdAt) >= thirtyDaysAgo
    ).length;
    const studentTrend = allStudents.length > 0 
      ? `+${Math.round((recentStudentsCount / allStudents.length) * 100)}% this month`
      : "Steady";

    // 2. Completion Trend (Current week vs Previous week)
    const [approvedPrevWeek, totalPrevWeek] = await Promise.all([
      Submission.countDocuments({ 
        class: { $in: workspaceIds }, 
        status: "Approved", 
        verifiedAt: { $gte: fourteenDaysAgo, $lt: sevenDaysAgo } 
      }),
      Task.countDocuments({ 
        $or: [
          { class: { $in: workspaceIds } },
          { workspace: { $in: workspaceIds } }
        ],
        createdAt: { $lt: sevenDaysAgo } 
      })
        .then(count => count * (uniqueStudents.length || 1)) // Approximation
    ]);
    
    const prevAvgCompletion = totalPrevWeek > 0 ? (approvedPrevWeek / totalPrevWeek) * 100 : 0;
    const completionDiff = avgCompletion - prevAvgCompletion;
    const completionTrend = completionDiff >= 0 
      ? `+${completionDiff.toFixed(1)}% vs last week` 
      : `${completionDiff.toFixed(1)}% vs last week`;

    // 3. Verification Trend
    const pendingYesterday = await Submission.countDocuments({ 
      class: { $in: workspaceIds }, 
      status: "Pending", 
      createdAt: { $lt: yesterday } 
    });
    const verificationDiff = pendingVerifications - pendingYesterday;
    const verificationTrend = verificationDiff >= 0 
      ? `+${verificationDiff} since yesterday` 
      : `${verificationDiff} since yesterday`;

    // 4. Engagement Rate (Logged in last 7 days)
    const activeStudentsCount = allStudents.filter((s: any) => 
      s.lastLogin && new Date(s.lastLogin) >= sevenDaysAgo
    ).length;
    const engagementRate = allStudents.length > 0 
      ? Math.round((activeStudentsCount / allStudents.length) * 100)
      : 0;
    
    // Engagement Trend (compared to 30 days ago - just a placeholder or relative to a fixed baseline for now)
    const engagementTrend = engagementRate >= 90 ? "Peak efficiency" : engagementRate >= 70 ? "High activity" : "Needs attention";

    return (
      <TeacherDashboard 
        userRecord={serialize(userRecord)} 
        workspaces={serialize(workspacesWithTasks)} 
        pendingVerifications={pendingVerifications} 
        avgCompletion={`${avgCompletion}%`}
        recentActivity={serialize(recentActivity)}
        topStudents={serialize(uniqueStudents)}
        activityPulse={activityPulse}
        growthData={growthData}
        studentTrend={studentTrend}
        completionTrend={completionTrend}
        verificationTrend={verificationTrend}
        engagementRate={`${engagementRate}%`}
        engagementTrend={engagementTrend}
      />
    );
  } else {
    // Student Logic
    const now = new Date();
    const lastLogin = new Date(userRecord.lastLogin || userRecord.createdAt || now);
    const diffDays = Math.floor((now.getTime() - lastLogin.getTime()) / (1000 * 3600 * 24));
    
    let needsUpdate = false;
    const updateData: any = {};

    if (diffDays > 0) {
      const multipliers = Math.pow(1.02, Math.min(diffDays, 7));
      if (userRecord.assets) {
        userRecord.assets.gold = Math.floor((userRecord.assets.gold || 0) * multipliers);
        userRecord.assets.business = Math.floor((userRecord.assets.business || 0) * multipliers);
        userRecord.assets.property = Math.floor((userRecord.assets.property || 0) * multipliers);
        updateData.assets = userRecord.assets;
      }
      userRecord.lastLogin = now;
      updateData.lastLogin = now;
      needsUpdate = true;
    }


    const lastReset = userRecord.lastChallengeReset || userRecord.createdAt || now;
    if (Math.floor((now.getTime() - new Date(lastReset).getTime()) / (1000 * 3600 * 24)) >= 7 || !userRecord.currentChallenge || userRecord.currentChallenge.length === 0) {
      userRecord.currentChallenge = generateMixChallenge();
      userRecord.lastChallengeReset = now;
      updateData.currentChallenge = userRecord.currentChallenge;
      updateData.lastChallengeReset = now;
      needsUpdate = true;
    }

    if (needsUpdate) {
      await User.findByIdAndUpdate(userId, updateData);
    }

    // Find all workspaces/classes the student is in
    const [joinedLegacy, joinedNew] = await Promise.all([
      Workspace.find({ students: userId }).select('_id').lean(),
      Class.find({ students: userId }).select('_id').lean()
    ]);
    const allWorkspaceIds = [...joinedLegacy.map(w => w._id), ...joinedNew.map(c => c._id)];

    const tasks = await Task.find({ 
      $or: [
        { workspace: { $in: allWorkspaceIds } },
        { class: { $in: allWorkspaceIds } }
      ]
    })
    .sort({ dueDate: 1 })
    .limit(4)
    .lean();

    const fourWeeksAgo = new Date();
    fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28);

    const [fullWorkspaces, recentTransactions, topGlobalStudents, personalSubmissions, growthSubmissions, userRank] = await Promise.all([
      Promise.all([
        Workspace.find({ _id: { $in: allWorkspaceIds } }).select('students name').lean(),
        Class.find({ _id: { $in: allWorkspaceIds } }).select('students name').lean()
      ]).then(([ws, cls]) => [...ws, ...cls]),
      Transaction.find({ user: userId }).sort({ createdAt: -1 }).limit(10).lean(),
      User.find({ role: 'Student' }).sort({ xp: -1 }).limit(5).select('username xp level role').lean(),
      Submission.find({ student: userId, createdAt: { $gte: sevenDaysAgo } }).select('createdAt').lean(),
      Submission.find({ 
        student: userId, 
        status: 'Approved', 
        verifiedAt: { $gte: fourWeeksAgo } 
      }).populate('task', 'xp').lean(),
      User.countDocuments({ role: 'Student', xp: { $gt: userRecord.xp } }).then(c => c + 1)
    ]);


    // Calculate Growth Data (Personal XP per week)
    const growthData = [
      { name: 'Week 1', xp: 0 },
      { name: 'Week 2', xp: 0 },
      { name: 'Week 3', xp: 0 },
      { name: 'Week 4', xp: 0 },
    ];

    growthSubmissions.forEach((s: any) => {
      const weekIndex = Math.floor((new Date(s.verifiedAt).getTime() - fourWeeksAgo.getTime()) / (1000 * 3600 * 24 * 7));
      if (weekIndex >= 0 && weekIndex < 4) {
        growthData[weekIndex].xp += (s.task?.xp || 0);
      }
    });

    // Personal Activity Pulse
    const personalPulse = [0, 0, 0, 0, 0, 0, 0];
    personalSubmissions.forEach(s => {
      const dayIndex = Math.floor((new Date(s.createdAt).getTime() - sevenDaysAgo.getTime()) / (1000 * 3600 * 24));
      if (dayIndex >= 0 && dayIndex < 7) {
        personalPulse[dayIndex]++;
      }
    });

    // Neighborhood Activity (Recent approved submissions in user's workspaces)
    const neighborhoodActivity = await Submission.find({
      $or: [
        { workspace: { $in: allWorkspaceIds } },
        { class: { $in: allWorkspaceIds } }
      ],
      status: 'Approved'
    })
    .sort({ createdAt: -1 })
    .limit(5)
    .populate('student', 'username')
    .lean();

    const neighborhoodFormatted = neighborhoodActivity.map(s => ({
      user: (s.student as any)?.username || 'Anonymous',
      action: 'completed an assignment',
      time: new Date(s.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }));

    const updatedUserRecord = { 
      ...userRecord, 
      fullWorkspaces,
      recentTransactions,
      rank: userRank
    };


    return (
      <StudentDashboard 
        userRecord={serialize(updatedUserRecord)} 
        tasks={serialize(tasks)} 
        userName={userName}
        topStudents={serialize(topGlobalStudents)}
        personalPulse={personalPulse}
        neighborhoodActivity={neighborhoodFormatted}
        growthData={growthData}
      />
    );
  }
}
