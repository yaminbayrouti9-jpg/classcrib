import Link from "next/link";
import { ArrowLeft, SearchX } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center px-6 py-16">
      <div className="max-w-lg text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl border border-primary/20 bg-primary/10 text-primary">
          <SearchX className="h-8 w-8" />
        </div>
        <p className="mb-3 text-xs font-black uppercase tracking-[0.2em] text-primary">404 · Page not found</p>
        <h1 className="text-3xl font-black tracking-tight text-text-primary">This page isn&apos;t here.</h1>
        <p className="mt-3 text-sm font-medium leading-relaxed text-text-secondary">
          The link may be out of date, or the page may have moved.
        </p>
        <Link
          href="/dashboard"
          className="mt-8 inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-bold text-white transition-colors hover:bg-primary/90"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to ClassCrib
        </Link>
      </div>
    </div>
  );
}
