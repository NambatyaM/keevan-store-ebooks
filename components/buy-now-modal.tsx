"use client";

import { useState, useEffect, useCallback } from "react";
import { ArrowRight, X, Loader2, Tag } from "lucide-react";
import { cn } from "@/lib/utils";

type BuyNowModalProps = {
  productId: string;
  productSlug: string;
  className?: string;
};

export function BuyNowModal({ productId, productSlug, className }: BuyNowModalProps) {
  const [open, setOpen] = useState(false);
  const [buyerName, setBuyerName] = useState("");
  const [buyerEmail, setBuyerEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  const [discountPercent, setDiscountPercent] = useState<number | null>(null);
  const [loadCheck, setLoadCheck] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => {
        if (d.profile?.role === "buyer") {
          setUserRole("buyer");
          setUserEmail(d.profile.email);
          setUserName(d.profile.full_name);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!open) return;
    setLoadCheck(true);
    fetch(`/api/discounts/active?productId=${productId}`)
      .then((r) => r.json())
      .then((d) => setDiscountPercent(d.discount?.discount_percent ?? null))
      .catch(() => setDiscountPercent(null))
      .finally(() => setLoadCheck(false));
  }, [open, productId]);

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (event.key === "Escape") setOpen(false);
  }, []);

  useEffect(() => {
    if (open) {
      document.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [open, handleKeyDown]);

  async function startCheckout(name: string, email: string, phoneVal: string) {
    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/payments/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId,
          buyerName: name,
          buyerEmail: email,
          phone: phoneVal || undefined
        })
      });

      const payload = await response.json();

      if (!response.ok) {
        setError(payload?.error?.message ?? "Unable to start checkout.");
        setSubmitting(false);
        return;
      }

      if (!payload?.redirectUrl) {
        setError("Pesapal did not return a redirect URL.");
        setSubmitting(false);
        return;
      }

      window.location.assign(payload.redirectUrl);
    } catch {
      setError("Unable to reach the checkout service. Please try again.");
      setSubmitting(false);
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await startCheckout(buyerName, buyerEmail, phone);
  }

  async function handleLoggedInCheckout() {
    await startCheckout(userName!, userEmail!, "");
  }

  return (
    <>
      <button
        className={cn(
          "focus-ring inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-brand-green px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#006f43]",
          className
        )}
        onClick={() => {
          if (userRole === "buyer") {
            handleLoggedInCheckout();
          } else {
            setOpen(true);
          }
        }}
      >
        Buy Now
        <ArrowRight aria-hidden size={17} />
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={(event) => { if (event.target === event.currentTarget) setOpen(false); }}
          role="dialog"
          aria-modal="true"
          aria-label="Checkout"
        >
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-green">Pesapal payment</p>
                <h2 className="text-lg font-bold">Secure Checkout</h2>
              </div>
              <button
                className="focus-ring rounded-md p-1 text-neutral-400 transition hover:text-neutral-600"
                onClick={() => setOpen(false)}
                aria-label="Close checkout"
              >
                <X size={20} />
              </button>
            </div>

            {discountPercent && (
              <div className="mb-4 flex items-center gap-2 rounded-md bg-amber-50 p-3 text-sm font-semibold text-amber-800">
                <Tag size={16} aria-hidden />
                {discountPercent}% discount applied at checkout
              </div>
            )}

            <form className="grid gap-4" onSubmit={handleSubmit}>
              <label className="grid gap-2 text-sm font-medium text-neutral-700">
                Full name
                <input
                  className="focus-ring rounded-md border border-neutral-300 px-4 py-3"
                  value={buyerName}
                  onChange={(event) => setBuyerName(event.target.value)}
                  autoComplete="name"
                  required
                />
              </label>
              <label className="grid gap-2 text-sm font-medium text-neutral-700">
                Email for receipt
                <input
                  className="focus-ring rounded-md border border-neutral-300 px-4 py-3"
                  type="email"
                  value={buyerEmail}
                  onChange={(event) => setBuyerEmail(event.target.value)}
                  autoComplete="email"
                  required
                />
              </label>
              <label className="grid gap-2 text-sm font-medium text-neutral-700">
                Phone number
                <input
                  className="focus-ring rounded-md border border-neutral-300 px-4 py-3"
                  type="tel"
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                  autoComplete="tel"
                />
              </label>
              <p className="text-xs text-neutral-500">
                Already have an account?{" "}
                <a href="/login?role=buyer" className="text-brand-green hover:underline">Sign in</a>
                {" "}to skip this step.
              </p>
              {error && <p className="text-sm text-red-600">{error}</p>}
              <button
                className="focus-ring inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-brand-green px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#006f43] disabled:cursor-not-allowed disabled:opacity-70"
                disabled={submitting}
                type="submit"
              >
                {submitting && <Loader2 className="animate-spin" size={16} />}
                {submitting ? "Redirecting to Pesapal..." : "Pay with Pesapal"}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
