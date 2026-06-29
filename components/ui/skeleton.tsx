export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`skeleton rounded ${className}`} />;
}

export function StatCardSkeleton() {
  return (
    <div className="rounded-xl border border-border bg-surface-card p-5 shadow-card animate-fade-in">
      <Skeleton className="mb-2 h-4 w-20" />
      <Skeleton className="mb-1 h-8 w-32" />
      <Skeleton className="h-3 w-24" />
    </div>
  );
}

export function ChartSkeleton() {
  return (
    <div className="rounded-xl border border-border bg-surface-card p-5 shadow-card">
      <Skeleton className="mb-4 h-5 w-40" />
      <Skeleton className="h-64 w-full rounded-lg" />
    </div>
  );
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-surface-card shadow-card">
      <div className="border-b border-border bg-surface px-4 py-3">
        <Skeleton className="h-4 w-24" />
      </div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 border-b border-border px-4 py-3">
          <Skeleton className="h-4 flex-1" />
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-16" />
        </div>
      ))}
    </div>
  );
}
