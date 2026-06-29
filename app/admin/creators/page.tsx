"use client";

import { useEffect, useState, useMemo } from "react";
import { DashboardShell } from "@/components/dashboard-shell";
import { Badge, getBadgeVariant } from "@/components/ui/badge";
import { Modal, ConfirmModal } from "@/components/ui/modal";
import { EmptyState } from "@/components/ui/empty-state";
import { TableSkeleton } from "@/components/ui/skeleton";
import { Pagination } from "@/components/ui/pagination";
import { useToast } from "@/components/ui/toast";
import { formatUgx } from "@/lib/constants";
import { Search, Users, Mail, Ban, CheckCircle, Eye, ExternalLink } from "lucide-react";
import Link from "next/link";

type Creator = {
  id: string;
  creator_id?: string;
  store_id?: string;
  display_name: string;
  full_name: string | null;
  email: string;
  store_name: string | null;
  store_slug: string | null;
  store_status: string | null;
  available_balance: number;
  total_sales?: number;
  total_earnings?: number;
  platform_revenue?: number;
  product_count?: number;
  created_at: string;
};

const PAGE_SIZE = 25;

export default function AdminCreatorsPage() {
  const { toast } = useToast();
  const [creators, setCreators] = useState<Creator[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all");
  const [sort, setSort] = useState("newest");
  const [page, setPage] = useState(1);
  const [selectedCreator, setSelectedCreator] = useState<Creator | null>(null);
  const [suspendTarget, setSuspendTarget] = useState<Creator | null>(null);
  const [suspendReason, setSuspendReason] = useState("");

  const load = () => {
    setLoading(true);
    setError(null);
    fetch("/api/admin/creators")
      .then((r) => r.json())
      .then((d) => setCreators(d.creators ?? []))
      .catch((err) => { console.error("Failed to load creators:", err); setError("Failed to load creators."); })
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    let result = [...creators];

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (c) =>
          (c.display_name || "").toLowerCase().includes(q) ||
          (c.email || "").toLowerCase().includes(q) ||
          (c.store_name || "").toLowerCase().includes(q),
      );
    }

    if (filter === "active") result = result.filter((c) => c.store_status === "active");
    else if (filter === "suspended") result = result.filter((c) => c.store_status === "suspended");
    else if (filter === "new") {
      const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString();
      result = result.filter((c) => c.created_at >= weekAgo);
    }

    result.sort((a, b) => {
      switch (sort) {
        case "newest": return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case "oldest": return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case "sales": return (b.total_sales ?? 0) - (a.total_sales ?? 0);
        case "revenue": return (b.total_earnings ?? 0) - (a.total_earnings ?? 0);
        case "products": return (b.product_count ?? 0) - (a.product_count ?? 0);
        default: return 0;
      }
    });

    return result;
  }, [creators, search, filter, sort]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleSuspend = async () => {
    if (!suspendTarget?.store_id) return;
    try {
      const res = await fetch(`/api/admin/stores/${suspendTarget.store_id}/suspend`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: suspendReason || undefined }),
      });
      if (!res.ok) throw new Error("Failed");
      toast("success", `${suspendTarget.display_name || suspendTarget.email} suspended successfully`);
      setSuspendTarget(null);
      setSuspendReason("");
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
      title="Creators"
      subtitle={`${creators.length} total creators on the platform`}
      role="admin"
    >
      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700">{error}</div>
      )}

      {/* Filter bar */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            type="text"
            placeholder="Search by name, email, or store..."
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
          <option value="new">New (7 days)</option>
        </select>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          className="rounded-lg border border-border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green"
        >
          <option value="newest">Newest</option>
          <option value="oldest">Oldest</option>
          <option value="sales">Most Sales</option>
          <option value="revenue">Most Revenue</option>
          <option value="products">Most Products</option>
        </select>
      </div>

      {/* Loading */}
      {loading && <TableSkeleton rows={8} />}

      {/* Empty */}
      {!loading && filtered.length === 0 && (
        <EmptyState
          icon={<Users size={48} strokeWidth={1.2} />}
          title={creators.length === 0 ? "No creators yet" : "No creators match your filters"}
          description="When creators sign up, they'll appear here."
        />
      )}

      {/* Creators table */}
      {!loading && filtered.length > 0 && (
        <div className="overflow-hidden rounded-xl border border-border bg-surface-card shadow-card">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-surface">
                  <th className="px-4 py-3 text-left font-semibold text-muted">Creator</th>
                  <th className="px-4 py-3 text-left font-semibold text-muted">Store Status</th>
                  <th className="px-4 py-3 text-right font-semibold text-muted">Products</th>
                  <th className="px-4 py-3 text-right font-semibold text-muted">Sales</th>
                  <th className="px-4 py-3 text-right font-semibold text-muted">Earnings</th>
                  <th className="px-4 py-3 text-right font-semibold text-muted">Platform Rev.</th>
                  <th className="px-4 py-3 text-right font-semibold text-muted">Balance</th>
                  <th className="px-4 py-3 text-right font-semibold text-muted">Joined</th>
                  <th className="px-4 py-3 text-right font-semibold text-muted">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginated.map((c) => (
                  <tr key={c.id} className="border-b border-border transition hover:bg-surface">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-brand-green text-sm font-bold text-white">
                          {(c.display_name || c.email || "?").charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-brand-black">{c.display_name || c.full_name || "—"}</p>
                          <p className="text-xs text-muted truncate">{c.email}</p>
                          {c.store_name && (
                            <p className="text-xs text-brand-green truncate">{c.store_name}</p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={getBadgeVariant(c.store_status ?? "no store")}>
                        {c.store_status ?? "no store"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right">{c.product_count ?? 0}</td>
                    <td className="px-4 py-3 text-right font-semibold">{c.total_sales ?? 0}</td>
                    <td className="px-4 py-3 text-right text-success">{formatUgx(c.total_earnings ?? 0)}</td>
                    <td className="px-4 py-3 text-right">{formatUgx(c.platform_revenue ?? 0)}</td>
                    <td className="px-4 py-3 text-right">{formatUgx(c.available_balance ?? 0)}</td>
                    <td className="px-4 py-3 text-right text-muted whitespace-nowrap">
                      {new Date(c.created_at).toLocaleDateString("en-UG")}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setSelectedCreator(c)}
                          className="rounded-md p-1.5 text-muted transition hover:bg-brand-mist hover:text-brand-green"
                          title="View details"
                        >
                          <Eye size={15} />
                        </button>
                        {c.store_id && c.store_status === "active" && (
                          <button
                            onClick={() => setSuspendTarget(c)}
                            className="rounded-md p-1.5 text-muted transition hover:bg-red-50 hover:text-error"
                            title="Suspend"
                          >
                            <Ban size={15} />
                          </button>
                        )}
                        {c.store_id && c.store_status === "suspended" && (
                          <button
                            onClick={() => handleReactivate(c.store_id!, c.display_name || c.email)}
                            className="rounded-md p-1.5 text-muted transition hover:bg-green-50 hover:text-success"
                            title="Reactivate"
                          >
                            <CheckCircle size={15} />
                          </button>
                        )}
                        {c.store_slug && (
                          <Link
                            href={`/store/${c.store_slug}`}
                            target="_blank"
                            className="rounded-md p-1.5 text-muted transition hover:bg-brand-mist hover:text-brand-green"
                            title="View store"
                          >
                            <ExternalLink size={15} />
                          </Link>
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

      {/* Pagination */}
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

      {/* Creator detail modal */}
      <Modal open={!!selectedCreator} onClose={() => setSelectedCreator(null)} title="Creator Details" size="lg">
        {selectedCreator && (
          <div className="space-y-5">
            <div className="flex items-center gap-4">
              <div className="grid h-14 w-14 place-items-center rounded-full bg-brand-green text-xl font-bold text-white">
                {(selectedCreator.display_name || selectedCreator.email || "?").charAt(0).toUpperCase()}
              </div>
              <div>
                <h4 className="text-lg font-bold">{selectedCreator.display_name || selectedCreator.full_name || "—"}</h4>
                <p className="text-sm text-muted">{selectedCreator.email}</p>
                {selectedCreator.store_name && (
                  <p className="text-sm text-brand-green">{selectedCreator.store_name}</p>
                )}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-lg border border-border p-3 text-center">
                <p className="text-2xl font-bold text-brand-black">{selectedCreator.product_count ?? 0}</p>
                <p className="text-xs text-muted">Products</p>
              </div>
              <div className="rounded-lg border border-border p-3 text-center">
                <p className="text-2xl font-bold text-brand-black">{selectedCreator.total_sales ?? 0}</p>
                <p className="text-xs text-muted">Total Sales</p>
              </div>
              <div className="rounded-lg border border-border p-3 text-center">
                <p className="text-2xl font-bold text-success">{formatUgx(selectedCreator.total_earnings ?? 0)}</p>
                <p className="text-xs text-muted">Total Earnings</p>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-xs font-semibold uppercase text-muted">Store Status</p>
                <div className="mt-1">
                  <Badge variant={getBadgeVariant(selectedCreator.store_status ?? "no store")}>
                    {selectedCreator.store_status ?? "No store"}
                  </Badge>
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase text-muted">Available Balance</p>
                <p className="mt-1 font-bold">{formatUgx(selectedCreator.available_balance ?? 0)}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase text-muted">Platform Revenue Generated</p>
                <p className="mt-1">{formatUgx(selectedCreator.platform_revenue ?? 0)}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase text-muted">Joined</p>
                <p className="mt-1">{new Date(selectedCreator.created_at).toLocaleDateString("en-UG")}</p>
              </div>
            </div>

            {selectedCreator.store_slug && (
              <Link
                href={`/store/${selectedCreator.store_slug}`}
                target="_blank"
                className="inline-flex items-center gap-2 text-sm font-semibold text-brand-green hover:underline"
              >
                <ExternalLink size={16} />
                Visit store
              </Link>
            )}
          </div>
        )}
      </Modal>

      {/* Suspend confirmation modal */}
      <ConfirmModal
        open={!!suspendTarget}
        onClose={() => { setSuspendTarget(null); setSuspendReason(""); }}
        onConfirm={handleSuspend}
        title={`Suspend ${suspendTarget?.display_name || suspendTarget?.email || ""}?`}
        description="This will make their store invisible to the public. The creator will be notified on login."
        confirmLabel="Suspend Store"
        confirmVariant="danger"
      />
    </DashboardShell>
  );
}
