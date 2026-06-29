"use client";

import { DashboardShell } from "@/components/dashboard-shell";
import { StatCard } from "@/components/ui/stat-card";
import { site, formatUgx } from "@/lib/constants";
import { Settings, Percent, Wallet, DollarSign, Mail, Shield } from "lucide-react";

export default function AdminSettingsPage() {
  return (
    <DashboardShell
      title="Admin Settings"
      subtitle="Configure platform commission, withdrawal limits, and support details"
      role="admin"
    >
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-xl border border-border bg-surface-card p-5 shadow-card">
          <div className="mb-3 flex items-center gap-2">
            <Percent size={18} className="text-brand-green" />
            <h2 className="font-semibold">Platform Commission</h2>
          </div>
          <p className="text-3xl font-black">{(site.commissionRate * 100).toFixed(0)}%</p>
          <p className="mt-1 text-xs text-muted">Applied to every transaction</p>
        </div>

        <div className="rounded-xl border border-border bg-surface-card p-5 shadow-card">
          <div className="mb-3 flex items-center gap-2">
            <Wallet size={18} className="text-brand-green" />
            <h2 className="font-semibold">Minimum Withdrawal</h2>
          </div>
          <p className="text-3xl font-black">{formatUgx(site.minimumWithdrawal)}</p>
          <p className="mt-1 text-xs text-muted">Minimum amount creators can withdraw</p>
        </div>

        <div className="rounded-xl border border-border bg-surface-card p-5 shadow-card">
          <div className="mb-3 flex items-center gap-2">
            <DollarSign size={18} className="text-brand-green" />
            <h2 className="font-semibold">Currency</h2>
          </div>
          <p className="text-3xl font-black">UGX</p>
          <p className="mt-1 text-xs text-muted">Ugandan Shilling</p>
        </div>
      </div>

      <div className="mt-6 rounded-xl border border-border bg-surface-card p-6 shadow-card">
        <div className="flex items-center gap-2">
          <Shield size={18} className="text-muted" />
          <h2 className="font-semibold">Configuration Source</h2>
        </div>
        <p className="mt-2 text-sm text-muted">
          These values are configured via environment variables (<code className="rounded bg-surface px-1.5 py-0.5 font-mono text-xs">NEXT_PUBLIC_COMMISSION_RATE</code>,{' '}
          <code className="rounded bg-surface px-1.5 py-0.5 font-mono text-xs">NEXT_PUBLIC_MINIMUM_WITHDRAWAL</code>).
        </p>
        <p className="mt-2 text-sm text-muted">
          Changes require a deployment restart to take effect.
        </p>
      </div>
    </DashboardShell>
  );
}
