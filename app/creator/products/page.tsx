import { DashboardShell, EmptyPanel } from "@/components/dashboard-shell";
import { creatorNav } from "@/app/creator/nav";

export default function CreatorProductsPage() {
  return (
    <DashboardShell title="Products" subtitle="Upload products, update pricing, change cover images, and disable products when needed." nav={creatorNav}>
      <EmptyPanel title="Product inventory is not rendered from live data yet" text="Static catalog records were removed. This page should load the signed-in creator's products from Supabase before launch." />
    </DashboardShell>
  );
}
