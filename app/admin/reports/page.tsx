import { DashboardShell, EmptyPanel } from "@/components/dashboard-shell";
import { SalesChart } from "@/components/sales-chart";
import { adminNav } from "@/app/admin/nav";

export default function AdminReportsPage() {
  return (
    <DashboardShell title="Reports" subtitle="Platform growth, revenue, registrations, active stores, and compliance reports." nav={adminNav}>
      <EmptyPanel title="Report charts now wait for live data" text="Hardcoded chart series were removed from admin reporting." />
      <div className="mt-6">
      <SalesChart />
      </div>
    </DashboardShell>
  );
}
