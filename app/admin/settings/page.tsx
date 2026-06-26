"use client";

import { DashboardShell } from "@/components/dashboard-shell";
import { adminNav } from "@/app/admin/nav";
import { site, formatUgx } from "@/lib/constants";

export default function AdminSettingsPage() {
  return (
    <DashboardShell title="Admin Settings" subtitle="Configure commission rate, withdrawal limits, moderation rules, and support details." nav={adminNav}>
      <div className="grid gap-4 rounded-lg border border-neutral-200 bg-white p-5 md:grid-cols-2">
        <div className="grid gap-2 text-sm font-semibold">
          <span>Platform commission</span>
          <span className="rounded-md border border-neutral-300 bg-neutral-50 px-4 py-3 text-neutral-700">{(site.commissionRate * 100).toFixed(0)}%</span>
        </div>
        <div className="grid gap-2 text-sm font-semibold">
          <span>Minimum withdrawal</span>
          <span className="rounded-md border border-neutral-300 bg-neutral-50 px-4 py-3 text-neutral-700">{formatUgx(site.minimumWithdrawal)}</span>
        </div>
      </div>
      <p className="mt-4 text-sm text-neutral-500">These values are configured via environment variables.</p>
    </DashboardShell>
  );
}
