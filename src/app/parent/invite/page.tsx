"use client";

import { useEffect, useState } from "react";
import { Copy, Loader2, MailPlus } from "lucide-react";

type InviteClass = { _id: string; name: string; students?: Array<{ _id: string; username: string; displayName?: string }> };

export default function ParentInvitePage() {
  const [classes, setClasses] = useState<InviteClass[]>([]);
  const [classId, setClassId] = useState("");
  const [studentId, setStudentId] = useState("");
  const [email, setEmail] = useState("");
  const [inviteUrl, setInviteUrl] = useState("");
  const [emailSent, setEmailSent] = useState(false);
  const [emailWarning, setEmailWarning] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetch("/api/classes").then(async (response) => {
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to load classes.");
      const available = data.classes || [];
      setClasses(available);
      setClassId(available[0]?._id || "");
      setStudentId(available[0]?.students?.[0]?._id || "");
    }).catch((loadError) => setError(loadError.message));
  }, []);

  const selectedClass = classes.find((item) => item._id === classId);

  const invite = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    setInviteUrl("");
    try {
      const response = await fetch("/api/parent/invites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ classId, studentId, email: email.trim() || undefined }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to create parent invite.");
      setInviteUrl(data.inviteUrl);
      setEmailSent(data.emailSent);
      setEmailWarning(data.emailWarning || "");
    } catch (inviteError) {
      setError(inviteError instanceof Error ? inviteError.message : "Unable to create parent invite.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl p-6 md:p-10">
      <form onSubmit={invite} className="space-y-5 rounded-3xl border border-card-border bg-card p-7">
        <p className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-primary"><MailPlus className="h-4 w-4" /> Parent accounts</p>
        <h1 className="text-3xl font-black text-text-primary">Invite a parent or guardian</h1>
        <p className="text-sm text-text-secondary">The parent receives read-only homework and behaviour access for the selected student.</p>
        <label className="block text-xs font-bold text-text-tertiary">
          Class
          <select value={classId} onChange={(event) => {
            const value = event.target.value;
            setClassId(value);
            setStudentId(classes.find((item) => item._id === value)?.students?.[0]?._id || "");
          }} className="mt-1 w-full rounded-xl border border-card-border bg-background p-3 text-sm text-text-primary">
            {classes.map((item) => <option key={item._id} value={item._id}>{item.name}</option>)}
          </select>
        </label>
        <label className="block text-xs font-bold text-text-tertiary">
          Student
          <select value={studentId} onChange={(event) => setStudentId(event.target.value)} className="mt-1 w-full rounded-xl border border-card-border bg-background p-3 text-sm text-text-primary">
            {(selectedClass?.students || []).map((student) => <option key={student._id} value={student._id}>{student.displayName || student.username} (@{student.username})</option>)}
          </select>
        </label>
        <label className="block text-xs font-bold text-text-tertiary">
          Parent email
          <input type="email" required value={email} onChange={(event) => setEmail(event.target.value)} maxLength={254} className="mt-1 w-full rounded-xl border border-card-border bg-background p-3 text-sm text-text-primary" />
        </label>
        <button disabled={busy || !classId || !studentId} className="flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-xs font-black uppercase tracking-widest text-white disabled:opacity-50">
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <MailPlus className="h-4 w-4" />} Create invitation
        </button>
        {error && <p role="alert" className="text-sm text-rose-600">{error}</p>}
        {inviteUrl && <div className="space-y-3 rounded-xl bg-background p-4">
          <p role="status" className="text-sm font-bold text-text-primary">{emailSent ? "Invitation emailed." : "Invitation created. Copy and send it securely to the parent."}</p>
          {emailWarning && <p role="alert" className="text-xs font-semibold text-amber-700">{emailWarning}</p>}
          <input readOnly value={inviteUrl} className="w-full rounded-lg border border-card-border bg-card p-2 text-xs text-text-secondary" />
          <button type="button" onClick={() => navigator.clipboard.writeText(inviteUrl)} className="flex items-center gap-2 text-xs font-black text-primary"><Copy className="h-4 w-4" /> Copy invitation link</button>
        </div>}
      </form>
    </div>
  );
}
