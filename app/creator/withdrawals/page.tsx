import { DashboardShell, EmptyPanel } from "@/components/dashboard-shell";
import { creatorNav } from "@/app/creator/nav";

export default function CreatorWithdrawalsPage() {
  return (
    <DashboardShell title="Withdrawals" subtitle="Request payouts once your available balance reaches the platform minimum." nav={creatorNav}>
      <EmptyPanel title="Withdrawal history now requires live creator data" text="Shared fake payout rows were removed so one creator can no longer see another creator's records." />
    </DashboardShell>
  );
}
