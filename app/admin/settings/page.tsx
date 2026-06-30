"use client";

import { DashboardShell } from "@/components/dashboard-shell";
import { site, formatCurrency, minimumWithdrawalByCurrency, type Currency } from "@/lib/constants";
import { Settings, Percent, Wallet, DollarSign, Mail, Shield, Globe } from "lucide-react";

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
          <p className="text-3xl font-black">{formatCurrency(site.minimumWithdrawal, "UGX")}</p>
          <p className="mt-1 text-xs text-muted">Default minimum for all currencies</p>
        </div>

        <div className="rounded-xl border border-border bg-surface-card p-5 shadow-card">
          <div className="mb-3 flex items-center gap-2">
            <Globe size={18} className="text-brand-green" />
            <h2 className="font-semibold">Per-Currency Minimums</h2>
          </div>
          <div className="space-y-1 text-sm">
            {(Object.entries(minimumWithdrawalByCurrency) as [Currency, number][]).map(([cur, amt]) => (
              <div key={cur} className="flex items-center justify-between">
                <span className="text-muted">{cur}</span>
                <span className="font-semibold">{formatCurrency(amt, cur)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-6 sm:grid-cols-2">
        <div className="rounded-xl border border-border bg-surface-card p-6 shadow-card">
          <div className="flex items-center gap-2">
            <Mail size={18} className="text-muted" />
            <h2 className="font-semibold">Support Email</h2>
          </div>
          <p className="mt-2 text-sm text-muted">
            For support inquiries, buyers and creators can reach out via WhatsApp at{" "}
            <a href={site.supportWhatsApp} className="text-brand-green hover:underline">{site.supportPhone}</a>
          </p>
        </div>

        <div className="rounded-xl border border-border bg-surface-card p-6 shadow-card">
          <div className="flex items-center gap-2">
            <Shield size={18} className="text-muted" />
            <h2 className="font-semibold">Configuration Source</h2>
          </div>
          <p className="mt-2 text-sm text-muted">
            These values are configured via environment variables. Changes require a deployment restart to take effect.
          </p>
        </div>
      </div>
    </DashboardShell>
  );
}
