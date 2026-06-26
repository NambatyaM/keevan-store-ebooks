"use client";

import { useEffect, useState } from "react";
import { DashboardShell } from "@/components/dashboard-shell";
import { StatCard } from "@/components/stat-card";
import { SalesChart } from "@/components/sales-chart";
import { creatorNav } from "@/app/creator/nav";
import { useAuth } from "@/components/auth-provider";
import { formatUgx } from "@/lib/constants";
import Link from "next/link";

type Order = {
  id: string;
  amount: number;
  platform_fee: number;
  status: string;
  created_at: string;
  products: { title: string; slug: string } | null;
};

export default function CreatorDashboardPage() {
  const { profile, loading } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [summary, setSummary] = useState<Record<string, number>>({});
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (loading) return;
    Promise.all([
      fetch("/api/orders?limit=10").then((r) => r.json()).then((d) => setOrders(d.orders ?? [])).catch((err) => { console.error("Failed to load orders:", err); setError("Failed to load recent orders."); }),
      fetch("/api/analytics/summary?days=30").then((r) => r.json()).then((d) => setSummary(d.summary ?? {})).catch((err) => { console.error("Failed to load analytics summary:", err); setError("Failed to load analytics data."); })
    ]).finally(() => setLoadingData(false));
  }, [loading]);

  const paidOrders = orders.filter((o) => o.status === "paid");
  const totalEarnings = paidOrders.reduce((s, o) => s + (o.amount - o.platform_fee), 0);
  const totalSales = paidOrders.length;
  const pendingCount = orders.filter((o) => o.status === "pending").length;

  const chartData = paidOrders.reduce<Record<string, number>>((acc, o) => {
    const day = new Date(o.created_at).toLocaleDateString("en-UG", { month: "short", day: "numeric" });
    acc[day] = (acc[day] ?? 0) + (o.amount - o.platform_fee);
    return acc;
  }, {});
  const chartPoints = Object.entries(chartData).map(([label, earnings]) => ({ label, earnings }));

  return (
    <DashboardShell title="Creator Overview" subtitle="Track sales, balance, store growth, downloads, and withdrawals from one simple workspace." nav={creatorNav}>
      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700">{error}</div>
      )}
      <div className="grid gap-4 md:grid-cols-4">
        <StatCard label="Total Sales" value={String(totalSales)} />
        <StatCard label="Earnings (paid)" value={formatUgx(totalEarnings)} />
        <StatCard label="Current Balance" value={profile ? formatUgx(Number((profile as any).available_balance) || 0) : "—"} />
        <StatCard label="Pending Orders" value={String(pendingCount)} />
      </div>

      <div className="mt-6">
        <h2 className="mb-3 text-xl font-bold">Earnings Growth (30d)</h2>
        {loadingData ? (
          <div className="grid h-72 place-items-center rounded-lg border border-dashed border-neutral-300 bg-white text-sm text-neutral-600">Loading...</div>
        ) : (
          <SalesChart data={chartPoints} />
        )}
      </div>

      {orders.length > 0 && (
        <div className="mt-8">
          <h2 className="mb-3 text-xl font-bold">Recent Orders</h2>
          <div className="overflow-x-auto rounded-lg border border-neutral-200 bg-white">
            <table className="w-full text-sm">
              <thead className="border-b border-neutral-200 bg-neutral-50 text-left">
                <tr>
                  <th className="p-3 font-semibold">Product</th>
                  <th className="p-3 font-semibold">Amount</th>
                  <th className="p-3 font-semibold">Status</th>
                  <th className="p-3 font-semibold">Date</th>
                </tr>
              </thead>
              <tbody>
                {orders.slice(0, 5).map((o) => (
                  <tr key={o.id} className="border-b border-neutral-100">
                    <td className="p-3">{o.products?.title ?? "—"}</td>
                    <td className="p-3">{formatUgx(o.amount)}</td>
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
          {orders.length > 5 && (
            <Link href="/creator/earnings" className="mt-2 inline-block text-sm font-semibold text-brand-green">View all orders →</Link>
          )}
        </div>
      )}
    </DashboardShell>
  );
}
