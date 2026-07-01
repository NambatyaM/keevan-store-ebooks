"use client";

import { useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, AlertCircle } from "lucide-react";
import * as Sentry from "@sentry/nextjs";

export default function BuyerError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { Sentry.captureException(error); console.error(error); }, [error]);

  return (
    <div className="min-h-screen bg-brand-bg">
      <header className="border-b border-border bg-surface-card">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">My Purchases</p>
            <h1 className="text-2xl font-black text-brand-black">Buyer Dashboard</h1>
          </div>
          <Link
            href="/"
            className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-sm font-semibold text-muted transition hover:bg-surface"
          >
            <ArrowLeft size={16} />
            Browse Stores
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-4xl px-4 py-8">
        <div className="flex flex-col items-center justify-center rounded-lg border border-red-200 bg-white p-12 text-center">
          <AlertCircle size={48} className="text-red-500" />
          <h2 className="mt-4 text-xl font-bold">Something went wrong</h2>
          <p className="mt-2 max-w-md text-neutral-600">An unexpected error occurred while loading your purchases.</p>
          <div className="mt-6 flex gap-3">
            <button onClick={reset} className="inline-flex min-h-11 items-center justify-center rounded-md bg-brand-green px-5 py-3 text-sm font-semibold text-white hover:bg-[#006f43]">
              Try again
            </button>
            <Link href="/" className="inline-flex min-h-11 items-center justify-center rounded-md border border-neutral-300 bg-white px-5 py-3 text-sm font-semibold text-neutral-700 hover:bg-neutral-50">
              Browse Stores
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
