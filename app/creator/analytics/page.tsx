"use client";

import { useEffect, useState } from "react";
import { DashboardShell } from "@/components/dashboard-shell";
import { SalesChart } from "@/components/sales-chart";
import { StatCard } from "@/components/stat-card";
import { creatorNav } from "@/app/creator/nav";

export default function CreatorAnalyticsPage() {
  const [summary, setSummary] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/analytics/summary?days=30")
      .then((r) => r.json())
      .then((d) => setSummary(d.summary ?? {}))
      .catch((err) => { console.error("Failed to load analytics summary:", err); setError("Failed to load analytics data."); })
      .finally(() => setLoading(false));
  }, []);

  const productViews = summary.product_view ?? 0;
  const storeViews = summary.store_view ?? 0;
  const totalViews = productViews + storeViews;
  const downloads = summary.download ?? 0;
  const purchases = summary.purchase ?? 0;
  const conversionRate = totalViews > 0 ? ((purchases / totalViews) * 100).toFixed(1) : "0.0";

  return (
      <DashboardShell title="Analytics" subtitle="Monitor views, purchases, revenue, conversion rate, top products, and traffic quality." nav={creatorNav}>
        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700">{error}</div>
        )}
        <div className="grid gap-4 md:grid-cols-4">
        <StatCard label="Total Views (30d)" value={String(totalViews)} />
        <StatCard label="Downloads (30d)" value={String(downloads)} />
        <StatCard label="Purchases (30d)" value={String(purchases)} />
        <StatCard label="Conversion Rate" value={`${conversionRate}%`} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
        <div>
          <h2 className="mb-3 text-xl font-bold">Activity (30d)</h2>
          {loading ? (
            <div className="grid h-72 place-items-center rounded-lg border border-dashed border-neutral-300 bg-white text-sm text-neutral-600">Loading...</div>
          ) : totalViews + downloads + purchases > 0 ? (
            <div className="grid h-72 place-items-center rounded-lg border border-neutral-200 bg-white p-4">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-3xl font-black text-brand-black">{totalViews}</p>
                  <p className="text-sm text-neutral-500">Views</p>
                </div>
                <div>
                  <p className="text-3xl font-black text-brand-black">{downloads}</p>
                  <p className="text-sm text-neutral-500">Downloads</p>
                </div>
                <div>
                  <p className="text-3xl font-black text-brand-black">{purchases}</p>
                  <p className="text-sm text-neutral-500">Purchases</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="grid h-72 place-items-center rounded-lg border border-dashed border-neutral-300 bg-white text-sm text-neutral-600">
              No activity data available yet.
            </div>
          )}
        </div>

        <div className="rounded-lg border border-neutral-200 bg-white p-5">
          <h2 className="text-xl font-bold">Event Breakdown</h2>
          <div className="mt-4 space-y-3 text-sm">
            {["product_view", "store_view", "purchase", "download"].map((t) => (
              <div key={t} className="flex items-center justify-between border-b border-neutral-100 pb-2">
                <span className="text-neutral-600">{t.replace("_", " ")}</span>
                <span className="font-bold">{summary[t] ?? 0}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
