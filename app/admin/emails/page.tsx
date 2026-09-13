"use client";

import { useEffect, useState, useCallback } from "react";
import { DashboardShell } from "@/components/dashboard-shell";
import { StatCard } from "@/components/ui/stat-card";
import { TableSkeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
import { Mail, Send, AlertTriangle, CheckCircle, RefreshCw, Download, ExternalLink } from "lucide-react";

type EmailStatus = {
  smtp_configured: boolean;
  cron_configured: boolean;
  queue_counts: {
    pending: number;
    processing: number;
    sent: number;
    failed: number;
  };
};

type EmailDelivery = {
  id: string;
  order_id: string | null;
  to_email: string;
  type: string;
  product_title: string | null;
  download_token: string | null;
  resend_id: string | null;
  delivery_status: string;
  created_at: string;
  delivered_at: string | null;
  orders: { product_id: string; status: string; amount: number; currency: string; products: { title: string } | null } | null;
};

function deliveryBadge(status: string) {
  if (status === "delivered") return "bg-emerald-100 text-emerald-700";
  if (status === "failed") return "bg-red-100 text-red-700";
  if (status === "pending" || status === "processing") return "bg-amber-100 text-amber-700";
  return "bg-neutral-100 text-muted";
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function AdminEmailsPage() {
  const { toast } = useToast();
  const [status, setStatus] = useState<EmailStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [processResult, setProcessResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [deliveries, setDeliveries] = useState<EmailDelivery[]>([]);
  const [deliveriesTotal, setDeliveriesTotal] = useState(0);
  const [deliveriesLoading, setDeliveriesLoading] = useState(false);
  const [refreshingStatuses, setRefreshingStatuses] = useState(false);

  const fetchStatus = useCallback(() => {
    fetch("/api/admin/email-status")
      .then((r) => r.json())
      .then((d) => setStatus(d))
      .catch((err) => { console.error("Failed to load email status:", err); setError("Failed to load email status."); })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchStatus(); }, [fetchStatus]);

  const fetchDeliveries = useCallback(async (refresh = false) => {
    setDeliveriesLoading(true);
    try {
      const q = new URLSearchParams({ limit: "50" });
      if (refresh) q.set("refresh", "1");
      const res = await fetch(`/api/admin/email-deliveries?${q}`);
      const d = await res.json();
      setDeliveries(d.deliveries ?? []);
      setDeliveriesTotal(d.total ?? 0);
    } catch {
      // non-blocking
    } finally {
      setDeliveriesLoading(false);
    }
  }, []);

  useEffect(() => { fetchDeliveries(false); }, [fetchDeliveries]);

  async function refreshStatuses() {
    setRefreshingStatuses(true);
    try {
      await fetchDeliveries(true);
      fetchStatus();
    } finally {
      setRefreshingStatuses(false);
    }
  }

  const handleProcess = async () => {
    setProcessing(true);
    setProcessResult(null);
    try {
      const r = await fetch("/api/emails/process", { method: "POST" });
      const d = await r.json();
      if (d.ok) {
        toast("success", `Processed: ${d.processed} sent, ${d.failed} failed`);
      } else {
        toast("error", d.error ?? "Processing failed");
      }
      setProcessResult(d.ok ? `Processed: ${d.processed} sent, ${d.failed} failed` : `Error: ${d.error}`);
      fetchStatus();
    } catch {
      toast("error", "Request failed");
      setProcessResult("Request failed");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <DashboardShell
      title="Email System"
      subtitle="Monitor transactional email queue and configuration"
      role="admin"
    >
      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700">{error}</div>
      )}

      {loading ? (
        <TableSkeleton rows={4} />
      ) : (
        <>
          {/* Config cards */}
          <div className="mb-6 grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-border bg-surface-card p-5 shadow-card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted">SMTP</p>
                  <div className="mt-2 flex items-center gap-2">
                    {status?.smtp_configured ? (
                      <CheckCircle size={16} className="text-success" />
                    ) : (
                      <AlertTriangle size={16} className="text-error" />
                    )}
                    <span className="font-semibold">
                      {status?.smtp_configured ? "Configured" : "Not configured"}
                    </span>
                  </div>
                  {!status?.smtp_configured && (
                    <p className="mt-2 text-xs text-muted">
                      Set RESEND_API_KEY in environment variables for transactional emails.
                    </p>
                  )}
                </div>
                <Mail size={24} className="shrink-0 text-muted" />
              </div>
            </div>

            <div className="rounded-xl border border-border bg-surface-card p-5 shadow-card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted">Cron (Automated)</p>
                  <div className="mt-2 flex items-center gap-2">
                    {status?.cron_configured ? (
                      <CheckCircle size={16} className="text-success" />
                    ) : (
                      <AlertTriangle size={16} className="text-amber-500" />
                    )}
                    <span className="font-semibold">
                      {status?.cron_configured ? "Configured" : "Not configured"}
                    </span>
                  </div>
                  {status?.cron_configured ? (
                    <p className="mt-2 text-xs text-muted">Runs once daily at 6 AM via Vercel Cron Jobs.</p>
                  ) : (
                    <p className="mt-2 text-xs text-muted">
                      Set CRON_SECRET in environment variables and deploy to enable automated processing.
                    </p>
                  )}
                </div>
                <RefreshCw size={24} className="shrink-0 text-muted" />
              </div>
            </div>
          </div>

          {/* Queue stats */}
          <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              label="Pending"
              value={String(status?.queue_counts.pending ?? 0)}
              icon={<Send size={20} />}
            />
            <StatCard
              label="Processing"
              value={String(status?.queue_counts.processing ?? 0)}
              icon={<RefreshCw size={20} />}
            />
            <StatCard
              label="Sent"
              value={String(status?.queue_counts.sent ?? 0)}
              icon={<CheckCircle size={20} />}
              green
            />
            <StatCard
              label="Failed"
              value={String(status?.queue_counts.failed ?? 0)}
              icon={<AlertTriangle size={20} />}
            />
          </div>

          {/* Manual processing */}
          <div className="rounded-xl border border-border bg-surface-card p-6 shadow-card">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-bold">Manual Processing</h2>
                <p className="mt-1 text-sm text-muted">
                  Trigger email processing immediately for any pending queue items.
                </p>
              </div>
              <button
                onClick={handleProcess}
                disabled={processing}
                className="rounded-lg bg-brand-green px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-green-deep disabled:opacity-50"
              >
                {processing ? "Processing..." : "Process Pending Emails"}
              </button>
            </div>
            {processResult && (
              <p className="mt-3 text-sm font-semibold text-muted">{processResult}</p>
            )}
          </div>

          {/* Per-order delivery log */}
          <div className="mt-6 rounded-xl border border-border bg-surface-card p-6 shadow-card">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="font-bold">Per-Order Delivery Log</h2>
                <p className="mt-1 text-sm text-muted">
                  {deliveriesTotal} delivery record(s) — check Resend status for each order email.
                </p>
              </div>
              <button
                onClick={refreshStatuses}
                disabled={refreshingStatuses || deliveriesLoading}
                className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs font-semibold hover:bg-neutral-50 disabled:opacity-50"
              >
                {refreshingStatuses ? <RefreshCw size={14} className="animate-spin" /> : <RefreshCw size={14} />}
                Refresh statuses
              </button>
            </div>

            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[720px] text-left text-sm">
                <thead>
                  <tr className="border-b border-border text-xs font-semibold uppercase tracking-wide text-muted">
                    <th className="py-2 pr-3">Sent</th>
                    <th className="py-2 pr-3">To</th>
                    <th className="py-2 pr-3">Type</th>
                    <th className="py-2 pr-3">Product</th>
                    <th className="py-2 pr-3">Download</th>
                    <th className="py-2 pr-3">Status</th>
                    <th className="py-2">Order</th>
                  </tr>
                </thead>
                <tbody>
                  {deliveriesLoading ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-sm text-muted">
                        <RefreshCw size={18} className="mx-auto animate-spin" />
                      </td>
                    </tr>
                  ) : deliveries.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-sm text-muted">
                        No email deliveries recorded yet.
                      </td>
                    </tr>
                  ) : (
                    deliveries.map((d) => {
                      const link = d.download_token
                        ? `${window.location.origin}/api/downloads/${d.download_token}`
                        : null;
                      return (
                        <tr key={d.id} className="border-b border-neutral-100 hover:bg-neutral-50">
                          <td className="py-2.5 pr-3 text-xs text-muted">{timeAgo(d.created_at)}</td>
                          <td className="py-2.5 pr-3 font-semibold text-brand-black">{d.to_email}</td>
                          <td className="py-2.5 pr-3 text-muted">{d.type}</td>
                          <td className="py-2.5 pr-3 max-w-[160px] truncate text-muted">
                            {d.product_title ?? d.orders?.products?.title ?? "—"}
                          </td>
                          <td className="py-2.5 pr-3">
                            {link ? (
                              <a
                                href={link}
                                target="_blank"
                                rel="noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                className="inline-flex items-center gap-1 text-brand-green hover:underline"
                              >
                                <Download size={13} /> Link
                              </a>
                            ) : (
                              <span className="text-muted">—</span>
                            )}
                          </td>
                          <td className="py-2.5 pr-3">
                            <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${deliveryBadge(d.delivery_status)}`}>
                              {d.delivery_status}
                            </span>
                          </td>
                          <td className="py-2.5">
                            <span className="text-xs text-muted">
                              {d.order_id ? (
                                <a href={`/admin/orders`} className="hover:text-brand-green hover:underline">
                                  {d.orders?.status ?? (d.order_id ?? "").slice(0, 8)}
                                </a>
                              ) : (
                                "—"
                              )}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
            {deliveriesTotal > 50 && (
              <p className="mt-3 text-xs text-muted">
                Showing the 50 most recent of {deliveriesTotal}. Order-level status is synced on demand.
              </p>
            )}
          </div>
        </>
      )}
    </DashboardShell>
  );
}
