"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Loader2, Sparkles } from "lucide-react";

const tools = [
  { id: "draft", label: "Draft an assignment" },
  { id: "rewards", label: "Suggest rewards" },
  { id: "summary", label: "Summarize class progress" },
] as const;

export default function TeacherAssistantPage() {
  const [classes, setClasses] = useState<any[]>([]);
  const [classId, setClassId] = useState("");
  const [tool, setTool] = useState<(typeof tools)[number]["id"]>("draft");
  const [taskType, setTaskType] = useState("Homework");
  const [prompt, setPrompt] = useState("");
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetch("/api/classes").then((response) => response.json()).then((data) => {
      setClasses(data.classes || []);
      setClassId(data.classes?.[0]?._id || "");
    }).catch(() => setError("Unable to load your classes."));
  }, []);

  const run = async () => {
    setBusy(true);
    setError("");
    setResult(null);
    try {
      const response = await fetch("/api/teacher/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mode: tool, classId, taskType, prompt }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Teacher AI request failed.");
      setResult(data.suggestion || data.summary);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Teacher AI request failed.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6 md:p-10">
      <header>
        <p className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-primary"><Sparkles className="h-4 w-4" /> Teacher tools</p>
        <h1 className="mt-2 text-4xl font-black text-text-primary">AI Assistance</h1>
        <p className="mt-2 text-sm text-text-secondary">Suggestions only. You review and decide what to publish or award.</p>
      </header>
      <section className="space-y-5 rounded-3xl border border-card-border bg-card p-6">
        <label className="block text-xs font-black uppercase tracking-widest text-text-tertiary">
          Tool
          <select value={tool} onChange={(event) => setTool(event.target.value as typeof tool)} className="mt-2 block w-full rounded-xl border border-card-border bg-background p-3 text-sm font-bold normal-case">
            {tools.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
          </select>
        </label>
        <label className="block text-xs font-black uppercase tracking-widest text-text-tertiary">
          Class
          <select value={classId} onChange={(event) => setClassId(event.target.value)} className="mt-2 block w-full rounded-xl border border-card-border bg-background p-3 text-sm font-bold normal-case">
            {classes.map((item) => <option key={item._id} value={item._id}>{item.name}</option>)}
          </select>
        </label>
        {tool !== "summary" && <>
          <label className="block text-xs font-black uppercase tracking-widest text-text-tertiary">
            Assignment type
            <select value={taskType} onChange={(event) => setTaskType(event.target.value)} className="mt-2 block w-full rounded-xl border border-card-border bg-background p-3 text-sm font-bold normal-case">
              <option>Homework</option><option>Green</option><option>Physical</option><option>Activity</option>
            </select>
          </label>
          <textarea value={prompt} onChange={(event) => setPrompt(event.target.value)} maxLength={4000} rows={5} placeholder="Describe the learning objective or activity…" className="w-full rounded-xl border border-card-border bg-background p-4 text-sm" />
        </>}
        <button disabled={busy || !classId || (tool !== "summary" && !prompt.trim())} onClick={run} className="flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-xs font-black uppercase tracking-widest text-white disabled:opacity-50">
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />} Generate suggestion
        </button>
        {error && <p role="alert" className="text-sm text-rose-600">{error}</p>}
        {result && <pre className="whitespace-pre-wrap rounded-2xl bg-primary/5 p-5 text-sm text-text-primary">{typeof result === "string" ? result : JSON.stringify(result, null, 2)}</pre>}
        {tool === "draft" && result && <Link href="/tasks?new=1" className="inline-block text-sm font-bold text-primary">Open Assignment Manager to review and publish →</Link>}
      </section>
    </div>
  );
}
