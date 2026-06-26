"use client";

import { useEffect, useState } from "react";
import { DashboardShell } from "@/components/dashboard-shell";
import { creatorNav } from "@/app/creator/nav";
import { formatUgx } from "@/lib/constants";
import Link from "next/link";

type Product = {
  id: string;
  title: string;
  slug: string;
  price: number;
  status: string;
  created_at: string;
};

export default function CreatorProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/products")
      .then((r) => r.json())
      .then((d) => setProducts(d.products ?? []))
      .catch((err) => { console.error("Failed to load products:", err); setError("Failed to load products."); })
      .finally(() => setLoading(false));
  }, []);

  return (
      <DashboardShell title="Products" subtitle="Upload products, update pricing, change cover images, and disable products when needed." nav={creatorNav} action={{ href: "/creator/products/new", label: "+ New Product" }}>
      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700">{error}</div>
      )}
      {loading ? (
        <div className="rounded-lg border border-dashed border-neutral-300 bg-white p-8 text-center text-neutral-600">Loading...</div>
      ) : products.length === 0 ? (
        <div className="rounded-lg border border-dashed border-neutral-300 bg-white p-8 text-center text-neutral-600">
          No products yet. Create your first product to start selling.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-neutral-200 bg-white">
          <table className="w-full text-sm">
            <thead className="border-b border-neutral-200 bg-neutral-50 text-left">
              <tr>
                <th className="p-3 font-semibold">Title</th>
                <th className="p-3 font-semibold">Price</th>
                <th className="p-3 font-semibold">Status</th>
                <th className="p-3 font-semibold">Created</th>
                <th className="p-3 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id} className="border-b border-neutral-100">
                  <td className="p-3 font-medium">{p.title}</td>
                  <td className="p-3">{formatUgx(p.price)}</td>
                  <td className="p-3">
                    <span className={`inline-block rounded px-2 py-0.5 text-xs font-semibold ${
                      p.status === "published" ? "bg-green-100 text-green-800" : "bg-neutral-100 text-neutral-600"
                    }`}>{p.status}</span>
                  </td>
                  <td className="p-3 text-neutral-500">{new Date(p.created_at).toLocaleDateString("en-UG")}</td>
                  <td className="p-3">
                    <Link href={`/creator/products/${p.id}/edit`} className="text-sm font-semibold text-brand-green">Edit</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </DashboardShell>
  );
}
