import Link from "next/link";
import { Gauge, Store } from "lucide-react";
import { cn } from "@/lib/utils";

export function DashboardShell({
  title,
  subtitle,
  nav,
  action,
  children
}: {
  title: string;
  subtitle: string;
  nav: Array<{ href: string; label: string }>;
  action?: { href: string; label: string };
  children: React.ReactNode;
}) {
  return (
    <main className="min-h-screen bg-neutral-50">
      <aside className="border-b border-neutral-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-4">
            <Link href="/" className="flex items-center gap-2 font-bold">
              <span className="grid h-9 w-9 place-items-center rounded-md bg-brand-green text-white">
                <Store size={18} aria-hidden />
              </span>
              Keevan Store
            </Link>
            {action ? (
              <Link href={action.href} className="text-sm font-semibold text-brand-green">
                {action.label}
              </Link>
            ) : null}
          </div>
          <nav className="flex gap-2 overflow-x-auto pb-1">
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn("shrink-0 rounded-md border border-neutral-200 px-3 py-2 text-sm font-semibold hover:bg-brand-mist")}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </aside>
      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-7">
          <div className="flex items-center gap-2 text-brand-green">
            <Gauge size={18} aria-hidden />
            <p className="text-sm font-bold uppercase tracking-[0.16em]">Dashboard</p>
          </div>
          <h1 className="mt-2 text-3xl font-black text-brand-black">{title}</h1>
          <p className="mt-2 max-w-2xl text-neutral-600">{subtitle}</p>
        </div>
        {children}
      </section>
    </main>
  );
}
