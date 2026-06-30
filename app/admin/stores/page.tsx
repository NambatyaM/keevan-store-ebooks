"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { DashboardShell } from "@/components/dashboard-shell";
import { Badge, getBadgeVariant } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { TableSkeleton } from "@/components/ui/skeleton";
import { Pagination } from "@/components/ui/pagination";
import { useToast } from "@/components/ui/toast";
import { Search, Store, ExternalLink, Ban, CheckCircle } from "lucide-react";

type StoreItem = {
  id: string;
  creator_id: string;
  name: string;
  slug: string;
  description: string | null;
  status: string;
  currency: string;
  created_at: string;
  creator_display_name: string | null;
  creator_full_name: string | null;
  creator_email: string | null;
};

const PAGE_SIZE = 25;

export default function AdminStoresPage() {
  const { toast } = useToast();
  const [stores, setStores] = useState<StoreItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [page, setPage] = useState(1);

  const load = () => {
    setLoading(true);
    setError(null);
    fetch("/api/admin/stores")
      .then((r) => r.json())
      .then((d) => setStores(d.stores ?? []))
      .catch((err) => { console.error("Failed to load stores:", err); setError("Failed to load stores."); })
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    let result = [...stores];

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (s) =>
          (s.name || "").toLowerCase().includes(q) ||
          (s.slug || "").toLowerCase().includes(q) ||
          (s.creator_display_name || "").toLowerCase().includes(q) ||
          (s.creator_email || "").toLowerCase().includes(q),
      );
    }

    if (filter === "active") result = result.filter((s) => s.status === "active");
    else if (filter === "suspended") result = result.filter((s) => s.status === "suspended");

    result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    return result;
  }, [stores, search, filter]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleSuspend = async (storeId: string, name: string) => {
    try {
      const res = await fetch(`/api/admin/stores/${storeId}/suspend`, { method: "POST" });
      if (!res.ok) throw new Error("Failed");
      toast("success", `${name} suspended successfully`);
      load();
    } catch {
      toast("error", "Failed to suspend store");
    }
  };

  const handleReactivate = async (storeId: string, name: string) => {
    try {
      const res = await fetch(`/api/admin/stores/${storeId}/reactivate`, { method: "POST" });
      if (!res.ok) throw new Error("Failed");
      toast("success", `${name} reactivated successfully`);
      load();
    } catch {
      toast("error", "Failed to reactivate store");
    }
  };

  return (
    <DashboardShell
      title="Stores"
      subtitle={`${stores.length} total stores on the platform`}
      role="admin"
    >
      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700">{error}</div>
      )}

      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            type="text"
            placeholder="Search by store name, slug, or creator..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full rounded-lg border border-border py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green"
          />
        </div>
        <select
          value={filter}
          onChange={(e) => { setFilter(e.target.value); setPage(1); }}
          className="rounded-lg border border-border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green"
        >
          <option value="all">All</option>
          <option value="active">Active</option>
          <option value="suspended">Suspended</option>
        </select>
      </div>

      {loading && <TableSkeleton rows={8} />}

      {!loading && filtered.length === 0 && (
        <EmptyState
          icon={<Store size={48} strokeWidth={1.2} />}
          title={stores.length === 0 ? "No stores yet" : "No stores match your filters"}
          description="When creators sign up, their stores will appear here."
        />
      )}

      {!loading && filtered.length > 0 && (
        <div className="overflow-hidden rounded-xl border border-border bg-surface-card shadow-card">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-surface">
                  <th className="px-4 py-3 text-left font-semibold text-muted">Store</th>
                  <th className="px-4 py-3 text-left font-semibold text-muted">Creator</th>
                  <th className="px-4 py-3 text-left font-semibold text-muted">Status</th>
                  <th className="px-4 py-3 text-left font-semibold text-muted">Currency</th>
                  <th className="px-4 py-3 text-right font-semibold text-muted">Created</th>
                  <th className="px-4 py-3 text-right font-semibold text-muted">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginated.map((store) => (
                  <tr key={store.id} className="border-b border-border transition hover:bg-surface">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-brand-mist text-sm font-bold text-brand-green">
                          {store.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-brand-black">{store.name}</p>
                          <p className="text-xs text-muted">/{store.slug}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-semibold">{store.creator_display_name || store.creator_full_name || "—"}</p>
                      {store.creator_email && (
                        <p className="text-xs text-muted">{store.creator_email}</p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={getBadgeVariant(store.status)}>{store.status}</Badge>
                    </td>
                    <td className="px-4 py-3 text-muted">{store.currency}</td>
                    <td className="px-4 py-3 text-right text-muted whitespace-nowrap">
                      {new Date(store.created_at).toLocaleDateString("en-UG")}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        {store.slug && (
                          <Link
                            href={`/store/${store.slug}`}
                            target="_blank"
                            className="rounded-md p-1.5 text-muted transition hover:bg-brand-mist hover:text-brand-green"
                            title="View store"
                          >
                            <ExternalLink size={15} />
                          </Link>
                        )}
                        {store.status === "active" && (
                          <button
                            onClick={() => handleSuspend(store.id, store.name)}
                            className="rounded-md p-1.5 text-muted transition hover:bg-red-50 hover:text-error"
                            title="Suspend"
                          >
                            <Ban size={15} />
                          </button>
                        )}
                        {store.status === "suspended" && (
                          <button
                            onClick={() => handleReactivate(store.id, store.name)}
                            className="rounded-md p-1.5 text-muted transition hover:bg-green-50 hover:text-success"
                            title="Reactivate"
                          >
                            <CheckCircle size={15} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {!loading && filtered.length > PAGE_SIZE && (
        <div className="mt-6">
          <Pagination
            page={page}
            totalPages={totalPages}
            totalItems={filtered.length}
            pageSize={PAGE_SIZE}
            onPageChange={setPage}
          />
        </div>
      )}
    </DashboardShell>
  );
}
