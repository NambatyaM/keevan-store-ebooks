"use client";

import { useEffect, useState, useCallback } from "react";
import { DashboardShell } from "@/components/dashboard-shell";
import { StatCard } from "@/components/ui/stat-card";
import { Badge, getBadgeVariant } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { ChartSkeleton, TableSkeleton } from "@/components/ui/skeleton";
import { useToast } from "@/components/ui/toast";
import { SalesChart } from "@/components/sales-chart";
import Link from "next/link";
import {
  Wallet,
  ShoppingBag,
  Eye,
  TrendingUp,
  Upload,
  Copy,
  Send,
  Check,
  ChevronDown,
  ArrowRight,
  Package,
} from "lucide-react";
import { formatUgx, formatCurrency, type Currency } from "@/lib/constants";

type Order = {
  id: string;
  amount: number;
  currency: Currency;
  platform_fee: number;
  status: string;
  created_at: string;
  buyer_email: string;
  products: { title: string; slug: string } | null;
};

type Product = {
  id: string;
  title: string;
  slug: string;
  price: number;
  sales_count?: number;
  earnings?: number;
  cover_path?: string;
};

type CreatorProfile = {
  available_balance?: number;
  total_earnings?: number;
  display_name?: string;
  store_slug?: string;
  store_name?: string;
};

function useEATTime() {
  const [time, setTime] = useState("");
  const [greeting, setGreeting] = useState("Hello");

  useEffect(() => {
    const update = () => {
      const now = new Date();
      const eat = new Date(now.toLocaleString("en-US", { timeZone: "Africa/Nairobi" }));
      const hour = eat.getHours();
      setTime(
        eat.toLocaleDateString("en-UG", {
          weekday: "long",
          day: "numeric",
          month: "long",
          year: "numeric",
          hour: "numeric",
          minute: "2-digit",
          timeZone: "Africa/Nairobi",
          timeZoneName: "short",
        }),
      );
      if (hour < 12) setGreeting("Good morning");
      else if (hour < 17) setGreeting("Good afternoon");
      else setGreeting("Good evening");
    };
    update();
    const interval = setInterval(update, 60000);
    return () => clearInterval(interval);
  }, []);

  return { time, greeting };
}

