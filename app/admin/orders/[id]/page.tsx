"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { DashboardShell } from "@/components/dashboard-shell";
import { formatUgx } from "@/lib/constants";

type Payment = {
  id: string;
  status: string;
  merchant_reference: string | null;
  tracking_id: string | null;
  verified_at: string | null;
  created_at: string;
};

type OrderDetail = {
  id: string;
  amount: number;
  platform_fee: number;
  creator_earnings: number;
  status: string;
  buyer_email: string;
  buyer_name: string;
  created_at: string;
  paid_at: string | null;
  products: { title: string; slug: string } | null;
  creators: { display_name: string; email: string } | null;
  payments: Payment[];
};

export default function AdminOrderDetailPage() {
  const params = useParams();
  const orderId = params.id as string;

  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [marking, setMarking] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [downloadToken, setDownloadToken] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    setError(null);
    fetch(`/api/admin/orders/${orderId}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.error) { setError(d.error.message); setOrder(null); }
        else { setOrder(d.order); }
      })
      .catch(() => setError("Failed to load order."))
      .finally(() => setLoading(false));
  };

  useEffect(() => { if (orderId) load(); }, [orderId]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleMarkPaid = async () => {
    setMarking(true);
    setMsg(null);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}/mark-paid`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setMsg({ type: "error", text: data.error?.message ?? "Failed to mark as paid." });
      } else {
        setMsg({ type: "success", text: "Order marked as paid successfully." });
        setDownloadToken(data.download_token);
        load();
      }
    } catch {
      setMsg({ type: "error", text: "Network error." });
    } finally {
      setMarking(false);
      setShowConfirm(false);
    }
  };

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

  const payment = order?.payments?.[0] ?? null;

  return (
      <DashboardShell title="Order Details" subtitle={`Order ID: ${orderId}`} role="admin">
      {loading && (
        <div className="rounded-lg border border-dashed border-neutral-300 bg-white p-8 text-center text-neutral-600">Loading...</div>
      )}
      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700">{error}</div>
      )}
      {msg && (
        <div className={`mb-4 rounded-lg border p-3 text-sm font-semibold ${
          msg.type === "success" ? "border-green-200 bg-green-50 text-green-700" : "border-red-200 bg-red-50 text-red-700"
        }`}>{msg.text}</div>
      )}

      {order && (
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <div className="rounded-lg border border-neutral-200 bg-white p-6">
              <h2 className="mb-4 text-lg font-bold">Order Information</h2>
              <dl className="grid gap-3 text-sm sm:grid-cols-2">
                <div>
                  <dt className="text-neutral-500">Order ID</dt>
                  <dd className="font-mono font-medium">{order.id}</dd>
                </div>
                <div>
                  <dt className="text-neutral-500">Status</dt>
                  <dd>{statusBadge(order.status)}</dd>
                </div>
                <div>
                  <dt className="text-neutral-500">Product</dt>
                  <dd className="font-medium">
                    {order.products ? (
                      <Link href={`/product/${order.products.slug}`} className="text-brand-green hover:underline">
                        {order.products.title}
                      </Link>
                    ) : "—"}
                  </dd>
                </div>
                <div>
                  <dt className="text-neutral-500">Creator</dt>
                  <dd className="font-medium">{order.creators?.display_name ?? "—"}</dd>
                </div>
                <div>
                  <dt className="text-neutral-500">Buyer Name</dt>
                  <dd className="font-medium">{order.buyer_name}</dd>
                </div>
                <div>
                  <dt className="text-neutral-500">Buyer Email</dt>
                  <dd className="font-medium">{order.buyer_email}</dd>
                </div>
                <div>
                  <dt className="text-neutral-500">Amount</dt>
                  <dd className="font-medium">{formatUgx(order.amount)}</dd>
                </div>
                <div>
                  <dt className="text-neutral-500">Platform Fee</dt>
                  <dd className="font-medium">{formatUgx(order.platform_fee)}</dd>
                </div>
                <div>
                  <dt className="text-neutral-500">Creator Earnings</dt>
                  <dd className="font-medium">{formatUgx(order.creator_earnings)}</dd>
                </div>
                <div>
                  <dt className="text-neutral-500">Created</dt>
                  <dd className="font-medium">{new Date(order.created_at).toLocaleString("en-UG")}</dd>
                </div>
                <div>
                  <dt className="text-neutral-500">Paid At</dt>
                  <dd className="font-medium">{order.paid_at ? new Date(order.paid_at).toLocaleString("en-UG") : "—"}</dd>
                </div>
              </dl>
            </div>

            {payment && (
              <div className="rounded-lg border border-neutral-200 bg-white p-6">
                <h2 className="mb-4 text-lg font-bold">Payment Information</h2>
                <dl className="grid gap-3 text-sm sm:grid-cols-2">
                  <div>
                    <dt className="text-neutral-500">Payment ID</dt>
                    <dd className="font-mono font-medium">{payment.id}</dd>
                  </div>
                  <div>
                    <dt className="text-neutral-500">Status</dt>
                    <dd>{statusBadge(payment.status)}</dd>
                  </div>
                  {payment.merchant_reference && (
                    <div>
                      <dt className="text-neutral-500">Merchant Reference</dt>
                      <dd className="font-mono text-xs font-medium">{payment.merchant_reference}</dd>
                    </div>
                  )}
                  {payment.tracking_id && (
                    <div>
                      <dt className="text-neutral-500">Tracking ID</dt>
                      <dd className="font-mono text-xs font-medium">{payment.tracking_id}</dd>
                    </div>
                  )}
                  {payment.verified_at && (
                    <div>
                      <dt className="text-neutral-500">Verified At</dt>
                      <dd className="font-medium">{new Date(payment.verified_at).toLocaleString("en-UG")}</dd>
                    </div>
                  )}
                </dl>
              </div>
            )}
          </div>

          <div className="space-y-6">
            {order.status === "pending" && (
              <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-6">
                <h2 className="mb-3 text-lg font-bold text-yellow-800">Manual Action Required</h2>
                <p className="mb-4 text-sm text-yellow-700">
                  This order is still pending. If the payment was received outside the normal flow, you can mark it as paid manually.
                </p>
                {!showConfirm ? (
                  <button
                    onClick={() => setShowConfirm(true)}
                    className="w-full rounded-md bg-brand-green px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#006f43]"
                  >
                    Mark as Paid
                  </button>
                ) : (
                  <div className="space-y-3">
                    <p className="text-sm font-semibold text-yellow-800">Are you sure you want to mark this order as paid?</p>
                    <div className="flex gap-2">
                      <button
                        onClick={handleMarkPaid}
                        disabled={marking}
                        className="flex-1 rounded-md bg-brand-green px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#006f43] disabled:opacity-70"
                      >
                        {marking ? "Processing..." : "Confirm"}
                      </button>
                      <button
                        onClick={() => setShowConfirm(false)}
                        className="flex-1 rounded-md border border-neutral-300 bg-white px-4 py-2 text-sm font-semibold text-neutral-700 transition hover:bg-neutral-50"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {downloadToken && (
              <div className="rounded-lg border border-green-200 bg-green-50 p-6">
                <h2 className="mb-3 text-lg font-bold text-green-800">Download Link Generated</h2>
                <p className="mb-2 text-sm text-green-700">Share this token with the buyer:</p>
                <div className="rounded-md bg-white p-3 font-mono text-xs break-all border border-green-200">
                  {downloadToken}
                </div>
                <p className="mt-2 text-xs text-green-600">Expires in 7 days.</p>
              </div>
            )}

            {order.status === "paid" && !downloadToken && (
              <div className="rounded-lg border border-green-200 bg-green-50 p-6">
                <h2 className="mb-2 text-lg font-bold text-green-800">Order Paid</h2>
                <p className="text-sm text-green-700">This order has been marked as paid.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </DashboardShell>
  );
}
