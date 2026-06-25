import { DashboardShell, EmptyPanel } from "@/components/dashboard-shell";
import { StatCard } from "@/components/stat-card";
import { adminNav } from "@/app/admin/nav";

export default function AdminSalesPage() {
  return (
    <DashboardShell title="Sales" subtitle="Review verified transactions, gross revenue, platform earnings, and creator earnings." nav={adminNav}>
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard label="Creator Share" value="90%" />
        <StatCard label="Platform Commission" value="10%" />
        <StatCard label="Verification Rule" value="Required" />
      </div>
      <div className="mt-6">
        <EmptyPanel title="Live sales totals were removed" text="This page no longer displays fabricated platform revenue and sales counts." />
      </div>
    </DashboardShell>
  );
}
