"use client";

import { useState } from "react";
import { ClipboardList, Plus, Search, Loader2, X, Trash2, AlertTriangle, CheckCircle2, Clock } from "lucide-react";
import CreateTaskForm from "./CreateTaskForm";
import { motion, AnimatePresence } from "framer-motion";
import { clsx } from "clsx";

interface TeacherTaskClientProps {
  initialTasks: any[];
}

function getTaskStatus(task: any): { label: string; color: string; icon: any } {
  const now = new Date();
  const due = task.dueDate ? new Date(task.dueDate) : null;
  const completedStudentIds = new Set((task.completions || [])
    .filter((completion: any) => completion.verified !== false)
    .map((completion: any) => String(completion.student?._id || completion.student))
    .filter(Boolean));
  const assignedStudentIds = task.assignedStudents?.length
    ? task.assignedStudents.map((studentId: any) => String(studentId?._id || studentId))
    : [...new Set([...(task.classes || []), task.class]
      .filter(Boolean)
      .flatMap((classDoc: any) => classDoc.students || [])
      .map((studentId: any) => String(studentId?._id || studentId)))];
  const isComplete = assignedStudentIds.length > 0 &&
    assignedStudentIds.every((studentId: string) => completedStudentIds.has(studentId));

  if (isComplete) {
    return { label: "Completed", color: "emerald", icon: CheckCircle2 };
  }
  if (due && due < now) {
    return { label: "Overdue", color: "rose", icon: AlertTriangle };
  }
  return { label: "Active", color: "primary", icon: Clock };
}

