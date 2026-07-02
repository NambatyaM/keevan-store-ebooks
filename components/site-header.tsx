"use client";

import { useEffect, useState } from "react";
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
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "sticky top-0 z-40 h-14 bg-white/95 backdrop-blur transition-shadow",
        scrolled && "border-b border-neutral-200 shadow-sm"
      )}
    >
      <div className="mx-auto flex h-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex shrink-0 items-center gap-2 font-bold">
          <span className="grid h-7 w-7 place-items-center sm:h-8 sm:w-8">
            <LogoIcon size={28} />
          </span>
          <span className="text-sm sm:text-base">Keevan Store</span>
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
