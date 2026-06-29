"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

export function Pagination({
  page,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
  onPageSizeChange,
}: {
  page: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
}) {
  const start = (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, totalItems);

  return (
    <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
      <p className="text-sm text-muted">
        Showing {start}–{end} of {totalItems} results
      </p>
      <div className="flex items-center gap-3">
        {onPageSizeChange && (
          <select
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            className="rounded-lg border border-border px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green"
          >
            {[10, 25, 50, 100].map((s) => (
              <option key={s} value={s}>{s} / page</option>
            ))}
          </select>
        )}
        <div className="flex items-center gap-1">
          <button
            onClick={() => onPageChange(page - 1)}
            disabled={page <= 1}
            className="rounded-lg border border-border p-2 text-muted transition hover:border-brand-green/30 hover:bg-brand-mist hover:text-brand-green disabled:opacity-40 disabled:hover:border-border disabled:hover:bg-transparent disabled:hover:text-muted"
            aria-label="Previous page"
          >
            <ChevronLeft size={16} />
          </button>
          <div className="flex items-center gap-0.5">
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
              .map((p, idx, arr) => (
                <span key={p} className="flex items-center">
                  {idx > 0 && arr[idx - 1] !== p - 1 && (
                    <span className="px-1 text-xs text-muted">...</span>
                  )}
                  <button
                    onClick={() => onPageChange(p)}
                    className={`min-w-[2rem] rounded-lg px-2 py-1.5 text-sm font-semibold transition ${
                      p === page
                        ? "bg-brand-green text-white shadow-sm"
                        : "text-muted hover:bg-brand-mist hover:text-brand-green"
                    }`}
                  >
                    {p}
                  </button>
                </span>
              ))}
          </div>
          <button
            onClick={() => onPageChange(page + 1)}
            disabled={page >= totalPages}
            className="rounded-lg border border-border p-2 text-muted transition hover:border-brand-green/30 hover:bg-brand-mist hover:text-brand-green disabled:opacity-40 disabled:hover:border-border disabled:hover:bg-transparent disabled:hover:text-muted"
            aria-label="Next page"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
