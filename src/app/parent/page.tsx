"use client";

import { useEffect, useState } from "react";
import { CalendarDays, CheckCircle2, Clock, Loader2, ShieldCheck } from "lucide-react";

type StudentOverview = {
  student: { id: string; displayName: string; schoolYear?: string; team?: string };
  school: { name: string };
  assignments: Array<{ id: string; title: string; dueDate: string; status: string; type: string }>;
  behavior: Array<{ _id: string; category: string; points: number; reason: string; createdAt: string }>;
  behaviorTotal: number;
  preferences: { weeklyEmail: boolean; alerts: boolean };
  weeklyEmailEnabled: boolean;
};

export default function ParentOverviewPage() {
  const [students, setStudents] = useState<StudentOverview[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const response = await fetch("/api/parent/overview");
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Unable to load parent overview.");
    setStudents(data.students);
  };

  useEffect(() => {
    load().catch((loadError) => setError(loadError.message)).finally(() => setLoading(false));
  }, []);

  const updatePreference = async (studentId: string, key: "weeklyEmail" | "alerts", value: boolean) => {
    const target = students.find((item) => item.student.id === studentId);
    if (!target) return;
    setStudents((current) => current.map((item) => item.student.id === studentId
      ? { ...item, preferences: { ...item.preferences, [key]: value } }
      : item));
    const response = await fetch("/api/parent/overview", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        studentId,
        weeklyEmail: key === "weeklyEmail" ? value : target.preferences.weeklyEmail,
        alerts: key === "alerts" ? value : target.preferences.alerts,
      }),
    });
    if (!response.ok) {
      const data = await response.json();
      setError(data.error || "Unable to update email preferences.");
      await load();
    }
  };

  if (loading) return <div className="flex justify-center p-16"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="mx-auto max-w-5xl space-y-8 p-6 md:p-10">
      <header>
        <p className="text-xs font-black uppercase tracking-widest text-primary">Parent account · read only</p>
        <h1 className="mt-2 text-4xl font-black text-text-primary">Student progress</h1>
        <p className="mt-2 text-sm text-text-secondary">Homework and behaviour records shared by your school.</p>
      </header>
      {error && <p role="alert" className="rounded-xl bg-rose-500/10 p-4 text-sm text-rose-600">{error}</p>}
      {students.length === 0 && <p className="rounded-2xl border border-card-border bg-card p-6 text-sm text-text-secondary">No student links are attached to this account yet.</p>}
      {students.map((item) => (
        <section key={item.student.id} className="space-y-5 rounded-3xl border border-card-border bg-card p-6 md:p-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-text-tertiary">{item.school?.name}</p>
              <h2 className="mt-1 text-2xl font-black text-text-primary">{item.student.displayName}</h2>
              <p className="text-xs text-text-secondary">{item.student.schoolYear || "Year not set"} · {item.student.team || "No team"}</p>
            </div>
            <div className="rounded-2xl bg-primary/10 px-4 py-3 text-center">
              <p className="text-2xl font-black text-primary">{item.behaviorTotal}</p>
              <p className="text-[10px] font-black uppercase tracking-widest text-text-tertiary">Behaviour points</p>
            </div>
          </div>
          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <h3 className="flex items-center gap-2 font-black text-text-primary"><CalendarDays className="h-4 w-4 text-primary" /> Homework</h3>
              <div className="mt-3 space-y-2">
                {item.assignments.length === 0 && <p className="text-sm text-text-tertiary">No homework assigned.</p>}
                {item.assignments.map((task) => (
                  <div key={task.id} className="flex items-start justify-between gap-3 rounded-xl border border-card-border p-3">
                    <div><p className="text-sm font-bold text-text-primary">{task.title}</p><p className="text-xs text-text-tertiary">Due {new Date(task.dueDate).toLocaleString()}</p></div>
                    <span className={`text-xs font-black ${task.status === "Overdue" ? "text-rose-500" : task.status === "Approved" ? "text-emerald-600" : "text-amber-600"}`}>{task.status}</span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h3 className="flex items-center gap-2 font-black text-text-primary"><ShieldCheck className="h-4 w-4 text-primary" /> Behaviour log</h3>
              <div className="mt-3 space-y-2">
                {item.behavior.length === 0 && <p className="text-sm text-text-tertiary">No behaviour entries yet.</p>}
                {item.behavior.map((record) => (
                  <div key={record._id} className="flex justify-between gap-3 rounded-xl border border-card-border p-3">
                    <div><p className="text-sm font-bold text-text-primary">{record.category}</p><p className="text-xs text-text-tertiary">{record.reason} · {new Date(record.createdAt).toLocaleDateString()}</p></div>
                    <span className={`font-black ${record.points < 0 ? "text-rose-600" : "text-emerald-600"}`}>{record.points > 0 ? "+" : ""}{record.points}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-5 border-t border-card-border pt-4 text-sm text-text-secondary">
            <label className="flex items-center gap-2"><input type="checkbox" disabled={!item.weeklyEmailEnabled} checked={item.preferences.weeklyEmail} onChange={(event) => updatePreference(item.student.id, "weeklyEmail", event.target.checked)} /> Weekly email summary{!item.weeklyEmailEnabled && " (disabled by school)"}</label>
            <label className="flex items-center gap-2"><input type="checkbox" checked={item.preferences.alerts} onChange={(event) => updatePreference(item.student.id, "alerts", event.target.checked)} /> Behaviour alerts</label>
          </div>
        </section>
      ))}
    </div>
  );
}
