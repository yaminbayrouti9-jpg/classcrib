import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import ParentLink from "@/models/ParentLink";
import Task from "@/models/Task";
import Submission from "@/models/Submission";
import BehaviorPoint from "@/models/BehaviorPoint";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as { role?: string }).role !== "Parent") {
    return NextResponse.json({ error: "Parent account access required." }, { status: 403 });
  }
  await dbConnect();
  const parentId = (session.user as { id: string }).id;
  const links = await ParentLink.find({ parent: parentId })
    .populate("student", "displayName username workspaces classes schoolYear team")
    .populate("school", "name settings.parentWeeklyEmailEnabled")
    .lean();
  const overview = await Promise.all(links.map(async (link) => {
    if (!link.student) return null;
    const student = link.student as unknown as { _id: string; displayName?: string; username: string; workspaces?: string[]; classes?: string[]; schoolYear?: string; team?: string };
    const classIds = student.workspaces?.length ? student.workspaces : student.classes || [];
    const tasks = await Task.find(classIds.length
      ? { $or: [{ class: { $in: classIds } }, { workspace: { $in: classIds } }, { classes: { $in: classIds } }] }
      : { _id: { $in: [] } })
      .select("_id title dueDate type assignedStudents")
      .sort({ dueDate: 1 })
      .limit(100)
      .lean();
    const targetedTasks = tasks.filter((task) => !task.assignedStudents?.length || task.assignedStudents.some((id) => id.toString() === student._id));
    const submissions = await Submission.find({ student: student._id, task: { $in: targetedTasks.map((task) => task._id) } }).select("task status").lean();
    const statusByTask = new Map(submissions.map((submission) => [submission.task.toString(), submission.status]));
    const assignments = targetedTasks.map((task) => ({
      id: task._id,
      title: task.title,
      dueDate: task.dueDate,
      type: task.type,
      status: statusByTask.get(task._id.toString()) || (new Date(task.dueDate) < new Date() ? "Overdue" : "Active"),
    }));
    const [behavior, [behaviorSummary]] = await Promise.all([
      BehaviorPoint.find({ student: student._id, status: "Approved", reversedAt: null })
        .select("category points reason createdAt").sort({ createdAt: -1 }).limit(50).lean(),
      BehaviorPoint.aggregate([
        { $match: { student: new mongoose.Types.ObjectId(student._id), status: "Approved", reversedAt: null } },
        { $group: { _id: null, total: { $sum: "$points" } } },
      ]),
    ]);
    return {
      student: { id: student._id, displayName: student.displayName || student.username, schoolYear: student.schoolYear, team: student.team },
      school: link.school,
      assignments,
      behavior,
      behaviorTotal: behaviorSummary?.total || 0,
      preferences: { weeklyEmail: link.weeklyEmail, alerts: link.alerts },
      weeklyEmailEnabled: (link.school as unknown as { settings?: { parentWeeklyEmailEnabled?: boolean } } | null)?.settings?.parentWeeklyEmailEnabled === true,
    };
  }));
  return NextResponse.json({ students: overview.filter(Boolean) });
}

export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user || (session.user as { role?: string }).role !== "Parent") {
    return NextResponse.json({ error: "Parent account access required." }, { status: 403 });
  }
  const body: unknown = await req.json();
  if (!body || typeof body !== "object") return NextResponse.json({ error: "Invalid preferences." }, { status: 400 });
  const { studentId, weeklyEmail, alerts } = body as Record<string, unknown>;
  if (typeof studentId !== "string" || typeof weeklyEmail !== "boolean" || typeof alerts !== "boolean") {
    return NextResponse.json({ error: "Provide studentId and boolean email preferences." }, { status: 400 });
  }
  await dbConnect();
  const link = await ParentLink.findOne({ parent: (session.user as { id: string }).id, student: studentId }).populate("school", "settings.parentWeeklyEmailEnabled");
  if (!link) return NextResponse.json({ error: "Parent link not found." }, { status: 404 });
  const schoolSettings = link.school as unknown as { settings?: { parentWeeklyEmailEnabled?: boolean } } | null;
  if (weeklyEmail && schoolSettings?.settings?.parentWeeklyEmailEnabled !== true) {
    return NextResponse.json({ error: "Weekly parent emails are disabled by the school." }, { status: 403 });
  }
  const updated = await ParentLink.findOneAndUpdate(
    { parent: (session.user as { id: string }).id, student: studentId },
    { $set: { weeklyEmail, alerts } },
    { new: true },
  );
  if (!updated) return NextResponse.json({ error: "Parent link not found." }, { status: 404 });
  return NextResponse.json({ success: true });
}
