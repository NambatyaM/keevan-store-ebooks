import { cn } from "@/lib/utils";

const variants = {
  completed: "bg-green-50 text-green-700 border-green-200",
  paid: "bg-green-50 text-green-700 border-green-200",
  published: "bg-green-50 text-green-700 border-green-200",
  active: "bg-green-50 text-green-700 border-green-200",
  pending: "bg-amber-50 text-amber-700 border-amber-200",
  draft: "bg-neutral-100 text-neutral-600 border-neutral-200",
  disabled: "bg-red-50 text-red-700 border-red-200",
  suspended: "bg-red-50 text-red-700 border-red-200",
  rejected: "bg-red-50 text-red-700 border-red-200",
  refunded: "bg-red-50 text-red-700 border-red-200",
  failed: "bg-red-50 text-red-700 border-red-200",
  approved: "bg-blue-50 text-blue-700 border-blue-200",
  queued: "bg-neutral-100 text-neutral-600 border-neutral-200",
  sent: "bg-green-50 text-green-700 border-green-200",
  retrying: "bg-amber-50 text-amber-700 border-amber-200",
  "mark-paid": "bg-green-50 text-green-700 border-green-200",
  neutral: "bg-neutral-100 text-neutral-700 border-neutral-200",
  default: "bg-neutral-100 text-neutral-700 border-neutral-200",
};

type BadgeVariant = keyof typeof variants;

export function Badge({
  variant = "default",
  children,
  className,
}: {
  variant?: BadgeVariant;
  children: React.ReactNode;
  className?: string;
}) {
  const v = variants[variant] || variants.default;
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold",
        v,
        className,
      )}
    >
      {children}
    </span>
  );
}

export function getBadgeVariant(status: string): BadgeVariant {
  const s = status?.toLowerCase() ?? "";
  if (["completed", "paid", "published", "active", "sent", "approved"].includes(s)) return "sent";
  if (s === "approved") return "approved";
  if (["pending", "draft"].includes(s)) return "pending";
  if (["disabled", "suspended", "rejected", "refunded", "failed"].includes(s)) return "disabled";
  return "default";
}