export default function TeacherTaskClient({ initialTasks }: TeacherTaskClientProps) {
  const [tasks, setTasks] = useState(initialTasks);
  const [showModal, setShowModal] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "Active" | "Overdue" | "Completed">("all");

  const filteredTasks = tasks.filter((t) => {
    const matchesSearch =
      t.title.toLowerCase().includes(search.toLowerCase()) ||
      (t.class?.name || "").toLowerCase().includes(search.toLowerCase());

    if (!matchesSearch) return false;
    if (statusFilter === "all") return true;

    const { label } = getTaskStatus(t);
    return label === statusFilter;
  });

  const handleSuccess = async () => {
    const res = await fetch("/api/teacher/tasks");
    const data = await res.json();
    if (data.success) {
      setTasks(data.tasks);
    }
    setShowModal(false);
  };

  const handleDelete = async (taskId: string) => {
    if (!confirm("Are you sure you want to delete this assignment?")) return;

    try {
      const res = await fetch("/api/teacher/tasks", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskId }),
      });

      const data = await res.json();
      if (data.success) {
        setTasks((prev) => prev.filter((t) => t._id !== taskId));
      } else {
        alert(data.error || "Failed to delete task");
      }
    } catch (err) {
      console.error("Delete error:", err);
      alert("An error occurred while deleting the task");
    }
  };

  const statusColors: Record<string, string> = {
    primary: "bg-primary/10 text-primary border-primary/20",
    emerald: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
    rose: "bg-rose-500/10 text-rose-500 border-rose-500/20",
  };

  return (
    <div className="space-y-10">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="space-y-1">
          <h1 className="text-4xl font-extrabold text-text-primary tracking-tight">
            Assignment <span className="text-primary">Manager</span>
          </h1>
          <p className="text-text-secondary font-medium">Create and manage tasks for your workspaces.</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="bg-primary text-white px-8 py-4 rounded-[2rem] shadow-xl shadow-primary/20 flex items-center gap-3 hover:scale-105 active:scale-95 transition-all font-black text-xs uppercase tracking-widest group"
        >
          <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
          <span>New Assignment</span>
        </button>
      </header>

      <div className="space-y-6">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <h2 className="text-2xl font-black text-text-primary flex items-center gap-3">
            <ClipboardList className="w-6 h-6 text-primary" />
            All Assignments
          </h2>
          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            {/* Status filter */}
            <div className="flex items-center gap-2 bg-card border border-card-border rounded-2xl p-1.5 shadow-sm">
              {(["all", "Active", "Overdue", "Completed"] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={clsx(
                    "px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                    statusFilter === s
                      ? "bg-primary text-white shadow-lg shadow-primary/20"
                      : "text-text-tertiary hover:text-text-primary"
                  )}
                >
                  {s === "all" ? "All" : s}
                </button>
              ))}
            </div>
            {/* Search */}
            <div className="relative w-full sm:w-72 group">
              <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-text-tertiary group-focus-within:text-primary transition-colors" />
              <input
                type="text"
                placeholder="Search assignments..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-12 pr-6 py-3.5 bg-card border border-card-border rounded-2xl text-sm font-bold text-text-primary focus:ring-4 focus:ring-primary/10 outline-none transition-all placeholder:text-text-tertiary shadow-inner"
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTasks.map((task: any) => {
            const status = getTaskStatus(task);
            const StatusIcon = status.icon;
            const colorClass = statusColors[status.color];

            return (
              <div
                key={task._id}
                className="bg-card p-6 rounded-[2.5rem] border border-card-border hover:border-primary/30 hover:shadow-2xl transition-all flex flex-col justify-between group cursor-pointer shadow-sm relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-bl-full -mr-12 -mt-12 group-hover:bg-primary/10 transition-colors" />

                <div className="space-y-4 relative z-10">
                  <div className="flex justify-between items-start">
                    <div className="w-12 h-12 rounded-2xl bg-card-hover flex items-center justify-center text-text-tertiary group-hover:bg-primary text-primary group-hover:text-white transition-all shadow-inner">
                      <ClipboardList className="w-6 h-6" />
                    </div>
                    <div className="flex gap-2 items-center">
                      {/* Status badge */}
                      <span
                        className={clsx(
                          "px-3 py-1 text-[8px] font-black rounded-full uppercase tracking-widest border flex items-center gap-1",
                          colorClass
                        )}
                      >
                        <StatusIcon className="w-3 h-3" />
                        {status.label}
                      </span>
                      {/* Type badge */}
                      <span className="px-3 py-1 bg-card-hover text-text-tertiary text-[8px] font-black rounded-full uppercase tracking-widest border border-card-border">
                        {task.type || "Homework"}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(task._id);
                        }}
                        className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-500/10 transition-all opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-lg font-black text-text-primary group-hover:text-primary transition-colors line-clamp-1">
                      {task.title}
                    </h4>
                    <p className="text-xs text-text-secondary font-bold mt-1">
                      {task.class?.name || "Unassigned Class"}
                    </p>
                  </div>
                </div>

                <div className="mt-8 pt-6 border-t border-card-border flex items-center justify-between relative z-10">
                  <div className="space-y-1">
                    <p className="text-[9px] font-black text-text-tertiary uppercase tracking-widest">Submissions</p>
                    <div className="flex items-center gap-1.5">
                      <span className="text-lg font-black text-text-primary">
                        {task.completions?.length || 0}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[9px] font-black text-text-tertiary uppercase tracking-widest">Due Date</p>
                    <p
                      className={clsx(
                        "text-xs font-black",
                        status.label === "Overdue" ? "text-rose-500" : "text-text-primary"
                      )}
                    >
                      {task.dueDate
                        ? new Date(task.dueDate).toLocaleDateString(undefined, {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })
                        : "No date"}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}

          {filteredTasks.length === 0 && (
            <div className="col-span-full py-32 text-center bg-card-hover/30 rounded-[3rem] border-2 border-dashed border-card-border">
              <div className="w-24 h-24 bg-card rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-inner border border-card-border">
                <ClipboardList className="w-12 h-12 text-text-tertiary opacity-30" />
              </div>
              <h3 className="text-2xl font-black text-text-primary tracking-tight">No assignments found</h3>
              <p className="text-text-tertiary font-bold mt-2">
                {statusFilter !== "all"
                  ? `No ${statusFilter.toLowerCase()} assignments.`
                  : "Start by creating a new assignment."}
              </p>
              {statusFilter === "all" && (
                <button
                  onClick={() => setShowModal(true)}
                  className="mt-8 px-8 py-4 bg-primary text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:shadow-xl transition-all"
                >
                  Create First Assignment
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      <AnimatePresence>
        {showModal && (
          <div
            className="fixed inset-0 z-[100] flex items-center justify-center p-6 sm:p-10 bg-black/60 backdrop-blur-sm"
            onClick={(e) => {
              if (e.target === e.currentTarget) setShowModal(false);
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-2xl shadow-2xl"
            >
              <CreateTaskForm onSuccess={handleSuccess} onClose={() => setShowModal(false)} />
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
