"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SiteHeaderAuth } from "@/components/site-header-auth";
import { MobileNav } from "@/components/mobile-nav";
import { LogoIcon } from "@/components/logo";
import { cn } from "@/lib/utils";

const nav = [
  { href: "/features", label: "Features" },
  { href: "/pricing", label: "Pricing" },
  { href: "/about", label: "About" },
  { href: "/faq", label: "FAQ" },
  { href: "/contact", label: "Contact" },
  { href: "/login", label: "Log in" }
];

export function SiteHeader() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 border-b border-neutral-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2 font-bold">
          <span className="grid h-9 w-9 place-items-center">
            <LogoIcon size={36} />
          </span>
          Keevan Store
        </Link>
        <nav className="hidden items-center gap-1 text-sm font-medium text-neutral-700 md:flex">
          {nav.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "rounded-lg px-3 py-2 transition hover:text-brand-green",
                  isActive ? "bg-brand-mist text-brand-green font-semibold" : "hover:bg-neutral-100"
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
        <SiteHeaderAuth />
        <MobileNav />
      </div>
    </header>
  );
}
