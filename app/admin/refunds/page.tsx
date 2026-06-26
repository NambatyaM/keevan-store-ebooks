"use client";

import { useEffect, useState } from "react";
import { DashboardShell } from "@/components/dashboard-shell";
import { adminNav } from "@/app/admin/nav";

type Refund = {
  id: string;
  buyer_email: string;
  buyer_name: string;
  reason: string;
  status: string;
  reversed_amount: number | null;
  created_at: string;
  orders: { amount: number; product_id: string; products: { title: string } | null } | null;
  admin_users: { email: string } | null;
};

export default function AdminRefundsPage() {
  const [refunds, setRefunds] = useState<Refund[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionMsg, setActionMsg] = useState("");
  const [notes, setNotes] = useState("");
  const [activeAction, setActiveAction] = useState<{ id: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    fetch("/api/admin/refunds?limit=200")
      .then((r) => r.json())
      .then((d) => setRefunds(d.refunds ?? []))
      .catch((err) => { console.error("Failed to load refunds:", err); setError("Failed to load refunds."); })
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleAction = async (id: string, action: string) => {
    setActionMsg("");
    setActiveAction(null);
    try {
      const res = await fetch(`/api/admin/refunds/${id}/${action}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes: notes || undefined })
      });
      const data = await res.json();
      if (!res.ok) {
        setActionMsg(data.error?.message ?? "Action failed.");
      } else {
        setActionMsg(`Refund ${action} successfully.`);
        setNotes("");
        load();
      }
    } catch {
      setActionMsg("Network error.");
    }
  };

  const orderAmount = (r: Refund) => r.orders?.amount ?? 0;

  return (
    <DashboardShell title="Refund Management" subtitle="Review and process customer refund requests." nav={adminNav}>
      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700">{error}</div>
      )}
      {actionMsg && (
        <p className={`mb-4 rounded-lg border p-3 text-sm font-semibold ${
          actionMsg.includes("successfully") ? "border-green-200 bg-green-50 text-green-700" : "border-red-200 bg-red-50 text-red-700"
        }`}>{actionMsg}</p>
      )}

      {loading ? (
        <div className="rounded-lg border border-dashed border-neutral-300 bg-white p-8 text-center text-neutral-600">Loading...</div>
      ) : refunds.length === 0 ? (
        <div className="rounded-lg border border-dashed border-neutral-300 bg-white p-8 text-center text-neutral-600">No refund requests yet.</div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-neutral-200 bg-white">
          <table className="w-full text-sm">
            <thead className="border-b border-neutral-200 bg-neutral-50 text-left">
              <tr>
                <th className="p-3 font-semibold">Product</th>
                <th className="p-3 font-semibold">Buyer</th>
                <th className="p-3 font-semibold">Amount</th>
                <th className="p-3 font-semibold">Reason</th>
                <th className="p-3 font-semibold">Status</th>
                <th className="p-3 font-semibold">Requested</th>
                <th className="p-3 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {refunds.map((r) => (
                <tr key={r.id} className="border-b border-neutral-100">
                  <td className="p-3 font-medium">{r.orders?.products?.title ?? "—"}</td>
                  <td className="p-3 text-neutral-600">
                    <div>{r.buyer_name}</div>
                    <div className="text-xs text-neutral-400">{r.buyer_email}</div>
                  </td>
                  <td className="p-3">{new Intl.NumberFormat("en-UG", { style: "currency", currency: "UGX", maximumFractionDigits: 0 }).format(orderAmount(r))}</td>
                  <td className="max-w-[200px] truncate p-3 text-neutral-600" title={r.reason}>{r.reason}</td>
                  <td className="p-3">
                    <span className={`inline-block rounded px-2 py-0.5 text-xs font-semibold ${
                      r.status === "approved" ? "bg-green-100 text-green-800" :
                      r.status === "rejected" ? "bg-red-100 text-red-800" :
                      "bg-yellow-100 text-yellow-800"
                    }`}>{r.status}</span>
                  </td>
                  <td className="p-3 text-neutral-500">{new Date(r.created_at).toLocaleDateString("en-UG")}</td>
                  <td className="p-3">
                    {r.status === "pending" && (
                      <div className="flex flex-col gap-2">
                        {activeAction?.id === r.id ? (
                          <div className="flex flex-col gap-2">
                            <input
                              type="text"
                              placeholder="Admin notes (optional)"
                              value={notes}
                              onChange={(e) => setNotes(e.target.value)}
                              className="w-44 rounded border border-neutral-300 px-2 py-1 text-xs"
                            />
                            <div className="flex gap-1">
                              <button onClick={() => handleAction(r.id, "approve")} className="rounded bg-blue-600 px-2 py-1 text-xs font-semibold text-white hover:bg-blue-700">Confirm Approve</button>
                              <button onClick={() => handleAction(r.id, "reject")} className="rounded bg-red-600 px-2 py-1 text-xs font-semibold text-white hover:bg-red-700">Confirm Reject</button>
                              <button onClick={() => { setActiveAction(null); setNotes(""); }} className="rounded bg-neutral-300 px-2 py-1 text-xs font-semibold text-neutral-700 hover:bg-neutral-400">Cancel</button>
                            </div>
                          </div>
                        ) : (
                          <button onClick={() => setActiveAction({ id: r.id })} className="rounded bg-neutral-600 px-2 py-1 text-xs font-semibold text-white hover:bg-neutral-700">
                            Take Action
                          </button>
                        )}
                      </div>
                    )}
                    {r.status === "approved" && r.admin_users && (
                      <span className="text-xs text-neutral-500">by {r.admin_users.email}</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </DashboardShell>
  );
}
