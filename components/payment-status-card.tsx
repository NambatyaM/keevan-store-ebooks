"use client";

import { useMemo, useState } from "react";

type PaymentStatusCardProps = {
  slug: string;
  merchantReference?: string;
  trackingId?: string;
  initialDownloadToken?: string | null;
  expired?: boolean;
};

export function PaymentStatusCard({
  slug,
  merchantReference,
  trackingId,
  initialDownloadToken = null,
  expired = false
}: PaymentStatusCardProps) {
  const [downloadToken, setDownloadToken] = useState<string | null>(initialDownloadToken);
  const [status, setStatus] = useState<"idle" | "verifying" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  const hasVerificationParams = useMemo(() => Boolean(merchantReference && trackingId), [merchantReference, trackingId]);

  async function verifyPayment() {
    if (!merchantReference || !trackingId) {
      setError("The payment callback is missing a merchant reference or tracking id.");
      setStatus("error");
      return;
    }

    setStatus("verifying");
    setError(null);

    try {
      const response = await fetch("/api/payments/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ merchantReference, trackingId })
      });

      const payload = await response.json();

      if (!response.ok) {
        setError(payload?.error?.message ?? "Unable to verify the payment.");
        setStatus("error");
        return;
      }

      setDownloadToken(payload.downloadToken ?? null);
      setStatus("idle");
    } catch {
      setError("Unable to verify the payment right now. Please try again.");
      setStatus("error");
    }
  }

  if (downloadToken) {
    return (
      <div className="mt-6">
        <a
          className="focus-ring inline-flex min-h-11 items-center justify-center rounded-md bg-brand-green px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#006f43]"
          href={`/api/downloads/${downloadToken}`}
        >
          Download E-book
        </a>
      </div>
    );
  }

  return (
    <div className="mt-6 grid gap-3">
      {expired ? <p className="text-sm text-red-600">This download link has expired. Please verify the payment again.</p> : null}
      {hasVerificationParams ? (
        <button
          className="focus-ring inline-flex min-h-11 items-center justify-center rounded-md bg-brand-green px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#006f43] disabled:cursor-not-allowed disabled:opacity-70"
          disabled={status === "verifying"}
          onClick={verifyPayment}
          type="button"
        >
          {status === "verifying" ? "Verifying payment..." : "Verify Payment"}
        </button>
      ) : (
        <a
          className="focus-ring inline-flex min-h-11 items-center justify-center rounded-md border border-brand-green bg-white px-5 py-3 text-sm font-semibold text-brand-green transition hover:bg-brand-mist"
          href={`/checkout/${slug}`}
        >
          Return to Checkout
        </a>
      )}
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
    </div>
  );
}
