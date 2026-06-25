import { cn } from "@/lib/utils";

export function StatCard({ label, value, note, className }: { label: string; value: string; note?: string; className?: string }) {
  return (
    <div className={cn("rounded-lg border border-neutral-200 bg-white p-5 shadow-sm", className)}>
      <p className="text-sm font-medium text-neutral-500">{label}</p>
      <p className="mt-2 text-2xl font-bold text-brand-black">{value}</p>
      {note ? <p className="mt-2 text-xs text-neutral-500">{note}</p> : null}
    </div>
  );
}
