"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { signOut, useSession } from "next-auth/react";
import { Loader2, ShieldCheck } from "lucide-react";

export default function PlatformOperatorSetupPage() {
  const [username, setUsername] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [complete, setComplete] = useState(false);
  const [busy, setBusy] = useState(false);
  const { data: session, status } = useSession();
  const role = (session?.user as { role?: string } | undefined)?.role;

  const createOperator = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true);
    setError("");

    try {
      const response = await fetch("/api/platform-admin/operators/setup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, displayName, password }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to create the operator account.");
      setComplete(true);
      setPassword("");
    } catch (setupError) {
      setError(setupError instanceof Error ? setupError.message : "Unable to create the operator account.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="mx-auto flex min-h-screen max-w-xl items-center px-6 py-12">
      <section className="w-full space-y-6 rounded-3xl border border-card-border bg-card p-7 shadow-xl">
        <div>
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <p className="text-xs font-black uppercase tracking-widest text-primary">One-time secure setup</p>
          <h1 className="mt-2 text-3xl font-black text-text-primary">Create ClassCrib operator</h1>
          <p className="mt-3 text-sm leading-6 text-text-secondary">
            A signed-in school administrator can create the initial ClassCrib operator account. This setup is available only once for the entire platform.
          </p>
        </div>

        {status === "loading" ? (
          <div className="flex items-center gap-3 text-sm text-text-secondary">
            <Loader2 className="h-4 w-4 animate-spin" /> Checking your account…
          </div>
        ) : !session?.user ? (
          <div className="space-y-4 rounded-2xl border border-amber-500/20 bg-amber-500/10 p-5 text-sm text-text-primary">
            <p>Sign in with an existing school administrator account before creating the first operator.</p>
            <Link href="/login" className="inline-flex rounded-xl bg-primary px-4 py-3 text-xs font-black uppercase text-white">
              Sign in
            </Link>
          </div>
        ) : role !== "SchoolAdmin" ? (
          <div role="alert" className="space-y-3 rounded-2xl border border-rose-500/20 bg-rose-500/10 p-5 text-sm text-text-primary">
            <p className="font-bold">School administrator access is required.</p>
            <p>Your current account cannot create the initial ClassCrib operator.</p>
            <button type="button" onClick={() => void signOut({ callbackUrl: "/login" })} className="rounded-xl bg-primary px-4 py-3 text-xs font-black uppercase text-white">
              Sign out
            </button>
          </div>
        ) : complete ? (
          <div role="status" className="space-y-4 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-5 text-sm text-text-primary">
            <p className="font-bold">Operator account created. The setup endpoint can no longer be used.</p>
            <p>Sign out of this school admin account, then sign in as the operator you just created to review school requests.</p>
            <button type="button" onClick={() => void signOut({ callbackUrl: "/login" })} className="inline-flex rounded-xl bg-primary px-4 py-3 text-xs font-black uppercase text-white">
              Sign out and go to login
            </button>
          </div>
        ) : (
          <form onSubmit={createOperator} className="space-y-4">
            <label className="block text-xs font-bold text-text-secondary">
              Operator display name
              <input
                type="text"
                required
                minLength={2}
                maxLength={100}
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
                className="mt-2 w-full rounded-xl border border-card-border bg-background p-3 text-sm"
              />
            </label>
            <label className="block text-xs font-bold text-text-secondary">
              Username
              <input
                type="text"
                required
                minLength={3}
                maxLength={32}
                pattern="[A-Za-z0-9._-]+"
                autoComplete="username"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                className="mt-2 w-full rounded-xl border border-card-border bg-background p-3 text-sm"
              />
            </label>
            <label className="block text-xs font-bold text-text-secondary">
              Password (at least 12 characters)
              <input
                type="password"
                required
                minLength={12}
                maxLength={128}
                autoComplete="new-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="mt-2 w-full rounded-xl border border-card-border bg-background p-3 text-sm"
              />
            </label>

            {error && <p role="alert" className="rounded-xl bg-rose-500/10 p-3 text-sm text-rose-600">{error}</p>}

            <button
              type="submit"
              disabled={busy}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-black text-white disabled:opacity-50"
            >
              {busy && <Loader2 className="h-4 w-4 animate-spin" />}
              Create initial operator
            </button>
          </form>
        )}
      </section>
    </main>
  );
}
