import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

type ButtonLinkProps = {
  href: string;
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "dark";
  icon?: boolean;
  className?: string;
};

export function ButtonLink({ href, children, variant = "primary", icon = false, className }: ButtonLinkProps) {
  return (
    <Link
      className={cn(
        "focus-ring inline-flex min-h-11 items-center justify-center gap-2 rounded-lg px-5 py-3 text-sm font-semibold transition hover:-translate-y-0.5 active:translate-y-0",
        variant === "primary" && "bg-brand-green text-white shadow-sm hover:bg-[#006f43] hover:shadow-md",
        variant === "secondary" && "border border-brand-green bg-white text-brand-green hover:bg-brand-mist hover:shadow-sm",
        variant === "dark" && "bg-brand-black text-white hover:bg-neutral-800 hover:shadow-md",
        className
      )}
      href={href}
    >
      {children}
      {icon ? <ArrowRight aria-hidden size={17} /> : null}
    </Link>
  );
}
