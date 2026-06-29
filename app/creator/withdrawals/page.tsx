"use client";

import { useEffect, useState } from "react";
import { DashboardShell } from "@/components/dashboard-shell";
import { creatorNav } from "@/app/creator/nav";
import { formatUgx, site } from "@/lib/constants";

type Withdrawal = {
  id: string;
  amount: number;
  status: string;
  payout_method: unknown;
  payout_details: unknown;
  requested_at: string;
  processed_at: string | null;
};

export default function CreatorWithdrawalsPage() {
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [balance, setBalance] = useState(0);
  const [amount, setAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("mobile_money");
  const [paymentDetails, setPaymentDetails] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    Promise.all([
      fetch("/api/withdrawals").then((r) => r.json()).then((d) => setWithdrawals(d.withdrawals ?? [])).catch((err) => { console.error("Failed to load withdrawals:", err); setError("Failed to load withdrawal history."); }),
      fetch("/api/auth/me").then((r) => r.json()).then((d) => {
        if (d.profile) setBalance(Number(d.profile.available_balance) || 0);
      }).catch((err) => { console.error("Failed to load profile:", err); setError("Failed to load profile."); })
    ]).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");
    const numAmount = Number(amount);
    if (numAmount < site.minimumWithdrawal) {
      setMessage(`Minimum withdrawal is ${formatUgx(site.minimumWithdrawal)}.`);
      return;
    }
    if (numAmount > balance) {
      setMessage("Insufficient balance.");
      return;
    }
    if (!paymentDetails.trim()) {
      setMessage("Please provide payment details (phone number or account).");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/withdrawals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: numAmount, payoutMethod: paymentMethod, payoutDetails: { value: paymentDetails.trim() } })
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage(data.error?.message ?? "Request failed.");
      } else {
        setMessage("Withdrawal requested successfully!");
        setAmount("");
        setPaymentDetails("");
        load();
      }
    } catch {
      setMessage("Network error.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <DashboardShell title="Withdrawals" subtitle="Request payouts once your available balance reaches the platform minimum." role="creator">
      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700">{error}</div>
      )}
      <div className="grid gap-6 lg:grid-cols-[1fr_1.5fr]">
        <div className="rounded-lg border border-neutral-200 bg-white p-5">
          <h2 className="text-xl font-bold">Request Withdrawal</h2>
          <p className="mt-2 text-sm text-neutral-600">Available balance: {formatUgx(balance)}</p>

          <form onSubmit={handleRequest} className="mt-4 space-y-4">
            <div>
              <label className="block text-sm font-semibold text-neutral-700">Amount (UGX)</label>
              <input
                type="number"
                min={site.minimumWithdrawal}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="focus-ring mt-1 w-full rounded-md border border-neutral-300 px-4 py-3"
                placeholder={`Min: ${site.minimumWithdrawal}`}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-neutral-700">Payment Method</label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="focus-ring mt-1 w-full rounded-md border border-neutral-300 px-4 py-3"
              >
                <option value="mobile_money">Mobile Money</option>
                <option value="bank">Bank Transfer</option>
                <option value="airtel_money">Airtel Money</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-neutral-700">Payment Details</label>
              <input
                type="text"
                value={paymentDetails}
                onChange={(e) => setPaymentDetails(e.target.value)}
                className="focus-ring mt-1 w-full rounded-md border border-neutral-300 px-4 py-3"
                placeholder="Phone number or account details"
                required
              />
            </div>

            {message && (
              <p className={`text-sm font-semibold ${message.includes("successfully") ? "text-green-700" : "text-red-700"}`}>{message}</p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-md bg-brand-green px-4 py-3 font-bold text-white hover:bg-brand-green/90 disabled:opacity-50"
            >
              {submitting ? "Submitting..." : "Request Withdrawal"}
            </button>
          </form>
        </div>

        <div>
          <h2 className="mb-3 text-xl font-bold">History</h2>
          {loading ? (
            <div className="rounded-lg border border-dashed border-neutral-300 bg-white p-8 text-center text-neutral-600">Loading...</div>
          ) : withdrawals.length === 0 ? (
            <div className="rounded-lg border border-dashed border-neutral-300 bg-white p-8 text-center text-neutral-600">No withdrawal requests yet.</div>
          ) : (
            <div className="space-y-3">
              {withdrawals.map((w) => (
                <div key={w.id} className="rounded-lg border border-neutral-200 bg-white p-4">
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-bold">{formatUgx(w.amount)}</span>
                    <span className={`inline-block rounded px-2 py-0.5 text-xs font-semibold ${
                      w.status === "paid" ? "bg-green-100 text-green-800" :
                      w.status === "approved" ? "bg-blue-100 text-blue-800" :
                      w.status === "rejected" ? "bg-red-100 text-red-800" :
                      "bg-yellow-100 text-yellow-800"
                    }`}>{w.status}</span>
                  </div>
                  <p className="mt-1 text-xs text-neutral-500">
                    {String(w.payout_method)} — {typeof w.payout_details === "object" ? String((w.payout_details as Record<string,unknown>).value ?? JSON.stringify(w.payout_details)) : String(w.payout_details)}
                  </p>
                  <p className="text-xs text-neutral-500">
                    Requested: {new Date(w.requested_at).toLocaleDateString("en-UG")}
                    {w.processed_at ? ` | Processed: ${new Date(w.processed_at).toLocaleDateString("en-UG")}` : ""}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardShell>
  );
}
