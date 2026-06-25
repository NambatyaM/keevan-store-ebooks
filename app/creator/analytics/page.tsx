import { DashboardShell, EmptyPanel } from "@/components/dashboard-shell";
import { SalesChart } from "@/components/sales-chart";
import { creatorNav } from "@/app/creator/nav";

export default function CreatorAnalyticsPage() {
  return (
    <DashboardShell title="Analytics" subtitle="Monitor views, purchases, revenue, conversion rate, top products, and traffic quality." nav={creatorNav}>
      <EmptyPanel title="Live analytics are not loaded in this shell yet" text="Fake traffic and revenue numbers were removed. Connect this page to authenticated analytics queries before exposing it to creators." />
      <div className="mt-6 grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
        <SalesChart />
        <div className="rounded-lg border border-neutral-200 bg-white p-5">
          <h2 className="text-xl font-bold">Top Products</h2>
          <p className="mt-4 text-sm text-neutral-600">Verified purchases will appear here once creator analytics queries are wired to live data.</p>
        </div>
      </div>
    </DashboardShell>
  );
}
