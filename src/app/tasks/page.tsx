import TaskList from "@/components/student/TaskList";
import CribbyTip from "@/components/ai/CribbyTip";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import dbConnect from "@/lib/mongodb";
import Task from "@/models/Task";
import Submission from "@/models/Submission";
import User from "@/models/User";
import Workspace from "@/models/Workspace"; // Required for populate to work correctly
import { ClipboardList, Plus, Search, Filter, Zap } from "lucide-react";
import TeacherTaskClient from "@/components/teacher/TeacherTaskClient";
import { serialize } from "@/lib/serialize";
import { redirect } from "next/navigation";

export default async function TasksPage() {
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect("/login");
  }

  const role = (session?.user as any)?.role || "Student";
  const userId = (session.user as any).id;

  if (!userId) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-slate-500 font-medium">Session error. Please log in again.</p>
      </div>
    );
  }

  await dbConnect();

  // Ensure Workspace model is registered
  if (!Workspace) {
    console.error("Workspace model not found");
  }

  const userRecord = await User.findById(userId).lean();

  if (role === "Teacher") {
    const createdTasks = await Task.find({ creator: userId })
      .populate('class', 'name')
      .sort({ createdAt: -1 })
      .lean();

    return (
      <div className="max-w-7xl mx-auto p-6 md:p-10 animate-fade-in pb-24">
        <TeacherTaskClient initialTasks={serialize(createdTasks)} />
      </div>
    );
  }

  // Student View
  const tasks = await Task.find({})
    .populate('class', 'name')
    .sort({ dueDate: 1 })
    .lean();

  // Filter tasks by classes the student is in
  const userClasses = (userRecord as any)?.workspaces || (userRecord as any)?.classes || []; 
  const filteredTasks = tasks.filter((t: any) => {
    const classId = t.class?._id || t.class || t.workspace;
    return userClasses.some((uc: any) => uc.toString() === classId?.toString());
  });

const submissions = await Submission.find({ student: userId }).lean();

const nonPendingTaskIds = new Set(
  submissions
    .filter(s => s.status === 'Pending' || s.status === 'Approved')
    .map(s => s.task?.toString())
    .filter(Boolean)
);
const pendingTasksCount = tasks.filter(t => !nonPendingTaskIds.has(t._id?.toString())).length;

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

