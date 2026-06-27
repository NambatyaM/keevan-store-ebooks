"use client";

import { useEffect, useState } from "react";
import { DashboardShell } from "@/components/dashboard-shell";
import { adminNav } from "@/app/admin/nav";
import { Search } from "lucide-react";

type Buyer = {
  id: string;
  user_id: string;
  display_name: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  created_at: string;
};

export default function AdminBuyersPage() {
  const [buyers, setBuyers] = useState<Buyer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const load = (q: string) => {
    setLoading(true);
    const params = q ? `?search=${encodeURIComponent(q)}` : "";
    fetch(`/api/admin/buyers${params}`)
      .then((r) => r.json())
      .then((d) => setBuyers(d.buyers ?? []))
      .catch((err) => { console.error("Failed to load buyers:", err); setError("Failed to load buyers."); })
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(search); }, []);

  function handleSearch(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    load(search);
  }

  return (
    <DashboardShell title="Buyers" subtitle="View all buyers on the platform." nav={adminNav}>
      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700">{error}</div>
      )}

      <form onSubmit={handleSearch} className="mb-4 flex gap-2">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
          <input
            className="focus-ring w-full rounded-md border border-neutral-300 py-2.5 pl-9 pr-4 text-sm"
            type="text"
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <button
          type="submit"
          className="rounded-md bg-brand-green px-4 py-2 text-sm font-semibold text-white hover:bg-[#006f43]"
        >
          Search
        </button>
      </form>

      {loading ? (
        <div className="rounded-lg border border-dashed border-neutral-300 bg-white p-8 text-center text-neutral-600">Loading...</div>
      ) : buyers.length === 0 ? (
        <div className="rounded-lg border border-dashed border-neutral-300 bg-white p-8 text-center text-neutral-600">No buyers found.</div>
      ) : (
        <>
          <div className="hidden overflow-x-auto rounded-lg border border-neutral-200 bg-white md:block">
            <table className="w-full text-sm">
              <thead className="border-b border-neutral-200 bg-neutral-50 text-left">
                <tr>
                  <th className="p-3 font-semibold">Name</th>
                  <th className="p-3 font-semibold">Email</th>
                  <th className="p-3 font-semibold">Phone</th>
                  <th className="p-3 font-semibold">Created</th>
                </tr>
              </thead>
              <tbody>
                {buyers.map((b) => (
                  <tr key={b.id} className="border-b border-neutral-100">
                    <td className="p-3 font-medium">{b.full_name ?? b.display_name ?? "—"}</td>
                    <td className="p-3 text-neutral-600">{b.email ?? "—"}</td>
                    <td className="p-3 text-neutral-600">{b.phone ?? "—"}</td>
                    <td className="p-3 text-neutral-500 whitespace-nowrap">{new Date(b.created_at).toLocaleDateString("en-UG")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="grid gap-3 md:hidden">
            {buyers.map((b) => (
              <div key={b.id} className="rounded-lg border border-neutral-200 bg-white p-4">
                <p className="font-medium">{b.full_name ?? b.display_name ?? "—"}</p>
                <p className="mt-1 text-sm text-neutral-600">{b.email ?? "—"}</p>
                <div className="mt-2 flex items-center justify-between text-sm text-neutral-500">
                  <span>{b.phone ?? "—"}</span>
                  <span>{new Date(b.created_at).toLocaleDateString("en-UG")}</span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </DashboardShell>
  );
}
