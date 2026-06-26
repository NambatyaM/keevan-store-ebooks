"use client";

import { useState } from "react";
import { SimplePage } from "@/components/simple-page";
import { site } from "@/lib/constants";

export default function RequestRefundPage() {
  const [step, setStep] = useState<"lookup" | "request" | "done">("lookup");
  const [email, setEmail] = useState("");
  const [orders, setOrders] = useState<Array<{ id: string; amount: number; created_at: string; products: { title: string } | null }>>([]);
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
        body: JSON.stringify({ orderId: selectedOrderId, buyerEmail: email, reason })
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
    <SimplePage title="Request a Refund" eyebrow="Customer support">
      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700">{error}</div>
      )}
      {message && (
        <div className="mb-4 rounded-lg border border-green-200 bg-green-50 p-3 text-sm font-semibold text-green-700">{message}</div>
      )}

      {step === "lookup" && (
        <div className="rounded-lg border border-neutral-200 bg-white p-6">
          <h2 className="text-xl font-bold">Find Your Orders</h2>
          <p className="mt-2 text-neutral-600">Enter the email address you used during checkout.</p>
          <input
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-4 w-full max-w-sm rounded border border-neutral-300 px-3 py-2 text-sm"
          />
          <button
            onClick={lookupOrders}
            disabled={!email || lookupLoading}
            className="mt-3 inline-block rounded bg-brand-green px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50"
          >
            {lookupLoading ? "Searching..." : "Find My Orders"}
          </button>
          <p className="mt-4 text-xs text-neutral-500">
            Need help? <a href={site.supportWhatsApp} className="text-brand-green hover:underline">Contact us on WhatsApp</a>
          </p>
        </div>
      )}

      {step === "request" && (
        <div className="rounded-lg border border-neutral-200 bg-white p-6">
          <h2 className="text-xl font-bold">Select an Order to Refund</h2>
          <div className="mt-4 grid gap-3">
            {orders.map((o) => (
              <label
                key={o.id}
                className={`flex cursor-pointer items-center gap-3 rounded border p-3 text-sm ${
                  selectedOrderId === o.id ? "border-brand-green bg-green-50" : "border-neutral-200"
                }`}
              >
                <input
                  type="radio"
                  name="order"
                  checked={selectedOrderId === o.id}
                  onChange={() => setSelectedOrderId(o.id)}
                  className="accent-brand-green"
                />
                <div>
                  <span className="font-semibold">{o.products?.title ?? "Product"}</span>
                  <span className="ml-2 text-neutral-500">
                    {new Intl.NumberFormat("en-UG", { style: "currency", currency: "UGX", maximumFractionDigits: 0 }).format(o.amount)}
                  </span>
                  <span className="ml-2 text-xs text-neutral-400">{new Date(o.created_at).toLocaleDateString("en-UG")}</span>
                </div>
              </label>
            ))}
          </div>

          {selectedOrderId && (
            <div className="mt-4">
              <label className="block text-sm font-semibold">Reason for refund</label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Describe why you are requesting a refund (minimum 10 characters)"
                rows={4}
                className="mt-2 w-full rounded border border-neutral-300 px-3 py-2 text-sm"
              />
              <p className="mt-1 text-xs text-neutral-400">{reason.length}/2000 characters</p>
              <button
                onClick={submitRefund}
                disabled={reason.length < 10 || submitLoading}
                className="mt-3 inline-block rounded bg-brand-green px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50"
              >
                {submitLoading ? "Submitting..." : "Submit Refund Request"}
              </button>
            </div>
          )}
          <button onClick={() => setStep("lookup")} className="mt-4 block text-sm text-neutral-500 hover:underline">
            &larr; Start over
          </button>
        </div>
      )}

      {step === "done" && (
        <div className="rounded-lg border border-green-200 bg-green-50 p-6">
          <h2 className="text-xl font-bold text-green-800">Refund Request Submitted</h2>
          <p className="mt-2 text-green-700">
            Your refund request has been received. A platform administrator will review it and respond within a reasonable timeframe.
          </p>
          <p className="mt-3 text-sm text-green-600">
            You will be contacted via email at <strong>{email}</strong> with the outcome.
          </p>
        </div>
      )}
    </SimplePage>
  );
}
