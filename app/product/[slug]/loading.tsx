import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export default function ProductLoading() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-[0.9fr_1.1fr] lg:px-8">
        <div className="aspect-[4/5] animate-pulse rounded-lg bg-neutral-200" />
        <div className="space-y-4">
          <div className="h-6 w-32 animate-pulse rounded bg-neutral-200" />
          <div className="h-10 w-3/4 animate-pulse rounded bg-neutral-200" />
          <div className="h-4 w-1/3 animate-pulse rounded bg-neutral-200" />
          <div className="mt-6 h-24 animate-pulse rounded bg-neutral-200" />
          <div className="mt-6 h-32 animate-pulse rounded bg-neutral-200" />
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
