"use client";

import { useEffect, useState, useMemo } from "react";
import { DashboardShell } from "@/components/dashboard-shell";
import { StatCard } from "@/components/ui/stat-card";
import { Badge, getBadgeVariant } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { EmptyState } from "@/components/ui/empty-state";
import { TableSkeleton } from "@/components/ui/skeleton";
import { Pagination } from "@/components/ui/pagination";
import { useToast } from "@/components/ui/toast";
import { formatCurrency, type Currency } from "@/lib/constants";
import {
  RotateCcw,
  Search,
  CheckCircle,
  XCircle,
  Clock,
  DollarSign,
  MessageSquare,
  Eye,
} from "lucide-react";

type Refund = {
  id: string;
  buyer_email: string;
  buyer_name: string;
  reason: string;
  status: string;
  reversed_amount: number | null;
  created_at: string;
  orders: { amount: number; currency: string; product_id: string; products: { title: string } | null } | null;
  admin_users: { email: string } | null;
};

const PAGE_SIZE = 25;

export default function AdminRefundsPage() {
  const { toast } = useToast();
  const [refunds, setRefunds] = useState<Refund[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedRefund, setSelectedRefund] = useState<Refund | null>(null);
  const [actionTarget, setActionTarget] = useState<Refund | null>(null);
  const [actionType, setActionType] = useState<"approve" | "reject" | null>(null);
  const [adminNote, setAdminNote] = useState("");
  const [processing, setProcessing] = useState(false);

  const load = () => {
    setLoading(true);
    setError(null);
    fetch("/api/admin/refunds?limit=500")
      .then((r) => r.json())
      .then((d) => setRefunds(d.refunds ?? []))
      .catch((err) => { console.error("Failed to load refunds:", err); setError("Failed to load refunds."); })
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    let result = [...refunds];
    if (statusFilter !== "all") {
      result = result.filter((r) => r.status === statusFilter);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (r) =>
          r.buyer_name.toLowerCase().includes(q) ||
          r.buyer_email.toLowerCase().includes(q) ||
          r.id.toLowerCase().includes(q) ||
          (r.orders?.products?.title ?? "").toLowerCase().includes(q) ||
          r.reason.toLowerCase().includes(q)
      );
    }
    return result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [refunds, statusFilter, search]);

  const pendingR = refunds.filter((r) => r.status === "pending");
  const approvedR = refunds.filter((r) => r.status === "approved");
  const rejectedR = refunds.filter((r) => r.status === "rejected");
  const totalReversed = approvedR.reduce((s, r) => s + (r.reversed_amount ?? 0), 0);

  const fmt = (amount: number, currency?: string) => formatCurrency(amount, (currency as Currency) ?? "UGX");

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleAction = async () => {
    if (!actionTarget || !actionType) return;
    setProcessing(true);
    try {
      const res = await fetch(`/api/admin/refunds/${actionTarget.id}/${actionType}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes: adminNote || undefined }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error?.message ?? "Action failed");
      }
      toast("success", `Refund ${actionType === "approve" ? "approved" : "rejected"} successfully`);
      setActionTarget(null);
      setActionType(null);
      setAdminNote("");
      load();
    } catch (err) {
      toast("error", err instanceof Error ? err.message : "Action failed");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <DashboardShell
      title="Refund Management"
      subtitle="Review and process customer refund requests"
      role="admin"
    >
      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700">{error}</div>
      )}

      {/* Summary cards */}
      <div className="mb-6 grid gap-4 sm:grid-cols-4">
        <StatCard
          label="Pending"
          value={String(pendingR.length)}
          sublabel={`${fmt(pendingR.reduce((s, r) => s + (r.orders?.amount ?? 0), 0))} at risk`}
          icon={<Clock size={20} />}
          green={pendingR.length === 0}
        />
        <StatCard
          label="Approved"
          value={String(approvedR.length)}
          sublabel={`${fmt(totalReversed)} reversed`}
          icon={<CheckCircle size={20} />}
        />
        <StatCard
          label="Rejected"
          value={String(rejectedR.length)}
          sublabel={fmt(rejectedR.reduce((s, r) => s + (r.orders?.amount ?? 0), 0))}
          icon={<XCircle size={20} />}
        />
        <StatCard
          label="Total Requests"
          value={String(refunds.length)}
          sublabel={fmt(refunds.reduce((s, r) => s + (r.orders?.amount ?? 0), 0))}
          icon={<RotateCcw size={20} />}
        />
      </div>

      {/* Urgent alert for pending refunds */}
      {pendingR.length > 0 && (
        <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-4">
          <div className="flex items-center gap-3">
            <RotateCcw size={20} className="text-amber-600" />
            <p className="font-semibold text-amber-800">
              {pendingR.length} refund request{pendingR.length !== 1 ? "s" : ""} need{pendingR.length === 1 ? "s" : ""} review
            </p>
          </div>
        </div>
      )}

      {/* Search + filter */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search by buyer, product, ID, or reason..."
            className="w-full rounded-lg border border-border py-2.5 pl-9 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="rounded-lg border border-border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green"
        >
          <option value="all">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      {/* Loading */}
      {loading && <TableSkeleton rows={6} />}

      {/* Empty */}
      {!loading && filtered.length === 0 && (
        <EmptyState
          icon={<RotateCcw size={48} strokeWidth={1.2} />}
          title={refunds.length === 0 ? "No refund requests yet" : "No refunds match your filters"}
        />
      )}

      {/* Refunds table */}
      {!loading && filtered.length > 0 && (
        <div className="overflow-hidden rounded-xl border border-border bg-surface-card shadow-card">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-surface">
                  <th className="px-4 py-3 text-left font-semibold text-muted">Product</th>
                  <th className="px-4 py-3 text-left font-semibold text-muted">Buyer</th>
                  <th className="px-4 py-3 text-right font-semibold text-muted">Amount</th>
                  <th className="px-4 py-3 text-left font-semibold text-muted">Reason</th>
                  <th className="px-4 py-3 text-right font-semibold text-muted">Requested</th>
                  <th className="px-4 py-3 text-center font-semibold text-muted">Status</th>
                  <th className="px-4 py-3 text-right font-semibold text-muted">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginated.map((r) => (
                  <tr key={r.id} className="border-b border-border transition hover:bg-surface">
                    <td className="px-4 py-3 font-medium">{r.orders?.products?.title ?? "—"}</td>
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-semibold text-brand-black">{r.buyer_name}</p>
                        <p className="text-xs text-muted">{r.buyer_email}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right font-bold">{fmt(r.orders?.amount ?? 0, r.orders?.currency)}</td>
                    <td className="max-w-[200px] truncate px-4 py-3 text-muted" title={r.reason}>
                      <div className="flex items-center gap-1.5">
                        <MessageSquare size={13} className="shrink-0 text-muted" />
                        <span>{r.reason}</span>
                      </div>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right text-muted">
                      {new Date(r.created_at).toLocaleDateString("en-UG")}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Badge variant={getBadgeVariant(r.status)}>{r.status}</Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setSelectedRefund(r)}
                          className="rounded-md p-1.5 text-muted transition hover:bg-brand-mist"
                          title="View details"
                        >
                          <Eye size={15} />
                        </button>
                        {r.status === "pending" && (
                          <>
                            <button
                              onClick={() => { setActionTarget(r); setActionType("approve"); setAdminNote(""); }}
                              className="rounded-md bg-brand-green px-2.5 py-1 text-xs font-semibold text-white hover:bg-brand-green-deep"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => { setActionTarget(r); setActionType("reject"); setAdminNote(""); }}
                              className="rounded-md bg-error px-2.5 py-1 text-xs font-semibold text-white hover:bg-red-600"
                            >
                              Reject
                            </button>
                          </>
                        )}
                        {r.status !== "pending" && r.admin_users && (
                          <span className="text-xs text-muted">by {r.admin_users.email}</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination */}
      {!loading && filtered.length > PAGE_SIZE && (
        <div className="mt-6">
          <Pagination page={page} totalPages={totalPages} totalItems={filtered.length} pageSize={PAGE_SIZE} onPageChange={setPage} />
        </div>
      )}

      {/* Detail modal */}
      <Modal open={!!selectedRefund} onClose={() => setSelectedRefund(null)} title="Refund Details" size="lg">
        {selectedRefund && (
          <div className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-xs font-semibold uppercase text-muted">Product</p>
                <p className="mt-1 font-semibold">{selectedRefund.orders?.products?.title || "—"}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase text-muted">Status</p>
                <div className="mt-1"><Badge variant={getBadgeVariant(selectedRefund.status)}>{selectedRefund.status}</Badge></div>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase text-muted">Buyer</p>
                <p className="mt-1 font-semibold">{selectedRefund.buyer_name}</p>
                <p className="text-sm text-muted">{selectedRefund.buyer_email}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase text-muted">Order Amount</p>
                <p className="mt-1 text-2xl font-bold">{fmt(selectedRefund.orders?.amount ?? 0, selectedRefund.orders?.currency)}</p>
                {selectedRefund.reversed_amount !== null && (
                  <p className="text-sm text-success">Reversed: {fmt(selectedRefund.reversed_amount, selectedRefund.orders?.currency)}</p>
                )}
              </div>
              <div className="sm:col-span-2">
                <p className="text-xs font-semibold uppercase text-muted">Reason</p>
                <p className="mt-1 text-sm">{selectedRefund.reason}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase text-muted">Requested At</p>
                <p className="mt-1">{new Date(selectedRefund.created_at).toLocaleString("en-UG")}</p>
              </div>
              {selectedRefund.admin_users && (
                <div>
                  <p className="text-xs font-semibold uppercase text-muted">Processed By</p>
                  <p className="mt-1">{selectedRefund.admin_users.email}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Approve modal */}
      <Modal
        open={actionType === "approve"}
        onClose={() => { setActionTarget(null); setActionType(null); }}
        title="Approve Refund"
        size="sm"
      >
        {actionTarget && (
          <div className="space-y-4">
            <p className="text-sm text-muted">
              Approve refund of <strong>{fmt(actionTarget.orders?.amount ?? 0, actionTarget.orders?.currency)}</strong> for{' '}
              <strong>{actionTarget.buyer_name}</strong> on{' '}
              <strong>{actionTarget.orders?.products?.title || "Unknown Product"}</strong>?
            </p>
            <div>
              <label className="mb-1 block text-sm font-semibold">Admin Note (optional)</label>
              <textarea
                value={adminNote}
                onChange={(e) => setAdminNote(e.target.value)}
                className="w-full rounded-lg border border-border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green"
                rows={2}
                placeholder="Optional internal note..."
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => { setActionTarget(null); setActionType(null); }}
                className="flex-1 rounded-lg border border-border px-4 py-2.5 text-sm font-semibold text-muted hover:bg-surface"
              >
                Cancel
              </button>
              <button
                onClick={handleAction}
                disabled={processing}
                className="flex-1 rounded-lg bg-brand-green px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-green-deep disabled:opacity-50"
              >
                {processing ? "Processing..." : "Confirm Approve"}
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Reject modal */}
      <Modal
        open={actionType === "reject"}
        onClose={() => { setActionTarget(null); setActionType(null); }}
        title="Reject Refund"
        size="sm"
      >
        {actionTarget && (
          <div className="space-y-4">
            <p className="text-sm text-muted">
              Reject refund request from <strong>{actionTarget.buyer_name}</strong> for{' '}
              <strong>{fmt(actionTarget.orders?.amount ?? 0, actionTarget.orders?.currency)}</strong>?
            </p>
            <div>
              <label className="mb-1 block text-sm font-semibold">Rejection Reason *</label>
              <textarea
                value={adminNote}
                onChange={(e) => setAdminNote(e.target.value)}
                className="w-full rounded-lg border border-border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green"
                rows={2}
                required
                placeholder="Explain why this refund is being rejected..."
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => { setActionTarget(null); setActionType(null); }}
                className="flex-1 rounded-lg border border-border px-4 py-2.5 text-sm font-semibold text-muted hover:bg-surface"
              >
                Cancel
              </button>
              <button
                onClick={handleAction}
                disabled={processing || !adminNote.trim()}
                className="flex-1 rounded-lg bg-error px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-600 disabled:opacity-50"
              >
                {processing ? "Processing..." : "Confirm Reject"}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </DashboardShell>
  );
}
