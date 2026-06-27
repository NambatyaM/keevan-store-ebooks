"use client";

import { useState, FormEvent } from "react";
import { SimplePage } from "@/components/simple-page";
import { Loader2, Search, CheckCircle, Clock, XCircle, Download } from "lucide-react";
import Link from "next/link";
import { formatUgx } from "@/lib/constants";

type Order = {
  id: string;
  amount: number;
  created_at: string;
  status: string;
  buyer_id: string | null;
  products: { title: string; slug: string };
};

export default function OrderLookupPage() {
  const [email, setEmail] = useState("");
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [downloadUrls, setDownloadUrls] = useState<Record<string, string>>({});
  const [loadingDl, setLoadingDl] = useState<Record<string, boolean>>({});

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    setSearched(true);
    setDownloadUrls({});
    try {
      const res = await fetch(`/api/orders/lookup?email=${encodeURIComponent(email)}`);
      const data = await res.json();
      setOrders(data.orders ?? []);
    } catch {
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (orderId: string) => {
    if (downloadUrls[orderId]) {
      window.open(downloadUrls[orderId], "_blank");
      return;
    }
    setLoadingDl((prev) => ({ ...prev, [orderId]: true }));
    try {
      const res = await fetch(`/api/orders/${orderId}/status`);
      const data = await res.json();
      if (data.downloadUrl) {
        setDownloadUrls((prev) => ({ ...prev, [orderId]: data.downloadUrl }));
        window.open(data.downloadUrl, "_blank");
      }
    } catch {
    } finally {
      setLoadingDl((prev) => {
        const next = { ...prev };
        delete next[orderId];
        return next;
      });
    }
  };

  return (
    <SimplePage title="Look Up Your Orders" eyebrow="Order lookup">
      <div className="rounded-lg border border-neutral-200 p-6">
        <form onSubmit={handleSubmit} className="flex gap-3">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email address"
            required
            className="flex-1 rounded-md border border-neutral-300 px-4 py-2 text-sm focus:border-brand-green focus:outline-none focus:ring-1 focus:ring-brand-green"
          />
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-md bg-brand-green px-5 py-2 text-sm font-semibold text-white hover:bg-[#006f43] disabled:opacity-50"
          >
            {loading ? <Loader2 className="animate-spin" size={16} /> : <Search size={16} />}
            Search
          </button>
        </form>
      </div>

      {loading && (
        <div className="mt-8 flex items-center justify-center py-12">
          <Loader2 className="animate-spin text-brand-green" size={32} />
        </div>
      )}

      {!loading && searched && orders?.length === 0 && (
        <div className="mt-8 rounded-lg border border-neutral-200 p-6 text-center">
          <p className="text-neutral-600">No orders found for this email address.</p>
        </div>
      )}

      {!loading && orders && orders.length > 0 && (
        <div className="mt-8 space-y-4">
          {orders.map((order) => (
            <div key={order.id} className="rounded-lg border border-neutral-200 p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    {order.status === "paid" && <CheckCircle className="text-green-600" size={20} />}
                    {order.status === "pending" && <Clock className="text-amber-500" size={20} />}
                    {order.status === "failed" && <XCircle className="text-red-500" size={20} />}
                    <h3 className="font-semibold text-brand-black">
                      {order.products?.title ?? "Unknown Product"}
                    </h3>
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-neutral-500">
                    {order.status === "paid" && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2.5 py-0.5 text-xs font-medium text-green-700">
                        Paid
                      </span>
                    )}
                    {order.status === "pending" && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-700">
                        Pending
                      </span>
                    )}
                    {order.status === "failed" && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-0.5 text-xs font-medium text-red-700">
                        Failed
                      </span>
                    )}
                    <span>{formatUgx(order.amount)}</span>
                    <span>{new Date(order.created_at).toLocaleDateString("en-UG", { year: "numeric", month: "short", day: "numeric" })}</span>
                  </div>
                </div>
                <div className="ml-4 shrink-0">
                  {order.status === "paid" && (
                    <button
                      onClick={() => handleDownload(order.id)}
                      disabled={loadingDl[order.id]}
                      className="inline-flex items-center gap-1.5 rounded-md bg-brand-green px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#006f43] disabled:opacity-50"
                    >
                      {loadingDl[order.id] ? (
                        <Loader2 className="animate-spin" size={14} />
                      ) : (
                        <Download size={14} />
                      )}
                      Download
                    </button>
                  )}
                  {order.status === "pending" && (
                    <p className="text-xs text-amber-600">Payment in progress — check back later</p>
                  )}
                  {order.status === "failed" && order.products?.slug && (
                    <Link
                      href={`/product/${order.products.slug}`}
                      className="text-xs text-red-600 hover:underline"
                    >
                      Payment failed — try purchasing again
                    </Link>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </SimplePage>
  );
}
