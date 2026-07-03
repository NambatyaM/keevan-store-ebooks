"use client";

import { Component, Suspense } from "react";
import { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle, Loader2, Download, XCircle } from "lucide-react";
import { SimplePage } from "@/components/simple-page";
import { site } from "@/lib/constants";

class ErrorBoundary extends Component<{ children: React.ReactNode }, { error: Error | null }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error: Error) {
    return { error };
  }
  render() {
    if (this.state.error) {
      const err = this.state.error;
      return (
        <SimplePage title="Order Error" eyebrow="Uh oh">
          <div className="rounded-lg border border-red-200 p-6 text-center">
            <XCircle className="mx-auto text-red-500" size={48} aria-hidden />
            <h2 className="mt-4 text-xl font-bold">Something went wrong</h2>
            <p className="mt-2 text-sm text-red-700 font-mono break-all">
              {err.name}: {err.message}
            </p>
            <p className="mt-4 text-neutral-600">
              Please contact support with the error above. You can also{" "}
              <button onClick={() => { this.setState({ error: null }); window.location.reload(); }} className="text-brand-green underline">
                reload the page
              </button>{" "}
              to try again.
            </p>
          </div>
        </SimplePage>
      );
    }
    return this.props.children;
  }
}

function OrderSuccessContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("order_id");
  const trackingId = searchParams.get("OrderTrackingId") ?? "";
  const [state, setState] = useState<"loading" | "confirming" | "completed" | "failed" | "error">("loading");
  const [productTitle, setProductTitle] = useState("");
  const [creatorName, setCreatorName] = useState("");
  const [storeSlug, setStoreSlug] = useState("");
  const [productSlug, setProductSlug] = useState("");
  const [downloadToken, setDownloadToken] = useState("");
  const [buyerId, setBuyerId] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const confirm = useCallback(async () => {
    if (!orderId) { setState("error"); setErrorMsg("No order ID provided."); return; }
    if (!trackingId) { setState("error"); setErrorMsg("No payment tracking ID found in URL."); return; }

    setState("confirming");

    try {
      const res = await fetch("/api/payments/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, trackingId }),
      });

      const body = await res.json().catch(() => ({}));

      if (res.ok && body.ok) {
        setDownloadToken(body.downloadToken);
        setState("completed");

        fetch(`/api/orders/${orderId}/status`).then(async (r) => {
          if (r.ok) {
            const data = await r.json();
            if (data.productTitle) setProductTitle(data.productTitle);
            if (data.creatorName) setCreatorName(data.creatorName);
            if (data.storeSlug) setStoreSlug(data.storeSlug);
            if (data.productSlug) setProductSlug(data.productSlug);
            if (data.buyerId) setBuyerId(data.buyerId);
          }
        }).catch(() => {});

        return;
      }

      if (res.status === 402) {
        setState("confirming");
        setErrorMsg(body?.error ?? "Payment is still being confirmed. Please wait.");
        return;
      }

      setState("error");
      setErrorMsg(body?.error ?? "An error occurred.");
    } catch {
      setState("error");
      setErrorMsg("Unable to reach payment verification. Please try again.");
    }
  }, [orderId, trackingId]);

  useEffect(() => {
    confirm();
  }, [confirm]);

  if (state === "error") {
    return (
      <SimplePage title="Order Error" eyebrow="Uh oh">
        <div className="rounded-lg border border-neutral-200 p-6 text-center">
          <XCircle className="mx-auto text-red-500" size={48} aria-hidden />
          <h2 className="mt-4 text-xl font-bold">Something went wrong</h2>
          <p className="mt-2 text-neutral-600">{errorMsg}</p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <button
              onClick={confirm}
              className="inline-flex items-center gap-2 rounded-md bg-brand-green px-4 py-2 text-sm font-semibold text-white hover:bg-[#006f43]"
            >
              Try again
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
      </SimplePage>
    );
  }

  if (state === "loading" || state === "confirming") {
    return (
      <SimplePage title="Confirming Your Payment" eyebrow="Order processing">
        <div className="rounded-lg border border-neutral-200 p-6 text-center">
          <Loader2 className="mx-auto animate-spin text-brand-green" size={48} aria-hidden />
          <h2 className="mt-4 text-xl font-bold">Confirming your payment...</h2>
          <p className="mt-2 text-neutral-600">
            We are verifying your payment with Pesapal.
          </p>
          {errorMsg && (
            <p className="mt-4 text-sm text-amber-600">{errorMsg}</p>
          )}
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <button
              onClick={confirm}
              className="inline-flex items-center gap-2 rounded-md bg-brand-green px-4 py-2 text-sm font-semibold text-white hover:bg-[#006f43]"
            >
              Check again
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
      </SimplePage>
    );
  }

  if (state === "failed") {
    return (
      <SimplePage title="Payment Failed" eyebrow="Payment unsuccessful">
        <div className="rounded-lg border border-neutral-200 p-6 text-center">
          <XCircle className="mx-auto text-red-500" size={48} aria-hidden />
          <h2 className="mt-4 text-xl font-bold">Payment did not go through</h2>
          <p className="mt-2 text-neutral-600">
            Your payment was not completed. Please try again or contact support.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            {storeSlug ? (
              <Link
                href={`/store/${storeSlug}`}
                className="inline-flex items-center gap-2 rounded-md bg-brand-green px-4 py-2 text-sm font-semibold text-white hover:bg-[#006f43]"
              >
                Try again
              </Link>
            ) : (
              <Link
                href="/"
                className="inline-flex items-center gap-2 rounded-md bg-brand-green px-4 py-2 text-sm font-semibold text-white hover:bg-[#006f43]"
              >
                Return to home
              </Link>
            )}
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
      </SimplePage>
    );
  }

  return (
    <SimplePage title="Purchase Successful!" eyebrow="Thank you for your order">
      <div className="rounded-lg border border-neutral-200 p-6">
        <CheckCircle className="text-brand-green" size={48} aria-hidden />
        <h2 className="mt-4 text-2xl font-bold">{productTitle || "Your purchase"}</h2>
        {creatorName && <p className="mt-2 text-neutral-600">by {creatorName}</p>}

        {downloadToken && (
          <div className="mt-6">
            <a
              href={`/api/downloads/${downloadToken}`}
              className="inline-flex items-center gap-2 rounded-md bg-brand-green px-6 py-3 text-sm font-semibold text-white hover:bg-[#006f43]"
            >
              <Download size={18} aria-hidden />
              Download Now
            </a>
            <p className="mt-2 text-sm text-neutral-500">
              This link expires in 7 days. Download your file now.
            </p>
          </div>
        )}

        <div className="mt-8 flex flex-wrap gap-3">
          {storeSlug && (
            <Link href={`/store/${storeSlug}`} className="text-sm text-brand-green hover:underline">
              Visit creator store
            </Link>
          )}
          {!buyerId && (
            <Link href="/signup-buyer" className="text-sm text-brand-green hover:underline">
              Create an account to re-access your purchases anytime
            </Link>
          )}
          {buyerId && (
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
    <ErrorBoundary>
      <Suspense fallback={
        <SimplePage title="Loading..." eyebrow="Order">
          <div className="flex items-center justify-center py-16">
            <Loader2 className="animate-spin text-brand-green" size={32} />
          </div>
        </SimplePage>
      }>
        <OrderSuccessContent />
      </Suspense>
    </ErrorBoundary>
  );
}