import { DashboardShell } from "@/components/dashboard-shell";
import { adminNav } from "@/app/admin/nav";

const creators = [
  { name: "Amina Nakasero", status: "Active", sales: 517, earnings: "UGX 11,518,000" },
  { name: "Peter Okello", status: "Active", sales: 284, earnings: "UGX 6,220,000" },
  { name: "Nadia Achieng", status: "Suspended", sales: 91, earnings: "UGX 1,940,000" }
];

export default function AdminCreatorsPage() {
  return (
    <DashboardShell title="Creator Management" subtitle="View profiles, suspend stores, reactivate stores, ban accounts, and review earnings." nav={adminNav}>
      <div className="overflow-hidden rounded-lg border border-neutral-200 bg-white">
        {creators.map((creator) => (
          <div key={creator.name} className="grid gap-2 border-b border-neutral-100 p-4 text-sm md:grid-cols-5">
            <strong>{creator.name}</strong>
            <span>{creator.status}</span>
            <span>{creator.sales} sales</span>
            <span>{creator.earnings}</span>
            <span className="font-semibold text-brand-green">Review</span>
          </div>
        ))}
      </div>
    </DashboardShell>
  );
}
