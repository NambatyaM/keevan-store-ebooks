"use client";

import { useEffect, useState, useMemo } from "react";
import { DashboardShell } from "@/components/dashboard-shell";
import { Badge, getBadgeVariant } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { TableSkeleton } from "@/components/ui/skeleton";
import { Modal } from "@/components/ui/modal";
import { Pagination } from "@/components/ui/pagination";
import { useToast } from "@/components/ui/toast";
import { formatUgx } from "@/lib/constants";
import { Search, ShoppingCart, X, Eye, Smartphone, CreditCard, Landmark } from "lucide-react";

type Order = {
  id: string;
  amount: number;
  platform_fee: number;
  status: string;
  created_at: string;
  buyer_name: string;
  buyer_email: string;
  buyer_phone?: string;
  payment_method?: string;
  pesapal_reference?: string;
  products: { title: string; slug: string } | null;
};

const PAGE_SIZE = 25;

const paymentIcons: Record<string, React.ReactNode> = {
  mtn: <Smartphone size={16} />,
  airtel: <Smartphone size={16} />,
  card: <CreditCard size={16} />,
  bank: <Landmark size={16} />,
};

export default function CreatorOrdersPage() {
  const { toast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const load = () => {
    setLoading(true);
    setError(null);
    fetch("/api/orders?limit=500")
      .then((r) => r.json())
      .then((d) => setOrders(d.orders ?? []))
      .catch((err) => { console.error("Failed to load orders:", err); setError("Failed to load orders."); })
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    let result = [...orders];
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (o) => o.id.toLowerCase().includes(q) || o.buyer_email.toLowerCase().includes(q),
      );
    }
    if (statusFilter !== "all") {
      result = result.filter((o) => o.status === statusFilter);
    }
    return result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [orders, search, statusFilter]);

  const totalEarnings = filtered
    .filter((o) => o.status === "paid" || o.status === "completed")
    .reduce((s, o) => s + (o.amount - o.platform_fee), 0);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const copyId = (id: string) => {
    navigator.clipboard.writeText(id);
    toast("success", "Order ID copied to clipboard");
  };

  const getPaymentIcon = (method?: string) => {
    if (!method) return <Smartphone size={16} />;
    const key = method.toLowerCase();
    return paymentIcons[key] ?? <Smartphone size={16} />;
  };

  const timeAgo = (date: string) => {
    const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
    if (seconds < 60) return "just now";
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 2592000) return `${Math.floor(seconds / 86400)}d ago`;
    return new Date(date).toLocaleDateString("en-UG");
  };

  return (
    <DashboardShell
      title="Orders"
      subtitle={`${filtered.length} total orders · ${formatUgx(totalEarnings)} earned`}
      role="creator"
    >
      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700">{error}</div>
      )}

      {/* Filter bar */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            type="text"
            placeholder="Search by order ID or buyer email..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full rounded-lg border border-border py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="rounded-lg border border-border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green"
        >
          <option value="all">All Statuses</option>
          <option value="paid">Completed</option>
          <option value="pending">Pending</option>
          <option value="refunded">Refunded</option>
        </select>
      </div>

      {/* Active filters */}
      {(search || statusFilter !== "all") && (
        <div className="mb-4 flex flex-wrap items-center gap-2">
          {search && (
            <span className="inline-flex items-center gap-1 rounded-full border border-border bg-surface px-3 py-1 text-xs font-medium text-muted">
              Search: &ldquo;{search}&rdquo; <button onClick={() => setSearch("")} className="hover:text-brand-black">×</button>
            </span>
          )}
          {statusFilter !== "all" && (
            <span className="inline-flex items-center gap-1 rounded-full border border-border bg-surface px-3 py-1 text-xs font-medium text-muted">
              Status: {statusFilter} <button onClick={() => setStatusFilter("all")} className="hover:text-brand-black">×</button>
            </span>
          )}
          <button onClick={() => { setSearch(""); setStatusFilter("all"); }} className="text-xs font-semibold text-brand-green hover:underline">Clear all filters</button>
        </div>
      )}

      {/* Loading */}
      {loading && <TableSkeleton rows={8} />}

      {/* Empty */}
      {!loading && filtered.length === 0 && (
        <EmptyState
          icon={<ShoppingCart size={48} strokeWidth={1.2} />}
          title={orders.length === 0 ? "No orders yet" : "No orders match your filters"}
          description={
            orders.length === 0
              ? "Share your store link to start receiving orders."
              : "Try adjusting your filters."
          }
        />
      )}

      {/* Orders table */}
      {!loading && filtered.length > 0 && (
        <div className="overflow-hidden rounded-xl border border-border bg-surface-card shadow-card">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-surface">
                  <th className="px-4 py-3 text-left font-semibold text-muted">Order ID</th>
                  <th className="px-4 py-3 text-left font-semibold text-muted">Product</th>
                  <th className="px-4 py-3 text-left font-semibold text-muted">Buyer</th>
                  <th className="px-4 py-3 text-right font-semibold text-muted">Amount</th>
                  <th className="px-4 py-3 text-right font-semibold text-muted">Your Earnings</th>
                  <th className="px-4 py-3 text-center font-semibold text-muted">Payment</th>
                  <th className="px-4 py-3 text-right font-semibold text-muted">Date</th>
                  <th className="px-4 py-3 text-right font-semibold text-muted">Status</th>
                  <th className="px-4 py-3 text-right font-semibold text-muted"></th>
                </tr>
              </thead>
              <tbody>
                {paginated.map((o) => (
                  <tr key={o.id} className="border-b border-border transition hover:bg-surface">
                    <td className="px-4 py-3">
                      <button
                        onClick={() => copyId(o.id)}
                        className="font-mono text-xs text-muted hover:text-brand-green"
                        title="Click to copy"
                      >
                        #{o.id.slice(0, 8)}
                      </button>
                    </td>
                    <td className="px-4 py-3 font-medium text-brand-black">
                      {o.products?.title ?? "—"}
                    </td>
                    <td className="px-4 py-3 text-muted">
                      {o.buyer_email
                        ? `${o.buyer_email.slice(0, 3)}***@${o.buyer_email.split("@")[1]}`
                        : "—"}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold">
                      {formatUgx(o.amount)}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-success">
                      {formatUgx(o.amount - o.platform_fee)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-center" title={o.payment_method ?? "N/A"}>
                        {getPaymentIcon(o.payment_method)}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right text-muted" title={new Date(o.created_at).toLocaleString("en-UG")}>
                      {timeAgo(o.created_at)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Badge variant={getBadgeVariant(o.status)}>{o.status}</Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => setSelectedOrder(o)}
                        className="rounded-md p-1.5 text-muted transition hover:bg-brand-mist hover:text-brand-green"
                        aria-label="View order details"
                      >
                        <Eye size={16} />
                      </button>
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
          <Pagination
            page={page}
            totalPages={totalPages}
            totalItems={filtered.length}
            pageSize={PAGE_SIZE}
            onPageChange={setPage}
          />
        </div>
      )}

      {/* Order detail slide-over */}
      <Modal open={!!selectedOrder} onClose={() => setSelectedOrder(null)} title="Order Details" size="lg">
        {selectedOrder && (
          <div className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted">Order ID</p>
                <p className="mt-1 font-mono text-sm">{selectedOrder.id}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted">Status</p>
                <div className="mt-1">
                  <Badge variant={getBadgeVariant(selectedOrder.status)}>{selectedOrder.status}</Badge>
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted">Product</p>
                <p className="mt-1 text-sm font-semibold">{selectedOrder.products?.title ?? "—"}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted">Date & Time</p>
                <p className="mt-1 text-sm">{new Date(selectedOrder.created_at).toLocaleString("en-UG")}</p>
              </div>
            </div>

            <div className="border-t border-border pt-4">
              <h4 className="mb-3 text-sm font-bold uppercase tracking-wide text-muted">Buyer Information</h4>
              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <p className="text-xs text-muted">Name</p>
                  <p className="mt-0.5 text-sm font-medium">{selectedOrder.buyer_name || "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted">Email</p>
                  <p className="mt-0.5 text-sm">{selectedOrder.buyer_email || "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted">Phone</p>
                  <p className="mt-0.5 text-sm">{selectedOrder.buyer_phone || "—"}</p>
                </div>
              </div>
            </div>

            <div className="border-t border-border pt-4">
              <h4 className="mb-3 text-sm font-bold uppercase tracking-wide text-muted">Payment Details</h4>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-xs text-muted">Payment Method</p>
                  <p className="mt-0.5 text-sm font-medium capitalize">{selectedOrder.payment_method || "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted">Pesapal Reference</p>
                  <p className="mt-0.5 font-mono text-xs">{selectedOrder.pesapal_reference || "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted">Gross Amount</p>
                  <p className="mt-0.5 text-sm font-semibold">{formatUgx(selectedOrder.amount)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted">Platform Fee (10%)</p>
                  <p className="mt-0.5 text-sm text-muted">{formatUgx(selectedOrder.platform_fee)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted">Your Earnings (90%)</p>
                  <p className="mt-0.5 text-lg font-bold text-success">
                    {formatUgx(selectedOrder.amount - selectedOrder.platform_fee)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </DashboardShell>
  );
}
