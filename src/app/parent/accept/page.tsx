"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

export default function AcceptParentInvitePage() {
  const router = useRouter();
  const [token, setToken] = useState("");
  const [invite, setInvite] = useState<any>(null);
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const value = new URLSearchParams(window.location.search).get("token") || "";
    setToken(value);
    if (!value) {
      setError("Invitation link is missing its token.");
      return;
    }
    fetch(`/api/parent/accept?token=${encodeURIComponent(value)}`)
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Invitation is invalid or expired.");
        setInvite(data);
      })
      .catch((loadError) => setError(loadError.message));
  }, []);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/parent/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, username, displayName, password }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to accept invitation.");
      router.push(data.requiresLogin ? "/login?parentInviteAccepted=1" : "/parent");
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unable to accept invitation.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-xl p-8">
      <div className="rounded-3xl border border-card-border bg-card p-8 shadow-xl">
        <p className="text-xs font-black uppercase tracking-widest text-primary">Parent invitation</p>
        <h1 className="mt-2 text-3xl font-black text-text-primary">Create your read-only account</h1>
        {invite && <p className="mt-4 text-sm text-text-secondary">View progress for {invite.student?.displayName || invite.student?.username} at {invite.school?.name}. Invitation sent to {invite.email}.</p>}
        {error && <p role="alert" className="mt-4 rounded-xl bg-rose-500/10 p-3 text-sm text-rose-600">{error}</p>}
        {invite && <form onSubmit={submit} className="mt-6 space-y-4">
          <input required minLength={3} maxLength={32} value={username} onChange={(event) => setUsername(event.target.value)} placeholder="Username" className="w-full rounded-xl border border-card-border bg-background p-3" />
          <input required minLength={2} maxLength={100} value={displayName} onChange={(event) => setDisplayName(event.target.value)} placeholder="Your name" className="w-full rounded-xl border border-card-border bg-background p-3" />
          <input required minLength={10} maxLength={128} type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Password (10+ characters)" className="w-full rounded-xl border border-card-border bg-background p-3" />
          <button disabled={busy} className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary p-3 font-black text-white disabled:opacity-50">
            {busy && <Loader2 className="h-4 w-4 animate-spin" />} Accept invitation
          </button>
        </form>}
      </div>
    </div>
  );
}
