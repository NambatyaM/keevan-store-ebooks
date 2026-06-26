"use client";

import { useEffect, useState } from "react";
import { DashboardShell } from "@/components/dashboard-shell";
import { adminNav } from "@/app/admin/nav";

type Withdrawal = {
  id: string;
  amount: number;
  status: string;
  payout_method: unknown;
  payout_details: unknown;
  requested_at: string;
  processed_at: string | null;
  creators: { display_name: string } | null;
};

export default function AdminWithdrawalsPage() {
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionMsg, setActionMsg] = useState("");
  const [notes, setNotes] = useState("");
  const [activeAction, setActiveAction] = useState<{ id: string; action: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    fetch("/api/admin/withdrawals?limit=200")
      .then((r) => r.json())
      .then((d) => setWithdrawals(d.withdrawals ?? []))
      .catch((err) => { console.error("Failed to load withdrawals:", err); setError("Failed to load withdrawals."); })
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleAction = async (id: string, action: string) => {
    setActionMsg("");
    setActiveAction(null);
    try {
      const res = await fetch(`/api/admin/withdrawals/${id}/${action}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes: notes || undefined })
      });
      const data = await res.json();
      if (!res.ok) {
        setActionMsg(data.error?.message ?? "Action failed.");
      } else {
        setActionMsg(`Withdrawal ${action} successfully.`);
        setNotes("");
        load();
      }
    } catch {
      setActionMsg("Network error.");
    }
  };

  return (
    <DashboardShell title="Withdrawal Management" subtitle="Approve, reject, mark paid, and add notes to creator withdrawal requests." nav={adminNav}>
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
      ) : withdrawals.length === 0 ? (
        <div className="rounded-lg border border-dashed border-neutral-300 bg-white p-8 text-center text-neutral-600">No withdrawal requests yet.</div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-neutral-200 bg-white">
          <table className="w-full text-sm">
            <thead className="border-b border-neutral-200 bg-neutral-50 text-left">
              <tr>
                <th className="p-3 font-semibold">Creator</th>
                <th className="p-3 font-semibold">Amount</th>
                <th className="p-3 font-semibold">Method</th>
                <th className="p-3 font-semibold">Details</th>
                <th className="p-3 font-semibold">Status</th>
                <th className="p-3 font-semibold">Requested</th>
                <th className="p-3 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {withdrawals.map((w) => (
                <tr key={w.id} className="border-b border-neutral-100">
                  <td className="p-3 font-medium">{w.creators?.display_name ?? "—"}</td>
                  <td className="p-3">{new Intl.NumberFormat("en-UG", { style: "currency", currency: "UGX", maximumFractionDigits: 0 }).format(w.amount)}</td>
                  <td className="p-3 text-neutral-600">{String(w.payout_method ?? "—")}</td>
                  <td className="p-3 text-neutral-600 max-w-[150px] truncate">{typeof w.payout_details === "object" ? JSON.stringify(w.payout_details) : String(w.payout_details ?? "—")}</td>
                  <td className="p-3">
                    <span className={`inline-block rounded px-2 py-0.5 text-xs font-semibold ${
                      w.status === "paid" ? "bg-green-100 text-green-800" :
                      w.status === "approved" ? "bg-blue-100 text-blue-800" :
                      w.status === "rejected" ? "bg-red-100 text-red-800" :
                      "bg-yellow-100 text-yellow-800"
                    }`}>{w.status}</span>
                  </td>
                  <td className="p-3 text-neutral-500">{new Date(w.requested_at).toLocaleDateString("en-UG")}</td>
                  <td className="p-3">
                    {w.status === "pending" && (
                      <div className="flex flex-col gap-2">
                        {activeAction?.id === w.id ? (
                          <div className="flex flex-col gap-2">
                            <input
                              type="text"
                              placeholder="Notes (optional)"
                              value={notes}
                              onChange={(e) => setNotes(e.target.value)}
                              className="w-40 rounded border border-neutral-300 px-2 py-1 text-xs"
                            />
                            <div className="flex gap-1">
                              <button onClick={() => handleAction(w.id, "approve")} className="rounded bg-blue-600 px-2 py-1 text-xs font-semibold text-white hover:bg-blue-700">Confirm Approve</button>
                              <button onClick={() => handleAction(w.id, "reject")} className="rounded bg-red-600 px-2 py-1 text-xs font-semibold text-white hover:bg-red-700">Confirm Reject</button>
                              <button onClick={() => { setActiveAction(null); setNotes(""); }} className="rounded bg-neutral-300 px-2 py-1 text-xs font-semibold text-neutral-700 hover:bg-neutral-400">Cancel</button>
                            </div>
                          </div>
                        ) : (
                          <button onClick={() => setActiveAction({ id: w.id, action: "pending" })} className="rounded bg-neutral-600 px-2 py-1 text-xs font-semibold text-white hover:bg-neutral-700">
                            Take Action
                          </button>
                        )}
                      </div>
                    )}
                    {w.status === "approved" && (
                      <div className="flex flex-col gap-2">
                        {activeAction?.id === w.id ? (
                          <div className="flex flex-col gap-2">
                            <input
                              type="text"
                              placeholder="Notes (optional)"
                              value={notes}
                              onChange={(e) => setNotes(e.target.value)}
                              className="w-40 rounded border border-neutral-300 px-2 py-1 text-xs"
                            />
                            <div className="flex gap-1">
                              <button onClick={() => handleAction(w.id, "mark-paid")} className="rounded bg-green-600 px-2 py-1 text-xs font-semibold text-white hover:bg-green-700">Confirm Pay</button>
                              <button onClick={() => setActiveAction(null)} className="rounded bg-neutral-300 px-2 py-1 text-xs font-semibold text-neutral-700 hover:bg-neutral-400">Cancel</button>
                            </div>
                          </div>
                        ) : (
                          <button onClick={() => setActiveAction({ id: w.id, action: "approved" })} className="rounded bg-green-600 px-2 py-1 text-xs font-semibold text-white hover:bg-green-700">
                            Mark Paid
                          </button>
                        )}
                      </div>
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
