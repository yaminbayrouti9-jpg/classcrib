import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import Class from "@/models/Class";
import Task from "@/models/Task";
import Submission from "@/models/Submission";
import User from "@/models/User";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as { role?: string }).role !== "SchoolAdmin") {
    return NextResponse.json({ error: "School administrator access required." }, { status: 403 });
  }
  const schoolId = (session.user as { schoolId?: string }).schoolId;
  if (!schoolId || !mongoose.isValidObjectId(schoolId)) {
    return NextResponse.json({ error: "School is not assigned to this account." }, { status: 403 });
  }
  await dbConnect();

  const classes = await Class.find({ school: schoolId }).select("_id name students").lean();
  const classIds = classes.map((item) => item._id);
  const classById = new Map(classes.map((item) => [item._id.toString(), item]));
  const studentIds = [...new Set(classes.flatMap((item) => item.students.map((id) => id.toString())))];
  const taskFilter = { $or: [{ class: { $in: classIds } }, { classes: { $in: classIds } }] };
  const [tasks, teacherCount, students, submissions] = await Promise.all([
    Task.find(taskFilter).select("_id class classes assignedStudents dueDate").lean(),
    User.countDocuments({ school: schoolId, role: "Teacher" }),
    User.find({ _id: { $in: studentIds }, role: "Student", school: schoolId }).select("_id username displayName xp").sort({ xp: -1 }).lean(),
    Submission.find({ task: { $in: await Task.find(taskFilter).distinct("_id") } })
      .select("task student status createdAt")
      .lean(),
  ]);
  const taskSubmissions = new Map<string, typeof submissions>();
  for (const submission of submissions) {
    const taskId = submission.task.toString();
    const existing = taskSubmissions.get(taskId) || [];
    existing.push(submission);
    taskSubmissions.set(taskId, existing);
  }

  let assignmentSeats = 0;
  let completedSeats = 0;
  let overdueCount = 0;
  for (const task of tasks) {
    const targetClassIds = task.classes?.length ? task.classes : task.class ? [task.class] : [];
    const eligibleIds = task.assignedStudents?.length
      ? task.assignedStudents.map((id) => id.toString())
      : [...new Set(targetClassIds.flatMap((classId) => classById.get(classId.toString())?.students.map((id) => id.toString()) || []))];
    assignmentSeats += eligibleIds.length;
    const approvedIds = new Set((taskSubmissions.get(task._id.toString()) || [])
      .filter((submission) => submission.status === "Approved")
      .map((submission) => submission.student.toString()));
    completedSeats += eligibleIds.filter((studentId) => approvedIds.has(studentId)).length;
    if (new Date(task.dueDate) < new Date() && eligibleIds.some((studentId) => !approvedIds.has(studentId))) overdueCount += 1;
  }

  const now = new Date();
  const todayStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const thisWeekStart = new Date(todayStart.getTime() - 6 * 24 * 60 * 60 * 1000);
  const previousWeekStart = new Date(thisWeekStart.getTime() - 7 * 24 * 60 * 60 * 1000);
  const activeThisWeek = new Set(submissions
    .filter((submission) => submission.createdAt >= thisWeekStart)
    .map((submission) => submission.student.toString()));
  const activePreviousWeek = new Set(submissions
    .filter((submission) => submission.createdAt >= previousWeekStart && submission.createdAt < thisWeekStart)
    .map((submission) => submission.student.toString()));
  const completionRate = assignmentSeats ? Math.round((completedSeats / assignmentSeats) * 100) : null;
  const engagementRate = students.length ? Math.round((activeThisWeek.size / students.length) * 100) : null;
  const engagementChange = activePreviousWeek.size
    ? Math.round(((activeThisWeek.size - activePreviousWeek.size) / activePreviousWeek.size) * 1000) / 10
    : null;
  const activityPulse = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(thisWeekStart.getTime() + index * 24 * 60 * 60 * 1000);
    const nextDate = new Date(date.getTime() + 24 * 60 * 60 * 1000);
    const count = submissions.filter((submission) => submission.createdAt >= date && submission.createdAt < nextDate).length;
    return { date: date.toISOString().slice(0, 10), submissions: count };
  });

  return NextResponse.json({
    summary: {
      studentCount: students.length,
      teacherCount,
      classCount: classes.length,
      taskCount: tasks.length,
      approvedCount: completedSeats,
      assignmentSeats,
      completionRate,
      overdueCount,
      activeStudentsThisWeek: activeThisWeek.size,
      engagementRate,
      engagementChange,
      engagementHasComparison: activePreviousWeek.size > 0,
      activityPulse,
      hallOfFame: students.slice(0, 5).map((student) => ({
        studentName: student.displayName || student.username,
        xp: student.xp || 0,
      })),
    },
  });
}
