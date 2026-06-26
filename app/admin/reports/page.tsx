"use client";

import { useEffect, useState } from "react";
import { DashboardShell } from "@/components/dashboard-shell";
import { StatCard } from "@/components/stat-card";
import { SalesChart } from "@/components/sales-chart";
import { adminNav } from "@/app/admin/nav";

type Order = {
  id: string;
  amount: number;
  platform_fee: number;
  status: string;
  created_at: string;
};

export default function AdminReportsPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/admin/orders?limit=500").then((r) => r.json()).then((d) => setOrders(d.orders ?? [])).catch((err) => { console.error("Failed to load orders:", err); setError("Failed to load orders."); }),
      fetch("/api/admin/stats").then((r) => r.json()).then((d) => setStats(d.stats ?? {})).catch((err) => { console.error("Failed to load stats:", err); setError("Failed to load stats."); })
    ]).finally(() => setLoading(false));
  }, []);

  const paid = orders.filter((o) => o.status === "paid");
  const chartData = paid.reduce<Record<string, number>>((acc, o) => {
    const day = new Date(o.created_at).toLocaleDateString("en-UG", { month: "short", day: "numeric" });
    acc[day] = (acc[day] ?? 0) + o.amount;
    return acc;
  }, {});
  const chartPoints = Object.entries(chartData).map(([label, earnings]) => ({ label, earnings }));

  return (
    <DashboardShell title="Reports" subtitle="Platform growth, revenue, registrations, active stores, and compliance reports." nav={adminNav}>
      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700">{error}</div>
      )}
      <div className="grid gap-4 md:grid-cols-4">
        <StatCard label="Total Creators" value={String(stats.totalCreators ?? 0)} />
        <StatCard label="Total Stores" value={String(stats.totalStores ?? 0)} />
        <StatCard label="Active / Suspended" value={`${stats.activeStores ?? 0} / ${stats.suspendedStores ?? 0}`} />
        <StatCard label="New Registrations (30d)" value={String(stats.newRegistrations ?? 0)} />
      </div>

      <div className="mt-6">
        <h2 className="mb-3 text-xl font-bold">Revenue Trend</h2>
        {loading ? (
          <div className="grid h-72 place-items-center rounded-lg border border-dashed border-neutral-300 bg-white text-sm text-neutral-600">Loading...</div>
        ) : (
          <SalesChart data={chartPoints} />
        )}
      </div>
    </DashboardShell>
  );
}
