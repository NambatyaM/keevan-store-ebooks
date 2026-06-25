import Link from "next/link";
import { Menu, Store } from "lucide-react";
import { ButtonLink } from "@/components/button";

const nav = [
  { href: "/features", label: "Features" },
  { href: "/pricing", label: "Pricing" },
  { href: "/faq", label: "FAQ" },
  { href: "/contact", label: "Contact" }
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-neutral-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2 font-bold">
          <span className="grid h-9 w-9 place-items-center rounded-md bg-brand-green text-white">
            <Store size={19} aria-hidden />
          </span>
          Keevan Store
        </Link>
        <nav className="hidden items-center gap-7 text-sm font-medium text-neutral-700 md:flex">
          {nav.map((item) => (
            <Link key={item.href} href={item.href} className="hover:text-brand-green">
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="hidden items-center gap-3 md:flex">
          <ButtonLink href="/login" variant="secondary" className="min-h-10 px-4 py-2">
            Login
          </ButtonLink>
          <ButtonLink href="/signup" className="min-h-10 px-4 py-2">
            Start Selling Free
          </ButtonLink>
        </div>
        <button className="focus-ring grid h-10 w-10 place-items-center rounded-md border border-neutral-200 md:hidden" aria-label="Open menu">
          <Menu size={20} />
        </button>
      </div>
    </header>
  );
}
