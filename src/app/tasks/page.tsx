// Force every request to be server-rendered so session is always available.
// This fixes the "server error 621218007" on direct URL load or refresh.
export const dynamic = "force-dynamic";

import TaskList from "@/components/student/TaskList";
import CribbyTip from "@/components/ai/CribbyTip";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import Task from "@/models/Task";
import Submission from "@/models/Submission";
import User from "@/models/User";
import Class from "@/models/Class";
import { Zap } from "lucide-react";
import TeacherTaskClient from "@/components/teacher/TeacherTaskClient";
import { serialize } from "@/lib/serialize";
import { redirect } from "next/navigation";

export default async function TasksPage() {
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect("/login");
  }

  const sessionUser = session.user as { id?: string; role?: string };
  const role = sessionUser.role || "Student";
  const userId = sessionUser.id;

  if (!userId) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-slate-500 font-medium">Session error. Please log in again.</p>
      </div>
    );
  }

  await dbConnect();

  const userRecord = await User.findById(userId).select("workspaces classes").lean();

  if (role === "Teacher") {
    const createdTasks = await Task.find({ creator: userId })
      .populate({ path: 'class', model: Class, select: 'name students' })
      .populate({ path: 'classes', model: Class, select: 'name students' })
      .sort({ createdAt: -1 })
      .lean();

    return (
      <div className="max-w-7xl mx-auto p-6 md:p-10 animate-fade-in pb-24">
        <TeacherTaskClient initialTasks={serialize(createdTasks)} />
      </div>
    );
  }

  // Student View
  const userClasses = userRecord?.workspaces?.length ? userRecord.workspaces : userRecord?.classes || [];
  const filteredTasks = userClasses.length
    ? await Task.find({
      $and: [
        { $or: [
          { class: { $in: userClasses } },
          { workspace: { $in: userClasses } },
          { classes: { $in: userClasses } },
        ] },
        { $or: [
          { assignedStudents: { $exists: false } },
          { assignedStudents: { $size: 0 } },
          { assignedStudents: userId },
        ] },
      ],
    })
      .populate({ path: 'class', model: Class, select: 'name' })
      .populate({ path: 'classes', model: Class, select: 'name' })
      .sort({ dueDate: 1 })
      .lean()
    : [];

const submissions = filteredTasks.length
  ? await Submission.find({
    student: userId,
    task: { $in: filteredTasks.map((task) => task._id) },
  }).select("task status").lean()
  : [];

const nonPendingTaskIds = new Set(
  submissions
    .filter(s => s.status === 'Pending' || s.status === 'Approved')
    .map(s => s.task?.toString())
    .filter(Boolean)
);
const pendingTasksCount = filteredTasks.filter(t => !nonPendingTaskIds.has(t._id?.toString())).length;

return (
  <div className="max-w-7xl mx-auto space-y-10 p-6 md:p-10 animate-fade-in pb-24">
    <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
      <div className="space-y-1">
        <div className="flex items-center gap-2 px-2.5 py-1 bg-primary/10 text-primary rounded-lg w-fit text-[10px] font-bold uppercase tracking-wider border border-primary/20">
           <Zap className="w-3 h-3" /> Assignments
        </div>
        <h1 className="text-4xl font-extrabold text-text-primary tracking-tight">My Tasks</h1>
        <p className="text-text-secondary font-medium text-lg">
          You have <span className="text-primary font-black">{pendingTasksCount}</span> pending {pendingTasksCount === 1 ? 'task' : 'tasks'} to complete.
        </p>
      </div>
      <CribbyTip />
    </header>

    <TaskList initialTasks={serialize(filteredTasks)} initialSubmissions={serialize(submissions)} />
  </div>
  );
}
