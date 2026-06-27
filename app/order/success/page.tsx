"use client";

import { Suspense } from "react";
import { useEffect, useState, useCallback, useRef } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle, Loader2, Download, XCircle } from "lucide-react";
import { SimplePage } from "@/components/simple-page";
import { site } from "@/lib/constants";

const POLLING_TIMEOUT_MS = 120000;

type OrderStatus = {
  ok: boolean;
  status: "pending" | "completed" | "failed";
  productTitle?: string;
  creatorName?: string;
  storeSlug?: string;
  productSlug?: string;
  downloadUrl?: string;
  buyerId?: string;
};

function OrderSuccessContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("order_id");
  const [status, setStatus] = useState<OrderStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pollingExpired, setPollingExpired] = useState(false);
  const pollStartRef = useRef<number | null>(null);

  const checkOrder = useCallback(async () => {
    if (!orderId) { setError("No order ID provided."); return; }

    try {
      const res = await fetch(`/api/orders/${orderId}/status`);
      if (!res.ok) { setError("Order not found."); return; }
      const data = await res.json();
      setStatus(data);

      if (data.status === "pending") {
        if (!pollStartRef.current) {
          pollStartRef.current = Date.now();
        }
        if (Date.now() - pollStartRef.current >= POLLING_TIMEOUT_MS) {
          setPollingExpired(true);
          return;
        }
        setTimeout(checkOrder, 3000);
      }
    } catch {
      setError("Unable to check order status.");
    }
  }, [orderId]);

  useEffect(() => {
    if (orderId) checkOrder();
    else setError("No order ID provided.");
  }, [orderId, checkOrder]);

  const handleVerify = useCallback(async () => {
    try {
      await fetch(`/api/payments/verify?order_id=${orderId}`);
    } catch {}
    window.location.reload();
  }, [orderId]);

  if (error) {
    return (
      <SimplePage title="Order Error" eyebrow="Uh oh">
        <div className="rounded-lg border border-neutral-200 p-6 text-center">
          <XCircle className="mx-auto text-red-500" size={48} aria-hidden />
          <h2 className="mt-4 text-xl font-bold">Something went wrong</h2>
          <p className="mt-2 text-neutral-600">{error}</p>
          <Link href="/" className="mt-4 inline-block text-brand-green hover:underline">Return to home</Link>
        </div>
      </SimplePage>
    );
  }

  if (!status || status.status === "pending") {
    return (
      <SimplePage title="Confirming Your Payment" eyebrow="Order processing">
        <div className="rounded-lg border border-neutral-200 p-6 text-center">
          <Loader2 className="mx-auto animate-spin text-brand-green" size={48} aria-hidden />
          <h2 className="mt-4 text-xl font-bold">Confirming your payment...</h2>
          <p className="mt-2 text-neutral-600">
            We are verifying your payment with Pesapal. This usually takes a few seconds.
          </p>
          {!pollingExpired ? (
            <p className="mt-4 text-sm text-neutral-500">This page will update automatically when confirmed.</p>
          ) : (
            <div className="mt-6 space-y-3">
              <p className="text-sm text-amber-600">
                Your payment is taking longer than expected. This can happen with mobile money delays.
              </p>
              <div className="flex flex-wrap justify-center gap-3">
                <button
                  onClick={handleVerify}
                  className="inline-flex items-center gap-2 rounded-md bg-brand-green px-4 py-2 text-sm font-semibold text-white hover:bg-[#006f43]"
                >
                  Check payment status
                </button>
                <a
                  href={site.supportWhatsApp}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-md border border-neutral-300 px-4 py-2 text-sm font-semibold text-neutral-700 hover:bg-neutral-50"
                >
                  Contact support on WhatsApp
                </a>
              </div>
            </div>
          )}
        </div>
      </SimplePage>
    );
  }

  if (status.status === "failed") {
    return (
      <SimplePage title="Payment Failed" eyebrow="Payment unsuccessful">
        <div className="rounded-lg border border-neutral-200 p-6 text-center">
          <XCircle className="mx-auto text-red-500" size={48} aria-hidden />
          <h2 className="mt-4 text-xl font-bold">Payment did not go through</h2>
          <p className="mt-2 text-neutral-600">
            Your payment was not completed. Please try again or contact support.
          </p>
          {status.productSlug && (
            <Link href={`/product/${status.productSlug}`} className="mt-4 inline-block text-brand-green hover:underline">
              Try again
            </Link>
          )}
        </div>
      </SimplePage>
    );
  }

  return (
    <SimplePage title="Purchase Successful!" eyebrow="Thank you for your order">
      <div className="rounded-lg border border-neutral-200 p-6">
        <CheckCircle className="text-brand-green" size={48} aria-hidden />
        <h2 className="mt-4 text-2xl font-bold">{status.productTitle}</h2>
        <p className="mt-2 text-neutral-600">
          by {status.creatorName}
        </p>

        {status.downloadUrl && (
          <div className="mt-6">
            <a
              href={status.downloadUrl}
              className="inline-flex items-center gap-2 rounded-md bg-brand-green px-6 py-3 text-sm font-semibold text-white hover:bg-[#006f43]"
            >
              <Download size={18} aria-hidden />
              Download Now
            </a>
            <p className="mt-2 text-sm text-neutral-500">
              This link expires in 24 hours. Download your file now.
            </p>
          </div>
        )}

        <div className="mt-8 flex flex-wrap gap-3">
          {status.storeSlug && (
            <Link href={`/store/${status.storeSlug}`} className="text-sm text-brand-green hover:underline">
              Visit creator store
            </Link>
          )}
          {!status.buyerId && (
            <Link href="/signup-buyer" className="text-sm text-brand-green hover:underline">
              Create an account to re-access your purchases anytime
            </Link>
          )}
          {status.buyerId && (
            <Link href="/buyer/dashboard" className="text-sm text-brand-green hover:underline">
              View your purchases
            </Link>
          )}
        </div>
      </div>
    </SimplePage>
  );
}

export default function OrderSuccessPage() {
  return (
    <Suspense fallback={
      <SimplePage title="Loading..." eyebrow="Order">
        <div className="flex items-center justify-center py-16">
          <Loader2 className="animate-spin text-brand-green" size={32} />
        </div>
      </SimplePage>
    }>
      <OrderSuccessContent />
    </Suspense>
  );
}
