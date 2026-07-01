import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function BuyerLoading() {
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
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-xl bg-neutral-100" />
          ))}
        </div>
      </main>
    </div>
  );
}