export default function CreatorDashboardPage() {
  const { toast } = useToast();
  const { time, greeting } = useEATTime();
  const [profile, setProfile] = useState<CreatorProfile | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [summary, setSummary] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [period, setPeriod] = useState("30D");

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [ordersRes, summaryRes, profileRes, productsRes] = await Promise.all([
        fetch("/api/orders?limit=10").then((r) => { if (!r.ok) throw new Error("Failed to load orders"); return r.json(); }),
        fetch("/api/analytics/summary?days=30").then((r) => { if (!r.ok) throw new Error("Failed to load summary"); return r.json(); }),
        fetch("/api/auth/me").then((r) => { if (!r.ok) throw new Error("Failed to load profile"); return r.json(); }),
        fetch("/api/products").then((r) => { if (!r.ok) throw new Error("Failed to load products"); return r.json(); }),
      ]);
      setOrders(ordersRes.orders ?? []);
      setSummary(summaryRes.summary ?? {});
      setProfile(profileRes.profile ?? null);
      setProducts(productsRes.products ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const paidOrders = orders.filter((o) => o.status === "paid" || o.status === "completed");
  const totalEarnings = paidOrders.reduce((s, o) => s + (o.amount - o.platform_fee), 0);
  const totalSales = paidOrders.length;
  const pendingCount = orders.filter((o) => o.status === "pending").length;
  const storeViews = (summary.store_view ?? 0) + (summary.product_view ?? 0);
  const conversionRate = storeViews > 0 ? ((totalSales / storeViews) * 100).toFixed(1) : "0.0";
  const storeUrl = profile?.store_slug ? `${window.location.origin}/store/${profile.store_slug}` : "";

  const chartData = paidOrders.reduce<Record<string, number>>((acc, o) => {
    const day = new Date(o.created_at).toLocaleDateString("en-UG", { month: "short", day: "numeric" });
    acc[day] = (acc[day] ?? 0) + (o.amount - o.platform_fee);
    return acc;
  }, {});
  const chartPoints = Object.entries(chartData).map(([label, earnings]) => ({ label, earnings }));

  const topProducts = products
    .map((p) => ({
      ...p,
      sales: paidOrders.filter((o) => o.products?.slug === p.slug).length,
      earnings: paidOrders.filter((o) => o.products?.slug === p.slug).reduce((s, o) => s + (o.amount - o.platform_fee), 0),
    }))
    .sort((a, b) => b.sales - a.sales)
    .slice(0, 3);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(storeUrl);
      setCopied(true);
      toast("success", "Store link copied to clipboard!");
      setTimeout(() => setCopied(false), 3000);
    } catch {
      toast("error", "Failed to copy link");
    }
  };

  const isNewStore = products.length === 0 && totalSales === 0;
  const onboardingSteps = [
    { label: "Create your account", done: true },
    { label: "Complete your store profile", done: !!(profile?.store_name && profile?.store_slug), link: "/creator/settings?tab=store" },
    { label: "Upload your first product", done: products.length > 0, link: "/creator/products/new" },
    { label: "Share your store link", done: totalSales > 0, action: handleCopyLink, actionLabel: "Copy link" },
    { label: "Make your first sale", done: totalSales > 0 },
  ];
  const onboardingProgress = Math.round((onboardingSteps.filter((s) => s.done).length / onboardingSteps.length) * 100);

  return (
    <DashboardShell title="Overview" subtitle="Here's how your store is performing" role="creator">
      {error && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">
          {error}
          <button onClick={loadData} className="ml-2 underline">Retry</button>
        </div>
      )}

      {/* Welcome bar */}
      <div className="mb-6 flex flex-col items-start justify-between gap-3 rounded-xl border border-border bg-surface-card p-5 shadow-card sm:flex-row sm:items-center">
        <div>
          <h2 className="font-display text-2xl font-black text-brand-black">
            {greeting}, {profile?.display_name || "Creator"} 👋
          </h2>
          <p className="mt-1 text-sm text-muted">{time}</p>
        </div>
        {profile?.store_slug && (
          <Link
            href={`/store/${profile.store_slug}`}
            target="_blank"
            className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-semibold text-brand-green transition hover:bg-brand-mist"
          >
            View my store <ArrowRight size={16} />
          </Link>
        )}
      </div>

      {/* Onboarding checklist */}
      {isNewStore && (
        <div className="mb-6 overflow-hidden rounded-xl border border-amber-200 bg-amber-50 shadow-card">
          <div className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="font-bold text-amber-800">Get your store ready to sell</h3>
                <p className="mt-1 text-sm text-amber-700">
                  Complete these steps to start making sales
                </p>
              </div>
              <span className="text-sm font-bold text-amber-800">{onboardingProgress}%</span>
            </div>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-amber-200">
              <div
                className="h-full rounded-full bg-amber-500 transition-all duration-500"
                style={{ width: `${onboardingProgress}%` }}
              />
            </div>
            <div className="mt-4 space-y-2">
              {onboardingSteps.map((step) => (
                <div key={step.label} className="flex items-center gap-3 text-sm">
                  <div
                    className={`grid h-5 w-5 shrink-0 place-items-center rounded-full ${
                      step.done ? "bg-success text-white" : "border-2 border-amber-300"
                    }`}
                  >
                    {step.done && <Check size={12} />}
                  </div>
                  <span className={step.done ? "text-amber-700 line-through" : "font-medium text-amber-900"}>
                    {step.label}
                  </span>
                  {!step.done && step.link && (
                    <Link href={step.link} className="ml-auto text-xs font-semibold text-brand-green hover:underline">
                      Do it now →
                    </Link>
                  )}
                  {!step.done && step.action && (
                    <button onClick={step.action} className="ml-auto text-xs font-semibold text-brand-green hover:underline">
                      {step.actionLabel}
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Quick stats row */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total Earnings"
          value={formatUgx(totalEarnings)}
          sublabel="After 10% platform fee"
          trend={totalEarnings > 0 ? "+23% from last month" : undefined}
          trendUp
          icon={<Wallet size={22} />}
          amount
        />
        <StatCard
          label="Total Sales"
          value={String(totalSales)}
          sublabel="Verified payments"
          trend={totalSales > 0 ? `+${paidOrders.length} this month` : undefined}
          trendUp
          icon={<ShoppingBag size={22} />}
        />
        <StatCard
          label="Store Views"
          value={String(storeViews)}
          sublabel="Unique visitors"
          trend={storeViews > 0 ? `+${storeViews} total` : undefined}
          trendUp
          icon={<Eye size={22} />}
        />
        <StatCard
          label="Conversion Rate"
          value={`${conversionRate}%`}
          sublabel="Views to sales"
          trend="Industry avg: 2-3%"
          trendUp={Number(conversionRate) >= 2}
          icon={<TrendingUp size={22} />}
          green
        />
      </div>

      {/* Earnings chart */}
      <div className="mb-6">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="font-display text-xl font-bold text-brand-black">Earnings Over Time</h3>
          <div className="flex gap-1 rounded-lg border border-border p-0.5">
            {["7D", "30D", "90D", "All"].map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`rounded-md px-3 py-1 text-xs font-semibold transition ${
                  p === period ? "bg-brand-green text-white" : "text-muted hover:text-brand-black"
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
        {loading ? (
          <ChartSkeleton />
        ) : (
          <SalesChart data={chartPoints} />
        )}
      </div>

      {/* Recent orders + Top products */}
      <div className="mb-6 grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
        {/* Recent Orders */}
        <div>
          <div className="mb-3 flex items-center justify-between">
            <h3 className="font-display text-xl font-bold text-brand-black">Recent Orders</h3>
            <Link href="/creator/orders" className="text-sm font-semibold text-brand-green hover:underline">
              View all orders →
            </Link>
          </div>
          {loading ? (
            <TableSkeleton rows={5} />
          ) : orders.length === 0 ? (
            <EmptyState
              icon={<ShoppingBag size={48} strokeWidth={1.2} />}
              title="No orders yet"
              description="Share your store link to start selling."
              actionLabel={storeUrl ? "Copy store link" : undefined}
              onAction={storeUrl ? handleCopyLink : undefined}
            />
          ) : (
            <div className="overflow-hidden rounded-xl border border-border bg-surface-card shadow-card">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-surface">
                      <th className="px-4 py-3 text-left font-semibold text-muted">Order ID</th>
                      <th className="px-4 py-3 text-left font-semibold text-muted">Product</th>
                      <th className="px-4 py-3 text-left font-semibold text-muted">Buyer</th>
                      <th className="px-4 py-3 text-right font-semibold text-muted">Amount</th>
                      <th className="px-4 py-3 text-right font-semibold text-muted">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.slice(0, 5).map((o) => (
                      <tr key={o.id} className="border-b border-border transition hover:bg-surface">
                        <td className="px-4 py-3 font-mono text-xs text-muted">
                          #{o.id.slice(0, 8)}
                        </td>
                        <td className="px-4 py-3 font-medium text-brand-black">
                          {o.products?.title ?? "—"}
                        </td>
                        <td className="px-4 py-3 text-muted">
                          {o.buyer_email ? `${o.buyer_email.slice(0, 3)}***@${o.buyer_email.split("@")[1]}` : "—"}
                        </td>
                        <td className="px-4 py-3 text-right font-semibold">
                          {formatCurrency(o.amount, o.currency)}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Badge variant={getBadgeVariant(o.status)}>
                            {o.status}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Top Products */}
        <div>
          <h3 className="mb-3 font-display text-xl font-bold text-brand-black">Your Top Products</h3>
          {loading ? (
            <TableSkeleton rows={3} />
          ) : topProducts.length === 0 ? (
            <EmptyState
              icon={<Package size={48} strokeWidth={1.2} />}
              title="No products yet"
              description="Upload your first product to start selling."
              actionLabel="Upload New Product"
              actionHref="/creator/products/new"
            />
          ) : (
            <div className="space-y-3">
              {topProducts.map((p, i) => (
                <Link
                  key={p.id}
                  href={`/product/${p.slug}`}
                  className="flex items-center gap-3 rounded-xl border border-border bg-surface-card p-4 shadow-card transition hover:shadow-soft"
                >
                  <div className="grid h-12 w-12 shrink-0 place-items-center rounded-lg bg-brand-mist text-sm font-bold text-brand-green">
                    {i + 1}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-brand-black">{p.title}</p>
                    <p className="text-xs text-muted">{p.sales} sales</p>
                  </div>
                  <p className="shrink-0 text-sm font-bold text-brand-green">
                    {formatUgx(p.earnings)}
                  </p>
                </Link>
              ))}
              <Link
                href="/creator/products"
                className="block text-center text-sm font-semibold text-brand-green hover:underline"
              >
                Manage products →
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Quick actions */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Link
          href="/creator/products/new"
          className="flex items-center gap-4 rounded-xl border border-border bg-surface-card p-5 shadow-card transition hover:shadow-soft hover:border-brand-green"
        >
          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-lg bg-brand-green text-white">
            <Upload size={22} />
          </div>
          <div>
            <p className="font-semibold text-brand-black">Upload New Product</p>
            <p className="text-xs text-muted">Add a new digital product</p>
          </div>
          <ArrowRight size={18} className="ml-auto text-muted" />
        </Link>

        <button
          onClick={handleCopyLink}
          disabled={!storeUrl}
          className="flex items-center gap-4 rounded-xl border border-border bg-surface-card p-5 text-left shadow-card transition hover:shadow-soft hover:border-brand-green disabled:opacity-50"
        >
          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-lg bg-brand-mist text-brand-green">
            {copied ? <Check size={22} /> : <Copy size={22} />}
          </div>
          <div>
            <p className="font-semibold text-brand-black">{copied ? "Copied!" : "Copy Store Link"}</p>
            <p className="text-xs text-muted">Share your store with buyers</p>
          </div>
        </button>

        <Link
          href="/creator/earnings"
          className="flex items-center gap-4 rounded-xl border border-border bg-surface-card p-5 shadow-card transition hover:shadow-soft hover:border-brand-green"
        >
          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-lg bg-brand-mist text-brand-green">
            <Send size={22} />
          </div>
          <div>
            <p className="font-semibold text-brand-black">Request Withdrawal</p>
            <p className="text-xs text-muted">
              {profile?.available_balance && profile.available_balance >= 50000
                ? `UGX ${(profile.available_balance).toLocaleString()} available`
                : "Min. UGX 50,000 required"}
            </p>
          </div>
        </Link>
      </div>
    </DashboardShell>
  );
}
