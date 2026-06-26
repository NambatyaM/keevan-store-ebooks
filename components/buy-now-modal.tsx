"use client";

import { useState, useEffect, useCallback } from "react";
import { ArrowRight, X, Loader2 } from "lucide-react";
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

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/payments/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId,
          buyerName,
          buyerEmail,
          phone: phone || undefined
        })
      });

      const payload = await response.json();

      if (!response.ok) {
        setError(payload?.error?.message ?? "Unable to start checkout.");
        return;
      }

      if (!payload?.redirectUrl) {
        setError("Pesapal did not return a redirect URL.");
        return;
      }

      window.location.assign(payload.redirectUrl);
    } catch {
      setError("Unable to reach the checkout service. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <button
        className={cn(
          "focus-ring inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-brand-green px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#006f43]",
          className
        )}
        onClick={() => setOpen(true)}
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
