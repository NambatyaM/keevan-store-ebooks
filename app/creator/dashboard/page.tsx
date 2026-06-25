import { DashboardShell, EmptyPanel } from "@/components/dashboard-shell";
import { SalesChart } from "@/components/sales-chart";
import { creatorNav } from "@/app/creator/nav";

export default function CreatorDashboardPage() {
  return (
    <DashboardShell title="Creator Overview" subtitle="Track sales, balance, store growth, downloads, and withdrawals from one simple workspace." nav={creatorNav}>
      <EmptyPanel title="Live dashboard data requires an authenticated creator session" text="Mock creator metrics were removed. Connect Supabase auth on the client and load this view from real creator-scoped queries." />
      <div className="mt-6">
        <h2 className="mb-3 text-xl font-bold">Earnings Growth</h2>
        <SalesChart />
      </div>
    </DashboardShell>
  );
}
