"use client";

import { useEffect, useState } from "react";
import { DashboardShell } from "@/components/dashboard-shell";
import { adminNav } from "@/app/admin/nav";
import { formatUgx } from "@/lib/constants";

export default function AdminCreatorsPage() {
  const [creators, setCreators] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionMsg, setActionMsg] = useState("");
  const [error, setError] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    fetch("/api/admin/creators")
      .then((r) => r.json())
      .then((d) => setCreators(d.creators ?? []))
      .catch((err) => { console.error("Failed to load creators:", err); setError("Failed to load creators."); })
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleStoreAction = async (storeId: string, action: "suspend" | "reactivate") => {
    setActionMsg("");
    try {
      const res = await fetch(`/api/admin/stores/${storeId}/${action}`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        setActionMsg(data.error?.message ?? "Action failed.");
      } else {
        setActionMsg(`Store ${action}d successfully.`);
        load();
      }
    } catch {
      setActionMsg("Network error.");
    }
  };

  return (
    <DashboardShell title="Creators" subtitle="View and manage all creators on the platform." nav={adminNav}>
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
      ) : creators.length === 0 ? (
        <div className="rounded-lg border border-dashed border-neutral-300 bg-white p-8 text-center text-neutral-600">No creators yet.</div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-neutral-200 bg-white">
          <table className="w-full text-sm">
            <thead className="border-b border-neutral-200 bg-neutral-50 text-left">
              <tr>
                <th className="p-3 font-semibold">Name</th>
                <th className="p-3 font-semibold">Email</th>
                <th className="p-3 font-semibold">Store</th>
                <th className="p-3 font-semibold">Status</th>
                <th className="p-3 font-semibold">Balance</th>
                <th className="p-3 font-semibold">Joined</th>
                <th className="p-3 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {creators.map((c) => (
                <tr key={c.id} className="border-b border-neutral-100">
                  <td className="p-3 font-medium">{c.full_name ?? c.display_name ?? "—"}</td>
                  <td className="p-3 text-neutral-600">{c.email ?? "—"}</td>
                  <td className="p-3">
                    {c.store_slug ? (
                      <span className="font-medium">{c.store_name ?? c.store_slug}</span>
                    ) : "—"}
                  </td>
                  <td className="p-3">
                    <span className={`inline-block rounded px-2 py-0.5 text-xs font-semibold ${
                      c.store_status === "active" ? "bg-green-100 text-green-800" :
                      c.store_status === "suspended" ? "bg-red-100 text-red-800" :
                      "bg-neutral-100 text-neutral-600"
                    }`}>{c.store_status ?? "no store"}</span>
                  </td>
                    <td className="p-3">{formatUgx(c.available_balance ?? 0)}</td>
                  <td className="p-3 text-neutral-500">{new Date(c.created_at).toLocaleDateString("en-UG")}</td>
                  <td className="p-3">
                    {c.store_id && c.store_status === "active" && (
                      <button
                        onClick={() => handleStoreAction(c.store_id, "suspend")}
                        className="rounded bg-red-600 px-2 py-1 text-xs font-semibold text-white hover:bg-red-700"
                      >
                        Suspend Store
                      </button>
                    )}
                    {c.store_id && c.store_status === "suspended" && (
                      <button
                        onClick={() => handleStoreAction(c.store_id, "reactivate")}
                        className="rounded bg-green-600 px-2 py-1 text-xs font-semibold text-white hover:bg-green-700"
                      >
                        Reactivate Store
                      </button>
                    )}
                    {!c.store_id && (
                      <span className="text-xs text-neutral-400">No store</span>
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
