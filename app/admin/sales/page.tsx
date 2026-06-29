"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { DashboardShell } from "@/components/dashboard-shell";
import { StatCard } from "@/components/ui/stat-card";
import { Badge, getBadgeVariant } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { TableSkeleton } from "@/components/ui/skeleton";
import { Pagination } from "@/components/ui/pagination";
import { formatUgx } from "@/lib/constants";
import { Search, TrendingUp, DollarSign, ArrowRight, ShoppingCart } from "lucide-react";

type Order = {
  id: string;
  amount: number;
  platform_fee: number;
  creator_earnings: number;
  status: string;
  created_at: string;
  paid_at: string | null;
  buyer_email: string;
  buyer_name: string;
  products: { title: string; slug: string } | null;
  creators: { display_name: string } | null;
};

const PAGE_SIZE = 25;

export default function AdminSalesPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateRange, setDateRange] = useState("all");

  useEffect(() => {
    setLoading(true);
    setError(null);
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
  const creatorEarnings = paid.reduce((s, o) => s + (o.creator_earnings ?? 0), 0);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <DashboardShell
      title="Sales"
      subtitle="Review verified transactions, gross revenue, and platform earnings"
      role="admin"
    >
      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700">{error}</div>
      )}

      {/* Summary cards */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total Orders"
          value={String(filtered.length)}
          sublabel={formatUgx(totalRevenue)}
          icon={<ShoppingCart size={20} />}
        />
        <StatCard
          label="Platform Revenue"
          value={formatUgx(platformEarnings)}
          sublabel={`${((platformEarnings / (totalRevenue || 1)) * 100).toFixed(1)}% effective fee`}
          icon={<DollarSign size={20} />}
          green
        />
        <StatCard
          label="Creator Earnings"
          value={formatUgx(creatorEarnings)}
          sublabel={formatUgx(pending.reduce((s, o) => s + (o.creator_earnings ?? 0), 0)) + " pending"}
          icon={<TrendingUp size={20} />}
        />
        <StatCard
          label="Pending / Failed"
          value={`${pending.length} / ${failed.length}`}
          sublabel={formatUgx(pending.reduce((s, o) => s + o.amount, 0))}
          icon={<ShoppingCart size={20} />}
        />
      </div>

      {/* Search + filters */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search by order ID, product, creator, buyer..."
            className="w-full rounded-lg border border-border py-2.5 pl-9 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="rounded-lg border border-border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green"
        >
          <option value="all">All Statuses</option>
          <option value="paid">Paid</option>
          <option value="pending">Pending</option>
          <option value="failed">Failed</option>
        </select>
        <select
          value={dateRange}
          onChange={(e) => { setDateRange(e.target.value); setPage(1); }}
          className="rounded-lg border border-border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green"
        >
          <option value="all">All Time</option>
          <option value="7d">Last 7 Days</option>
          <option value="30d">Last 30 Days</option>
        </select>
      </div>

      {/* Loading */}
      {loading && <TableSkeleton rows={8} />}

      {/* Empty */}
      {!loading && filtered.length === 0 && (
        <EmptyState
          icon={<ShoppingCart size={48} strokeWidth={1.2} />}
          title="No orders match your filters"
        />
      )}

      {/* Orders table */}
      {!loading && filtered.length > 0 && (
        <div className="overflow-hidden rounded-xl border border-border bg-surface-card shadow-card">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-surface">
                  <th className="px-4 py-3 text-left font-semibold text-muted">Product</th>
                  <th className="px-4 py-3 text-left font-semibold text-muted">Creator</th>
                  <th className="px-4 py-3 text-left font-semibold text-muted">Buyer</th>
                  <th className="px-4 py-3 text-right font-semibold text-muted">Amount</th>
                  <th className="px-4 py-3 text-right font-semibold text-muted">Fee</th>
                  <th className="px-4 py-3 text-center font-semibold text-muted">Status</th>
                  <th className="px-4 py-3 text-right font-semibold text-muted">Date</th>
                  <th className="px-4 py-3 text-right font-semibold text-muted" />
                </tr>
              </thead>
              <tbody>
                {paginated.map((o) => (
                  <tr key={o.id} className="border-b border-border transition hover:bg-surface">
                    <td className="px-4 py-3 font-medium">{o.products?.title ?? "—"}</td>
                    <td className="px-4 py-3 text-muted">{o.creators?.display_name ?? "—"}</td>
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-semibold text-brand-black">{o.buyer_name}</p>
                        <p className="text-xs text-muted">{o.buyer_email}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right font-bold">{formatUgx(o.amount)}</td>
                    <td className="px-4 py-3 text-right text-muted">{formatUgx(o.platform_fee)}</td>
                    <td className="px-4 py-3 text-center">
                      <Badge variant={getBadgeVariant(o.status)}>{o.status}</Badge>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right text-muted">
                      {new Date(o.created_at).toLocaleDateString("en-UG")}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/admin/orders/${o.id}`}
                        className="inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-semibold text-brand-green hover:bg-brand-mist"
                      >
                        Details <ArrowRight size={12} />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination */}
      {!loading && filtered.length > PAGE_SIZE && (
        <div className="mt-6">
          <Pagination page={page} totalPages={totalPages} totalItems={filtered.length} pageSize={PAGE_SIZE} onPageChange={setPage} />
        </div>
      )}
    </DashboardShell>
  );
}
