"use client";

import { useEffect, useState } from "react";
import { DashboardShell } from "@/components/dashboard-shell";
import { Badge, getBadgeVariant } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { TableSkeleton } from "@/components/ui/skeleton";
import { Pagination } from "@/components/ui/pagination";
import { ClipboardList, ShieldAlert } from "lucide-react";

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
const PAGE_SIZE = 50;

export default function AdminAuditLogPage() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterAction, setFilterAction] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  useEffect(() => {
    setLoading(true);
    setError(null);
    const params = new URLSearchParams({ limit: "200" });
    if (filterAction) params.set("action", filterAction);

    fetch(`/api/admin/audit-log?${params}`)
      .then((r) => r.json())
      .then((d) => setLogs(d.logs ?? []))
      .catch((err) => { console.error("Failed to load audit log:", err); setError("Failed to load audit log."); })
      .finally(() => setLoading(false));
  }, [filterAction]);

  useEffect(() => { setPage(1); }, [filterAction]);

  const totalPages = Math.ceil(logs.length / PAGE_SIZE);
  const paginated = logs.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <DashboardShell
      title="Audit Log"
      subtitle="Immutable record of every administrative action on the platform"
      role="admin"
    >
      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700">{error}</div>
      )}

      {/* Filter */}
      <div className="mb-4 flex items-center gap-3">
        <label className="text-sm font-semibold text-muted">Filter by action:</label>
        <select
          value={filterAction}
          onChange={(e) => setFilterAction(e.target.value)}
          className="rounded-lg border border-border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green"
        >
          <option value="">All actions</option>
          {ACTION_FILTERS.filter(Boolean).map((a) => (
            <option key={a} value={a}>{ACTION_LABELS[a]}</option>
          ))}
        </select>
      </div>

      {/* Loading */}
      {loading && <TableSkeleton rows={6} />}

      {/* Empty */}
      {!loading && logs.length === 0 && (
        <EmptyState
          icon={<ClipboardList size={48} strokeWidth={1.2} />}
          title="No audit log entries found"
        />
      )}

      {/* Audit log table */}
      {!loading && logs.length > 0 && (
        <div className="overflow-hidden rounded-xl border border-border bg-surface-card shadow-card">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-surface">
                  <th className="px-4 py-3 text-left font-semibold text-muted">Timestamp</th>
                  <th className="px-4 py-3 text-left font-semibold text-muted">Admin</th>
                  <th className="px-4 py-3 text-left font-semibold text-muted">Action</th>
                  <th className="px-4 py-3 text-left font-semibold text-muted">Target</th>
                  <th className="px-4 py-3 text-left font-semibold text-muted">Target ID</th>
                </tr>
              </thead>
              <tbody>
                {paginated.map((entry) => {
                  const admin = entry.users;
                  return (
                    <tr key={entry.id} className="border-b border-border transition hover:bg-surface">
                      <td className="whitespace-nowrap px-4 py-3 text-muted">
                        {new Date(entry.created_at).toLocaleString("en-UG")}
                      </td>
                      <td className="px-4 py-3 font-semibold">
                        {admin?.full_name ?? admin?.email ?? "—"}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="neutral">
                          {ACTION_LABELS[entry.action] ?? entry.action}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-muted">{entry.target_table}</td>
                      <td className="px-4 py-3 font-mono text-xs text-muted">
                        {entry.target_id ? entry.target_id.slice(0, 8) + "…" : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination */}
      {!loading && logs.length > PAGE_SIZE && (
        <div className="mt-6">
          <Pagination page={page} totalPages={totalPages} totalItems={logs.length} pageSize={PAGE_SIZE} onPageChange={setPage} />
        </div>
      )}
    </DashboardShell>
  );
}
