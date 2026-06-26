"use client";

import { useEffect } from "react";
import Link from "next/link";
import * as Sentry from "@sentry/nextjs";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { Sentry.captureException(error); console.error(error); }, [error]);

  return (
    <main className="mx-auto grid min-h-screen max-w-7xl place-items-center px-4 py-16 sm:px-6 lg:px-8">
      <div className="text-center">
        <p className="text-6xl font-black text-red-600">500</p>
        <h1 className="mt-4 text-3xl font-bold">Something went wrong</h1>
        <p className="mt-3 text-neutral-600">An unexpected error occurred. Please try again or contact support if the issue persists.</p>
        <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <button onClick={reset} className="inline-flex min-h-11 items-center justify-center rounded-md bg-brand-green px-5 py-3 text-sm font-semibold text-white hover:bg-[#006f43]">
            Try again
          </button>
          <Link href="/" className="inline-flex min-h-11 items-center justify-center rounded-md border border-brand-green bg-white px-5 py-3 text-sm font-semibold text-brand-green hover:bg-brand-mist">
            Go home
          </Link>
          <Link href="/contact" className="inline-flex min-h-11 items-center justify-center rounded-md border border-neutral-300 bg-white px-5 py-3 text-sm font-semibold text-neutral-700 hover:bg-neutral-50">
            Contact support
          </Link>
        </div>
      </div>
    </main>
  );
}
