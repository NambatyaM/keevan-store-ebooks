"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Download, Package, ArrowLeft, Loader2, ShoppingBag } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { TableSkeleton } from "@/components/ui/skeleton";
import { formatUgx } from "@/lib/constants";

type Purchase = {
  id: string;
  product_id: string;
  product_title: string;
  product_slug: string;
  creator_name: string;
  store_slug: string;
  amount: number;
  paid_at: string;
};

export default function BuyerDashboardPage() {
  const router = useRouter();
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/buyer/purchases")
      .then((r) => {
        if (r.status === 401) { router.push("/login?role=buyer"); return null; }
        return r.json();
      })
      .then((data) => {
        if (data) setPurchases(data.purchases ?? []);
      })
      .catch(() => setError("Unable to load purchases."))
      .finally(() => setLoading(false));
  }, [router]);

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
        {loading && (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-24 animate-pulse rounded-xl bg-neutral-100" />
            ))}
          </div>
        )}

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700">{error}</div>
        )}

        {!loading && !error && purchases.length === 0 && (
          <EmptyState
            icon={<Package size={48} strokeWidth={1.2} />}
            title="No purchases yet"
            description="When you buy a product, it will appear here."
            actionLabel="Browse Stores"
            actionHref="/"
          />
        )}

        {!loading && !error && purchases.length > 0 && (
          <div className="grid gap-4">
            {purchases.map((p) => (
              <div
                key={p.id}
                className="flex flex-col gap-3 rounded-xl border border-border bg-surface-card p-4 shadow-card transition hover:shadow-lift sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-mist">
                    <ShoppingBag size={18} className="text-brand-green" />
                  </div>
                  <div>
                    <Link
                      href={`/product/${p.product_slug}`}
                      className="font-bold text-brand-black hover:text-brand-green"
                    >
                      {p.product_title}
                    </Link>
                    <p className="text-sm text-muted">
                      by{" "}
                      <Link href={`/store/${p.store_slug}`} className="font-medium hover:text-brand-green">
                        {p.creator_name}
                      </Link>
                    </p>
                    <p className="text-xs text-muted">
                      {formatUgx(p.amount)} &middot; {new Date(p.paid_at).toLocaleDateString("en-UG")}
                    </p>
                  </div>
                </div>
                <DownloadButton slug={p.product_slug} />
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

function DownloadButton({ slug }: { slug: string }) {
  const [downloading, setDownloading] = useState(false);

  async function handleDownload() {
    setDownloading(true);
    try {
      const res = await fetch(`/api/buyer/download?slug=${encodeURIComponent(slug)}`);
      if (!res.ok) { alert("Unable to generate download link."); return; }
      const { url } = await res.json();
      const a = document.createElement("a");
      a.href = url;
      a.download = "";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch {
      alert("Unable to generate download link.");
    } finally {
      setDownloading(false);
    }
  }

  return (
    <button
      onClick={handleDownload}
      disabled={downloading}
      className="flex shrink-0 items-center gap-2 rounded-lg bg-brand-green px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-green-deep disabled:opacity-50"
    >
      {downloading ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
      {downloading ? "Downloading..." : "Download"}
    </button>
  );
}
