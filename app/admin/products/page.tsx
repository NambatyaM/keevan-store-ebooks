import { DashboardShell, EmptyPanel } from "@/components/dashboard-shell";
import { adminNav } from "@/app/admin/nav";

export default function AdminProductsPage() {
  return (
    <DashboardShell title="Product Moderation" subtitle="Review uploaded products, disable violating content, and disable stores when required." nav={adminNav}>
      <EmptyPanel title="Moderation records are no longer mocked" text="Static product review rows were removed. Load real product moderation data for admins through authenticated queries." />
    </DashboardShell>
  );
}
