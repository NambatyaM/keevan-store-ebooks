"use client";

import { useEffect, useState, useMemo } from "react";
import { DashboardShell } from "@/components/dashboard-shell";
import { StatCard } from "@/components/ui/stat-card";
import { TableSkeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { formatCurrency, type Currency } from "@/lib/constants";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from "recharts";
import { TrendingUp, Users, Store, UserPlus, BarChart3 } from "lucide-react";

type Order = {
  id: string;
  amount: number;
  platform_fee: number;
  status: string;
  created_at: string;
  currency?: string;
};

const CHART_COLORS = ["#00854A", "#F5A623", "#3B82F6", "#8B5CF6", "#EF4444"];

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

  const paid = useMemo(() => orders.filter((o) => o.status === "paid" || o.status === "completed"), [orders]);

  const revenueByCurrency = useMemo(() => {
    const map = new Map<string, { gross: number; fee: number; count: number }>();
    paid.forEach((o) => {
      const c = o.currency ?? "UGX";
      const existing = map.get(c) ?? { gross: 0, fee: 0, count: 0 };
      existing.gross += o.amount;
      existing.fee += o.platform_fee;
      existing.count += 1;
      map.set(c, existing);
    });
    return Array.from(map.entries()).map(([currency, data]) => ({ currency, ...data }));
  }, [paid]);

  const chartDataMap = useMemo(() => {
    const map = new Map<string, Record<string, number | string>>();
    paid.forEach((o) => {
      const day = new Date(o.created_at).toLocaleDateString("en-UG", { month: "short", day: "numeric" });
      const c = o.currency ?? "UGX";
      if (!map.has(day)) map.set(day, { label: day });
      const entry = map.get(day)!;
      entry[c] = (entry[c] as number ?? 0) + o.amount;
    });
    return Array.from(map.values());
  }, [paid]);

  const currencies = useMemo(() => {
    const set = new Set<string>();
    paid.forEach((o) => set.add(o.currency ?? "UGX"));
    return Array.from(set);
  }, [paid]);

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

          {/* Revenue by currency summary */}
          {revenueByCurrency.length > 0 && (
            <div className="mb-6 rounded-xl border border-border bg-surface-card p-5 shadow-card">
              <h2 className="mb-1 text-lg font-bold">Revenue Summary</h2>
              <p className="mb-4 text-sm text-muted">
                Total from {paid.length} paid/completed orders
              </p>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
                {revenueByCurrency.map((r) => (
                  <div key={r.currency} className="rounded-lg border border-border bg-surface p-3">
                    <p className="text-xs font-semibold text-muted">{r.currency}</p>
                    <p className="text-lg font-bold text-brand-black">{formatCurrency(r.gross, r.currency as Currency)}</p>
                    <p className="text-xs text-muted">{r.count} orders &middot; {formatCurrency(r.fee, r.currency as Currency)} fees</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Revenue chart */}
          <div className="rounded-xl border border-border bg-surface-card p-6 shadow-card">
            <h2 className="mb-1 text-lg font-bold">Revenue Trend</h2>
            <p className="mb-6 text-sm text-muted">
              Revenue by currency over time
            </p>
            {chartDataMap.length === 0 ? (
              <div className="flex h-72 items-center justify-center">
                <EmptyState icon={<BarChart3 size={40} strokeWidth={1.2} />} title="No revenue data yet" />
              </div>
            ) : (
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartDataMap}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                    <XAxis dataKey="label" tick={{ fontSize: 12, fill: "#6B7280" }} />
                    <YAxis tick={{ fontSize: 12, fill: "#6B7280" }} />
                    <Tooltip
                      formatter={(value: number, name: string) => [formatCurrency(value, name as Currency), name]}
                      contentStyle={{ borderRadius: 8, border: "1px solid #E5E7EB" }}
                    />
                    <Legend
                      formatter={(value: string) => <span className="text-sm">{value}</span>}
                    />
                    {currencies.map((c, i) => (
                      <Bar key={c} dataKey={c} fill={CHART_COLORS[i % CHART_COLORS.length]} radius={[4, 4, 0, 0]} />
                    ))}
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
