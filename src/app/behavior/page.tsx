"use client";

import { useEffect, useState } from "react";
import { Award, Loader2, RotateCcw, ShieldAlert } from "lucide-react";

type Student = { _id: string; username: string; displayName?: string };
type ClassData = { _id: string; name: string; students: Student[] };

export default function BehaviorPage() {
  const [classes, setClasses] = useState<ClassData[]>([]);
  const [classId, setClassId] = useState("");
  const [school, setSchool] = useState<any>(null);
  const [report, setReport] = useState<any>(null);
  const [studentId, setStudentId] = useState("");
  const [category, setCategory] = useState("");
  const [points, setPoints] = useState(1);
  const [reason, setReason] = useState("");
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const loadReport = async (targetClassId: string) => {
    if (!targetClassId) return;
    const response = await fetch(`/api/behavior/report?classId=${encodeURIComponent(targetClassId)}`);
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Unable to load point totals.");
    setReport(data);
  };

  useEffect(() => {
    Promise.all([fetch("/api/classes").then((response) => response.json()), fetch("/api/school").then((response) => response.json())])
      .then(([classData, schoolData]) => {
        const available = classData.classes || [];
        setClasses(available);
        const firstClass = available[0];
        setClassId(firstClass?._id || "");
        setStudentId(firstClass?.students?.[0]?._id || "");
        if (schoolData.school) {
          setSchool(schoolData.school);
          setCategory(schoolData.school.settings.behavior.categories?.[0]?.name || "");
        }
        if (firstClass?._id) loadReport(firstClass._id).catch((loadError) => setError(loadError.message));
      })
      .catch((loadError) => setError(loadError.message));
  }, []);

  const selectClass = (value: string) => {
    setClassId(value);
    setStudentId(classes.find((item) => item._id === value)?.students?.[0]?._id || "");
    loadReport(value).catch((loadError) => setError(loadError.message));
  };

  const submitAward = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    setStatus("");
    try {
      const response = await fetch("/api/teacher/behavior", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ classId, studentId, category, points, reason, idempotencyKey: crypto.randomUUID() }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to award behaviour points.");
      setStatus(data.requiresApproval ? "Submitted to your school administrator for approval." : "Behaviour points recorded.");
      setReason("");
      await loadReport(classId);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unable to award behaviour points.");
    } finally {
      setBusy(false);
    }
  };

  const reverse = async (recordId: string) => {
    const reversalReason = window.prompt("Why are you reversing this entry? (At least 5 characters)");
    if (!reversalReason) return;
    setBusy(true);
    try {
      const response = await fetch("/api/teacher/behavior", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reverse", recordId, reason: reversalReason, idempotencyKey: crypto.randomUUID() }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to reverse point record.");
      await loadReport(classId);
    } catch (reverseError) {
      setError(reverseError instanceof Error ? reverseError.message : "Unable to reverse point record.");
    } finally {
      setBusy(false);
    }
  };

  const activeClass = classes.find((item) => item._id === classId);
  const behaviorRules = school?.settings?.behavior;

  return (
    <div className="mx-auto max-w-6xl space-y-7 p-6 md:p-10">
      <header>
        <p className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-primary"><Award className="h-4 w-4" /> School-wide points</p>
        <h1 className="mt-2 text-4xl font-black text-text-primary">Behaviour points</h1>
        <p className="mt-2 text-sm text-text-secondary">Record a reasoned positive or negative point change. Negative points reduce the team total; configured coin effects are applied within school limits.</p>
      </header>
      {error && <p role="alert" className="rounded-xl bg-rose-500/10 p-4 text-sm text-rose-600">{error}</p>}
      {status && <p role="status" className="rounded-xl bg-emerald-500/10 p-4 text-sm text-emerald-600">{status}</p>}

      <section className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
        <form onSubmit={submitAward} className="space-y-4 rounded-2xl border border-card-border bg-card p-6">
          <h2 className="text-xl font-black text-text-primary">Award or deduct points</h2>
          <label className="block text-xs font-bold text-text-tertiary">
            Class
            <select value={classId} onChange={(event) => selectClass(event.target.value)} className="mt-1 w-full rounded-lg border border-card-border bg-background p-3 text-sm text-text-primary">
              {classes.map((item) => <option key={item._id} value={item._id}>{item.name}</option>)}
            </select>
          </label>
          <label className="block text-xs font-bold text-text-tertiary">
            Student
            <select value={studentId} onChange={(event) => setStudentId(event.target.value)} className="mt-1 w-full rounded-lg border border-card-border bg-background p-3 text-sm text-text-primary">
              {(activeClass?.students || []).map((student) => <option key={student._id} value={student._id}>{student.displayName || student.username} (@{student.username})</option>)}
            </select>
          </label>
          <label className="block text-xs font-bold text-text-tertiary">
            School-configured category
            <select value={category} onChange={(event) => {
              const nextCategory = behaviorRules?.categories?.find((item: any) => item.name === event.target.value);
              setCategory(event.target.value);
              if (nextCategory) setPoints(nextCategory.defaultPoints);
            }} className="mt-1 w-full rounded-lg border border-card-border bg-background p-3 text-sm text-text-primary">
              {(behaviorRules?.categories || []).map((item: any) => <option key={item.name} value={item.name}>{item.name} ({item.defaultPoints > 0 ? "+" : ""}{item.defaultPoints})</option>)}
            </select>
          </label>
          <label className="block text-xs font-bold text-text-tertiary">
            Points (positive or negative)
            <input type="number" step={1} min={-100} max={100} value={points} onChange={(event) => setPoints(Number(event.target.value))} className="mt-1 w-full rounded-lg border border-card-border bg-background p-3 text-sm text-text-primary" />
          </label>
          <label className="block text-xs font-bold text-text-tertiary">
            Required reason
            <textarea required minLength={5} maxLength={500} value={reason} onChange={(event) => setReason(event.target.value)} rows={3} className="mt-1 w-full rounded-lg border border-card-border bg-background p-3 text-sm text-text-primary" />
          </label>
          <p className="flex gap-2 text-xs text-text-tertiary"><ShieldAlert className="h-4 w-4 shrink-0" /> School limit: {behaviorRules?.maxPointsPerEntry ?? 10} points per entry; {behaviorRules?.pointsPerStudentPerDay ?? 20} points per student per day.</p>
          <button disabled={busy || !classId || !studentId || !category} className="flex items-center gap-2 rounded-xl bg-primary px-4 py-3 text-xs font-black uppercase tracking-widest text-white disabled:opacity-50">
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Award className="h-4 w-4" />} Record points
          </button>
        </form>

        <div className="space-y-5">
          <section className="rounded-2xl border border-card-border bg-card p-6">
            <h2 className="text-xl font-black text-text-primary">Team / house totals</h2>
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              {(report?.totals?.team || []).map((team: any) => (
                <div key={team.name} className="flex justify-between rounded-xl bg-background p-3"><span>{team.name}</span><b>{team.points}</b></div>
              ))}
              {!report?.totals?.team?.length && <p className="text-sm text-text-tertiary">No team totals recorded yet.</p>}
            </div>
            <p className="mt-3 text-xs text-text-tertiary">Class total: {(report?.totals?.class || []).reduce((sum: number, item: any) => sum + item.points, 0)} · School-wide totals are visible to administrators.</p>
          </section>
          <section className="rounded-2xl border border-card-border bg-card p-6">
            <h2 className="text-xl font-black text-text-primary">Student totals</h2>
            <div className="mt-3 space-y-2">
              {(report?.students || []).map((student: any) => (
                <div key={student.studentId} className="flex justify-between rounded-xl border border-card-border p-3 text-sm"><span>{student.studentName} · {student.team}</span><b className={student.points < 0 ? "text-rose-600" : "text-emerald-600"}>{student.points}</b></div>
              ))}
              {!report?.students?.length && <p className="text-sm text-text-tertiary">No point records yet.</p>}
            </div>
          </section>
        </div>
      </section>

      <section className="rounded-2xl border border-card-border bg-card p-6">
        <h2 className="text-xl font-black text-text-primary">Audit log</h2>
        <div className="mt-4 divide-y divide-card-border">
          {(report?.records || []).map((record: any) => (
            <div key={record._id} className="flex flex-wrap items-center justify-between gap-3 py-3">
              <div><p className="text-sm font-bold text-text-primary">{record.student?.displayName || record.student?.username} · {record.points > 0 ? "+" : ""}{record.points} · {record.category}</p><p className="text-xs text-text-tertiary">{record.reason} · {new Date(record.createdAt).toLocaleString()}</p></div>
              {!record.reversalOf && !record.reversedAt && <button disabled={busy} onClick={() => reverse(record._id)} className="flex items-center gap-2 rounded-lg border border-card-border px-3 py-2 text-xs font-bold text-text-secondary"><RotateCcw className="h-3 w-3" /> Reverse</button>}
              {record.reversedAt && <span className="text-xs font-bold text-rose-600">Reversed</span>}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
