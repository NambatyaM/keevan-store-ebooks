"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { DashboardShell } from "@/components/dashboard-shell";
import { StatCard } from "@/components/stat-card";
import { adminNav } from "@/app/admin/nav";
import { formatUgx } from "@/lib/constants";

type Order = {
  id: string;
  amount: number;
  platform_fee: number;
  status: string;
  created_at: string;
  buyer_email: string;
  buyer_name: string;
  products: { title: string; slug: string } | null;
  creators: { display_name: string } | null;
};

export default function AdminSalesPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateRange, setDateRange] = useState("all");

  useEffect(() => {
    fetch("/api/admin/orders?limit=500")
      .then((r) => r.json())
      .then((d) => setOrders(d.orders ?? []))
      .catch((err) => { console.error("Failed to load orders:", err); setError("Failed to load orders."); })
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    let result = orders;
    if (statusFilter !== "all") {
      result = result.filter((o) => o.status === statusFilter);
    }
    const now = Date.now();
    if (dateRange === "7d") {
      const cutoff = new Date(now - 7 * 24 * 60 * 60 * 1000).toISOString();
      result = result.filter((o) => o.created_at >= cutoff);
    } else if (dateRange === "30d") {
      const cutoff = new Date(now - 30 * 24 * 60 * 60 * 1000).toISOString();
      result = result.filter((o) => o.created_at >= cutoff);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (o) =>
          o.id.toLowerCase().includes(q) ||
          (o.products?.title ?? "").toLowerCase().includes(q) ||
          (o.creators?.display_name ?? "").toLowerCase().includes(q) ||
          o.buyer_email.toLowerCase().includes(q)
      );
    }
    return result;
  }, [orders, search, statusFilter, dateRange]);

  const paid = filtered.filter((o) => o.status === "paid");
  const pending = filtered.filter((o) => o.status === "pending");
  const failed = filtered.filter((o) => o.status === "failed");
  const totalRevenue = paid.reduce((s, o) => s + o.amount, 0);
  const platformEarnings = paid.reduce((s, o) => s + o.platform_fee, 0);

  const statusBadge = (status: string) => {
    const colors: Record<string, string> = {
      paid: "bg-green-100 text-green-800",
      pending: "bg-yellow-100 text-yellow-800",
      failed: "bg-red-100 text-red-800",
    };
    return (
      <span className={`inline-block rounded px-2 py-0.5 text-xs font-semibold ${colors[status] ?? "bg-neutral-100 text-neutral-800"}`}>
        {status}
      </span>
    );
  };

  return (
    <DashboardShell title="Sales" subtitle="Review verified transactions, gross revenue, platform earnings, and creator earnings." nav={adminNav}>
      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700">{error}</div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total Orders" value={String(filtered.length)} />
        <StatCard label="Paid" value={String(paid.length)} />
        <StatCard label="Pending" value={String(pending.length)} />
        <StatCard label="Failed" value={String(failed.length)} />
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <input
          type="text"
          placeholder="Search by order ID, product, creator, buyer email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-lg border border-neutral-300 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green sm:w-80"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green"
        >
          <option value="all">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="paid">Paid</option>
          <option value="failed">Failed</option>
        </select>
        <select
          value={dateRange}
          onChange={(e) => setDateRange(e.target.value)}
          className="rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green"
        >
          <option value="all">All Time</option>
          <option value="7d">Last 7 Days</option>
          <option value="30d">Last 30 Days</option>
        </select>
      </div>

      <div className="mt-6">
        <h2 className="mb-3 text-xl font-bold">Orders</h2>
        {loading ? (
          <div className="rounded-lg border border-dashed border-neutral-300 bg-white p-8 text-center text-neutral-600">Loading...</div>
        ) : filtered.length === 0 ? (
          <div className="rounded-lg border border-dashed border-neutral-300 bg-white p-8 text-center text-neutral-600">No orders match your filters.</div>
        ) : (
          <>
            <div className="hidden overflow-x-auto rounded-lg border border-neutral-200 bg-white sm:block">
              <table className="w-full text-sm">
                <thead className="border-b border-neutral-200 bg-neutral-50 text-left">
                  <tr>
                    <th className="p-3 font-semibold">Product</th>
                    <th className="p-3 font-semibold">Creator</th>
                    <th className="p-3 font-semibold">Buyer</th>
                    <th className="p-3 font-semibold">Amount</th>
                    <th className="p-3 font-semibold">Fee</th>
                    <th className="p-3 font-semibold">Status</th>
                    <th className="p-3 font-semibold">Date</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((o) => (
                    <tr key={o.id} className="cursor-pointer border-b border-neutral-100 transition hover:bg-neutral-50" onClick={() => window.location.href = `/admin/orders/${o.id}`}>
                      <td className="p-3 font-medium">{o.products?.title ?? "—"}</td>
                      <td className="p-3 text-neutral-600">{o.creators?.display_name ?? "—"}</td>
                      <td className="p-3 text-neutral-600">
                        <div>{o.buyer_name}</div>
                        <div className="text-xs text-neutral-400">{o.buyer_email}</div>
                      </td>
                      <td className="p-3">{formatUgx(o.amount)}</td>
                      <td className="p-3">{formatUgx(o.platform_fee)}</td>
                      <td className="p-3">{statusBadge(o.status)}</td>
                      <td className="p-3 text-neutral-500">{new Date(o.created_at).toLocaleDateString("en-UG")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="block space-y-3 sm:hidden">
              {filtered.map((o) => (
                <Link
                  key={o.id}
                  href={`/admin/orders/${o.id}`}
                  className="block rounded-lg border border-neutral-200 bg-white p-4 transition hover:border-brand-green"
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-semibold">{o.products?.title ?? "—"}</p>
                    {statusBadge(o.status)}
                  </div>
                  <div className="mt-2 text-sm text-neutral-600">
                    <p>Creator: {o.creators?.display_name ?? "—"}</p>
                    <p>Buyer: {o.buyer_name} ({o.buyer_email})</p>
                    <p>Amount: {formatUgx(o.amount)}</p>
                    <p className="text-xs text-neutral-400">{new Date(o.created_at).toLocaleDateString("en-UG")}</p>
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}
      </div>
    </DashboardShell>
  );
}
