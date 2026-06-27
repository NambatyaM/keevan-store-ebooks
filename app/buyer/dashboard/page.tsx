"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Download, Package, ArrowLeft, Loader2 } from "lucide-react";
import { SimplePage } from "@/components/simple-page";

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

  if (loading) {
    return (
      <SimplePage title="My Purchases" eyebrow="Buyer dashboard">
        <div className="flex items-center justify-center py-16">
          <Loader2 className="animate-spin text-brand-green" size={32} />
        </div>
      </SimplePage>
    );
  }

  return (
    <SimplePage title="My Purchases" eyebrow="Buyer dashboard">
      {error ? (
        <p className="text-red-600">{error}</p>
      ) : purchases.length === 0 ? (
        <div className="rounded-lg border border-dashed border-neutral-300 p-8 text-center">
          <Package className="mx-auto text-neutral-400" size={48} aria-hidden />
          <h2 className="mt-4 text-xl font-bold">No purchases yet</h2>
          <p className="mt-2 text-neutral-600">When you buy a product, it will appear here.</p>
          <Link href="/" className="mt-4 inline-block text-brand-green hover:underline">
            Browse stores
          </Link>
        </div>
      ) : (
        <div className="grid gap-4">
          {purchases.map((p) => (
            <div key={p.id} className="flex items-center justify-between rounded-lg border border-neutral-200 p-4">
              <div>
                <Link href={`/product/${p.product_slug}`} className="font-bold text-brand-green hover:underline">
                  {p.product_title}
                </Link>
                <p className="text-sm text-neutral-600">
                  by <Link href={`/store/${p.store_slug}`} className="hover:underline">{p.creator_name}</Link>
                </p>
                <p className="text-sm text-neutral-500">
                  UGX {p.amount.toLocaleString()} &middot; {new Date(p.paid_at).toLocaleDateString()}
                </p>
              </div>
              <button
                onClick={() => generateDownload(p.product_slug)}
                className="flex items-center gap-2 rounded-md bg-brand-green px-4 py-2 text-sm font-semibold text-white hover:bg-[#006f43]"
              >
                <Download size={16} aria-hidden />
                Download
              </button>
            </div>
          ))}
        </div>
      )}
    </SimplePage>
  );
}

async function generateDownload(slug: string) {
  try {
    const res = await fetch(`/api/buyer/download?slug=${encodeURIComponent(slug)}`);
    if (!res.ok) { alert("Unable to generate download link."); return; }
    const { url } = await res.json();
    window.open(url, "_blank");
  } catch {
    alert("Unable to generate download link.");
  }
}
