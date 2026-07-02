"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/components/auth-provider";
import { LogoIcon } from "@/components/logo";
import { cn } from "@/lib/utils";

const nav = [
  { href: "/features", label: "Features" },
  { href: "/pricing", label: "Pricing" },
  { href: "/faq", label: "FAQ" },
  { href: "/contact", label: "Contact" },
];

export function MobileNav() {
  const [open, setOpen] = useState(false);
  const { profile, loading } = useAuth();
  const pathname = usePathname();

  useEffect(() => { setOpen(false); }, [pathname]);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open]);

  const toggle = useCallback(() => setOpen((v) => !v), []);

  const role = profile?.role ?? null;

  return (
    <>
      {/* Hamburger button — 44x44px minimum touch target */}
      <button
        onClick={toggle}
        className={cn(
          "relative z-50 grid h-11 w-11 place-items-center rounded-md transition-colors md:hidden",
          "hover:bg-neutral-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-green",
          open && "bg-neutral-100"
        )}
        aria-label={open ? "Close menu" : "Open menu"}
        aria-expanded={open}
        aria-controls="mobile-menu-panel"
      >
        <span className="relative h-5 w-5" aria-hidden="true">
          {/* Top bar */}
          <span
            className={cn(
              "absolute left-0 top-[3px] h-[2px] w-full rounded-full bg-current",
              "motion-safe:transition-all duration-200"
            )}
            style={{
              transform: open
                ? "translateY(6px) rotate(45deg)"
                : "translateY(0) rotate(0deg)",
            }}
          />
          {/* Middle bar */}
          <span
            className={cn(
              "absolute left-0 top-[9px] h-[2px] w-full rounded-full bg-current",
              "motion-safe:transition-all duration-200"
            )}
            style={{ opacity: open ? 0 : 1 }}
          />
          {/* Bottom bar */}
          <span
            className={cn(
              "absolute left-0 top-[15px] h-[2px] w-full rounded-full bg-current",
              "motion-safe:transition-all duration-200"
            )}
            style={{
              transform: open
                ? "translateY(-6px) rotate(-45deg)"
                : "translateY(0) rotate(0deg)",
            }}
          />
        </span>
      </button>

      {/* Backdrop overlay — always mounted for smooth opacity transition */}
      <div
        className={cn(
          "fixed inset-0 z-40 bg-black/30 motion-safe:transition-opacity duration-200 md:hidden",
          open ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={() => setOpen(false)}
        aria-hidden="true"
      />

      {/* Side drawer — slides in from right */}
      <div
        id="mobile-menu-panel"
        role="dialog"
        aria-modal="true"
        aria-label="Navigation menu"
        aria-hidden={!open}
        inert={!open || undefined}
        className={cn(
          "fixed inset-y-0 right-0 z-50 flex w-80 max-w-[85vw] flex-col bg-white shadow-xl md:hidden",
          "motion-safe:transition-transform duration-200",
          open ? "translate-x-0" : "translate-x-full"
        )}
      >
        {/* Drawer header */}
        <div className="flex items-center justify-between border-b border-neutral-200 px-4 py-3">
          <Link
            href="/"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 font-bold"
            tabIndex={open ? 0 : -1}
          >
            <span className="grid h-9 w-9 place-items-center">
              <LogoIcon size={36} />
            </span>
            Keevan Store
          </Link>
          <button
            onClick={() => setOpen(false)}
            className="grid h-11 w-11 place-items-center rounded-md hover:bg-neutral-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-green"
            aria-label="Close menu"
            tabIndex={open ? 0 : -1}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            >
              <line x1="4" y1="4" x2="16" y2="16" />
              <line x1="16" y1="4" x2="4" y2="16" />
            </svg>
          </button>
        </div>

        {/* Nav links */}
        <nav className="flex-1 overflow-y-auto px-4 py-6">
          <div className="flex flex-col gap-1">
            {/* Primary CTA — visually distinct */}
            <Link
              href="/"
              onClick={() => setOpen(false)}
              className="flex items-center rounded-lg bg-brand-green px-4 py-3 text-base font-semibold text-white min-h-[48px]"
              tabIndex={open ? 0 : -1}
            >
              Browse Products
            </Link>

            <hr className="my-3 border-neutral-200" />

            {/* Main navigation links */}
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className="flex items-center rounded-lg px-4 py-3 text-base font-medium text-neutral-700 hover:bg-brand-mist min-h-[48px]"
                tabIndex={open ? 0 : -1}
              >
                {item.label}
              </Link>
            ))}

            <hr className="my-3 border-neutral-200" />

            {/* Auth-aware section */}
            {loading ? (
              <div className="px-4 py-3 text-base text-neutral-400">
                Loading...
              </div>
            ) : role ? (
              <Link
                href={
                  role === "admin"
                    ? "/admin/dashboard"
                    : role === "buyer"
                      ? "/buyer/dashboard"
                      : "/creator/dashboard"
                }
                onClick={() => setOpen(false)}
                className="flex items-center justify-center rounded-lg bg-brand-green px-4 py-3 text-base font-semibold text-white min-h-[48px]"
                tabIndex={open ? 0 : -1}
              >
                Dashboard
              </Link>
            ) : (
              <div className="flex flex-col gap-2">
                <Link
                  href="/login"
                  onClick={() => setOpen(false)}
                  className="flex items-center justify-center rounded-lg border border-neutral-300 px-4 py-3 text-base font-medium text-neutral-700 hover:bg-neutral-50 min-h-[48px]"
                  tabIndex={open ? 0 : -1}
                >
                  Sign In
                </Link>
                <Link
                  href="/signup-buyer"
                  onClick={() => setOpen(false)}
                  className="flex items-center justify-center rounded-lg px-4 py-3 text-base font-medium text-neutral-700 hover:bg-brand-mist min-h-[48px]"
                  tabIndex={open ? 0 : -1}
                >
                  Sign Up as Buyer
                </Link>
                <Link
                  href="/signup"
                  onClick={() => setOpen(false)}
                  className="flex items-center justify-center rounded-lg bg-brand-green px-4 py-3 text-base font-semibold text-white min-h-[48px]"
                  tabIndex={open ? 0 : -1}
                >
                  Start Selling Free
                </Link>
              </div>
            )}
          </div>
        </nav>
      </div>
    </>
  );
}
