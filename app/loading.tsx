import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

export default function Loading() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-10 md:grid-cols-2">
          <div className="space-y-6">
            <div className="h-4 w-32 animate-pulse rounded bg-neutral-200" />
            <div className="h-12 w-full animate-pulse rounded bg-neutral-200" />
            <div className="h-6 w-3/4 animate-pulse rounded bg-neutral-200" />
            <div className="h-20 w-full animate-pulse rounded bg-neutral-200" />
            <div className="flex gap-3">
              <div className="h-11 w-44 animate-pulse rounded bg-neutral-200" />
              <div className="h-11 w-36 animate-pulse rounded bg-neutral-200" />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="h-20 animate-pulse rounded bg-neutral-100" />
              <div className="h-20 animate-pulse rounded bg-neutral-100" />
              <div className="h-20 animate-pulse rounded bg-neutral-100" />
            </div>
          </div>
          <div className="aspect-[4/3] animate-pulse rounded-lg bg-neutral-200" />
        </div>
        <div className="mt-16 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-40 animate-pulse rounded-lg bg-neutral-100" />
          ))}
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
