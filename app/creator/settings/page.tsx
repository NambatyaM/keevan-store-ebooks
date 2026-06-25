import { DashboardShell, SettingsPanel } from "@/components/dashboard-shell";
import { creatorNav } from "@/app/creator/nav";

export default function CreatorSettingsPage() {
  return (
    <DashboardShell title="Settings" subtitle="Manage profile, store handle, support details, and payout information." nav={creatorNav}>
      <SettingsPanel />
    </DashboardShell>
  );
}
