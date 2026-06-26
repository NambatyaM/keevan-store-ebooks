"use client";

import { useEffect, useState } from "react";
import { DashboardShell } from "@/components/dashboard-shell";
import { StatCard } from "@/components/stat-card";
import { adminNav } from "@/app/admin/nav";

type LogEntry = {
  id: string;
  action: string;
  target_table: string;
  created_at: string;
  users: { full_name: string } | null;
};

const ACTION_LABELS: Record<string, string> = {
  "withdrawal.approve": "Approved withdrawal",
  "withdrawal.reject": "Rejected withdrawal",
  "withdrawal.mark_paid": "Marked withdrawal paid",
  "product.disable": "Disabled product",
  "product.reactivate": "Reactivated product",
  "store.suspend": "Suspended store",
  "store.reactivate": "Reactivated store",
};

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<Record<string, number>>({});
  const [recentLogs, setRecentLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/admin/stats").then((r) => r.json()).then((d) => setStats(d.stats ?? {})).catch((err) => { console.error("Failed to load admin stats:", err); setError("Failed to load admin stats."); }),
      fetch("/api/admin/audit-log?limit=10").then((r) => r.json()).then((d) => setRecentLogs(d.logs ?? [])).catch((err) => { console.error("Failed to load audit log:", err); setError("Failed to load recent activity."); })
    ]).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
        <DashboardShell title="Admin Overview" subtitle="Manage creators, sales, withdrawals, moderation, and platform performance." nav={adminNav}>
        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700">{error}</div>
        )}
        <div className="rounded-lg border border-dashed border-neutral-300 bg-white p-8 text-center text-neutral-600">Loading...</div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell title="Admin Overview" subtitle="Manage creators, sales, withdrawals, moderation, and platform performance." nav={adminNav}>
      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700">{error}</div>
      )}
      <div className="grid gap-4 md:grid-cols-4">
        <StatCard label="Creators" value={String(stats.totalCreators ?? 0)} />
        <StatCard label="Stores" value={String(stats.totalStores ?? 0)} />
        <StatCard label="Products" value={String(stats.totalProducts ?? 0)} />
        <StatCard label="Total Sales" value={String(stats.totalSales ?? 0)} />
      </div>
      <div className="mt-4 grid gap-4 md:grid-cols-4">
        <StatCard label="Revenue" value={new Intl.NumberFormat("en-UG", { style: "currency", currency: "UGX", maximumFractionDigits: 0 }).format(stats.totalRevenue ?? 0)} />
        <StatCard label="Platform Earnings" value={new Intl.NumberFormat("en-UG", { style: "currency", currency: "UGX", maximumFractionDigits: 0 }).format(stats.platformEarnings ?? 0)} />
        <StatCard label="Active / Suspended" value={`${stats.activeStores ?? 0} / ${stats.suspendedStores ?? 0}`} />
        <StatCard label="Pending Withdrawals" value={String(stats.pendingWithdrawals ?? 0)} />
      </div>
      <div className="mt-4">
        <StatCard label="New Registrations (30d)" value={String(stats.newRegistrations ?? 0)} className="md:col-span-2" />
      </div>

      {recentLogs.length > 0 && (
        <div className="mt-8">
          <h2 className="mb-3 text-xl font-bold">Recent Admin Activity</h2>
          <div className="overflow-x-auto rounded-lg border border-neutral-200 bg-white">
            <table className="w-full text-sm">
              <thead className="border-b border-neutral-200 bg-neutral-50 text-left">
                <tr>
                  <th className="p-3 font-semibold">Time</th>
                  <th className="p-3 font-semibold">Admin</th>
                  <th className="p-3 font-semibold">Action</th>
                </tr>
              </thead>
              <tbody>
                {recentLogs.map((entry) => (
                  <tr key={entry.id} className="border-b border-neutral-100">
                    <td className="p-3 text-neutral-500 whitespace-nowrap">{new Date(entry.created_at).toLocaleString("en-UG")}</td>
                    <td className="p-3 font-medium">{entry.users?.full_name ?? "—"}</td>
                    <td className="p-3 text-neutral-600">{ACTION_LABELS[entry.action] ?? entry.action}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </DashboardShell>
  );
}
