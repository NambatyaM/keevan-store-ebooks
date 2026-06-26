import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export default function CheckoutLoading() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="h-6 w-48 animate-pulse rounded bg-neutral-200" />
        <div className="mt-4 h-10 w-96 animate-pulse rounded bg-neutral-200" />
        <div className="mt-8 grid gap-6 md:grid-cols-[1fr_0.8fr]">
          <div className="h-96 animate-pulse rounded-lg bg-neutral-200" />
          <div className="h-64 animate-pulse rounded-lg bg-neutral-200" />
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
