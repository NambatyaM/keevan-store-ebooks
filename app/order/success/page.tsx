"use client";

import { useEffect, useState, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { CheckCircle, Loader2, Download, XCircle, ShoppingBag } from "lucide-react";
import { SimplePage } from "@/components/simple-page";

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

export default function OrderSuccessPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const orderId = searchParams.get("order_id");
  const [status, setStatus] = useState<OrderStatus | null>(null);
  const [error, setError] = useState<string | null>(null);

  const checkOrder = useCallback(async () => {
    if (!orderId) { setError("No order ID provided."); return; }

    try {
      const res = await fetch(`/api/orders/${orderId}/status`);
      if (!res.ok) { setError("Order not found."); return; }
      const data = await res.json();
      setStatus(data);

      if (data.status === "pending") {
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
          <p className="mt-4 text-sm text-neutral-500">This page will update automatically when confirmed.</p>
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
