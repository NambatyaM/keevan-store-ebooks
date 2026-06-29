"use client";

import { useEffect, useState } from "react";
import { DashboardShell } from "@/components/dashboard-shell";
import { StatCard } from "@/components/ui/stat-card";
import { TableSkeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { formatUgx } from "@/lib/constants";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { TrendingUp, Users, Store, UserPlus, BarChart3 } from "lucide-react";

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
    setLoading(true);
    setError(null);
    Promise.all([
      fetch("/api/admin/orders?limit=500")
        .then((r) => r.json())
        .then((d) => setOrders(d.orders ?? []))
        .catch((err) => { console.error("Failed to load orders:", err); setError("Failed to load orders."); }),
      fetch("/api/admin/stats")
        .then((r) => r.json())
        .then((d) => setStats(d.stats ?? {}))
        .catch((err) => { console.error("Failed to load stats:", err); setError("Failed to load stats."); }),
    ]).finally(() => setLoading(false));
  }, []);

  const paid = orders.filter((o) => o.status === "paid");
  const chartDataMap = paid.reduce<Record<string, { label: string; revenue: number; orders: number }>>((acc, o) => {
    const day = new Date(o.created_at).toLocaleDateString("en-UG", { month: "short", day: "numeric" });
    if (!acc[day]) acc[day] = { label: day, revenue: 0, orders: 0 };
    acc[day].revenue += o.amount;
    acc[day].orders += 1;
    return acc;
  }, {});
  const chartData = Object.values(chartDataMap);

  return (
    <DashboardShell
      title="Reports"
      subtitle="Platform growth, revenue, registrations, and compliance reports"
      role="admin"
    >
      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700">{error}</div>
      )}

      {loading ? (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-24 animate-pulse rounded-xl bg-neutral-100" />
            ))}
          </div>
          <div className="h-72 animate-pulse rounded-xl bg-neutral-100" />
        </div>
      ) : (
        <>
          {/* Summary cards */}
          <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard label="Total Creators" value={String(stats.totalCreators ?? 0)} icon={<Users size={20} />} />
            <StatCard label="Total Stores" value={String(stats.totalStores ?? 0)} icon={<Store size={20} />} />
            <StatCard
              label="Active / Suspended"
              value={`${stats.activeStores ?? 0} / ${stats.suspendedStores ?? 0}`}
              icon={<Store size={20} />}
            />
            <StatCard
              label="New Registrations (30d)"
              value={String(stats.newRegistrations ?? 0)}
              icon={<UserPlus size={20} />}
              green
            />
          </div>

          {/* Revenue chart */}
          <div className="rounded-xl border border-border bg-surface-card p-6 shadow-card">
            <h2 className="mb-1 text-lg font-bold">Revenue Trend</h2>
            <p className="mb-6 text-sm text-muted">
              Total revenue from paid orders: {formatUgx(paid.reduce((s, o) => s + o.amount, 0))}
            </p>
            {chartData.length === 0 ? (
              <div className="flex h-72 items-center justify-center">
                <EmptyState icon={<BarChart3 size={40} strokeWidth={1.2} />} title="No revenue data yet" />
              </div>
            ) : (
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                    <XAxis dataKey="label" tick={{ fontSize: 12, fill: "#6B7280" }} />
                    <YAxis tick={{ fontSize: 12, fill: "#6B7280" }} />
                    <Tooltip
                      formatter={(value: number) => [formatUgx(value), "Revenue"]}
                      contentStyle={{ borderRadius: 8, border: "1px solid #E5E7EB" }}
                    />
                    <Bar dataKey="revenue" fill="#00854A" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </>
      )}
    </DashboardShell>
  );
}
