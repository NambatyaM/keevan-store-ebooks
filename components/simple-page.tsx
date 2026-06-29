import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export function SimplePage({ title, eyebrow, children, minimalFooter }: { title: string; eyebrow?: string; children: React.ReactNode; minimalFooter?: boolean }) {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-4xl px-4 py-14 sm:px-6 lg:px-8">
        {eyebrow ? <p className="text-sm font-bold uppercase tracking-[0.18em] text-brand-green">{eyebrow}</p> : null}
        <h1 className="mt-3 text-4xl font-black text-brand-black">{title}</h1>
        <div className="prose prose-neutral content-visibility-auto mt-7 max-w-none leading-7 text-neutral-700">{children}</div>
      </main>
      {minimalFooter ? (
        <footer className="border-t border-neutral-200 bg-neutral-950 py-6 text-center text-sm text-neutral-400">
          <a href="/terms" className="hover:text-white">Terms</a>
          <span className="mx-2">·</span>
          <a href="/privacy" className="hover:text-white">Privacy</a>
          <span className="mx-2">·</span>
          &copy; 2026 Keevan Store
        </footer>
      ) : (
        <SiteFooter />
      )}
    </>
  );
}
