"use client";

import { useEffect, useState, useMemo } from "react";
import { DashboardShell } from "@/components/dashboard-shell";
import { StatCard } from "@/components/ui/stat-card";
import { Badge, getBadgeVariant } from "@/components/ui/badge";
import { Modal, ConfirmModal } from "@/components/ui/modal";
import { EmptyState } from "@/components/ui/empty-state";
import { TableSkeleton } from "@/components/ui/skeleton";
import { Pagination } from "@/components/ui/pagination";
import { useToast } from "@/components/ui/toast";
import { formatUgx, formatCurrency, type Currency } from "@/lib/constants";
import { DollarSign, AlertTriangle, CheckCircle, XCircle, Eye, Smartphone, Landmark, Wallet } from "lucide-react";
import Link from "next/link";

type Withdrawal = {
  id: string;
  amount: number;
  currency: Currency;
  status: string;
  payout_method: string;
  payout_details: unknown;
  admin_notes: string | null;
  requested_at: string;
  processed_at: string | null;
  creators: { display_name: string; email: string } | null;
  stores: { name: string } | null;
};

const PAGE_SIZE = 25;

export default function AdminWithdrawalsPage() {
  const { toast } = useToast();
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedW, setSelectedW] = useState<Withdrawal | null>(null);
  const [actionTarget, setActionTarget] = useState<Withdrawal | null>(null);
  const [actionType, setActionType] = useState<"approve" | "reject" | "mark-paid" | null>(null);
  const [adminNote, setAdminNote] = useState("");
  const [paymentRef, setPaymentRef] = useState("");
  const [processing, setProcessing] = useState(false);

  const load = () => {
    setLoading(true);
    setError(null);
    fetch("/api/admin/withdrawals?limit=500")
      .then((r) => r.json())
      .then((d) => setWithdrawals(d.withdrawals ?? []))
      .catch((err) => { console.error("Failed to load withdrawals:", err); setError("Failed to load withdrawals."); })
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    let result = [...withdrawals];
    if (statusFilter !== "all") {
      result = result.filter((w) => w.status === statusFilter);
    }
    return result.sort((a, b) => new Date(b.requested_at).getTime() - new Date(a.requested_at).getTime());
  }, [withdrawals, statusFilter]);

  const pendingW = withdrawals.filter((w) => w.status === "pending");
  const approvedW = withdrawals.filter((w) => w.status === "approved");
  const paidW = withdrawals.filter((w) => w.status === "paid");
  const totalPendingByCurrency = pendingW.reduce<Record<string, number>>((acc, w) => {
    acc[w.currency] = (acc[w.currency] ?? 0) + w.amount;
    return acc;
  }, {});
  const totalPendingLabel = Object.entries(totalPendingByCurrency)
    .map(([c, amt]) => formatCurrency(amt, c as Currency))
    .join(" / ") || "—";

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleAction = async () => {
    if (!actionTarget || !actionType) return;
    setProcessing(true);
    try {
      const body: Record<string, unknown> = {};
      if (adminNote) body.notes = adminNote;
      if (actionType === "mark-paid" && paymentRef) body.paymentReference = paymentRef;

      const endpoint = actionType === "mark-paid" ? "mark-paid" : actionType;
      const res = await fetch(`/api/admin/withdrawals/${actionTarget.id}/${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error?.message ?? "Action failed");
      }
      toast("success", `Withdrawal ${actionType === "approve" ? "approved" : actionType === "reject" ? "rejected" : "marked as paid"} successfully`);
      setActionTarget(null);
      setActionType(null);
      setAdminNote("");
      setPaymentRef("");
      load();
    } catch (err) {
      toast("error", err instanceof Error ? err.message : "Action failed");
    } finally {
      setProcessing(false);
    }
  };

  const getPayoutDetailsDisplay = (w: Withdrawal) => {
    const details = w.payout_details as Record<string, string> | null;
    return details?.value ?? JSON.stringify(details ?? {});
  };

  const getPayoutIcon = (method: string) => {
    const m = method.toLowerCase();
    if (m.includes("mtn")) return <Smartphone size={16} />;
    if (m.includes("airtel")) return <Smartphone size={16} />;
    if (m.includes("bank")) return <Landmark size={16} />;
    return <Wallet size={16} />;
  };

  return (
    <DashboardShell
      title="Withdrawals"
      subtitle="Review and process creator withdrawal requests"
      role="admin"
    >
      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700">{error}</div>
      )}

      {/* Summary cards */}
      <div className="mb-6 grid gap-4 sm:grid-cols-4">
        <StatCard
          label="Pending"
          value={String(pendingW.length)}
          sublabel={totalPendingLabel}
          icon={<AlertTriangle size={20} />}
          green={pendingW.length === 0}
        />
        <StatCard
          label="Approved (Processing)"
          value={String(approvedW.length)}
          sublabel="Awaiting payment"
          icon={<CheckCircle size={20} />}
        />
        <StatCard
          label="Paid This Period"
          value={String(paidW.length)}
          sublabel={(() => {
            const byCurrency = paidW.reduce<Record<string, number>>((acc, w) => {
              acc[w.currency] = (acc[w.currency] ?? 0) + w.amount;
              return acc;
            }, {});
            return Object.entries(byCurrency).map(([c, amt]) => formatCurrency(amt, c as Currency)).join(" / ") || "—";
          })()}
          icon={<DollarSign size={20} />}
        />
        <StatCard
          label="Total Requests"
          value={String(withdrawals.length)}
          sublabel={(() => {
            const byCurrency = withdrawals.reduce<Record<string, number>>((acc, w) => {
              acc[w.currency] = (acc[w.currency] ?? 0) + w.amount;
              return acc;
            }, {});
            return Object.entries(byCurrency).map(([c, amt]) => formatCurrency(amt, c as Currency)).join(" / ") || "—";
          })()}
          icon={<Wallet size={20} />}
        />
      </div>

      {/* Urgent alert */}
      {pendingW.length > 0 && (
        <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-4">
          <div className="flex items-center gap-3">
            <AlertTriangle size={20} className="text-amber-600" />
            <p className="font-semibold text-amber-800">
              {pendingW.length} withdrawal request{pendingW.length !== 1 ? "s" : ""} need{pendingW.length === 1 ? "s" : ""} your review
            </p>
          </div>
          {pendingW.slice(0, 3).map((w) => (
            <div key={w.id} className="mt-3 flex items-center justify-between rounded-lg border border-amber-200 bg-white p-3">
              <div>
                <p className="font-semibold text-brand-black">{w.creators?.display_name || "Unknown"}</p>
                <p className="text-sm text-muted">{formatCurrency(w.amount, w.currency)} via {w.payout_method}</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => { setActionTarget(w); setActionType("approve"); }}
                  className="rounded-lg bg-brand-green px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-green-deep"
                >
                  Approve
                </button>
                <button
                  onClick={() => { setActionTarget(w); setActionType("reject"); }}
                  className="rounded-lg bg-error px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-600"
                >
                  Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Filter */}
      <div className="mb-4">
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="rounded-lg border border-border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green"
        >
          <option value="all">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="paid">Paid</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      {/* Loading */}
      {loading && <TableSkeleton rows={8} />}

      {/* Empty */}
      {!loading && filtered.length === 0 && (
        <EmptyState
          icon={<DollarSign size={48} strokeWidth={1.2} />}
          title={withdrawals.length === 0 ? "No withdrawal requests yet" : "No requests match your filters"}
        />
      )}

      {/* Withdrawals table */}
      {!loading && filtered.length > 0 && (
        <div className="overflow-hidden rounded-xl border border-border bg-surface-card shadow-card">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-surface">
                  <th className="px-4 py-3 text-left font-semibold text-muted">Creator</th>
                  <th className="px-4 py-3 text-right font-semibold text-muted">Amount</th>
                  <th className="px-4 py-3 text-left font-semibold text-muted">Method</th>
                  <th className="px-4 py-3 text-left font-semibold text-muted">Details</th>
                  <th className="px-4 py-3 text-right font-semibold text-muted">Requested</th>
                  <th className="px-4 py-3 text-center font-semibold text-muted">Status</th>
                  <th className="px-4 py-3 text-left font-semibold text-muted">Notes</th>
                  <th className="px-4 py-3 text-right font-semibold text-muted">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginated.map((w) => (
                  <tr key={w.id} className="border-b border-border transition hover:bg-surface">
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-semibold text-brand-black">{w.creators?.display_name || "—"}</p>
                        <p className="text-xs text-muted">{w.creators?.email || "—"}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right font-bold">{formatCurrency(w.amount, w.currency)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {getPayoutIcon(w.payout_method)}
                        <span className="capitalize text-muted">{w.payout_method}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted max-w-[120px] truncate" title={getPayoutDetailsDisplay(w)}>
                      {getPayoutDetailsDisplay(w)}
                    </td>
                    <td className="px-4 py-3 text-right text-muted whitespace-nowrap">
                      {new Date(w.requested_at).toLocaleDateString("en-UG")}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <Badge variant={getBadgeVariant(w.status)}>{w.status}</Badge>
                    </td>
                    <td className="px-4 py-3 text-xs text-muted max-w-[120px] truncate">
                      {w.admin_notes || "—"}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setSelectedW(w)}
                          className="rounded-md p-1.5 text-muted transition hover:bg-brand-mist"
                          title="View details"
                        >
                          <Eye size={15} />
                        </button>
                        {w.status === "pending" && (
                          <>
                            <button
                              onClick={() => { setActionTarget(w); setActionType("approve"); }}
                              className="rounded-md bg-brand-green px-2.5 py-1 text-xs font-semibold text-white hover:bg-brand-green-deep"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => { setActionTarget(w); setActionType("reject"); }}
                              className="rounded-md bg-error px-2.5 py-1 text-xs font-semibold text-white hover:bg-red-600"
                            >
                              Reject
                            </button>
                          </>
                        )}
                        {w.status === "approved" && (
                          <button
                            onClick={() => { setActionTarget(w); setActionType("mark-paid"); }}
                            className="rounded-md bg-success px-2.5 py-1 text-xs font-semibold text-white hover:bg-green-600"
                          >
                            Mark Paid
                          </button>
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
      <Modal open={!!selectedW} onClose={() => setSelectedW(null)} title="Withdrawal Details" size="lg">
        {selectedW && (
          <div className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-xs font-semibold uppercase text-muted">Creator</p>
                <p className="mt-1 font-semibold">{selectedW.creators?.display_name || "—"}</p>
                <p className="text-sm text-muted">{selectedW.creators?.email || "—"}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase text-muted">Status</p>
                <div className="mt-1"><Badge variant={getBadgeVariant(selectedW.status)}>{selectedW.status}</Badge></div>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase text-muted">Amount Requested</p>
                <p className="mt-1 text-2xl font-bold">{formatCurrency(selectedW.amount, selectedW.currency)}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase text-muted">Payout Method</p>
                <p className="mt-1 capitalize">{selectedW.payout_method}</p>
                <p className="text-sm text-muted break-all">{getPayoutDetailsDisplay(selectedW)}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase text-muted">Requested Date</p>
                <p className="mt-1">{new Date(selectedW.requested_at).toLocaleString("en-UG")}</p>
              </div>
              {selectedW.processed_at && (
                <div>
                  <p className="text-xs font-semibold uppercase text-muted">Processed Date</p>
                  <p className="mt-1">{new Date(selectedW.processed_at).toLocaleString("en-UG")}</p>
                </div>
              )}
            </div>
            {selectedW.admin_notes && (
              <div className="rounded-lg border border-border p-3">
                <p className="text-xs font-semibold uppercase text-muted">Admin Notes</p>
                <p className="mt-1 text-sm">{selectedW.admin_notes}</p>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Action modals */}
      <Modal
        open={actionType === "approve"}
        onClose={() => { setActionTarget(null); setActionType(null); }}
        title="Approve Withdrawal"
        size="sm"
      >
        {actionTarget && (
          <div className="space-y-4">
            <p className="text-sm text-muted">
              Are you sure you want to approve <strong>{formatCurrency(actionTarget.amount, actionTarget.currency)}</strong> to{' '}
              <strong>{actionTarget.creators?.display_name || "Unknown"}</strong> via{' '}
              <strong className="capitalize">{actionTarget.payout_method}</strong>?
            </p>
            <div>
              <label className="block text-sm font-semibold mb-1">Admin Note (optional)</label>
              <textarea
                value={adminNote}
                onChange={(e) => setAdminNote(e.target.value)}
                className="w-full rounded-lg border border-border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green"
                rows={2}
              />
            </div>
            <div className="flex gap-3">
              <button onClick={() => { setActionTarget(null); setActionType(null); }} className="flex-1 rounded-lg border border-border px-4 py-2.5 text-sm font-semibold text-muted hover:bg-surface">Cancel</button>
              <button onClick={handleAction} disabled={processing} className="flex-1 rounded-lg bg-brand-green px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-green-deep disabled:opacity-50">
                {processing ? "Processing..." : "Confirm Approve"}
              </button>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        open={actionType === "reject"}
        onClose={() => { setActionTarget(null); setActionType(null); }}
        title="Reject Withdrawal"
        size="sm"
      >
        {actionTarget && (
          <div className="space-y-4">
            <p className="text-sm text-muted">
              Reject <strong>{formatCurrency(actionTarget.amount, actionTarget.currency)}</strong> for{' '}
              <strong>{actionTarget.creators?.display_name || "Unknown"}</strong>?
            </p>
            <p className="text-xs text-muted">The creator will be notified with the reason below.</p>
            <div>
              <label className="block text-sm font-semibold mb-1">Rejection Reason *</label>
              <textarea
                value={adminNote}
                onChange={(e) => setAdminNote(e.target.value)}
                className="w-full rounded-lg border border-border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green"
                rows={2}
                required
                placeholder="Explain why this withdrawal is being rejected..."
              />
            </div>
            <div className="flex gap-3">
              <button onClick={() => { setActionTarget(null); setActionType(null); }} className="flex-1 rounded-lg border border-border px-4 py-2.5 text-sm font-semibold text-muted hover:bg-surface">Cancel</button>
              <button onClick={handleAction} disabled={processing || !adminNote.trim()} className="flex-1 rounded-lg bg-error px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-600 disabled:opacity-50">
                {processing ? "Processing..." : "Confirm Reject"}
              </button>
            </div>
          </div>
        )}
      </Modal>

      <Modal
        open={actionType === "mark-paid"}
        onClose={() => { setActionTarget(null); setActionType(null); }}
        title="Mark as Paid"
        size="sm"
      >
        {actionTarget && (
          <div className="space-y-4">
            <p className="text-sm text-muted">
              Mark <strong>{formatCurrency(actionTarget.amount, actionTarget.currency)}</strong> as paid to{' '}
              <strong>{actionTarget.creators?.display_name || "Unknown"}</strong>?
            </p>
            <div>
              <label className="block text-sm font-semibold mb-1">Payment Reference / Transaction ID</label>
              <input
                value={paymentRef}
                onChange={(e) => setPaymentRef(e.target.value)}
                className="w-full rounded-lg border border-border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green"
                placeholder="e.g. MTN transaction ID"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1">Admin Note (optional)</label>
              <textarea
                value={adminNote}
                onChange={(e) => setAdminNote(e.target.value)}
                className="w-full rounded-lg border border-border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green"
                rows={2}
              />
            </div>
            <div className="flex gap-3">
              <button onClick={() => { setActionTarget(null); setActionType(null); }} className="flex-1 rounded-lg border border-border px-4 py-2.5 text-sm font-semibold text-muted hover:bg-surface">Cancel</button>
              <button onClick={handleAction} disabled={processing} className="flex-1 rounded-lg bg-success px-4 py-2.5 text-sm font-semibold text-white hover:bg-green-600 disabled:opacity-50">
                {processing ? "Processing..." : "Confirm Paid"}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </DashboardShell>
  );
}
