"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { DashboardShell } from "@/components/dashboard-shell";
import { EmptyState } from "@/components/ui/empty-state";
import { TableSkeleton } from "@/components/ui/skeleton";
import { Pagination } from "@/components/ui/pagination";
import { useToast } from "@/components/ui/toast";
import { Search, Users } from "lucide-react";

type Buyer = {
  id: string;
  user_id: string;
  display_name: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  created_at: string;
};

const PAGE_SIZE = 25;

export default function AdminBuyersPage() {
  const { toast } = useToast();
  const [buyers, setBuyers] = useState<Buyer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null);

  const load = useCallback((q: string) => {
    setLoading(true);
    setError(null);
    const params = q ? `?search=${encodeURIComponent(q)}` : "";
    fetch(`/api/admin/buyers${params}`)
      .then((r) => r.json())
      .then((d) => setBuyers(d.buyers ?? []))
      .catch((err) => { console.error("Failed to load buyers:", err); setError("Failed to load buyers."); })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(search); }, [search, load]);
  useEffect(() => { setPage(1); }, [search]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    load(search);
  };

  // Debounced auto-search as user types
  // Debounced auto-search as user types
  useEffect(() => {
    const timer = setTimeout(() => load(search), 300);
    return () => clearTimeout(timer);
  }, [search, load]);

  const totalPages = Math.ceil(buyers.length / PAGE_SIZE);
  const paginated = buyers.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <DashboardShell
      title="Buyers"
      subtitle="View all buyers on the platform"
      role="admin"
    >
      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700">{error}</div>
      )}

      {/* Search */}
      <form onSubmit={handleSearch} className="mb-4 flex gap-2">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); load(search); } }}
            placeholder="Search by name or email..."
            className="w-full rounded-lg border border-border py-2.5 pl-9 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green"
          />
        </div>
        <button
          type="submit"
          className="rounded-lg bg-brand-green px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-green-deep"
        >
          Search
        </button>
      </form>

      {/* Loading */}
      {loading && <TableSkeleton rows={6} />}

      {/* Empty */}
      {!loading && buyers.length === 0 && (
        <EmptyState
          icon={<Users size={48} strokeWidth={1.2} />}
          title="No buyers found"
        />
      )}

      {/* Buyers table */}
      {!loading && buyers.length > 0 && (
        <div className="overflow-hidden rounded-xl border border-border bg-surface-card shadow-card">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-surface">
                  <th className="px-4 py-3 text-left font-semibold text-muted">Name</th>
                  <th className="px-4 py-3 text-left font-semibold text-muted">Email</th>
                  <th className="px-4 py-3 text-left font-semibold text-muted">Phone</th>
                  <th className="px-4 py-3 text-right font-semibold text-muted">Created</th>
                </tr>
              </thead>
              <tbody>
                {paginated.map((b) => (
                  <tr key={b.id} className="border-b border-border transition hover:bg-surface">
                    <td className="px-4 py-3 font-semibold">{b.full_name ?? b.display_name ?? "—"}</td>
                    <td className="px-4 py-3 text-muted">{b.email ?? "—"}</td>
                    <td className="px-4 py-3 text-muted">{b.phone ?? "—"}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-right text-muted">
                      {new Date(b.created_at).toLocaleDateString("en-UG")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination */}
      {!loading && buyers.length > PAGE_SIZE && (
        <div className="mt-6">
          <Pagination page={page} totalPages={totalPages} totalItems={buyers.length} pageSize={PAGE_SIZE} onPageChange={setPage} />
        </div>
      )}

      {/* Mobile cards */}
      {!loading && buyers.length > 0 && (
        <div className="mt-4 grid gap-3 sm:hidden">
          {paginated.map((b) => (
            <div key={b.id} className="rounded-lg border border-border bg-surface-card p-4">
              <p className="font-semibold">{b.full_name ?? b.display_name ?? "—"}</p>
              <p className="mt-1 text-sm text-muted">{b.email ?? "—"}</p>
              <div className="mt-2 flex items-center justify-between text-xs text-muted">
                <span>{b.phone ?? "—"}</span>
                <span>{new Date(b.created_at).toLocaleDateString("en-UG")}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </DashboardShell>
  );
}
