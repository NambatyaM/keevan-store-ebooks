"use client";

import { useState, useEffect, useCallback } from "react";
import { ArrowRight, X, Loader2, Tag } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatUgx } from "@/lib/constants";

type BuyNowModalProps = {
  productId: string;
  productSlug: string;
  price: number;
  title: string;
  className?: string;
};

const UG_PHONE_REGEX = /^(\+256|0)[0-9]{9}$/;

export function BuyNowModal({ productId, productSlug, price, title, className }: BuyNowModalProps) {
  const [open, setOpen] = useState(false);
  const [buyerName, setBuyerName] = useState("");
  const [buyerEmail, setBuyerEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [duplicateError, setDuplicateError] = useState(false);
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [discountPercent, setDiscountPercent] = useState<number | null>(null);
  const [loadCheck, setLoadCheck] = useState(false);

  const isLoggedIn = userRole === "buyer";
  const discountedPrice = discountPercent
    ? Math.round(price * (1 - discountPercent / 100))
    : price;

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => {
        if (d.profile?.role === "buyer") {
          setUserRole("buyer");
          setBuyerName(d.profile.full_name ?? "");
          setBuyerEmail(d.profile.email ?? "");
          setPhone(d.profile.phone ?? "");
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

  function validatePhone(val: string): string | null {
    if (!val.trim()) return "Phone number is required";
    if (!UG_PHONE_REGEX.test(val.trim())) return "Enter a valid MTN or Airtel number (e.g. 0772XXXXXX)";
    return null;
  }

  async function startCheckout(name: string, email: string, phoneVal: string) {
    setSubmitting(true);
    setError(null);
    setDuplicateError(false);

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
        if (response.status === 409) {
          setDuplicateError(true);
        } else {
          setError(payload?.error?.message ?? "Unable to start checkout.");
        }
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
    const phoneVal = phone.trim();
    const phoneErr = validatePhone(phoneVal);
    if (phoneErr) {
      setPhoneError(phoneErr);
      return;
    }
    setPhoneError(null);
    setDuplicateError(false);
    await startCheckout(buyerName, buyerEmail, phoneVal);
  }

  return (
    <>
      <button
        className={cn(
          "focus-ring inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-brand-green px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#006f43]",
          className
        )}
        onClick={() => setOpen(true)}
        aria-label="Buy Now"
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
          aria-label="Complete your purchase"
        >
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-green">Pesapal payment</p>
                <h2 className="text-lg font-bold">Complete your purchase</h2>
              </div>
              <button
                className="focus-ring rounded-md p-1 text-neutral-400 transition hover:text-neutral-600"
                onClick={() => setOpen(false)}
                aria-label="Close checkout"
              >
                <X size={20} />
              </button>
            </div>

            {/* Product summary */}
            <div className="mb-4 rounded-md border border-neutral-200 bg-neutral-50 p-3">
              <p className="text-sm font-semibold text-neutral-800">{title}</p>
              <div className="mt-1 flex items-baseline gap-2">
                {discountPercent ? (
                  <>
                    <span className="text-lg font-bold text-brand-green">{formatUgx(discountedPrice)}</span>
                    <span className="text-sm text-neutral-400 line-through">{formatUgx(price)}</span>
                    <span className="rounded bg-amber-100 px-1.5 py-0.5 text-xs font-semibold text-amber-700">
                      -{discountPercent}%
                    </span>
                  </>
                ) : (
                  <span className="text-lg font-bold">{formatUgx(price)}</span>
                )}
              </div>
            </div>

            {/* Discount loading skeleton */}
            {loadCheck && (
              <div className="mb-4 flex animate-pulse items-center gap-2 rounded-md bg-neutral-100 p-3 text-sm text-neutral-500">
                <div className="h-4 w-4 rounded bg-neutral-300" />
                <span>Checking for discounts...</span>
              </div>
            )}

            {!loadCheck && discountPercent && (
              <div className="mb-4 flex items-center gap-2 rounded-md bg-amber-50 p-3 text-sm font-semibold text-amber-800">
                <Tag size={16} aria-hidden />
                {discountPercent}% discount applied
              </div>
            )}

            <form className="grid gap-4" onSubmit={handleSubmit} noValidate>
              <label className="grid gap-2 text-sm font-medium text-neutral-700">
                Full name
                <input
                  className="focus-ring rounded-md border border-neutral-300 px-4 py-3"
                  value={buyerName}
                  onChange={(event) => setBuyerName(event.target.value)}
                  autoComplete="name"
                  required
                  aria-required="true"
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
                  aria-required="true"
                />
              </label>
              <label className="grid gap-2 text-sm font-medium text-neutral-700">
                Phone number
                <input
                  className={cn(
                    "focus-ring rounded-md border px-4 py-3",
                    phoneError ? "border-red-400" : "border-neutral-300"
                  )}
                  type="tel"
                  value={phone}
                  onChange={(event) => {
                    setPhone(event.target.value);
                    if (phoneError) setPhoneError(null);
                  }}
                  autoComplete="tel"
                  required
                  aria-required="true"
                  aria-invalid={!!phoneError}
                  aria-describedby={phoneError ? "phone-error" : "phone-helper"}
                />
                {phoneError && (
                  <p id="phone-error" className="text-xs text-red-600" role="alert">
                    {phoneError}
                  </p>
                )}
                <p id="phone-helper" className="text-xs text-neutral-500">
                  Enter MTN or Airtel number (e.g. 0772XXXXXX)
                </p>
              </label>

              {/* Payment summary */}
              <div className="flex items-center justify-between rounded-md bg-neutral-50 p-3 text-sm">
                <span className="font-medium text-neutral-700">Total to pay</span>
                <span className="text-base font-bold">
                  {discountPercent ? formatUgx(discountedPrice) : formatUgx(price)}
                </span>
              </div>

              {!isLoggedIn && (
                <p className="text-xs text-neutral-500">
                  Already have an account?{" "}
                  <a href="/login?role=buyer" className="text-brand-green hover:underline">Sign in</a>
                  {" "}to auto-fill your details.
                </p>
              )}

              {duplicateError && (
                <p className="text-sm text-red-600" role="alert">
                  You already have a pending order for this product.{" "}
                  <a href="/buyer/dashboard" className="font-semibold underline">Check your orders</a>{" "}
                  or try again later.
                </p>
              )}
              {error && <p className="text-sm text-red-600" role="alert">{error}</p>}
              <button
                className="focus-ring inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-brand-green px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#006f43] disabled:cursor-not-allowed disabled:opacity-70"
                disabled={submitting}
                type="submit"
                aria-label={submitting ? "Redirecting to payment" : "Pay with Pesapal"}
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
