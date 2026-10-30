"use client";

import { useState, useEffect } from "react";
import {
  ClipboardPlus,
  Loader2,
  CheckCircle,
  AlertCircle,
  Coins,
  Zap,
  Calendar,
  Clock,
  Layers,
  FileText,
  Target,
  X,
  Plus,
} from "lucide-react";
import { clsx } from "clsx";
import Link from "next/link";

interface Workspace {
  _id: string;
  name: string;
  students?: Array<{ _id: string; username: string; displayName?: string }>;
}

interface AssignmentTemplate {
  title?: string;
  description?: string;
  type?: string;
  coins?: number;
  xp?: number;
}

interface CreateTaskFormProps {
  onSuccess?: () => void;
  onClose?: () => void;
}

// Human-readable labels for task types
const TASK_TYPE_LABELS: Record<string, string> = {
  Homework:    "Homework",
  Green:       "Eco Challenge",
  Physical:    "PE / Physical Activity",
  Activity:    "Class Activity",
};

export default function CreateTaskForm({ onSuccess, onClose }: CreateTaskFormProps) {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetchingClasses, setFetchingClasses] = useState(true);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    type: "Homework",
    coins: 100,
    xp: 50,
    dueDate: "",
    dueTime: "23:59",
    workspaceId: "",
    classIds: [] as string[],
    studentIds: [] as string[],
    attachments: [] as Array<{ name: string; url: string }>,
    recurrence: "none",
    recurrenceUntil: "",
    postToClassChat: false,
  });
  const [lastAssignment, setLastAssignment] = useState<AssignmentTemplate | null>(null);
  const [attachmentName, setAttachmentName] = useState("");
  const [attachmentUrl, setAttachmentUrl] = useState("");
  const [uploadingAttachments, setUploadingAttachments] = useState(false);

  const uploadFiles = async (files: File[]) => {
    if (!formData.classIds.length) {
      setMessage({ type: "error", text: "Select at least one class before uploading attachments." });
      return;
    }
    const availableSlots = 10 - formData.attachments.length;
    if (files.length > availableSlots) {
      setMessage({ type: "error", text: `You can attach up to 10 files or links; ${availableSlots} slot${availableSlots === 1 ? "" : "s"} remain.` });
      return;
    }
    if (files.length === 0) return;
    setUploadingAttachments(true);
    setMessage(null);
    const uploaded: Array<{ name: string; url: string }> = [];
    try {
      for (const file of files) {
        const uploadData = new FormData();
        uploadData.set("file", file);
        uploadData.set("classIds", JSON.stringify(formData.classIds));
        const response = await fetch("/api/teacher/attachments", { method: "POST", body: uploadData });
        const result = await response.json();
        if (!response.ok || !result.success || !result.attachment) {
          throw new Error(result.error || `Could not upload ${file.name}.`);
        }
        uploaded.push(result.attachment);
      }
      setFormData((previous) => ({
        ...previous,
        attachments: [...previous.attachments, ...uploaded].slice(0, 10),
      }));
      setMessage({ type: "success", text: `${uploaded.length} attachment${uploaded.length === 1 ? "" : "s"} uploaded.` });
    } catch (error) {
      await Promise.all(uploaded.map(async (attachment) => {
        const id = attachment.url.split("/").pop();
        if (id) await fetch("/api/teacher/attachments", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id }),
        });
      }));
      setMessage({ type: "error", text: error instanceof Error ? error.message : "Attachment upload failed." });
    } finally {
      setUploadingAttachments(false);
    }
  };

  const removeAttachment = async (index: number) => {
    const attachment = formData.attachments[index];
    if (attachment?.url.startsWith("/api/attachments/")) {
      const id = attachment.url.split("/").pop();
      if (id) {
        const response = await fetch("/api/teacher/attachments", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id }),
        });
        if (!response.ok) {
          const result = await response.json();
          setMessage({ type: "error", text: result.error || "Could not remove uploaded attachment." });
          return;
        }
      }
    }
    setFormData((previous) => ({
      ...previous,
      attachments: previous.attachments.filter((_, currentIndex) => currentIndex !== index),
    }));
  };

  useEffect(() => {
    Promise.all([fetch("/api/classes"), fetch("/api/teacher/tasks")])
      .then(async ([classesResponse, tasksResponse]) => {
        const [data, tasksData] = await Promise.all([classesResponse.json(), tasksResponse.json()]);
        if (data.classes) {
          setWorkspaces(data.classes);
          if (data.classes.length > 0) {
            setFormData((prev) => ({ ...prev, workspaceId: data.classes[0]._id, classIds: [data.classes[0]._id] }));
          }
        }
        if (tasksData.success && tasksData.tasks?.length) setLastAssignment(tasksData.tasks[0]);
      })
      .catch((err) => console.error("Error fetching classes:", err))
      .finally(() => setFetchingClasses(false));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    try {
      // Combine date + time into a single ISO datetime
      const dueDateISO = formData.dueDate && formData.dueTime
        ? new Date(`${formData.dueDate}T${formData.dueTime}`).toISOString()
        : formData.dueDate;

      const res = await fetch("/api/teacher/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          dueDate: dueDateISO,
          recurrence: {
            frequency: formData.recurrence,
            until: formData.recurrenceUntil || undefined,
          },
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setMessage({ type: "success", text: "Assignment published successfully!" });
        setFormData((prev) => ({
          ...prev,
          title: "",
          description: "",
          dueDate: "",
          dueTime: "23:59",
          studentIds: [],
          attachments: [],
          recurrence: "none",
          recurrenceUntil: "",
          postToClassChat: false,
        }));
        setTimeout(() => {
          if (onSuccess) onSuccess();
        }, 1500);
      } else {
        setMessage({ type: "error", text: data.error || "Failed to create task" });
      }
    } catch {
      setMessage({ type: "error", text: "A network error occurred" });
    } finally {
      setLoading(false);
    }
  };

  const toggleClass = (classId: string) => {
    setFormData((prev) => {
      const classIds = prev.classIds.includes(classId)
        ? prev.classIds.filter((id) => id !== classId)
        : [...prev.classIds, classId];
      const studentsForClasses = workspaces
        .filter((workspace) => classIds.includes(workspace._id))
        .flatMap((workspace) => workspace.students || [])
        .map((student) => student._id);
      return {
        ...prev,
        classIds,
        workspaceId: classIds[0] || "",
        studentIds: prev.studentIds.filter((studentId) => studentsForClasses.includes(studentId)),
      };
    });
  };

  const applyLastAssignment = () => {
    if (!lastAssignment) return;
    setFormData((prev) => ({
      ...prev,
      title: lastAssignment.title || "",
      description: lastAssignment.description || "",
      type: lastAssignment.type || "Homework",
      coins: lastAssignment.coins ?? 100,
      xp: lastAssignment.xp ?? 50,
    }));
  };

  return (
    <div className="bg-card rounded-[2rem] border border-card-border shadow-2xl overflow-hidden max-w-2xl w-full mx-auto animate-scale-in flex flex-col max-h-[90vh]">
      <div className="p-5 border-b border-card-border bg-card-hover/30 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white shadow-lg shadow-primary/20">
            <ClipboardPlus className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-black text-text-primary tracking-tight">New Assignment</h3>
            <p className="text-[9px] text-text-tertiary font-bold uppercase tracking-widest">Draft a task for your class</p>
          </div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-card-hover rounded-lg text-text-tertiary transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto no-scrollbar">
        <div className="flex flex-wrap gap-2">
          <label className="text-[9px] font-black text-text-tertiary uppercase tracking-widest self-center">Templates</label>
          <select
            aria-label="Assignment template"
            defaultValue=""
            onChange={(e) => {
              const templates: Record<string, { title: string; description: string; type: string; coins: number; xp: number }> = {
                homework: { title: "Homework", description: "Complete the assigned practice and submit your work.", type: "Homework", coins: 100, xp: 50 },
                eco: { title: "Eco Challenge", description: "Complete this sustainability activity and describe what you learned.", type: "Green", coins: 75, xp: 40 },
                physical: { title: "Physical Activity", description: "Complete the activity and record your participation.", type: "Physical", coins: 75, xp: 40 },
              };
              const template = templates[e.target.value];
              if (template) setFormData((prev) => ({ ...prev, ...template }));
            }}
            className="px-3 py-2 rounded-lg border border-card-border bg-background text-xs font-bold text-text-primary"
          >
            <option value="">Choose a template</option>
            <option value="homework">Homework</option>
            <option value="eco">Eco challenge</option>
            <option value="physical">Physical activity</option>
          </select>
          {lastAssignment && (
            <button type="button" onClick={applyLastAssignment} className="px-3 py-2 rounded-lg bg-primary/10 text-primary text-xs font-bold">
              Copy last assignment
            </button>
          )}
        </div>
        <div className="space-y-3">
          {/* Title */}
          <div className="space-y-1">
            <label className="text-[9px] font-black text-text-tertiary uppercase tracking-widest flex items-center gap-2 px-1">
              <FileText className="w-3 h-3 text-primary" /> Title
            </label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl border border-card-border bg-background focus:border-primary outline-none transition-all font-bold text-sm text-text-primary placeholder:text-text-tertiary shadow-inner"
              placeholder="e.g. Vocabulary Quiz"
            />
          </div>

          {/* Instructions */}
          <div className="space-y-1">
            <label className="text-[9px] font-black text-text-tertiary uppercase tracking-widest flex items-center gap-2 px-1">
              <FileText className="w-3 h-3 text-primary" /> Instructions
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={2}
              className="w-full px-4 py-2.5 rounded-xl border border-card-border bg-background focus:border-primary outline-none transition-all font-bold text-sm text-text-primary resize-none placeholder:text-text-tertiary shadow-inner"
              placeholder="Detailed instructions..."
            />
          </div>

          {/* Type + Due Date + Due Time */}
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1">
              <label className="text-[9px] font-black text-text-tertiary uppercase tracking-widest flex items-center gap-2 px-1">
                <Layers className="w-3 h-3 text-primary" /> Type
              </label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="w-full px-3 py-2.5 rounded-xl border border-card-border bg-background focus:border-primary outline-none transition-all font-black text-xs text-text-primary"
              >
                {Object.entries(TASK_TYPE_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[9px] font-black text-text-tertiary uppercase tracking-widest flex items-center gap-2 px-1">
                <Calendar className="w-3 h-3 text-primary" /> Due Date
              </label>
              <input
                type="date"
                required
                value={formData.dueDate}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                className="w-full px-3 py-2.5 rounded-xl border border-card-border bg-background focus:border-primary outline-none transition-all font-black text-xs text-text-primary uppercase"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[9px] font-black text-text-tertiary uppercase tracking-widest flex items-center gap-2 px-1">
                <Clock className="w-3 h-3 text-primary" /> Due Time
              </label>
              <input
                type="time"
                value={formData.dueTime}
                onChange={(e) => setFormData({ ...formData, dueTime: e.target.value })}
                className="w-full px-3 py-2.5 rounded-xl border border-card-border bg-background focus:border-primary outline-none transition-all font-black text-xs text-text-primary"
              />
            </div>
          </div>

          {/* Coins + XP */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[9px] font-black text-text-tertiary uppercase tracking-widest flex items-center gap-2 px-1">
                <Coins className="w-3 h-3 text-accent-gold" /> Coins Reward
              </label>
              <input
                type="number"
                required
                min={0}
                value={formData.coins}
                onChange={(e) => setFormData({ ...formData, coins: parseInt(e.target.value) || 0 })}
                className="w-full px-4 py-2.5 rounded-xl border border-card-border bg-background focus:border-primary outline-none transition-all font-bold text-sm text-text-primary"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[9px] font-black text-text-tertiary uppercase tracking-widest flex items-center gap-2 px-1">
                <Zap className="w-3 h-3 text-indigo-500" /> XP Reward
              </label>
              <input
                type="number"
                required
                min={0}
                value={formData.xp}
                onChange={(e) => setFormData({ ...formData, xp: parseInt(e.target.value) || 0 })}
                className="w-full px-4 py-2.5 rounded-xl border border-card-border bg-background focus:border-primary outline-none transition-all font-bold text-sm text-text-primary"
              />
            </div>
          </div>

          {/* Target Class */}
          <div className="space-y-1">
            <label className="text-[9px] font-black text-text-tertiary uppercase tracking-widest flex items-center gap-2 px-1">
              <Target className="w-3 h-3 text-primary" /> Target Class
            </label>
            {fetchingClasses ? (
              <div className="w-full px-4 py-2.5 rounded-xl border border-card-border bg-card-hover flex items-center gap-2">
                <Loader2 className="w-3 h-3 animate-spin text-primary" />
                <span className="text-[8px] text-text-tertiary font-black uppercase tracking-widest">Loading...</span>
              </div>
            ) : workspaces.length > 0 ? (
              <div className="space-y-2 rounded-xl border border-card-border p-3">
                {workspaces.map((ws) => (
                  <label key={ws._id} className="flex items-center gap-2 text-sm font-bold text-text-primary">
                    <input type="checkbox" checked={formData.classIds.includes(ws._id)} onChange={() => toggleClass(ws._id)} />
                    {ws.name}
                  </label>
                ))}
              </div>
            ) : (
              <div className="p-4 rounded-xl border border-dashed border-card-border bg-card-hover/20 text-center space-y-2">
                <p className="text-[10px] text-text-tertiary font-bold uppercase tracking-widest">No classes found</p>
                <Link
                  href="/classes"
                  className="text-[10px] text-primary font-black uppercase tracking-widest hover:underline flex items-center justify-center gap-1"
                >
                  <Plus className="w-3 h-3" /> Create your first class
                </Link>
              </div>
            )}
          </div>

          {formData.classIds.length > 0 && (
            <div className="space-y-2">
              <label className="text-[9px] font-black text-text-tertiary uppercase tracking-widest">Optional: assign to individual students</label>
              <div className="max-h-36 overflow-y-auto rounded-xl border border-card-border p-3 space-y-2">
                {[...new Map(workspaces
                  .filter((workspace) => formData.classIds.includes(workspace._id))
                  .flatMap((workspace) => workspace.students || [])
                  .map((student) => [student._id, student])).values()].map((student) => (
                  <label key={student._id} className="flex items-center gap-2 text-xs font-bold text-text-primary">
                    <input
                      type="checkbox"
                      checked={formData.studentIds.includes(student._id)}
                      onChange={() => setFormData((prev) => ({
                        ...prev,
                        studentIds: prev.studentIds.includes(student._id)
                          ? prev.studentIds.filter((id) => id !== student._id)
                          : [...prev.studentIds, student._id],
                      }))}
                    />
                    {student.displayName || `@${student.username}`}
                  </label>
                ))}
              </div>
              <p className="text-[9px] text-text-tertiary">Leave all students unchecked to assign to everyone in the selected classes.</p>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-[9px] font-black text-text-tertiary uppercase tracking-widest">Attachments (files up to 4 MB or HTTPS links)</label>
            <input
              type="file"
              multiple
              accept=".pdf,.png,.jpg,.jpeg,.webp,.txt,application/pdf,image/png,image/jpeg,image/webp,text/plain"
              disabled={uploadingAttachments || formData.attachments.length >= 10}
              onChange={(event) => {
                const files = Array.from(event.target.files || []);
                if (files.length) uploadFiles(files);
                event.currentTarget.value = "";
              }}
              className="block w-full text-xs text-text-secondary file:mr-3 file:rounded-lg file:border-0 file:bg-primary file:px-3 file:py-2 file:font-bold file:text-white disabled:opacity-50"
            />
            {uploadingAttachments && <p role="status" className="text-xs font-semibold text-primary">Uploading attachments…</p>}
            <div className="flex gap-2">
              <input value={attachmentName} onChange={(e) => setAttachmentName(e.target.value)} placeholder="Attachment label" className="min-w-0 flex-1 px-3 py-2 rounded-lg border border-card-border bg-background text-xs" />
              <input value={attachmentUrl} onChange={(e) => setAttachmentUrl(e.target.value)} placeholder="https://..." className="min-w-0 flex-[2] px-3 py-2 rounded-lg border border-card-border bg-background text-xs" />
              <button type="button" onClick={() => {
                if (/^https:\/\//i.test(attachmentUrl) && attachmentName.trim() && formData.attachments.length < 10) {
                  setFormData((prev) => ({ ...prev, attachments: [...prev.attachments, { name: attachmentName.trim(), url: attachmentUrl.trim() }] }));
                  setAttachmentName("");
                  setAttachmentUrl("");
                }
              }} className="px-3 rounded-lg bg-primary text-white text-xs font-bold">Add</button>
            </div>
            {formData.attachments.map((file, index) => (
              <div key={`${file.url}-${index}`} className="flex justify-between text-xs text-text-secondary">
                <a href={file.url} target="_blank" rel="noreferrer" className="truncate hover:underline">{file.name}</a>
                <button type="button" onClick={() => removeAttachment(index)} className="text-rose-500">Remove</button>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <label className="space-y-1 text-[9px] font-black uppercase tracking-widest text-text-tertiary">
              Repeat homework
              <select value={formData.recurrence} onChange={(e) => setFormData((prev) => ({ ...prev, recurrence: e.target.value }))} className="block w-full px-3 py-2 rounded-lg border border-card-border bg-background text-xs font-bold">
                <option value="none">Does not repeat</option>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
              </select>
            </label>
            {formData.recurrence !== "none" && (
              <label className="space-y-1 text-[9px] font-black uppercase tracking-widest text-text-tertiary">
                Repeat until
                <input type="date" required value={formData.recurrenceUntil} onChange={(e) => setFormData((prev) => ({ ...prev, recurrenceUntil: e.target.value }))} className="block w-full px-3 py-2 rounded-lg border border-card-border bg-background text-xs font-bold" />
              </label>
            )}
          </div>
          <label className="flex items-center gap-2 text-xs font-bold text-text-primary">
            <input type="checkbox" checked={formData.postToClassChat} onChange={(e) => setFormData((prev) => ({ ...prev, postToClassChat: e.target.checked }))} />
            Post assignment announcement to each selected class chat
          </label>

          {/* Type explanation banner */}
          {formData.type === "Green" && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-bold text-emerald-600 uppercase tracking-wider">
              🌱 Eco Challenge — students earn extra Sustainability XP for completing this task.
            </div>
          )}
          {formData.type === "Physical" && (
            <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-[10px] font-bold text-blue-600 uppercase tracking-wider">
              🏃 PE / Physical Activity — this task counts toward physical education goals.
            </div>
          )}
        </div>

        {message && (
          <div
            className={clsx(
              "p-3 rounded-xl flex items-start gap-3 animate-scale-in border",
              message.type === "success"
                ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                : "bg-rose-500/10 text-rose-500 border-rose-500/20"
            )}
          >
            {message.type === "success" ? (
              <CheckCircle className="w-4 h-4 mt-0.5" />
            ) : (
              <AlertCircle className="w-4 h-4 mt-0.5" />
            )}
            <div className="text-[9px] font-black uppercase tracking-widest leading-tight">{message.text}</div>
          </div>
        )}

        <button
          type="submit"
          disabled={loading || uploadingAttachments || workspaces.length === 0}
          className="w-full bg-primary hover:shadow-lg text-white font-black py-3.5 rounded-xl flex items-center justify-center gap-2 disabled:opacity-50 transition-all active:scale-[0.98] text-[9px] uppercase tracking-widest shrink-0"
        >
          {loading || uploadingAttachments ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <>
              <ClipboardPlus className="w-4 h-4" /> Publish Assignment
            </>
          )}
        </button>
      </form>
    </div>
  );
}
