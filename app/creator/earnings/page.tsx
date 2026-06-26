"use client";

import { useEffect, useState } from "react";
import { DashboardShell } from "@/components/dashboard-shell";
import { StatCard } from "@/components/stat-card";
import { creatorNav } from "@/app/creator/nav";
import { formatUgx, site } from "@/lib/constants";

type Order = {
  id: string;
  amount: number;
  platform_fee: number;
  status: string;
  created_at: string;
  products: { title: string; slug: string } | null;
};

const commissionPercent = Math.round(site.commissionRate * 100);

export default function CreatorEarningsPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [balance, setBalance] = useState(0);
  const [totalEarnings, setTotalEarnings] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/orders?limit=200").then((r) => {
        if (!r.ok) throw new Error("Failed to load orders");
        return r.json();
      }).then((d) => {
        const allOrders = d.orders ?? [];
        setOrders(allOrders);
        const paid = allOrders.filter((o: Order) => o.status === "paid");
        setTotalEarnings(paid.reduce((s: number, o: Order) => s + (o.amount - o.platform_fee), 0));
      }).catch((err: Error) => {
        setError(err.message);
      }),
      fetch("/api/auth/me").then((r) => {
        if (!r.ok) throw new Error("Failed to load profile");
        return r.json();
      }).then((d) => {
        if (d.profile) setBalance(Number(d.profile.available_balance) || 0);
      }).catch((err: Error) => {
        setError(err.message);
      })
    ]).finally(() => setLoading(false));
  }, []);

  const totalPlatformFees = orders.filter((o) => o.status === "paid").reduce((s, o) => s + o.platform_fee, 0);
  const totalGross = orders.filter((o) => o.status === "paid").reduce((s, o) => s + o.amount, 0);

  return (
    <DashboardShell title="Earnings" subtitle="See platform commission, creator earnings, available balance, and withdrawal readiness." nav={creatorNav}>
      <div className="grid gap-4 md:grid-cols-4">
        <StatCard label="Total Gross Sales" value={formatUgx(totalGross)} />
        <StatCard label={`Platform Commission (${commissionPercent}%)`} value={formatUgx(totalPlatformFees)} />
        <StatCard label="Your Total Earnings" value={formatUgx(totalEarnings)} />
        <StatCard label="Available Balance" value={formatUgx(balance)} note={`Min. withdrawal: ${formatUgx(site.minimumWithdrawal)}`} />
      </div>

      {error && (
        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="mt-6">
        <h2 className="mb-3 text-xl font-bold">Order History</h2>
        {loading ? (
          <div className="rounded-lg border border-dashed border-neutral-300 bg-white p-8 text-center text-neutral-600">Loading...</div>
        ) : orders.length === 0 ? (
          <div className="rounded-lg border border-dashed border-neutral-300 bg-white p-8 text-center text-neutral-600">No orders yet.</div>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-neutral-200 bg-white">
            <table className="w-full text-sm">
              <thead className="border-b border-neutral-200 bg-neutral-50 text-left">
                <tr>
                  <th className="p-3 font-semibold">Product</th>
                  <th className="p-3 font-semibold">Gross</th>
                  <th className="p-3 font-semibold">Fee</th>
                  <th className="p-3 font-semibold">Your Cut</th>
                  <th className="p-3 font-semibold">Status</th>
                  <th className="p-3 font-semibold">Date</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o.id} className="border-b border-neutral-100">
                    <td className="p-3 font-medium">{o.products?.title ?? "—"}</td>
                    <td className="p-3">{formatUgx(o.amount)}</td>
                    <td className="p-3">{formatUgx(o.platform_fee)}</td>
                    <td className="p-3">{formatUgx(o.amount - o.platform_fee)}</td>
                    <td className="p-3">
                      <span className={`inline-block rounded px-2 py-0.5 text-xs font-semibold ${
                        o.status === "paid" ? "bg-green-100 text-green-800" :
                        o.status === "pending" ? "bg-yellow-100 text-yellow-800" :
                        o.status === "failed" ? "bg-red-100 text-red-800" :
                        "bg-neutral-100 text-neutral-800"
                      }`}>{o.status}</span>
                    </td>
                    <td className="p-3 text-neutral-500">{new Date(o.created_at).toLocaleDateString("en-UG")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
