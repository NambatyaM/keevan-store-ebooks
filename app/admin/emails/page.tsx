"use client";

import { useEffect, useState, useCallback } from "react";
import { DashboardShell } from "@/components/dashboard-shell";
import { StatCard } from "@/components/ui/stat-card";
import { TableSkeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
import { Mail, Send, AlertTriangle, CheckCircle, RefreshCw } from "lucide-react";

type EmailStatus = {
  smtp_configured: boolean;
  cron_configured: boolean;
  queue_counts: {
    pending: number;
    sent: number;
    failed: number;
  };
};

export default function AdminEmailsPage() {
  const { toast } = useToast();
  const [status, setStatus] = useState<EmailStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [processResult, setProcessResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchStatus = useCallback(() => {
    fetch("/api/admin/email-status")
      .then((r) => r.json())
      .then((d) => setStatus(d))
      .catch((err) => { console.error("Failed to load email status:", err); setError("Failed to load email status."); })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchStatus(); }, [fetchStatus]);

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
          <div className="mb-6 grid gap-4 sm:grid-cols-3">
            <StatCard
              label="Pending"
              value={String(status?.queue_counts.pending ?? 0)}
              icon={<Send size={20} />}
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
        </>
      )}
    </DashboardShell>
  );
}
