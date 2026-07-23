"use client";

import { useEffect, useState, useRef } from "react";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown } from "lucide-react";

function useCountUp(end: number, duration = 800) {
  const [value, setValue] = useState(0);
  const ref = useRef<number | null>(null);

  useEffect(() => {
    if (end === 0) { setValue(0); return; }
    const startTime = performance.now();
    ref.current = requestAnimationFrame(function animate(now) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      setValue(Math.round(end * progress));
      if (progress < 1) {
        ref.current = requestAnimationFrame(animate);
      }
    });
    return () => {
      if (ref.current) cancelAnimationFrame(ref.current);
    };
  }, [end, duration]);

  return value;
}

export function StatCard({
  label,
  value,
  sublabel,
  trend,
  trendUp = true,
  icon,
  className,
  green = false,
  amount = false,
}: {
  label: string;
  value: string;
  sublabel?: string;
  trend?: string;
  trendUp?: boolean;
  icon?: React.ReactNode;
  className?: string;
  green?: boolean;
  amount?: boolean;
}) {
  const numericValue = (() => {
    if (value.includes("/")) return 0;
    const cleaned = value.replace(/[^0-9.]/g, "");
    return parseFloat(cleaned) || 0;
  })();

  const animValue = useCountUp(numericValue);
  const shouldAnimate = numericValue > 0 && value.length > 0 && /[0-9]/.test(value);
  const displayValue = shouldAnimate ? String(animValue) : value;
  const formattedDisplay = amount
    ? `${value.startsWith("UGX") ? "UGX " : ""}${Number(displayValue).toLocaleString()}`
    : value.includes("%")
      ? `${displayValue}%`
      : value.startsWith("UGX")
        ? `UGX ${Number(displayValue).toLocaleString()}`
        : displayValue;

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-xl border p-5 shadow-card transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lift",
        green
          ? "border-brand-green bg-brand-green text-white"
          : "border-border bg-surface-card text-brand-black hover:border-brand-green/30",
        className,
      )}
    >
      {green && (
        <div className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-white/10" aria-hidden />
      )}
      <div className="flex items-start justify-between">
        <div className="min-w-0">
          <p className={cn("text-xs font-semibold uppercase tracking-wider", green ? "text-white/80" : "text-muted")}>
            {label}
          </p>
          <p className={cn("mt-1.5 text-2xl font-bold tracking-tight", green ? "text-white" : "text-brand-black")}>
            {formattedDisplay}
          </p>
          {sublabel && (
            <p className={cn("mt-1 text-xs", green ? "text-white/70" : "text-muted")}>
              {sublabel}
            </p>
          )}
        </div>
        {icon && (
          <div className={cn("shrink-0", green ? "text-white/60" : "text-brand-green/70")}>
            {icon}
          </div>
        )}
      </div>
      {trend && (
        <div className="mt-3 flex items-center gap-1.5">
          {trendUp ? (
            <TrendingUp size={14} className={green ? "text-green-200" : "text-success"} />
          ) : (
            <TrendingDown size={14} className="text-error" />
          )}
          <span className={cn("text-xs font-semibold", green ? "text-green-100" : trendUp ? "text-success" : "text-error")}>
            {trend}
          </span>
        </div>
      )}
    </div>
  );
}
