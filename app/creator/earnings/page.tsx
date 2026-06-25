import { DashboardShell, EmptyPanel } from "@/components/dashboard-shell";
import { StatCard } from "@/components/stat-card";
import { creatorNav } from "@/app/creator/nav";
import { formatUgx, site } from "@/lib/constants";

export default function CreatorEarningsPage() {
  return (
    <DashboardShell title="Earnings" subtitle="See platform commission, creator earnings, available balance, and withdrawal readiness." nav={creatorNav}>
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard label="Minimum Withdrawal" value={formatUgx(site.minimumWithdrawal)} note="The balance gate is enforced server-side when withdrawals are requested." />
        <StatCard label="Creator Share" value="90%" />
        <StatCard label="Platform Commission" value="10%" />
      </div>
      <div className="mt-6">
        <EmptyPanel title="Live earnings totals were removed" text="This page no longer shows fabricated balances. Load real creator earnings after authenticated dashboard queries are in place." />
      </div>
    </DashboardShell>
  );
}
