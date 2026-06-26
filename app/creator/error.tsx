"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Store, Gauge, AlertCircle } from "lucide-react";
import { creatorNav } from "@/app/creator/nav";
import * as Sentry from "@sentry/nextjs";

export default function CreatorError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { Sentry.captureException(error); console.error(error); }, [error]);

  return (
    <main className="min-h-screen bg-neutral-50">
      <aside className="border-b border-neutral-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-4">
            <Link href="/" className="flex items-center gap-2 font-bold">
              <span className="grid h-9 w-9 place-items-center rounded-md bg-brand-green text-white"><Store size={18} /></span>
              Keevan Store
            </Link>
          </div>
          <nav className="flex gap-2 overflow-x-auto pb-1">
            {creatorNav.map((item) => (
              <Link key={item.href} href={item.href} className="shrink-0 rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm font-semibold hover:bg-brand-mist">{item.label}</Link>
            ))}
          </nav>
        </div>
      </aside>
      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-7 flex items-center gap-2 text-brand-green">
          <Gauge size={18} />
          <p className="text-sm font-bold uppercase tracking-[0.16em]">Dashboard</p>
        </div>
        <div className="flex flex-col items-center justify-center rounded-lg border border-red-200 bg-white p-12 text-center">
          <AlertCircle size={48} className="text-red-500" />
          <h2 className="mt-4 text-xl font-bold">Something went wrong</h2>
          <p className="mt-2 max-w-md text-neutral-600">An unexpected error occurred while loading this page.</p>
          <div className="mt-6 flex gap-3">
            <button onClick={reset} className="inline-flex min-h-11 items-center justify-center rounded-md bg-brand-green px-5 py-3 text-sm font-semibold text-white hover:bg-[#006f43]">
              Try again
            </button>
            <Link href="/creator/dashboard" className="inline-flex min-h-11 items-center justify-center rounded-md border border-neutral-300 bg-white px-5 py-3 text-sm font-semibold text-neutral-700 hover:bg-neutral-50">
              Go to Dashboard
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
