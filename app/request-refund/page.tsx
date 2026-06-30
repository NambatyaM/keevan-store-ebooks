"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Search, MessageSquare, CheckCircle } from "lucide-react";
import { site, formatCurrency, type Currency } from "@/lib/constants";

export default function RequestRefundPage() {
  const [step, setStep] = useState<"lookup" | "request" | "done">("lookup");
  const [email, setEmail] = useState("");
  const [orders, setOrders] = useState<Array<{ id: string; amount: number; currency: Currency; created_at: string; products: { title: string } | null }>>([]);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [lookupLoading, setLookupLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);

  const lookupOrders = async () => {
    setLookupLoading(true);
    setError("");
    setMessage("");
    try {
      const res = await fetch(`/api/orders/lookup?email=${encodeURIComponent(email)}`);
      const data = await res.json();
      const paid = data.orders ?? [];
      if (paid.length === 0) {
        setError("No paid orders found for this email address.");
      } else {
        setOrders(paid);
        setStep("request");
      }
    } catch {
      setError("Failed to look up orders. Please try again.");
    } finally {
      setLookupLoading(false);
    }
  };

  const submitRefund = async () => {
    if (!selectedOrderId || reason.length < 10) return;
    setSubmitLoading(true);
    setError("");
    setMessage("");
    try {
      const res = await fetch("/api/refunds/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: selectedOrderId, buyerEmail: email, reason }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error?.message ?? "Failed to submit refund request.");
      } else {
        setMessage(data.message ?? "Refund request submitted successfully.");
        setStep("done");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setSubmitLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-brand-bg">
      <header className="border-b border-border bg-surface-card">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">Customer Support</p>
            <h1 className="text-2xl font-black text-brand-black">Request a Refund</h1>
          </div>
          <Link
            href="/"
            className="flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-sm font-semibold text-muted transition hover:bg-surface"
          >
            <ArrowLeft size={16} />
            Home
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-8">
        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700">{error}</div>
        )}
        {message && (
          <div className="mb-4 rounded-lg border border-green-200 bg-green-50 p-3 text-sm font-semibold text-green-700">{message}</div>
        )}

        {step === "lookup" && (
          <div className="rounded-xl border border-border bg-surface-card p-6 shadow-card">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-mist">
                <Search size={18} className="text-brand-green" />
              </div>
              <div>
                <h2 className="text-lg font-bold">Find Your Orders</h2>
                <p className="text-sm text-muted">
                  Enter the email address you used during checkout.
                </p>
              </div>
            </div>
            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green"
              onKeyDown={(e) => { if (e.key === "Enter") lookupOrders(); }}
            />
            <div className="mt-3 flex items-center gap-3">
              <button
                onClick={lookupOrders}
                disabled={!email || lookupLoading}
                className="rounded-lg bg-brand-green px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-green-deep disabled:opacity-50"
              >
                {lookupLoading ? "Searching..." : "Find My Orders"}
              </button>
            </div>
            <p className="mt-4 text-xs text-muted">
              Need help?{" "}
              <a href={site.supportWhatsApp} className="font-semibold text-brand-green hover:underline">
                Contact us on WhatsApp
              </a>
            </p>
          </div>
        )}

        {step === "request" && (
          <div className="rounded-xl border border-border bg-surface-card p-6 shadow-card">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-mist">
                <MessageSquare size={18} className="text-brand-green" />
              </div>
              <div>
                <h2 className="text-lg font-bold">Select an Order to Refund</h2>
                <p className="text-sm text-muted">
                  Choose which order you&rsquo;d like a refund for and explain why.
                </p>
              </div>
            </div>

            <div className="grid gap-3">
              {orders.map((o) => (
                <label
                  key={o.id}
                  className={`flex cursor-pointer items-center gap-3 rounded-lg border p-4 text-sm transition ${
                    selectedOrderId === o.id
                      ? "border-brand-green bg-brand-mist"
                      : "border-border hover:border-brand-green/30"
                  }`}
                >
                  <input
                    type="radio"
                    name="order"
                    checked={selectedOrderId === o.id}
                    onChange={() => setSelectedOrderId(o.id)}
                    className="h-4 w-4 accent-brand-green"
                  />
                  <div className="flex-1">
                    <span className="font-semibold">{o.products?.title ?? "Product"}</span>
                    <div className="mt-0.5 flex items-center gap-2 text-xs text-muted">
                      <span>{formatCurrency(o.amount, o.currency)}</span>
                      <span>&middot;</span>
                      <span>{new Date(o.created_at).toLocaleDateString("en-UG")}</span>
                    </div>
                  </div>
                </label>
              ))}
            </div>

            {selectedOrderId && (
              <div className="mt-6">
                <label className="block text-sm font-semibold">Reason for refund</label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Describe why you are requesting a refund (minimum 10 characters)"
                  rows={4}
                  className="mt-2 w-full rounded-lg border border-border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green"
                />
                <div className="mt-1 flex items-center justify-between">
                  <p className="text-xs text-muted">{reason.length}/2000 characters</p>
                  {reason.length > 0 && reason.length < 10 && (
                    <p className="text-xs text-error">Minimum 10 characters</p>
                  )}
                </div>
                <button
                  onClick={submitRefund}
                  disabled={reason.length < 10 || submitLoading}
                  className="mt-4 rounded-lg bg-brand-green px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-green-deep disabled:opacity-50"
                >
                  {submitLoading ? "Submitting..." : "Submit Refund Request"}
                </button>
              </div>
            )}

            <button
              onClick={() => setStep("lookup")}
              className="mt-4 block text-sm text-muted transition hover:text-brand-green"
            >
              &larr; Start over
            </button>
          </div>
        )}

        {step === "done" && (
          <div className="rounded-xl border border-green-200 bg-green-50 p-8 text-center shadow-card">
            <CheckCircle size={48} className="mx-auto text-success" strokeWidth={1.5} />
            <h2 className="mt-4 text-xl font-bold text-green-800">Refund Request Submitted</h2>
            <p className="mt-2 text-sm text-green-700">
              Your refund request has been received. A platform administrator will review it and respond
              within a reasonable timeframe.
            </p>
            <p className="mt-3 text-sm font-semibold text-green-700">
              You will be contacted via email at <span className="underline">{email}</span> with the outcome.
            </p>
            <Link
              href="/"
              className="mt-6 inline-block rounded-lg bg-brand-green px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-green-deep"
            >
              Back to Home
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}
