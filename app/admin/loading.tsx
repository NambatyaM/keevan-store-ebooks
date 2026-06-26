import { Gauge } from "lucide-react";
import Link from "next/link";
import { Store } from "lucide-react";
import { adminNav } from "@/app/admin/nav";

export default function AdminLoading() {
  return (
    <main className="min-h-screen bg-neutral-50">
      <aside className="border-b border-neutral-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-4">
            <Link href="/" className="flex items-center gap-2 font-bold">
              <span className="grid h-9 w-9 place-items-center rounded-md bg-brand-green text-white"><Store size={18} /></span>
              Keevan Store
            </Link>
          </div>
          <nav className="flex gap-2 overflow-x-auto pb-1">
            {adminNav.map((item) => (
              <Link key={item.href} href={item.href} className="shrink-0 rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm font-semibold hover:bg-brand-mist">{item.label}</Link>
            ))}
          </nav>
        </div>
      </aside>
      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-7 flex items-center gap-2 text-brand-green">
          <Gauge size={18} />
          <p className="text-sm font-bold uppercase tracking-[0.16em]">Dashboard</p>
        </div>
        <div className="grid gap-4 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-lg bg-neutral-200" />
          ))}
        </div>
        <div className="mt-6 h-72 animate-pulse rounded-lg bg-neutral-200" />
      </section>
    </main>
  );
}
