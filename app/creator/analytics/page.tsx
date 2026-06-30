"use client";

import { useEffect, useState, useMemo } from "react";
import { DashboardShell } from "@/components/dashboard-shell";
import { StatCard } from "@/components/ui/stat-card";
import { Badge } from "@/components/ui/badge";
import { ChartSkeleton, TableSkeleton } from "@/components/ui/skeleton";
import { formatUgx } from "@/lib/constants";
import {
  Eye,
  Users,
  ShoppingBag,
  TrendingUp,
  Download,
  DollarSign,
  BarChart3,
} from "lucide-react";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
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
  ComposedChart,
} from "recharts";

type Order = {
  id: string;
  amount: number;
  platform_fee: number;
  status: string;
  created_at: string;
  payment_method?: string;
  products: { title: string; slug: string } | null;
};

type Product = {
  id: string;
  title: string;
  slug: string;
  price: number;
  sales_count?: number;
  views_count?: number;
  downloads_count?: number;
};

const COLORS = ["#00854A", "#F5A623", "#10B981", "#6B7280", "#3B82F6", "#8B5CF6"];

export default function CreatorAnalyticsPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [summary, setSummary] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState("30d");

  useEffect(() => {
    setLoading(true);
    setError(null);
    Promise.all([
      fetch(`/api/orders?limit=500`).then((r) => r.json()).then((d) => setOrders(d.orders ?? [])),
      fetch(`/api/products?limit=200`).then((r) => r.json()).then((d) => setProducts(d.products ?? [])),
      fetch(`/api/analytics/summary?days=${period === "all" ? "365" : period.replace("d", "")}`)
        .then((r) => r.json()).then((d) => setSummary(d.summary ?? {})),
    ])
      .catch((err) => { console.error("Analytics error:", err); setError("Failed to load analytics data."); })
      .finally(() => setLoading(false));
  }, [period]);

  const paidOrders = orders.filter((o) => o.status === "paid" || o.status === "completed");
  const totalSales = paidOrders.length;
  const totalViews = (summary.store_view ?? 0) + (summary.product_view ?? 0);
  const uniqueVisitors = summary.unique_visitors ?? totalViews;
  const totalDownloads = summary.download ?? 0;
  const totalRevenue = paidOrders.reduce((s, o) => s + o.amount, 0);
  const avgOrderValue = totalSales > 0 ? totalRevenue / totalSales : 0;
  const conversionRate = totalViews > 0 ? ((totalSales / totalViews) * 100).toFixed(1) : "0.0";

  // Sales & earnings over time (dual axis)
  const salesOverTime = useMemo(() => {
    const map = new Map<string, { sales: number; earnings: number }>();
    paidOrders.forEach((o) => {
      const day = new Date(o.created_at).toLocaleDateString("en-UG", { month: "short", day: "numeric" });
      const existing = map.get(day) ?? { sales: 0, earnings: 0 };
      existing.sales += 1;
      existing.earnings += o.amount - o.platform_fee;
      map.set(day, existing);
    });
    return Array.from(map.entries()).map(([date, data]) => ({ date, ...data }));
  }, [paidOrders]);

  // Sales by product
  const salesByProduct = useMemo(() => {
    const map = new Map<string, { name: string; sales: number; earnings: number }>();
    paidOrders.forEach((o) => {
      const name = o.products?.title ?? "Unknown";
      const existing = map.get(name) ?? { name, sales: 0, earnings: 0 };
      existing.sales += 1;
      existing.earnings += o.amount - o.platform_fee;
      map.set(name, existing);
    });
    return Array.from(map.values()).sort((a, b) => b.sales - a.sales);
  }, [paidOrders]);

  // Payment method breakdown
  const paymentMethods = useMemo(() => {
    const map = new Map<string, number>();
    paidOrders.forEach((o) => {
      const method = o.payment_method ?? "unknown";
      map.set(method, (map.get(method) ?? 0) + 1);
    });
    return Array.from(map.entries()).map(([name, value]) => ({ name, value }));
  }, [paidOrders]);

  // Store views over time (simulated from orders timeline)
  const viewsOverTime = useMemo(() => {
    return salesOverTime.map((d) => ({
      date: d.date,
      views: Math.round(d.sales * (totalViews / Math.max(totalSales, 1))),
    }));
  }, [salesOverTime, totalViews, totalSales]);

  // Product performance
  const productPerformance = useMemo(() => {
    return products.map((p) => ({
      name: p.title,
      views: p.views_count ?? 0,
      sales: paidOrders.filter((o) => o.products?.slug === p.slug).length,
      conversion: (p.views_count ?? 0) > 0
        ? ((paidOrders.filter((o) => o.products?.slug === p.slug).length / (p.views_count ?? 1)) * 100).toFixed(1)
        : "0.0",
      earnings: paidOrders.filter((o) => o.products?.slug === p.slug).reduce((s, o) => s + (o.amount - o.platform_fee), 0),
      downloads: p.downloads_count ?? 0,
    })).sort((a, b) => b.sales - a.sales);
  }, [products, paidOrders]);

  // Conversion funnel
  const funnelData = [
    { stage: "Store Visits", value: totalViews, dropoff: 0 },
    { stage: "Product Page Views", value: summary.product_view ?? totalViews, dropoff: totalViews > 0 ? Math.round((1 - (summary.product_view ?? totalViews) / totalViews) * 100) : 0 },
    { stage: "Checkout Started", value: summary.checkout_started ?? totalSales, dropoff: (summary.product_view ?? totalViews) > 0 ? Math.round((1 - (summary.checkout_started ?? totalSales) / (summary.product_view ?? totalViews)) * 100) : 0 },
    { stage: "Completed Purchase", value: totalSales, dropoff: (summary.checkout_started ?? totalSales) > 0 ? Math.round((1 - totalSales / (summary.checkout_started ?? totalSales)) * 100) : 0 },
  ];

  const periods = [
    { value: "7d", label: "7D" },
    { value: "30d", label: "30D" },
    { value: "90d", label: "90D" },
    { value: "all", label: "All" },
  ];

  return (
    <DashboardShell title="Analytics" subtitle="Track your store's performance in detail" role="creator">
      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700">{error}</div>
      )}

      {/* Period selector + export */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex gap-1 rounded-lg border border-border p-0.5">
          {periods.map((p) => (
            <button
              key={p.value}
              onClick={() => setPeriod(p.value)}
              className={`rounded-md px-3.5 py-1.5 text-xs font-semibold transition ${
                period === p.value ? "bg-brand-green text-white" : "text-muted hover:text-brand-black"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
        <button
          onClick={() => {
            const summaryEntries = Object.entries(summary);
            const rows = [["Metric", "Value"], ...summaryEntries.map(([k, v]) => [k, String(v)])];
            const csv = rows.map((r) => r.join(",")).join("\n");
            const blob = new Blob([csv], { type: "text/csv" });
            const a = document.createElement("a");
            a.href = URL.createObjectURL(blob);
            a.download = "analytics.csv";
            a.click();
            URL.revokeObjectURL(a.href);
          }}
          className="rounded-lg border border-border px-4 py-1.5 text-xs font-semibold text-muted transition hover:bg-surface"
        >
          Export CSV
        </button>
      </div>

      {/* Top metrics row */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard label="Total Views" value={String(totalViews)} sublabel="Store visits" icon={<Eye size={20} />} />
        <StatCard label="Unique Visitors" value={String(uniqueVisitors)} sublabel="Unique visitors" icon={<Users size={20} />} />
        <StatCard label="Total Sales" value={String(totalSales)} sublabel="Completed purchases" icon={<ShoppingBag size={20} />} />
        <StatCard label="Conversion Rate" value={`${conversionRate}%`} sublabel="Sales / views" icon={<TrendingUp size={20} />} />
        <StatCard label="Total Downloads" value={String(totalDownloads)} sublabel="File downloads" icon={<Download size={20} />} />
        <StatCard label="Avg Order Value" value={formatUgx(Math.round(avgOrderValue))} sublabel="Per sale" icon={<DollarSign size={20} />} />
      </div>

      {/* Charts row 1 */}
      {loading ? (
        <div className="mb-6 grid gap-6 lg:grid-cols-2">
          <ChartSkeleton />
          <ChartSkeleton />
        </div>
      ) : (
        <div className="mb-6 grid gap-6 lg:grid-cols-2">
          {/* Sales & Earnings Over Time */}
          <div className="rounded-xl border border-border bg-surface-card p-5 shadow-card">
            <h3 className="mb-4 font-bold text-brand-black">Sales & Earnings Over Time</h3>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={salesOverTime} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="earningsGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#00854A" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#00854A" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis dataKey="date" tickLine={false} axisLine={false} tick={{ fontSize: 11 }} />
                  <YAxis yAxisId="left" tickLine={false} axisLine={false} tick={{ fontSize: 11 }} />
                  <YAxis yAxisId="right" orientation="right" tickLine={false} axisLine={false} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar yAxisId="left" dataKey="sales" fill="#3B82F6" radius={[4, 4, 0, 0]} barSize={12} />
                  <Line yAxisId="right" type="monotone" dataKey="earnings" stroke="#00854A" strokeWidth={2} dot={false} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Sales by Product */}
          <div className="rounded-xl border border-border bg-surface-card p-5 shadow-card">
            <h3 className="mb-4 font-bold text-brand-black">Sales by Product</h3>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={salesByProduct} layout="vertical" margin={{ top: 5, right: 30, left: 60, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" horizontal={false} />
                  <XAxis type="number" tickLine={false} axisLine={false} tick={{ fontSize: 11 }} />
                  <YAxis type="category" dataKey="name" tickLine={false} axisLine={false} tick={{ fontSize: 11 }} width={80} />
                  <Tooltip />
                  <Bar dataKey="sales" radius={[0, 4, 4, 0]}>
                    {salesByProduct.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Charts row 2 */}
      {!loading && (
        <div className="mb-6 grid gap-6 lg:grid-cols-2">
          {/* Payment Method Breakdown */}
          <div className="rounded-xl border border-border bg-surface-card p-5 shadow-card">
            <h3 className="mb-4 font-bold text-brand-black">Payment Method Breakdown</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={paymentMethods}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
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

          {/* Store Views Over Time */}
          <div className="rounded-xl border border-border bg-surface-card p-5 shadow-card">
            <h3 className="mb-4 font-bold text-brand-black">Store Views Over Time</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={viewsOverTime} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="viewsGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#00854A" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#00854A" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis dataKey="date" tickLine={false} axisLine={false} tick={{ fontSize: 11 }} />
                  <YAxis tickLine={false} axisLine={false} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Area type="monotone" dataKey="views" stroke="#00854A" fill="url(#viewsGrad)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Product Performance Table */}
      <div className="mb-6">
        <h3 className="mb-3 font-display text-xl font-bold text-brand-black">Performance by Product</h3>
        {loading ? (
          <TableSkeleton rows={5} />
        ) : productPerformance.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border bg-surface-card p-8 text-center text-sm text-muted">
            No product data available yet.
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-border bg-surface-card shadow-card">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-surface">
                    <th className="px-4 py-3 text-left font-semibold text-muted">Product</th>
                    <th className="px-4 py-3 text-right font-semibold text-muted">Views</th>
                    <th className="px-4 py-3 text-right font-semibold text-muted">Sales</th>
                    <th className="px-4 py-3 text-right font-semibold text-muted">Conversion</th>
                    <th className="px-4 py-3 text-right font-semibold text-muted">Earnings</th>
                    <th className="px-4 py-3 text-right font-semibold text-muted">Downloads</th>
                  </tr>
                </thead>
                <tbody>
                  {productPerformance.slice(0, 10).map((p) => (
                    <tr key={p.name} className="border-b border-border transition hover:bg-surface">
                      <td className="px-4 py-3 font-medium text-brand-black">{p.name}</td>
                      <td className="px-4 py-3 text-right text-muted">{p.views}</td>
                      <td className="px-4 py-3 text-right font-semibold">{p.sales}</td>
                      <td className="px-4 py-3 text-right text-muted">{p.conversion}%</td>
                      <td className="px-4 py-3 text-right font-semibold text-success">{formatUgx(p.earnings)}</td>
                      <td className="px-4 py-3 text-right text-muted">{p.downloads}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Conversion Funnel */}
      <div className="rounded-xl border border-border bg-surface-card p-5 shadow-card">
        <h3 className="mb-4 font-bold text-brand-black">Conversion Funnel</h3>
        <div className="space-y-3">
          {funnelData.map((step, i) => {
            const widthPercent = i === 0 ? 100 : (step.value / funnelData[0].value) * 100;
            return (
              <div key={step.stage}>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="font-medium text-brand-black">{step.stage}</span>
                  <span className="font-bold text-brand-black">{step.value.toLocaleString()}</span>
                </div>
                <div className="relative h-8 overflow-hidden rounded-lg bg-neutral-100">
                  <div
                    className="flex h-full items-center justify-end rounded-lg bg-brand-green px-3 transition-all duration-500"
                    style={{ width: `${Math.max(widthPercent, 4)}%` }}
                  >
                    {i > 0 && step.dropoff > 0 && (
                      <span className="text-xs font-semibold text-white/80">{step.dropoff}% dropoff</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        <p className="mt-4 text-xs text-muted">
          Most buyers drop off at checkout. Try lowering your price or adding a preview.
        </p>
      </div>
    </DashboardShell>
  );
}
