"use client";

import { useCallback, useEffect, useState } from "react";
import { Check, Loader2, RefreshCw, X } from "lucide-react";

interface SchoolSignupRequest {
  _id: string;
  schoolName: string;
  contactEmail: string;
  adminUsername: string;
  adminDisplayName: string;
  createdAt: string;
}

export default function PlatformSchoolRequestsPage() {
  const [requests, setRequests] = useState<SchoolSignupRequest[]>([]);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [accessDenied, setAccessDenied] = useState(false);

  const loadRequests = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/platform-admin/school-requests");
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to load school requests.");
      setAccessDenied(false);
      setRequests(data.requests || []);
    } catch (loadError) {
      const errorMessage = loadError instanceof Error ? loadError.message : "Unable to load school requests.";
      if (errorMessage === "Platform operator access required.") {
        setAccessDenied(true);
        setRequests([]);
        setError("");
      } else {
        setError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadRequests();
  }, [loadRequests]);

  const review = async (request: SchoolSignupRequest, decision: "approve" | "reject") => {
    setBusyId(request._id);
    setError("");
    setMessage("");
    try {
      const response = await fetch("/api/platform-admin/school-requests", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestId: request._id,
          decision,
          reviewNote: notes[request._id] || "",
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to review school request.");
      const decisionMessage = decision === "approve"
        ? `${request.schoolName} approved. The school administrator can now sign in.`
        : `${request.schoolName} request rejected.`;
      setMessage(data.emailWarning ? `${decisionMessage} ${data.emailWarning}` : decisionMessage);
      await loadRequests();
    } catch (reviewError) {
      setError(reviewError instanceof Error ? reviewError.message : "Unable to review school request.");
    } finally {
      setBusyId("");
    }
  };

  return (
    <main className="mx-auto max-w-5xl space-y-6 p-6 md:p-10">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-black uppercase tracking-widest text-primary">ClassCrib operations</p>
          <h1 className="mt-2 text-3xl font-black text-text-primary">School signup requests</h1>
          <p className="mt-2 text-sm text-text-secondary">
            Verify the school and contact details before granting school administrator access.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void loadRequests()}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-xl border border-card-border px-4 py-2 text-sm font-bold text-text-primary disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </header>

      {error && <p role="alert" className="rounded-xl bg-rose-500/10 p-4 text-sm text-rose-600">{error}</p>}
      {message && <p role="status" className="rounded-xl bg-emerald-500/10 p-4 text-sm text-emerald-600">{message}</p>}

      {loading ? (
        <div className="flex items-center gap-3 rounded-2xl border border-card-border bg-card p-8 text-text-secondary">
          <Loader2 className="h-5 w-5 animate-spin" /> Loading requests…
        </div>
      ) : accessDenied ? (
        <div role="alert" className="space-y-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-6 text-sm text-text-primary">
          <h2 className="font-black">Operator access required</h2>
          <p>
            You are not signed in as a ClassCrib operator. School signup requests remain pending until an operator account is created and approved access is used here.
          </p>
          <p>Signing in as a student or school administrator does not grant operator approval access.</p>
        </div>
      ) : requests.length === 0 ? (
        <div className="rounded-2xl border border-card-border bg-card p-8 text-sm text-text-secondary">
          There are no pending school requests.
        </div>
      ) : (
        <section className="space-y-4">
          {requests.map((request) => (
            <article key={request._id} className="rounded-2xl border border-card-border bg-card p-5 md:p-6">
              <div className="flex flex-wrap justify-between gap-3">
                <div>
                  <h2 className="text-xl font-black text-text-primary">{request.schoolName}</h2>
                  <p className="mt-1 text-sm text-text-secondary">{request.contactEmail}</p>
                </div>
                <p className="text-xs text-text-tertiary">
                  Requested {new Date(request.createdAt).toLocaleString()}
                </p>
              </div>
              <div className="mt-4 rounded-xl bg-card-hover p-4 text-sm text-text-secondary">
                Proposed administrator: <strong className="text-text-primary">{request.adminDisplayName}</strong>
                {" "}(@{request.adminUsername})
              </div>
              <label className="mt-4 block text-xs font-bold text-text-secondary">
                Internal review note (optional)
                <textarea
                  value={notes[request._id] || ""}
                  onChange={(event) => setNotes((current) => ({ ...current, [request._id]: event.target.value }))}
                  maxLength={500}
                  rows={2}
                  className="mt-2 w-full rounded-xl border border-card-border bg-background p-3 text-sm"
                  placeholder="Record the verification outcome or reason for rejection."
                />
              </label>
              <div className="mt-4 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={() => void review(request, "approve")}
                  disabled={Boolean(busyId)}
                  className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-black text-white disabled:opacity-50"
                >
                  {busyId === request._id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                  Approve and create school admin
                </button>
                <button
                  type="button"
                  onClick={() => void review(request, "reject")}
                  disabled={Boolean(busyId)}
                  className="inline-flex items-center gap-2 rounded-xl border border-rose-500/30 px-4 py-2.5 text-sm font-black text-rose-600 disabled:opacity-50"
                >
                  <X className="h-4 w-4" /> Reject request
                </button>
              </div>
            </article>
          ))}
        </section>
      )}
    </main>
  );
}
