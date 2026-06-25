import { DashboardShell } from "@/components/dashboard-shell";
import { adminNav } from "@/app/admin/nav";

export default function AdminSettingsPage() {
  return (
    <DashboardShell title="Admin Settings" subtitle="Configure commission rate, withdrawal limits, moderation rules, and support details." nav={adminNav}>
      <div className="grid gap-4 rounded-lg border border-neutral-200 bg-white p-5 md:grid-cols-2">
        <label className="grid gap-2 text-sm font-semibold">
          Platform commission
          <input className="focus-ring rounded-md border border-neutral-300 px-4 py-3" defaultValue="10%" />
        </label>
        <label className="grid gap-2 text-sm font-semibold">
          Minimum withdrawal
          <input className="focus-ring rounded-md border border-neutral-300 px-4 py-3" defaultValue="50,000 UGX" />
        </label>
      </div>
    </DashboardShell>
  );
}
