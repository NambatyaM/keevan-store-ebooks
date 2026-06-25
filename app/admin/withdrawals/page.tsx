import { DashboardShell, EmptyPanel } from "@/components/dashboard-shell";
import { adminNav } from "@/app/admin/nav";

export default function AdminWithdrawalsPage() {
  return (
    <DashboardShell title="Withdrawal Management" subtitle="Approve, reject, mark paid, and add notes to creator withdrawal requests." nav={adminNav}>
      <EmptyPanel title="Withdrawal management rows are no longer fabricated" text="Static payout requests were removed so admins only act on real withdrawal records." />
    </DashboardShell>
  );
}
