"use client";

import { useEffect, useState } from "react";
import { DashboardShell } from "@/components/dashboard-shell";
import { StatCard } from "@/components/stat-card";
import { adminNav } from "@/app/admin/nav";

type Order = {
  id: string;
  amount: number;
  platform_fee: number;
  status: string;
  created_at: string;
  products: { title: string; slug: string } | null;
  creators: { display_name: string } | null;
};

export default function AdminSalesPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/orders?limit=200")
      .then((r) => r.json())
      .then((d) => setOrders(d.orders ?? []))
      .catch((err) => { console.error("Failed to load orders:", err); setError("Failed to load orders."); })
      .finally(() => setLoading(false));
  }, []);

  const paid = orders.filter((o) => o.status === "paid");
  const totalRevenue = paid.reduce((s, o) => s + o.amount, 0);
  const platformEarnings = paid.reduce((s, o) => s + o.platform_fee, 0);

  return (
    <DashboardShell title="Sales" subtitle="Review verified transactions, gross revenue, platform earnings, and creator earnings." nav={adminNav}>
      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700">{error}</div>
      )}
      <div className="grid gap-4 md:grid-cols-4">
        <StatCard label="Total Orders" value={String(orders.length)} />
        <StatCard label="Paid Orders" value={String(paid.length)} />
        <StatCard label="Total Revenue" value={new Intl.NumberFormat("en-UG", { style: "currency", currency: "UGX", maximumFractionDigits: 0 }).format(totalRevenue)} />
        <StatCard label="Platform Earnings" value={new Intl.NumberFormat("en-UG", { style: "currency", currency: "UGX", maximumFractionDigits: 0 }).format(platformEarnings)} />
      </div>

      <div className="mt-6">
        <h2 className="mb-3 text-xl font-bold">Orders</h2>
        {loading ? (
          <div className="rounded-lg border border-dashed border-neutral-300 bg-white p-8 text-center text-neutral-600">Loading...</div>
        ) : orders.length === 0 ? (
          <div className="rounded-lg border border-dashed border-neutral-300 bg-white p-8 text-center text-neutral-600">No orders yet.</div>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-neutral-200 bg-white">
            <table className="w-full text-sm">
              <thead className="border-b border-neutral-200 bg-neutral-50 text-left">
                <tr>
                  <th className="p-3 font-semibold">Product</th>
                  <th className="p-3 font-semibold">Creator</th>
                  <th className="p-3 font-semibold">Amount</th>
                  <th className="p-3 font-semibold">Fee</th>
                  <th className="p-3 font-semibold">Status</th>
                  <th className="p-3 font-semibold">Date</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o.id} className="border-b border-neutral-100">
                    <td className="p-3 font-medium">{o.products?.title ?? "—"}</td>
                    <td className="p-3 text-neutral-600">{o.creators?.display_name ?? "—"}</td>
                    <td className="p-3">{new Intl.NumberFormat("en-UG", { style: "currency", currency: "UGX", maximumFractionDigits: 0 }).format(o.amount)}</td>
                    <td className="p-3">{new Intl.NumberFormat("en-UG", { style: "currency", currency: "UGX", maximumFractionDigits: 0 }).format(o.platform_fee)}</td>
                    <td className="p-3">
                      <span className={`inline-block rounded px-2 py-0.5 text-xs font-semibold ${
                        o.status === "paid" ? "bg-green-100 text-green-800" :
                        o.status === "pending" ? "bg-yellow-100 text-yellow-800" :
                        o.status === "failed" ? "bg-red-100 text-red-800" :
                        "bg-neutral-100 text-neutral-800"
                      }`}>{o.status}</span>
                    </td>
                    <td className="p-3 text-neutral-500">{new Date(o.created_at).toLocaleDateString("en-UG")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
