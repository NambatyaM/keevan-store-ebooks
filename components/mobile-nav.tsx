"use client";

import { useEffect, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { MessageCircle } from "lucide-react";
import { useAuth } from "@/components/auth-provider";
import { LogoIcon } from "@/components/logo";
import { site } from "@/lib/constants";
import { cn } from "@/lib/utils";

const nav = [
  { href: "/features", label: "Features" },
  { href: "/pricing", label: "Pricing" },
  { href: "/about", label: "About" },
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

  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

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
          {/* Top bar → rotates 45° down-right */}
          <span
            className={cn(
              "absolute left-0 top-[3px] h-[2px] w-full rounded-full bg-current",
              "motion-safe:transition-all duration-[250ms]"
            )}
            style={{
              transform: open
                ? "translateY(6px) rotate(45deg)"
                : "translateY(0) rotate(0deg)",
            }}
          />
          {/* Middle bar → fades out */}
          <span
            className={cn(
              "absolute left-0 top-[9px] h-[2px] w-full rounded-full bg-current",
              "motion-safe:transition-all duration-[250ms]"
            )}
            style={{ opacity: open ? 0 : 1 }}
          />
          {/* Bottom bar → rotates -45° up-right */}
          <span
            className={cn(
              "absolute left-0 top-[15px] h-[2px] w-full rounded-full bg-current",
              "motion-safe:transition-all duration-[250ms]"
            )}
            style={{
              transform: open
                ? "translateY(-6px) rotate(-45deg)"
                : "translateY(0) rotate(0deg)",
            }}
          />
        </span>
      </button>

      {/* Backdrop + drawer are portaled to document.body to escape the
          backdrop-filter containing block on the <header>. Without this,
          position:fixed elements would be positioned relative to the header
          instead of the viewport, causing the menu to appear only within
          the header area. */}
      {mounted && createPortal(
        <>
          <div
            className={cn(
              "fixed inset-0 z-40 bg-black/40 motion-safe:transition-opacity duration-[250ms] md:hidden",
              open ? "opacity-100" : "opacity-0 pointer-events-none"
            )}
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />
          <div
            id="mobile-menu-panel"
            role="dialog"
            aria-modal="true"
            aria-label="Navigation menu"
            aria-hidden={!open}
            inert={!open || undefined}
            className={cn(
              "fixed inset-y-0 right-0 z-50 flex w-[85vw] max-w-[360px] flex-col bg-white shadow-xl md:hidden",
              "motion-safe:transition-transform duration-[250ms]",
              open ? "translate-x-0" : "translate-x-full"
            )}
          >
        {/* Drawer header */}
        <div className="flex shrink-0 items-center justify-between border-b border-neutral-100 px-5 py-4">
          <Link
            href="/"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2 font-bold text-sm"
            tabIndex={open ? 0 : -1}
          >
            <span className="grid h-7 w-7 place-items-center">
              <LogoIcon size={28} />
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
        <nav className="flex-1 overflow-y-auto px-5 py-5">
          <div className="flex flex-col gap-0.5">
            {/* -- Group 1: Primary CTA — conversion action -- */}
            {role ? (
              <Link
                href={role === "admin" ? "/admin/dashboard" : role === "buyer" ? "/buyer/dashboard" : "/creator/dashboard"}
                onClick={() => setOpen(false)}
                className="flex items-center justify-center rounded-lg bg-brand-green px-5 py-3 text-[16px] font-semibold text-white min-h-[48px]"
                tabIndex={open ? 0 : -1}
              >
                Dashboard
              </Link>
            ) : (
              <Link
                href="/login"
                onClick={() => setOpen(false)}
                className="flex items-center justify-center rounded-lg bg-brand-green px-5 py-3 text-[16px] font-semibold text-white min-h-[48px]"
                tabIndex={open ? 0 : -1}
              >
                Log in
              </Link>
            )}

            {/* -- Divider -- */}
            <div className="my-4 border-t border-neutral-100" />

            {/* -- Group 2: Main nav links -- */}
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className="flex items-center rounded-lg px-5 py-3 text-[16px] font-medium text-neutral-700 hover:bg-brand-mist min-h-[48px]"
                tabIndex={open ? 0 : -1}
              >
                {item.label}
              </Link>
            ))}

            {/* -- Divider -- */}
            <div className="my-4 border-t border-neutral-100" />

            {/* -- Group 3: Auth-aware section -- */}
            {loading && !role ? null : role ? (
              <Link
                href={
                  role === "admin"
                    ? "/admin/dashboard"
                    : role === "buyer"
                      ? "/buyer/dashboard"
                      : "/creator/dashboard"
                }
                onClick={() => setOpen(false)}
                className="flex items-center justify-center rounded-lg bg-brand-green px-5 py-3 text-[16px] font-semibold text-white min-h-[48px]"
                tabIndex={open ? 0 : -1}
              >
                Dashboard
              </Link>
            ) : (
              <div className="flex flex-col gap-1">
                <Link
                  href="/login"
                  onClick={() => setOpen(false)}
                  className="flex items-center rounded-lg px-5 py-3 text-[16px] font-medium text-neutral-700 hover:bg-neutral-50 min-h-[48px]"
                  tabIndex={open ? 0 : -1}
                >
                  Log in
                </Link>
                <Link
                  href="/signup-buyer"
                  onClick={() => setOpen(false)}
                  className="flex items-center rounded-lg px-5 py-3 text-[16px] font-medium text-neutral-700 hover:bg-brand-mist min-h-[48px]"
                  tabIndex={open ? 0 : -1}
                >
                  Sign Up as Buyer
                </Link>
                <Link
                  href="/signup"
                  onClick={() => setOpen(false)}
                  className="mt-2 flex items-center justify-center gap-2 rounded-lg bg-brand-green px-5 py-3 text-[16px] font-semibold text-white min-h-[48px]"
                  tabIndex={open ? 0 : -1}
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <line x1="19" y1="8" x2="19" y2="14" />
                    <line x1="22" y1="11" x2="16" y2="11" />
                  </svg>
                  Create Your Free Store
                </Link>
              </div>
            )}

            {/* -- Divider -- */}
            <div className="my-4 border-t border-neutral-100" />

            {/* -- Group 4: Support / trust signal -- */}
            <a
              href={site.supportWhatsApp}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 rounded-lg px-5 py-3 text-[14px] font-medium text-neutral-500 hover:bg-brand-mist hover:text-brand-green min-h-[44px]"
              tabIndex={open ? 0 : -1}
            >
              <MessageCircle size={18} className="shrink-0" />
              Chat with us on WhatsApp
            </a>
          </div>
        </nav>
      </div>
    </>,
    document.body
  )}
    </>
  );
}
