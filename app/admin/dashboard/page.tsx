import { DashboardShell, EmptyPanel } from "@/components/dashboard-shell";
import { adminNav } from "@/app/admin/nav";

export default function AdminDashboardPage() {
  return (
    <DashboardShell title="Admin Overview" subtitle="Manage creators, sales, withdrawals, moderation, and platform performance." nav={adminNav}>
      <EmptyPanel title="Admin metrics must come from authenticated live queries" text="Fabricated platform totals were removed from this dashboard. Wire this shell to real admin-only data before launch." />
    </DashboardShell>
  );
}
