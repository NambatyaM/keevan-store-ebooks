"use client";

import { useEffect, useCallback, type ReactNode } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export function Modal({
  open,
  onClose,
  title,
  children,
  size = "md",
}: {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
}) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    },
    [onClose],
  );

  useEffect(() => {
    if (open) {
      document.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [open, handleKeyDown]);

  if (!open) return null;

  const widths = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-xl",
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div className={cn("w-full rounded-xl bg-surface-card p-6 shadow-warm animate-scale-check", widths[size])}>
        {title && (
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-bold text-brand-black">{title}</h2>
            <button
              onClick={onClose}
              className="rounded-md p-1 text-muted transition hover:text-brand-black"
              aria-label="Close"
            >
              <X size={20} />
            </button>
          </div>
        )}
        {children}
      </div>
    </div>
  );
}

export function ConfirmModal({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = "Confirm",
  confirmVariant = "danger",
  loading = false,
  requireTyping,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description?: string;
  confirmLabel?: string;
  confirmVariant?: "danger" | "primary";
  loading?: boolean;
  requireTyping?: string;
}) {
  if (!open) return null;

  return (
    <Modal open={open} onClose={onClose} title={title} size="sm">
      {description && (
        <p className="mb-4 text-sm text-muted">{description}</p>
      )}
      {requireTyping && (
        <ConfirmTyping
          phrase={requireTyping}
          onMatched={(matched) => {
            if (matched) {
              onConfirm();
            }
          }}
          loading={loading}
          onClose={onClose}
          confirmLabel={confirmLabel}
          confirmVariant={confirmVariant}
        />
      )}
      {!requireTyping && (
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 rounded-lg border border-border px-4 py-2.5 text-sm font-semibold text-muted transition hover:bg-neutral-50"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={`flex-1 rounded-lg px-4 py-2.5 text-sm font-semibold text-white transition disabled:opacity-50 ${
              confirmVariant === "danger"
                ? "bg-error hover:bg-red-600"
                : "bg-brand-green hover:bg-brand-green-deep"
            }`}
          >
            {loading ? "Processing..." : confirmLabel}
          </button>
        </div>
      )}
    </Modal>
  );
}

function ConfirmTyping({
  phrase,
  onMatched,
  loading,
  onClose,
  confirmLabel,
  confirmVariant,
}: {
  phrase: string;
  onMatched: (matched: boolean) => void;
  loading: boolean;
  onClose: () => void;
  confirmLabel: string;
  confirmVariant: "danger" | "primary";
}) {
  return (
    <div>
      <p className="mb-2 text-sm text-muted">
        Type <strong className="text-brand-black">{phrase}</strong> below to confirm:
      </p>
      <input
        type="text"
        className="mb-4 w-full rounded-lg border border-border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green"
        placeholder={phrase}
        onChange={(e) => {
          if (e.target.value === phrase) {
            onMatched(true);
          }
        }}
      />
      <div className="flex gap-3">
        <button
          onClick={onClose}
          className="flex-1 rounded-lg border border-border px-4 py-2.5 text-sm font-semibold text-muted transition hover:bg-neutral-50"
          disabled={loading}
        >
          Cancel
        </button>
        <button
          onClick={() => onMatched(true)}
          disabled={loading}
          className={`flex-1 rounded-lg px-4 py-2.5 text-sm font-semibold text-white transition disabled:opacity-50 ${
            confirmVariant === "danger"
              ? "bg-error hover:bg-red-600"
              : "bg-brand-green hover:bg-brand-green-deep"
          }`}
        >
          {loading ? "Processing..." : confirmLabel}
        </button>
      </div>
    </div>
  );
}
