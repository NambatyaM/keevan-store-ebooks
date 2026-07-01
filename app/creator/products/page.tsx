"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { DashboardShell } from "@/components/dashboard-shell";
import { Badge, getBadgeVariant } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { TableSkeleton } from "@/components/ui/skeleton";
import { ConfirmModal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import { Pagination } from "@/components/ui/pagination";
import { formatCurrency, Currency } from "@/lib/constants";
import { getCoverUrl } from "@/lib/storefront";
import {
  Search,
  SlidersHorizontal,
  LayoutGrid,
  List,
  Eye,
  Copy,
  Edit3,
  Trash2,
  ToggleLeft,
  ToggleRight,
  Upload,
  Package,
  FileText,
  BarChart3,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Product = {
  id: string;
  title: string;
  slug: string;
  description?: string;
  price: number;
  currency?: Currency;
  status: string;
  file_mime?: string;
  file_size?: number;
  cover_path?: string;
  views_count?: number;
  sales_count?: number;
  created_at: string;
};

const PAGE_SIZE = 25;

export default function CreatorProductsPage() {
  const { toast } = useToast();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sort, setSort] = useState("newest");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [page, setPage] = useState(1);
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    setError(null);
    fetch("/api/products?limit=200")
      .then((r) => r.json())
      .then((d) => setProducts(d.products ?? []))
      .catch((err) => { console.error("Failed to load products:", err); setError("Failed to load products."); })
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    let result = [...products];

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((p) => p.title.toLowerCase().includes(q));
    }

    if (statusFilter !== "all") {
      result = result.filter((p) => p.status === statusFilter);
    }

    result.sort((a, b) => {
      switch (sort) {
        case "newest": return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case "oldest": return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case "sales": return (b.sales_count ?? 0) - (a.sales_count ?? 0);
        case "price-high": return b.price - a.price;
        case "price-low": return a.price - b.price;
        default: return 0;
      }
    });

    return result;
  }, [products, search, statusFilter, sort]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleToggleStatus = async (product: Product) => {
    setTogglingId(product.id);
    const newStatus = product.status === "published" ? "disabled" : "published";
    try {
      const res = await fetch(`/api/products/${product.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error("Failed");
      toast("success", `Product ${newStatus} successfully`);
      load();
    } catch {
      toast("error", "Failed to update product status");
    } finally {
      setTogglingId(null);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      const res = await fetch(`/api/products/${deleteTarget.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed");
      toast("success", "Product deleted successfully");
      setDeleteTarget(null);
      load();
    } catch {
      toast("error", "Failed to delete product");
    }
  };

  const handleCopyLink = (slug: string) => {
    navigator.clipboard.writeText(`${window.location.origin}/product/${slug}`);
    toast("success", "Product link copied to clipboard");
  };

  const formatLabel = (mime?: string) => {
    if (!mime) return "PDF";
    if (mime.includes("pdf")) return "PDF";
    if (mime.includes("epub")) return "EPUB";
    if (mime.includes("mobi")) return "MOBI";
    if (mime.includes("zip")) return "ZIP";
    return mime.split("/").pop()?.toUpperCase() ?? "FILE";
  };

  const publishedCount = products.filter((p) => p.status === "published").length;
  const draftCount = products.filter((p) => p.status === "draft").length;

  return (
    <DashboardShell
      title="Your Products"
      subtitle={`${products.length} products · ${publishedCount} published · ${draftCount} draft`}
      role="creator"
      action={{ href: "/creator/products/new", label: "Upload New Product" }}
    >
      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700">{error}</div>
      )}

      {/* Filter bar */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <input
              type="text"
              placeholder="Search products..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="w-full rounded-lg border border-border py-2.5 pl-10 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="rounded-lg border border-border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green"
          >
            <option value="all">All</option>
            <option value="published">Published</option>
            <option value="draft">Draft</option>
            <option value="disabled">Disabled</option>
          </select>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="rounded-lg border border-border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green"
          >
            <option value="newest">Newest</option>
            <option value="oldest">Oldest</option>
            <option value="sales">Most Sales</option>
            <option value="price-high">Highest Price</option>
            <option value="price-low">Lowest Price</option>
          </select>
        </div>

        {/* View toggle */}
        <div className="flex items-center gap-1 rounded-lg border border-border p-1">
          <button
            onClick={() => setView("grid")}
            className={`rounded-md p-1.5 transition ${view === "grid" ? "bg-brand-green text-white" : "text-muted hover:text-brand-black"}`}
            aria-label="Grid view"
          >
            <LayoutGrid size={16} />
          </button>
          <button
            onClick={() => setView("list")}
            className={`rounded-md p-1.5 transition ${view === "list" ? "bg-brand-green text-white" : "text-muted hover:text-brand-black"}`}
            aria-label="List view"
          >
            <List size={16} />
          </button>
        </div>
      </div>

      {/* Active filters */}
      {(search || statusFilter !== "all") && (
        <div className="mb-4 flex flex-wrap items-center gap-2">
          {search && (
            <span className="inline-flex items-center gap-1 rounded-full border border-border bg-surface px-3 py-1 text-xs font-medium text-muted">
              Search: &ldquo;{search}&rdquo;
              <button onClick={() => setSearch("")} className="ml-1 hover:text-brand-black">×</button>
            </span>
          )}
          {statusFilter !== "all" && (
            <span className="inline-flex items-center gap-1 rounded-full border border-border bg-surface px-3 py-1 text-xs font-medium text-muted">
              Status: {statusFilter}
              <button onClick={() => setStatusFilter("all")} className="ml-1 hover:text-brand-black">×</button>
            </span>
          )}
          <button onClick={() => { setSearch(""); setStatusFilter("all"); }} className="text-xs font-semibold text-brand-green hover:underline">
            Clear all filters
          </button>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className={view === "grid" ? "grid gap-4 sm:grid-cols-2 lg:grid-cols-3" : ""}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="animate-pulse rounded-xl border border-border bg-surface-card p-4">
              <div className="mb-3 aspect-[16/9] rounded-lg bg-neutral-200" />
              <div className="mb-2 h-5 w-3/4 rounded bg-neutral-200" />
              <div className="mb-1 h-4 w-1/2 rounded bg-neutral-200" />
              <div className="h-4 w-1/4 rounded bg-neutral-200" />
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && filtered.length === 0 && (
        <EmptyState
          icon={<Package size={48} strokeWidth={1.2} />}
          title={products.length === 0 ? "You haven't uploaded any products yet" : "No products match your filters"}
          description={
            products.length === 0
              ? "Your first product could be an ebook, guide, template, or any digital file your audience would pay for."
              : "Try adjusting your search or filter."
          }
          actionLabel={products.length === 0 ? "Upload Your First Product" : undefined}
          actionHref={products.length === 0 ? "/creator/products/new" : undefined}
        />
      )}

      {/* Grid view */}
      {!loading && filtered.length > 0 && view === "grid" && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {paginated.map((product) => (
            <div
              key={product.id}
              className="group relative overflow-hidden rounded-xl border border-border bg-surface-card shadow-card transition-all duration-200 hover:shadow-lift"
            >
              {/* Cover image */}
              <Link href={`/product/${product.slug}`} className="block">
                <div className="relative aspect-[16/9] overflow-hidden bg-gradient-to-br from-brand-green/20 to-brand-green/5">
                  {getCoverUrl(product.cover_path ?? null) ? (
                    <div className="h-full w-full bg-cover bg-center" style={{ backgroundImage: `url(${getCoverUrl(product.cover_path ?? null, 400) ?? ''})` }} />
                  ) : (
                    <div className="grid h-full place-items-center">
                      <FileText size={36} className="text-brand-green/40" />
                    </div>
                  )}
                  <span className="absolute left-2 top-2 rounded-md bg-white/90 px-2 py-0.5 text-xs font-semibold text-brand-black shadow-sm backdrop-blur">
                    {formatLabel(product.file_mime)}
                  </span>
                </div>
              </Link>

              {/* Product info */}
              <div className="p-4">
                <Link href={`/product/${product.slug}`}>
                  <h3 className="line-clamp-2 font-bold text-brand-black group-hover:text-brand-green">
                    {product.title}
                  </h3>
                </Link>

                <p className="mt-2 text-lg font-bold text-brand-green">
                  {formatCurrency(product.price, product.currency)}
                </p>

                {/* Stats row */}
                <div className="mt-2 flex items-center gap-3 text-xs text-muted">
                  <span className="flex items-center gap-1">
                    <BarChart3 size={12} /> {product.views_count ?? 0} views
                  </span>
                  <span className="flex items-center gap-1">
                    <Package size={12} /> {product.sales_count ?? 0} sales
                  </span>
                </div>

                {/* Status */}
                <div className="mt-3">
                  <Badge variant={getBadgeVariant(product.status)}>
                    {product.status}
                  </Badge>
                </div>
              </div>

              {/* Actions overlay */}
              <div className="absolute inset-x-0 bottom-0 flex translate-y-full gap-1 border-t border-border bg-surface-card p-2 transition-transform duration-200 group-hover:translate-y-0">
                <Link
                  href={`/creator/products/${product.id}/edit`}
                  className="flex-1 rounded-md px-2 py-1.5 text-center text-xs font-semibold text-brand-green transition hover:bg-brand-mist"
                >
                  <Edit3 size={14} className="mx-auto" />
                </Link>
                <Link
                  href={`/product/${product.slug}`}
                  className="flex-1 rounded-md px-2 py-1.5 text-center text-xs font-semibold text-muted transition hover:bg-neutral-50"
                >
                  <Eye size={14} className="mx-auto" />
                </Link>
                <button
                  onClick={() => handleCopyLink(product.slug)}
                  className="flex-1 rounded-md px-2 py-1.5 text-center text-xs font-semibold text-muted transition hover:bg-neutral-50"
                >
                  <Copy size={14} className="mx-auto" />
                </button>
                <button
                  onClick={() => handleToggleStatus(product)}
                  disabled={togglingId === product.id}
                  className="flex-1 rounded-md px-2 py-1.5 text-center text-xs font-semibold transition hover:bg-neutral-50"
                >
                  {product.status === "published" ? (
                    <ToggleRight size={14} className="mx-auto text-success" />
                  ) : (
                    <ToggleLeft size={14} className="mx-auto text-muted" />
                  )}
                </button>
                <button
                  onClick={() => setDeleteTarget(product)}
                  className="flex-1 rounded-md px-2 py-1.5 text-center text-xs font-semibold text-error transition hover:bg-red-50"
                >
                  <Trash2 size={14} className="mx-auto" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* List view */}
      {!loading && filtered.length > 0 && view === "list" && (
        <div className="overflow-hidden rounded-xl border border-border bg-surface-card shadow-card">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-surface">
                  <th className="px-4 py-3 text-left font-semibold text-muted">Product</th>
                  <th className="px-4 py-3 text-left font-semibold text-muted">Price</th>
                  <th className="px-4 py-3 text-center font-semibold text-muted">Views</th>
                  <th className="px-4 py-3 text-center font-semibold text-muted">Sales</th>
                  <th className="px-4 py-3 text-center font-semibold text-muted">Conv.</th>
                  <th className="px-4 py-3 text-center font-semibold text-muted">Status</th>
                  <th className="px-4 py-3 text-right font-semibold text-muted">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginated.map((product) => {
                  const views = product.views_count ?? 0;
                  const sales = product.sales_count ?? 0;
                  const conv = views > 0 ? ((sales / views) * 100).toFixed(1) : "0.0";
                  return (
                    <tr key={product.id} className="border-b border-border transition hover:bg-surface">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-brand-mist text-brand-green">
                            <FileText size={18} />
                          </div>
                          <div className="min-w-0">
                            <Link href={`/product/${product.slug}`} className="font-semibold text-brand-black hover:text-brand-green">
                              {product.title}
                            </Link>
                            <p className="text-xs text-muted">{formatLabel(product.file_mime)}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 font-semibold">{formatCurrency(product.price, product.currency)}</td>
                      <td className="px-4 py-3 text-center text-muted">{views}</td>
                      <td className="px-4 py-3 text-center font-semibold">{sales}</td>
                      <td className="px-4 py-3 text-center text-muted">{conv}%</td>
                      <td className="px-4 py-3 text-center">
                        <Badge variant={getBadgeVariant(product.status)}>{product.status}</Badge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <Link href={`/creator/products/${product.id}/edit`} className="rounded-md p-1.5 text-muted transition hover:bg-brand-mist hover:text-brand-green">
                            <Edit3 size={15} />
                          </Link>
                          <button onClick={() => handleCopyLink(product.slug)} className="rounded-md p-1.5 text-muted transition hover:bg-brand-mist hover:text-brand-green">
                            <Copy size={15} />
                          </button>
                          <button onClick={() => handleToggleStatus(product)} disabled={togglingId === product.id} className="rounded-md p-1.5 text-muted transition hover:bg-brand-mist">
                            {product.status === "published" ? <ToggleRight size={15} className="text-success" /> : <ToggleLeft size={15} />}
                          </button>
                          <button onClick={() => setDeleteTarget(product)} className="rounded-md p-1.5 text-muted transition hover:bg-red-50 hover:text-error">
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
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

      {/* Delete confirmation modal */}
      <ConfirmModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Product"
        description={`Are you sure you want to delete "${deleteTarget?.title}"? This action cannot be undone.`}
        confirmLabel="Delete"
        confirmVariant="danger"
        requireTyping={deleteTarget?.title ?? ""}
      />
    </DashboardShell>
  );
}
