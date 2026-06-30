"use client";

import { useEffect, useState, useMemo } from "react";
import { DashboardShell } from "@/components/dashboard-shell";
import { StatCard } from "@/components/ui/stat-card";
import { Badge, getBadgeVariant } from "@/components/ui/badge";
import { ChartSkeleton, TableSkeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
import { formatCurrency } from "@/lib/constants";
import {
  Users,
  Package,
  ShoppingCart,
  DollarSign,
  Wallet,
  AlertTriangle,
  Clock,
  ShieldAlert,
  UserPlus,
  RefreshCw,
  TrendingUp,
  Smartphone,
  CreditCard,
  Landmark,
} from "lucide-react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import Link from "next/link";

type Order = {
  id: string;
  amount: number;
  platform_fee: number;
  status: string;
  created_at: string;
  buyer_email: string;
  buyer_name: string;
  payment_method?: string;
  currency?: string;
  products: { title: string; slug: string } | null;
  creators: { display_name: string } | null;
};

type Creator = {
  id: string;
  display_name: string;
  email: string;
  store_name: string;
  store_slug: string;
  created_at: string;
  product_count?: number;
};

type ActivityItem = {
  id: string;
  type: "creator" | "order" | "withdrawal" | "refund" | "product";
  description: string;
  timestamp: string;
  link?: string;
};

const COLORS = ["#00854A", "#F5A623", "#10B981", "#3B82F6", "#8B5CF6"];

const paymentMethodIcons: Record<string, React.ReactNode> = {
  mtn: <Smartphone size={14} />,
  airtel: <Smartphone size={14} />,
  card: <CreditCard size={14} />,
  bank: <Landmark size={14} />,
};

export default function AdminDashboardPage() {
  const { toast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [creators, setCreators] = useState<Creator[]>([]);
  const [stats, setStats] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState("30d");

  useEffect(() => {
    setLoading(true);
    setError(null);
    Promise.all([
      fetch("/api/admin/orders?limit=500").then((r) => r.json()).then((d) => setOrders(d.orders ?? [])),
      fetch("/api/admin/creators").then((r) => r.json()).then((d) => setCreators(d.creators ?? [])),
      fetch("/api/admin/stats").then((r) => r.json()).then((d) => setStats(d.stats ?? {})),
    ])
      .catch((err) => { console.error("Admin dashboard error:", err); setError("Failed to load dashboard data."); })
      .finally(() => setLoading(false));
  }, []);

  const paidOrders = orders.filter((o) => o.status === "paid" || o.status === "completed");
  const totalRevenue = paidOrders.reduce((s, o) => s + o.amount, 0);
  const platformRevenue = paidOrders.reduce((s, o) => s + o.platform_fee, 0);
  const pendingWithdrawals = stats.pendingWithdrawals ?? 0;
  const pendingRefunds = stats.pendingRefunds ?? 0;

  // Revenue grouped by currency
  const revenueByCurrency = useMemo(() => {
    const map = new Map<string, { gross: number; fee: number; count: number }>();
    paidOrders.forEach((o) => {
      const c = o.currency ?? "UGX";
      const existing = map.get(c) ?? { gross: 0, fee: 0, count: 0 };
      existing.gross += o.amount;
      existing.fee += o.platform_fee;
      existing.count += 1;
      map.set(c, existing);
    });
    return Array.from(map.entries()).map(([currency, data]) => ({ currency, ...data }));
  }, [paidOrders]);

  // Revenue over time
  const revenueOverTime = useMemo(() => {
    const map = new Map<string, { gross: number; fee: number }>();
    paidOrders.forEach((o) => {
      const day = new Date(o.created_at).toLocaleDateString("en-UG", { month: "short", day: "numeric" });
      const existing = map.get(day) ?? { gross: 0, fee: 0 };
      existing.gross += o.amount;
      existing.fee += o.platform_fee;
      map.set(day, existing);
    });
    return Array.from(map.entries()).map(([date, data]) => ({ date, ...data }));
  }, [paidOrders]);

  // New registrations over time
  const registrationsOverTime = useMemo(() => {
    const map = new Map<string, number>();
    creators.forEach((c) => {
      const day = new Date(c.created_at).toLocaleDateString("en-UG", { month: "short", day: "numeric" });
      map.set(day, (map.get(day) ?? 0) + 1);
    });
    return Array.from(map.entries()).map(([date, count]) => ({ date, count }));
  }, [creators]);

  // Orders by payment method
  const paymentMethods = useMemo(() => {
    const map = new Map<string, number>();
    paidOrders.forEach((o) => {
      const method = o.payment_method ?? "unknown";
      map.set(method, (map.get(method) ?? 0) + 1);
    });
    return Array.from(map.entries()).map(([name, value]) => ({ name, value }));
  }, [paidOrders]);

  // Recent activity feed
  const recentActivity: ActivityItem[] = useMemo(() => {
    const items: ActivityItem[] = [];

    creators.slice(0, 3).forEach((c) => {
      items.push({
        id: `c-${c.id}`,
        type: "creator",
        description: `New creator registered: ${c.display_name || c.store_name}`,
        timestamp: c.created_at,
        link: "/admin/creators",
      });
    });

    orders.slice(0, 3).forEach((o) => {
      items.push({
        id: `o-${o.id}`,
        type: "order",
        description: `New order: ${formatCurrency(o.amount, (o.currency ?? "UGX") as never)} — ${o.products?.title ?? "Unknown"}`,
        timestamp: o.created_at,
        link: "/admin/orders",
      });
    });

    return items.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 8);
  }, [creators, orders]);

  const timeAgo = (date: string) => {
    const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
    if (seconds < 60) return "just now";
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 2592000) return `${Math.floor(seconds / 86400)}d ago`;
    return new Date(date).toLocaleDateString("en-UG");
  };

  const activityIcons: Record<string, React.ReactNode> = {
    creator: <UserPlus size={16} className="text-success" />,
    order: <ShoppingCart size={16} className="text-brand-green" />,
    withdrawal: <Wallet size={16} className="text-warning" />,
    refund: <RefreshCw size={16} className="text-error" />,
    product: <Package size={16} className="text-brand-green" />,
  };

  return (
    <DashboardShell title="Platform Overview" subtitle="Monitor your platform's health and performance" role="admin">
      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700">{error}</div>
      )}

      {/* Date range + Summary */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-1 rounded-lg border border-border p-0.5">
          {["Today", "Yesterday", "7D", "30D", "Custom"].map((period) => (
            <button
              key={period}
              className={`rounded-md px-3.5 py-1.5 text-xs font-semibold transition ${
                dateRange === period ? "bg-brand-green text-white" : "text-muted hover:text-brand-black"
              }`}
              onClick={() => setDateRange(period)}
            >
              {period}
            </button>
          ))}
        </div>
      </div>

      {/* Revenue by currency summary */}
      {revenueByCurrency.length > 0 && (
        <div className="mb-6 rounded-xl border border-border bg-surface-card p-4 shadow-card">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">Revenue by Currency</p>
          <p className="mb-3 text-xs text-muted">Revenue shown in original transaction currencies. No auto-conversion applied.</p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {revenueByCurrency.map((r) => (
              <div key={r.currency} className="rounded-lg border border-border bg-surface p-3">
                <p className="text-xs font-semibold text-muted">{r.currency}</p>
                <p className="text-lg font-bold text-brand-black">{formatCurrency(r.gross, r.currency as never)}</p>
                <p className="text-xs text-muted">{r.count} order{r.count !== 1 ? "s" : ""} &middot; {formatCurrency(r.fee, r.currency as never)} fees</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Top metrics */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard
          label="Platform Revenue"
          value={revenueByCurrency.length > 0 ? revenueByCurrency.map((r) => formatCurrency(r.fee, r.currency as never)).join(" / ") : "—"}
          sublabel="10% fees earned"
          icon={<DollarSign size={20} />}
          green
        />
        <StatCard
          label="Gross Volume"
          value={revenueByCurrency.length > 0 ? revenueByCurrency.map((r) => formatCurrency(r.gross, r.currency as never)).join(" / ") : "—"}
          sublabel="Total sales processed"
          icon={<TrendingUp size={20} />}
        />
        <StatCard
          label="Total Orders"
          value={String(paidOrders.length)}
          sublabel="Verified payments"
          icon={<ShoppingCart size={20} />}
        />
        <StatCard
          label="Active Creators"
          value={String(stats.activeStores ?? stats.totalCreators ?? 0)}
          sublabel="With published stores"
          icon={<Users size={20} />}
        />
        <StatCard
          label="Total Buyers"
          value={String(stats.totalBuyers ?? 0)}
          sublabel="Unique buyers"
          icon={<UserPlus size={20} />}
        />
        <StatCard
          label="Pending Withdrawals"
          value={String(pendingWithdrawals)}
          sublabel="Awaiting approval"
          icon={<Clock size={20} />}
          green={pendingWithdrawals === 0}
        />
      </div>

      {/* Operational alerts */}
      {!loading && (pendingWithdrawals > 0 || pendingRefunds > 0) && (
        <div className="mb-6 grid gap-3">
          {pendingWithdrawals > 0 && (
            <Link
              href="/admin/withdrawals"
              className="flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-800 transition hover:bg-amber-100"
            >
              <AlertTriangle size={20} />
              {pendingWithdrawals} withdrawal request{pendingWithdrawals !== 1 ? "s" : ""} pending review
              <span className="ml-auto">Review now →</span>
            </Link>
          )}
          {pendingRefunds > 0 && (
            <Link
              href="/admin/refunds"
              className="flex items-center gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-800 transition hover:bg-red-100"
            >
              <ShieldAlert size={20} />
              {pendingRefunds} refund request{pendingRefunds !== 1 ? "s" : ""} pending
              <span className="ml-auto">Review now →</span>
            </Link>
          )}
        </div>
      )}

      {/* Charts row */}
      {loading ? (
        <div className="mb-6 grid gap-6 lg:grid-cols-3">
          <ChartSkeleton />
          <ChartSkeleton />
          <ChartSkeleton />
        </div>
      ) : (
        <div className="mb-6 grid gap-6 lg:grid-cols-3">
          {/* Revenue Over Time */}
          <div className="rounded-xl border border-border bg-surface-card p-5 shadow-card lg:col-span-2">
            <h3 className="mb-4 font-bold text-brand-black">Revenue Over Time</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={revenueOverTime} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis dataKey="date" tickLine={false} axisLine={false} tick={{ fontSize: 11 }} />
                  <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Line type="monotone" dataKey="gross" stroke="#00854A" strokeWidth={2} name="Gross Volume" dot={false} />
                  <Line type="monotone" dataKey="fee" stroke="#F5A623" strokeWidth={2} name="Platform Fee" dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* New Registrations */}
          <div className="rounded-xl border border-border bg-surface-card p-5 shadow-card">
            <h3 className="mb-4 font-bold text-brand-black">New Creators</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={registrationsOverTime} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis dataKey="date" tickLine={false} axisLine={false} tick={{ fontSize: 11 }} />
                  <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#00854A" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Payment Method Breakdown */}
          <div className="rounded-xl border border-border bg-surface-card p-5 shadow-card">
            <h3 className="mb-4 font-bold text-brand-black">Payment Methods</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={paymentMethods}
                    cx="50%" cy="50%"
                    innerRadius={50} outerRadius={80}
                    paddingAngle={4} dataKey="value"
                  >
                    {paymentMethods.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend
                    formatter={(value: string) => <span className="text-sm capitalize">{value.replace("_", " ")}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Recent Activity + Tables */}
      <div className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
        {/* Recent Orders */}
        <div>
          <h3 className="mb-3 font-display text-xl font-bold text-brand-black">Recent Orders</h3>
          {loading ? (
            <TableSkeleton rows={6} />
          ) : orders.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border bg-surface-card p-8 text-center text-sm text-muted">No orders yet.</div>
          ) : (
            <div className="overflow-hidden rounded-xl border border-border bg-surface-card shadow-card">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-surface">
                      <th className="px-4 py-3 text-left font-semibold text-muted">Order</th>
                      <th className="px-4 py-3 text-left font-semibold text-muted">Product</th>
                      <th className="px-4 py-3 text-left font-semibold text-muted">Creator</th>
                      <th className="px-4 py-3 text-right font-semibold text-muted">Amount</th>
                      <th className="px-4 py-3 text-right font-semibold text-muted">Fee</th>
                      <th className="px-4 py-3 text-right font-semibold text-muted">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.slice(0, 6).map((o) => (
                      <tr key={o.id} className="border-b border-border transition hover:bg-surface">
                        <td className="px-4 py-3 font-mono text-xs text-muted">#{o.id.slice(0, 8)}</td>
                        <td className="px-4 py-3 font-medium text-brand-black">{o.products?.title ?? "—"}</td>
                        <td className="px-4 py-3 text-muted">{o.creators?.display_name ?? "—"}</td>
                        <td className="px-4 py-3 text-right font-semibold">{formatCurrency(o.amount, (o.currency ?? "UGX") as never)}</td>
                        <td className="px-4 py-3 text-right text-muted">{formatCurrency(o.platform_fee, (o.currency ?? "UGX") as never)}</td>
                        <td className="px-4 py-3 text-right"><Badge variant={getBadgeVariant(o.status)}>{o.status}</Badge></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <Link href="/admin/orders" className="block border-t border-border px-4 py-3 text-center text-sm font-semibold text-brand-green hover:bg-surface">
                View all orders →
              </Link>
            </div>
          )}
        </div>

        {/* Recent Activity Feed */}
        <div>
          <h3 className="mb-3 font-display text-xl font-bold text-brand-black">Recent Activity</h3>
          {loading ? (
            <TableSkeleton rows={6} />
          ) : (
            <div className="space-y-2">
              {recentActivity.map((item) => (
                <div
                  key={item.id}
                  className="flex items-start gap-3 rounded-xl border border-border bg-surface-card p-3 shadow-card"
                >
                  <div className="mt-0.5 shrink-0">{activityIcons[item.type]}</div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-brand-black">{item.description}</p>
                    <p className="text-xs text-muted">{timeAgo(item.timestamp)}</p>
                  </div>
                  {item.link && (
                    <Link href={item.link} className="shrink-0 text-xs font-semibold text-brand-green hover:underline">
                      View
                    </Link>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent Registrations */}
      <div className="mt-6">
        <h3 className="mb-3 font-display text-xl font-bold text-brand-black">Recent Registrations</h3>
        {loading ? (
          <TableSkeleton rows={5} />
        ) : creators.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-surface-card p-8 text-center text-sm text-muted">No creators yet.</div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-border bg-surface-card shadow-card">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-surface">
                    <th className="px-4 py-3 text-left font-semibold text-muted">Store</th>
                    <th className="px-4 py-3 text-left font-semibold text-muted">Email</th>
                    <th className="px-4 py-3 text-right font-semibold text-muted">Products</th>
                    <th className="px-4 py-3 text-right font-semibold text-muted">Joined</th>
                  </tr>
                </thead>
                <tbody>
                  {creators.slice(0, 5).map((c) => (
                    <tr key={c.id} className="border-b border-border transition hover:bg-surface">
                      <td className="px-4 py-3 font-medium text-brand-black">{c.store_name || c.display_name || "—"}</td>
                      <td className="px-4 py-3 text-muted">{c.email || "—"}</td>
                      <td className="px-4 py-3 text-right">{c.product_count ?? 0}</td>
                      <td className="px-4 py-3 text-right text-muted">{new Date(c.created_at).toLocaleDateString("en-UG")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Link href="/admin/creators" className="block border-t border-border px-4 py-3 text-center text-sm font-semibold text-brand-green hover:bg-surface">
              View all creators →
            </Link>
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
