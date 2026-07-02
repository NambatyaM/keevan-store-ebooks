"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Menu, X } from "lucide-react";
import { LogoIcon } from "@/components/logo";
import { cn } from "@/lib/utils";

const nav = [
  { href: "/features", label: "Features" },
  { href: "/pricing", label: "Pricing" },
  { href: "/faq", label: "FAQ" },
  { href: "/contact", label: "Contact" }
];

export function MobileNav() {
  const [open, setOpen] = useState(false);
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => { if (d.profile?.role) setRole(d.profile.role); })
      .catch((err) => console.error("Failed to fetch user role in mobile nav:", err));
  }, []);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  return (
    <>
      <button onClick={() => setOpen(true)} className="focus-ring grid h-10 w-10 place-items-center rounded-md border border-neutral-200 md:hidden" aria-label="Open menu">
        <Menu size={20} />
      </button>

      {/* Backdrop overlay */}
      {open && (
        <div
          className="fixed inset-0 z-[60] bg-black/30 md:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Side drawer */}
      <div
        className={cn(
          "fixed inset-y-0 right-0 z-[70] flex w-80 max-w-[85vw] flex-col bg-white shadow-xl md:hidden transition-transform duration-200",
          open ? "translate-x-0" : "translate-x-full",
        )}
      >
        <div className="flex items-center justify-between border-b border-neutral-200 px-4 py-3">
          <Link href="/" className="flex items-center gap-2 font-bold" onClick={() => setOpen(false)}>
            <span className="grid h-9 w-9 place-items-center">
              <LogoIcon size={36} />
            </span>
            Keevan Store
          </Link>
          <button onClick={() => setOpen(false)} className="focus-ring grid h-10 w-10 place-items-center rounded-md border border-neutral-200" aria-label="Close menu">
            <X size={20} />
          </button>
        </div>
        <nav className="flex-1 overflow-y-auto px-4 py-6">
          <div className="flex flex-col gap-4">
            {nav.map((item) => (
              <Link key={item.href} href={item.href} onClick={() => setOpen(false)} className="rounded-md px-3 py-2 text-lg font-semibold hover:bg-brand-mist">
                {item.label}
              </Link>
            ))}
            <hr className="my-2 border-neutral-200" />
            {role ? (
              <Link
                href={role === "admin" ? "/admin/dashboard" : role === "buyer" ? "/buyer/dashboard" : "/creator/dashboard"}
                onClick={() => setOpen(false)}
                className="rounded-md bg-brand-green px-3 py-2 text-lg font-semibold text-white text-center"
              >
                Dashboard
              </Link>
            ) : (
              <>
                <Link href="/login" onClick={() => setOpen(false)} className="rounded-md px-3 py-2 text-lg font-semibold hover:bg-brand-mist">
                  Login
                </Link>
                <Link href="/signup-buyer" onClick={() => setOpen(false)} className="rounded-md px-3 py-2 text-lg font-semibold hover:bg-brand-mist">
                  Sign Up as Buyer
                </Link>
                <Link href="/signup" onClick={() => setOpen(false)} className="rounded-md bg-brand-green px-3 py-2 text-lg font-semibold text-white text-center">
                  Start Selling Free
                </Link>
              </>
            )}
          </div>
        </nav>
      </div>
    </>
  );
}
