"use client";

import { useEffect, useState } from "react";
import { DashboardShell } from "@/components/dashboard-shell";
import { adminNav } from "@/app/admin/nav";

type Product = {
  id: string;
  title: string;
  slug: string;
  price: number;
  status: string;
  created_at: string;
  stores: { name: string; slug: string } | null;
};

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionMsg, setActionMsg] = useState("");
  const [error, setError] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    fetch("/api/products?limit=200")
      .then((r) => r.json())
      .then((d) => setProducts(d.products ?? []))
      .catch((err) => { console.error("Failed to load products:", err); setError("Failed to load products."); })
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleAction = async (id: string, action: "disable" | "reactivate") => {
    setActionMsg("");
    try {
      const res = await fetch(`/api/admin/products/${id}/${action}`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setActionMsg(data.error?.message ?? "Action failed.");
      } else {
        setActionMsg(`Product ${action}d successfully.`);
        load();
      }
    } catch {
      setActionMsg("Network error.");
    }
  };

  return (
    <DashboardShell title="Product Moderation" subtitle="Review uploaded products, disable violating content, and disable stores when required." nav={adminNav}>
      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700">{error}</div>
      )}
      {actionMsg && (
        <p className={`mb-4 rounded-lg border p-3 text-sm font-semibold ${
          actionMsg.includes("successfully") ? "border-green-200 bg-green-50 text-green-700" : "border-red-200 bg-red-50 text-red-700"
        }`}>{actionMsg}</p>
      )}

      {loading ? (
        <div className="rounded-lg border border-dashed border-neutral-300 bg-white p-8 text-center text-neutral-600">Loading...</div>
      ) : products.length === 0 ? (
        <div className="rounded-lg border border-dashed border-neutral-300 bg-white p-8 text-center text-neutral-600">No products yet.</div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-neutral-200 bg-white">
          <table className="w-full text-sm">
            <thead className="border-b border-neutral-200 bg-neutral-50 text-left">
              <tr>
                <th className="p-3 font-semibold">Title</th>
                <th className="p-3 font-semibold">Store</th>
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
                  <td className="p-3 text-neutral-600">{p.stores?.name ?? "—"}</td>
                  <td className="p-3">{new Intl.NumberFormat("en-UG", { style: "currency", currency: "UGX", maximumFractionDigits: 0 }).format(p.price)}</td>
                  <td className="p-3">
                    <span className={`inline-block rounded px-2 py-0.5 text-xs font-semibold ${
                      p.status === "published" ? "bg-green-100 text-green-800" :
                      p.status === "disabled" ? "bg-red-100 text-red-800" :
                      "bg-neutral-100 text-neutral-600"
                    }`}>{p.status}</span>
                  </td>
                  <td className="p-3 text-neutral-500">{new Date(p.created_at).toLocaleDateString("en-UG")}</td>
                  <td className="p-3">
                    {p.status === "published" && (
                      <button
                        onClick={() => handleAction(p.id, "disable")}
                        className="rounded bg-red-600 px-2 py-1 text-xs font-semibold text-white hover:bg-red-700"
                      >
                        Disable
                      </button>
                    )}
                    {p.status === "disabled" && (
                      <button
                        onClick={() => handleAction(p.id, "reactivate")}
                        className="rounded bg-green-600 px-2 py-1 text-xs font-semibold text-white hover:bg-green-700"
                      >
                        Reactivate
                      </button>
                    )}
                    {p.status !== "published" && p.status !== "disabled" && (
                      <span className="text-xs text-neutral-400">—</span>
                    )}
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
