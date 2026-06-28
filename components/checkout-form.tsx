"use client";

import { useState } from "react";

const UG_PHONE_REGEX = /^(\+256|0)[0-9]{9}$/;

type CheckoutFormProps = {
  productId: string;
};

export function CheckoutForm({ productId }: CheckoutFormProps) {
  const [buyerName, setBuyerName] = useState("");
  const [buyerEmail, setBuyerEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function validatePhone(val: string): string | null {
    if (!val.trim()) return "Phone number is required";
    if (!UG_PHONE_REGEX.test(val.trim())) return "Enter a valid MTN or Airtel number (e.g. 0772XXXXXX)";
    return null;
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const phoneErr = validatePhone(phone);
    if (phoneErr) {
      setPhoneError(phoneErr);
      return;
    }
    setPhoneError(null);
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
          phone
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
    <form className="grid gap-4 rounded-lg border border-neutral-200 p-5" onSubmit={handleSubmit}>
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
          onChange={(event) => {
            setPhone(event.target.value);
            if (phoneError) setPhoneError(null);
          }}
          autoComplete="tel"
          required
          aria-invalid={!!phoneError}
          aria-describedby={phoneError ? "phone-error" : undefined}
        />
        {phoneError && (
          <p id="phone-error" className="text-xs text-red-600" role="alert">
            {phoneError}
          </p>
        )}
      </label>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      <button
        className="focus-ring inline-flex min-h-11 items-center justify-center rounded-md bg-brand-green px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#006f43] disabled:cursor-not-allowed disabled:opacity-70"
        disabled={submitting}
        type="submit"
      >
        {submitting ? "Redirecting to Pesapal..." : "Pay with Pesapal"}
      </button>
    </form>
  );
}
