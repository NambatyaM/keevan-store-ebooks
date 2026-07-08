"use client";

import { useEffect, useState } from "react";
import { DashboardShell } from "@/components/dashboard-shell";
import { Modal } from "@/components/ui/modal";
import { EmptyState } from "@/components/ui/empty-state";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/toast";
import { formatCurrency, Currency } from "@/lib/constants";
import { Plus, Trash2, Tag } from "lucide-react";

type Product = {
  id: string;
  title: string;
  price: number;
  currency?: Currency;
};

type Discount = {
  id: string;
  product_id: string;
  discount_percent: number;
  starts_at: string;
  expires_at: string;
  max_uses: number | null;
  use_count: number;
  is_active: boolean;
  created_at: string;
  products: { title: string; slug: string } | null;
};

export default function CreatorDiscountsPage() {
  const { toast } = useToast();
  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showCreate, setShowCreate] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [formProductId, setFormProductId] = useState("");
  const [formPercent, setFormPercent] = useState("");
  const [formStartsAt, setFormStartsAt] = useState("");
  const [formExpiresAt, setFormExpiresAt] = useState("");
  const [formMaxUses, setFormMaxUses] = useState("");

  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadDiscounts = () => {
    setLoading(true);
    setError(null);
    fetch("/api/discounts")
      .then(async (r) => {
        if (!r.ok) throw new Error("Failed to load discounts");
        const d = await r.json();
        setDiscounts(d.discounts ?? []);
      })
      .catch((err) => {
        console.error("Failed to load discounts:", err);
        setError("Failed to load discounts.");
      })
      .finally(() => setLoading(false));
  };

  const loadProducts = () => {
    fetch("/api/products?limit=200")
      .then(async (r) => {
        if (!r.ok) return;
        const d = await r.json();
        setProducts(d.products ?? []);
      })
      .catch(() => {});
  };

  useEffect(() => { loadDiscounts(); loadProducts(); }, []);

  const resetForm = () => {
    setFormProductId("");
    setFormPercent("");
    setFormStartsAt("");
    setFormExpiresAt("");
    setFormMaxUses("");
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const numPercent = Number(formPercent);
    if (isNaN(numPercent) || numPercent < 1 || numPercent > 100) {
      toast("error", "Discount percent must be between 1 and 100");
      return;
    }
    if (!formProductId) { toast("error", "Select a product"); return; }
    if (!formStartsAt || !formExpiresAt) { toast("error", "Set start and end dates"); return; }
    if (new Date(formExpiresAt) <= new Date(formStartsAt)) { toast("error", "End date must be after start date"); return; }

    setCreateLoading(true);
    try {
      const res = await fetch("/api/discounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: formProductId,
          discountPercent: numPercent,
          startsAt: formStartsAt,
          expiresAt: formExpiresAt,
          maxUses: formMaxUses ? Number(formMaxUses) : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast("error", data.error?.message ?? "Failed to create discount");
      } else {
        toast("success", "Discount created successfully");
        setShowCreate(false);
        resetForm();
        loadDiscounts();
      }
    } catch {
      toast("error", "Connection lost. Please try again.");
    } finally {
      setCreateLoading(false);
    }
  };

  const handleToggleActive = async (discount: Discount) => {
    try {
      const res = await fetch(`/api/discounts/${discount.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !discount.is_active }),
      });
      if (!res.ok) throw new Error("Failed");
      toast("success", discount.is_active ? "Discount deactivated" : "Discount activated");
      loadDiscounts();
    } catch {
      toast("error", "Failed to update discount");
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      const res = await fetch(`/api/discounts/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed");
      toast("success", "Discount deleted");
      loadDiscounts();
    } catch {
      toast("error", "Failed to delete discount");
    } finally {
      setDeletingId(null);
    }
  };

  const now = new Date();
  const activeDiscounts = discounts.filter(
    (d) => d.is_active && new Date(d.starts_at) <= now && new Date(d.expires_at) > now
  );
  const upcomingDiscounts = discounts.filter(
    (d) => d.is_active && new Date(d.starts_at) > now
  );
  const expiredDiscounts = discounts.filter(
    (d) => !d.is_active || new Date(d.expires_at) <= now
  );

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString("en-UG", {
      day: "numeric", month: "short", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    });
  }

  return (
    <DashboardShell
      title="Discounts"
      subtitle={`${activeDiscounts.length} active · ${upcomingDiscounts.length} upcoming · ${expiredDiscounts.length} expired`}
      role="creator"
    >
      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700">{error}</div>
      )}

      {!loading && discounts.length > 0 && (
        <div className="mb-6">
          <button
            onClick={() => { loadProducts(); setShowCreate(true); }}
            className="inline-flex items-center gap-2 rounded-lg bg-brand-green px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-green-deep"
          >
            <Plus size={16} /> Create Discount
          </button>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="animate-pulse rounded-xl border border-border bg-surface-card p-5">
              <div className="mb-3 h-5 w-1/3 rounded bg-neutral-200" />
              <div className="mb-2 h-4 w-2/3 rounded bg-neutral-200" />
              <div className="h-4 w-1/2 rounded bg-neutral-200" />
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && discounts.length === 0 && (
        <EmptyState
          icon={<Tag size={48} strokeWidth={1.2} />}
          title="No discounts yet"
          description="Create time-limited percentage discounts to boost sales and reward your customers."
          actionLabel="Create Discount"
          onAction={() => { loadProducts(); setShowCreate(true); }}
        />
      )}

      {/* Active discounts */}
      {!loading && activeDiscounts.length > 0 && (
        <div className="mb-8">
          <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-success">Active Discounts</h3>
          <div className="space-y-3">
            {activeDiscounts.map((d) => <DiscountCard key={d.id} discount={d} onToggle={handleToggleActive} onDelete={handleDelete} deletingId={deletingId} formatDate={formatDate} />)}
          </div>
        </div>
      )}

      {/* Upcoming discounts */}
      {!loading && upcomingDiscounts.length > 0 && (
        <div className="mb-8">
          <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-amber-600">Upcoming</h3>
          <div className="space-y-3">
            {upcomingDiscounts.map((d) => <DiscountCard key={d.id} discount={d} onToggle={handleToggleActive} onDelete={handleDelete} deletingId={deletingId} formatDate={formatDate} />)}
          </div>
        </div>
      )}

      {/* Expired/inactive discounts */}
      {!loading && expiredDiscounts.length > 0 && (
        <div>
          <h3 className="mb-3 text-sm font-bold uppercase tracking-wide text-muted">Past Discounts</h3>
          <div className="space-y-3">
            {expiredDiscounts.map((d) => <DiscountCard key={d.id} discount={d} onToggle={handleToggleActive} onDelete={handleDelete} deletingId={deletingId} formatDate={formatDate} />)}
          </div>
        </div>
      )}

      {/* Create discount modal */}
      <Modal open={showCreate} onClose={() => { setShowCreate(false); resetForm(); }} title="Create Discount" size="lg">
        <form onSubmit={handleCreate} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-neutral-700">Product</label>
            <select
              value={formProductId}
              onChange={(e) => setFormProductId(e.target.value)}
              className="focus-ring mt-1 w-full rounded-md border border-neutral-300 px-4 py-3"
              required
            >
              <option value="">Select a product...</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.title} — {formatCurrency(p.price, p.currency)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-neutral-700">Discount (%)</label>
            <input
              type="number"
              min="1"
              max="100"
              value={formPercent}
              onChange={(e) => setFormPercent(e.target.value)}
              className="focus-ring mt-1 w-full rounded-md border border-neutral-300 px-4 py-3"
              placeholder="e.g. 20"
              required
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-semibold text-neutral-700">Start Date & Time</label>
              <input
                type="datetime-local"
                value={formStartsAt}
                onChange={(e) => setFormStartsAt(e.target.value)}
                className="focus-ring mt-1 w-full rounded-md border border-neutral-300 px-4 py-3"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-neutral-700">End Date & Time</label>
              <input
                type="datetime-local"
                value={formExpiresAt}
                onChange={(e) => setFormExpiresAt(e.target.value)}
                className="focus-ring mt-1 w-full rounded-md border border-neutral-300 px-4 py-3"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-neutral-700">
              Max Uses <span className="font-normal text-neutral-500">(optional)</span>
            </label>
            <input
              type="number"
              min="1"
              value={formMaxUses}
              onChange={(e) => setFormMaxUses(e.target.value)}
              className="focus-ring mt-1 w-full rounded-md border border-neutral-300 px-4 py-3"
              placeholder="Leave empty for unlimited"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => { setShowCreate(false); resetForm(); }}
              className="rounded-lg border border-border px-5 py-2.5 text-sm font-semibold text-muted transition hover:bg-neutral-50"
              disabled={createLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createLoading}
              className="rounded-lg bg-brand-green px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-green-deep disabled:opacity-50"
            >
              {createLoading ? "Creating..." : "Create Discount"}
            </button>
          </div>
        </form>
      </Modal>
    </DashboardShell>
  );
}

