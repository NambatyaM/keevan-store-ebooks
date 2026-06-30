"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { DashboardShell } from "@/components/dashboard-shell";
import { StatCard } from "@/components/ui/stat-card";
import { Badge, getBadgeVariant } from "@/components/ui/badge";
import { ConfirmModal } from "@/components/ui/modal";
import { EmptyState } from "@/components/ui/empty-state";
import { TableSkeleton } from "@/components/ui/skeleton";
import { Pagination } from "@/components/ui/pagination";
import { useToast } from "@/components/ui/toast";
import { formatCurrency, Currency } from "@/lib/constants";
import { Search, Package, Eye, Ban, RefreshCw } from "lucide-react";

type Product = {
  id: string;
  title: string;
  slug: string;
  price: number;
  currency?: Currency;
  status: string;
  created_at: string;
  stores: { name: string; slug: string } | null;
};

const PAGE_SIZE = 25;

export default function AdminProductsPage() {
  const { toast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [actionTarget, setActionTarget] = useState<{ id: string; title: string; action: "disable" | "reactivate" } | null>(null);
  const [processing, setProcessing] = useState(false);

  const load = () => {
    setLoading(true);
    setError(null);
    fetch("/api/products?limit=500")
      .then((r) => r.json())
      .then((d) => setProducts(d.products ?? []))
      .catch((err) => { console.error("Failed to load products:", err); setError("Failed to load products."); })
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    let result = [...products];
    if (statusFilter !== "all") {
      result = result.filter((p) => p.status === statusFilter);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          (p.stores?.name ?? "").toLowerCase().includes(q)
      );
    }
    return result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [products, statusFilter, search]);

  const published = products.filter((p) => p.status === "published");
  const disabled = products.filter((p) => p.status === "disabled");
  const draft = products.filter((p) => p.status === "draft");

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleAction = async () => {
    if (!actionTarget) return;
    setProcessing(true);
    try {
      const res = await fetch(`/api/admin/products/${actionTarget.id}/${actionTarget.action}`, { method: "POST" });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error?.message ?? "Action failed");
      }
      toast("success", `Product ${actionTarget.action === "disable" ? "disabled" : "reactivated"} successfully`);
      setActionTarget(null);
      load();
    } catch (err) {
      toast("error", err instanceof Error ? err.message : "Action failed");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <DashboardShell
      title="Product Moderation"
      subtitle="Review uploaded products, disable violating content"
      role="admin"
    >
      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700">{error}</div>
      )}

      {/* Summary cards */}
      <div className="mb-6 grid gap-4 sm:grid-cols-4">
        <StatCard label="Total Products" value={String(products.length)} icon={<Package size={20} />} />
        <StatCard label="Published" value={String(published.length)} icon={<Package size={20} />} green />
        <StatCard label="Disabled" value={String(disabled.length)} icon={<Ban size={20} />} />
        <StatCard label="Draft" value={String(draft.length)} icon={<Package size={20} />} />
      </div>

      {/* Search + Filter */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search by product title or store..."
            className="w-full rounded-lg border border-border py-2.5 pl-9 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="rounded-lg border border-border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green"
        >
          <option value="all">All Statuses</option>
          <option value="published">Published</option>
          <option value="disabled">Disabled</option>
          <option value="draft">Draft</option>
        </select>
      </div>

      {/* Loading */}
      {loading && <TableSkeleton rows={6} />}

      {/* Empty */}
      {!loading && filtered.length === 0 && (
        <EmptyState
          icon={<Package size={48} strokeWidth={1.2} />}
          title={products.length === 0 ? "No products yet" : "No products match your filters"}
        />
      )}

      {/* Products table */}
      {!loading && filtered.length > 0 && (
        <div className="overflow-hidden rounded-xl border border-border bg-surface-card shadow-card">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-surface">
                  <th className="px-4 py-3 text-left font-semibold text-muted">Title</th>
                  <th className="px-4 py-3 text-left font-semibold text-muted">Store</th>
                  <th className="px-4 py-3 text-right font-semibold text-muted">Price</th>
                  <th className="px-4 py-3 text-center font-semibold text-muted">Status</th>
                  <th className="px-4 py-3 text-right font-semibold text-muted">Created</th>
                  <th className="px-4 py-3 text-right font-semibold text-muted">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginated.map((p) => (
                  <tr key={p.id} className="border-b border-border transition hover:bg-surface">
                    <td className="px-4 py-3">
                      <Link
                        href={`/product/${p.slug}`}
                        className="font-semibold text-brand-green hover:underline"
                        target="_blank"
                      >
                        {p.title}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-muted">
                      {p.stores ? (
                        <Link href={`/store/${p.stores.slug}`} className="hover:underline" target="_blank">
                          {p.stores.name}
                        </Link>
                      ) : "—"}
                    </td>
                    <td className="px-4 py-3 text-right font-bold">{formatCurrency(p.price, p.currency)}</td>
                    <td className="px-4 py-3 text-center">
                      <Badge variant={getBadgeVariant(p.status)}>
                        {p.status === "published" ? "Published" : p.status === "disabled" ? "Disabled" : p.status}
                      </Badge>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right text-muted">
                      {new Date(p.created_at).toLocaleDateString("en-UG")}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Link
                          href={`/product/${p.slug}`}
                          target="_blank"
                          className="rounded-md p-1.5 text-muted transition hover:bg-brand-mist"
                          title="Preview"
                        >
                          <Eye size={15} />
                        </Link>
                        {p.status === "published" && (
                          <button
                            onClick={() => setActionTarget({ id: p.id, title: p.title, action: "disable" })}
                            className="rounded-md bg-error px-2.5 py-1 text-xs font-semibold text-white hover:bg-red-600"
                          >
                            Disable
                          </button>
                        )}
                        {p.status === "disabled" && (
                          <button
                            onClick={() => setActionTarget({ id: p.id, title: p.title, action: "reactivate" })}
                            className="rounded-md bg-brand-green px-2.5 py-1 text-xs font-semibold text-white hover:bg-brand-green-deep"
                          >
                            Reactivate
                          </button>
                        )}
                        {p.status !== "published" && p.status !== "disabled" && (
                          <span className="text-xs text-muted">—</span>
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
          <Pagination page={page} totalPages={totalPages} totalItems={filtered.length} pageSize={PAGE_SIZE} onPageChange={setPage} />
        </div>
      )}

      {/* Action confirmation */}
      <ConfirmModal
        open={!!actionTarget}
        onClose={() => setActionTarget(null)}
        onConfirm={handleAction}
        title={actionTarget?.action === "disable" ? "Disable Product" : "Reactivate Product"}
        description={
          actionTarget
            ? `Are you sure you want to ${actionTarget.action === "disable" ? "disable" : "reactivate"} "${actionTarget.title}"?`
            : ""
        }
        confirmLabel={processing ? "Processing..." : `Confirm ${actionTarget?.action === "disable" ? "Disable" : "Reactivate"}`}
        confirmVariant={actionTarget?.action === "disable" ? "danger" : "primary"}
      />
    </DashboardShell>
  );
}
