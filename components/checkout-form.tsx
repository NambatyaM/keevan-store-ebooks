"use client";

import { useState, useEffect } from "react";
import { Loader2, Tag } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatCurrency, currencyPhoneRegex, type Currency } from "@/lib/constants";

type CheckoutFormProps = {
  productId: string;
  price?: number;
  currency?: Currency;
  title?: string;
};

export function CheckoutForm({ productId, price, currency, title }: CheckoutFormProps) {
  const [buyerName, setBuyerName] = useState("");
  const [buyerEmail, setBuyerEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [duplicateError, setDuplicateError] = useState(false);
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [discountPercent, setDiscountPercent] = useState<number | null>(null);

  const discountedPrice = discountPercent
    ? Math.round((price ?? 0) * (1 - discountPercent / 100))
    : (price ?? 0);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => {
        if (d.profile?.role === "buyer") {
          setBuyerName(d.profile.full_name ?? "");
          setBuyerEmail(d.profile.email ?? "");
          setPhone(d.profile.phone ?? "");
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetch(`/api/discounts/active?productId=${productId}`)
      .then((r) => r.json())
      .then((d) => setDiscountPercent(d.discount?.discount_percent ?? null))
      .catch(() => setDiscountPercent(null));
  }, [productId]);

  function validatePhone(val: string): string | null {
    if (!val.trim()) return "Phone number is required";
    const regex = currencyPhoneRegex[currency ?? "UGX"] ?? currencyPhoneRegex.UGX;
    if (!regex.test(val.trim())) return "Enter a valid phone number for your region (e.g. 0772XXXXXX)";
    return null;
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
          phone: phoneVal || undefined
        })
      });

      const payload = await response.json();

      if (!response.ok) {
        if (response.status === 409) {
          setDuplicateError(true);
          setError(payload?.error?.message ?? null);
        } else {
          setError(payload?.error?.message ?? "Unable to start checkout.");
        }
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
    <form className="grid gap-4 rounded-lg border border-neutral-200 p-5" onSubmit={handleSubmit} noValidate>
      {title && price && (
        <div className="mb-2 rounded-md border border-neutral-200 bg-neutral-50 p-3">
          <p className="text-sm font-semibold text-neutral-800">{title}</p>
          <div className="mt-1 flex items-baseline gap-2">
            {discountPercent ? (
              <>
                <span className="text-lg font-bold text-brand-green">{formatCurrency(discountedPrice, currency)}</span>
                <span className="text-sm text-neutral-400 line-through">{formatCurrency(price, currency)}</span>
                <span className="rounded bg-amber-100 px-1.5 py-0.5 text-xs font-semibold text-amber-700">-{discountPercent}%</span>
              </>
            ) : (
              <span className="text-lg font-bold">{formatCurrency(price, currency)}</span>
            )}
          </div>
        </div>
      )}

      {discountPercent && (
        <div className="flex items-center gap-2 rounded-md bg-amber-50 p-3 text-sm font-semibold text-amber-800">
          <Tag size={16} aria-hidden />
          {discountPercent}% discount applied
        </div>
      )}

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
          aria-describedby={phoneError ? "cf-phone-error" : "cf-phone-helper"}
        />
        {phoneError && (
          <p id="cf-phone-error" className="text-xs text-red-600" role="alert">
            {phoneError}
          </p>
        )}
        <p id="cf-phone-helper" className="text-xs text-neutral-500">
          Enter a valid mobile money number (e.g. 0772XXXXXX)
        </p>
      </label>

      {duplicateError && (
        <p className="text-sm text-red-600" role="alert">
          {error ?? "You already have a pending order for this product."}
        </p>
      )}
      {!duplicateError && error && <p className="text-sm text-red-600" role="alert">{error}</p>}

      <button
        className="focus-ring inline-flex min-h-11 items-center justify-center rounded-md bg-brand-green px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#006f43] disabled:cursor-not-allowed disabled:opacity-70"
        disabled={submitting}
        type="submit"
      >
        {submitting && <Loader2 className="mr-2 animate-spin" size={16} />}
        {submitting ? "Redirecting to Pesapal..." : "Pay with Pesapal"}
      </button>
    </form>
  );
}