function DiscountCard({
  discount,
  onToggle,
  onDelete,
  deletingId,
  formatDate,
}: {
  discount: Discount;
  onToggle: (d: Discount) => void;
  onDelete: (id: string) => void;
  deletingId: string | null;
  formatDate: (iso: string) => string;
}) {
  const now = new Date();
  const isExpired = new Date(discount.expires_at) <= now;
  const isUpcoming = new Date(discount.starts_at) > now;

  let statusLabel = "Active";
  let statusVariant: string = "active";
  if (isExpired || !discount.is_active) {
    statusLabel = "Expired";
    statusVariant = "disabled";
  }
  if (isUpcoming) {
    statusLabel = "Scheduled";
    statusVariant = "pending";
  }

  const usesLabel = discount.max_uses
    ? `${discount.use_count} / ${discount.max_uses}`
    : `${discount.use_count} (unlimited)`;

  return (
    <div className="rounded-xl border border-border bg-surface-card p-5 shadow-card transition hover:shadow-lift">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-mist text-lg font-bold text-brand-green">
              {discount.discount_percent}%
            </span>
            <div className="min-w-0">
              <p className="font-bold text-brand-black">
                {discount.products?.title ?? "Unknown Product"}
              </p>
              <p className="mt-0.5 text-sm text-muted">
                {formatDate(discount.starts_at)} — {formatDate(discount.expires_at)}
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right text-sm">
            <p className="font-semibold text-brand-black">{usesLabel} used</p>
          </div>
          <Badge variant={statusVariant as any}>{statusLabel}</Badge>
          <button
            onClick={() => onToggle(discount)}
            className={`rounded-md p-1.5 text-sm font-semibold transition ${
              discount.is_active
                ? "text-error hover:bg-red-50"
                : "text-brand-green hover:bg-brand-mist"
            }`}
            title={discount.is_active ? "Deactivate" : "Activate"}
          >
            {discount.is_active ? "Deactivate" : "Activate"}
          </button>
          {deletingId !== discount.id && (
            <button
              onClick={() => onDelete(discount.id)}
              className="rounded-md p-1.5 text-muted transition hover:bg-red-50 hover:text-error"
              title="Delete"
            >
              <Trash2 size={16} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
