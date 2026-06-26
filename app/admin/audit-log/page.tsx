"use client";

import { useEffect, useState } from "react";
import { DashboardShell } from "@/components/dashboard-shell";
import { adminNav } from "@/app/admin/nav";

type LogEntry = {
  id: string;
  action: string;
  target_table: string;
  target_id: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  users: { full_name: string; email: string } | null;
};

const ACTION_LABELS: Record<string, string> = {
  "withdrawal.approve": "Withdrawal Approved",
  "withdrawal.reject": "Withdrawal Rejected",
  "withdrawal.mark_paid": "Withdrawal Marked Paid",
  "product.disable": "Product Disabled",
  "product.reactivate": "Product Reactivated",
  "store.suspend": "Store Suspended",
  "store.reactivate": "Store Reactivated",
};

const ACTION_FILTERS = ["", ...Object.keys(ACTION_LABELS)];

export default function AdminAuditLogPage() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterAction, setFilterAction] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams({ limit: "200" });
    if (filterAction) params.set("action", filterAction);

    fetch(`/api/admin/audit-log?${params}`)
      .then((r) => r.json())
      .then((d) => setLogs(d.logs ?? []))
      .catch((err) => { console.error("Failed to load audit log:", err); setError("Failed to load audit log."); })
      .finally(() => setLoading(false));
  }, [filterAction]);

  return (
    <DashboardShell title="Audit Log" subtitle="Immutable record of every administrative action on the platform." nav={adminNav}>
      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700">{error}</div>
      )}
      <div className="mb-4 flex items-center gap-3">
        <label className="text-sm font-semibold text-neutral-700">Filter by action:</label>
        <select
          value={filterAction}
          onChange={(e) => setFilterAction(e.target.value)}
          className="focus-ring rounded-md border border-neutral-300 px-3 py-2 text-sm"
        >
          <option value="">All actions</option>
          {ACTION_FILTERS.filter(Boolean).map((a) => (
            <option key={a} value={a}>{ACTION_LABELS[a]}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="rounded-lg border border-dashed border-neutral-300 bg-white p-8 text-center text-neutral-600">Loading...</div>
      ) : logs.length === 0 ? (
        <div className="rounded-lg border border-dashed border-neutral-300 bg-white p-8 text-center text-neutral-600">No audit log entries found.</div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-neutral-200 bg-white">
          <table className="w-full text-sm">
            <thead className="border-b border-neutral-200 bg-neutral-50 text-left">
              <tr>
                <th className="p-3 font-semibold">Timestamp</th>
                <th className="p-3 font-semibold">Admin</th>
                <th className="p-3 font-semibold">Action</th>
                <th className="p-3 font-semibold">Target</th>
                <th className="p-3 font-semibold">Target ID</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((entry) => {
                const admin = entry.users;
                return (
                  <tr key={entry.id} className="border-b border-neutral-100">
                    <td className="p-3 text-neutral-500 whitespace-nowrap">{new Date(entry.created_at).toLocaleString("en-UG")}</td>
                    <td className="p-3 font-medium">{admin?.full_name ?? admin?.email ?? "—"}</td>
                    <td className="p-3">
                      <span className="inline-block rounded bg-neutral-100 px-2 py-0.5 text-xs font-semibold text-neutral-700">
                        {ACTION_LABELS[entry.action] ?? entry.action}
                      </span>
                    </td>
                    <td className="p-3 text-neutral-600">{entry.target_table}</td>
                    <td className="p-3 font-mono text-xs text-neutral-500">{entry.target_id ? entry.target_id.slice(0, 8) + "…" : "—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </DashboardShell>
  );
}
