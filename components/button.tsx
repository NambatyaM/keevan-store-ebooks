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
        "focus-ring inline-flex min-h-11 items-center justify-center gap-2 rounded-md px-5 py-3 text-sm font-semibold transition",
        variant === "primary" && "bg-brand-green text-white hover:bg-[#006f43]",
        variant === "secondary" && "border border-brand-green bg-white text-brand-green hover:bg-brand-mist",
        variant === "dark" && "bg-brand-black text-white hover:bg-neutral-800",
        className
      )}
      href={href}
    >
      {children}
      {icon ? <ArrowRight aria-hidden size={17} /> : null}
    </Link>
  );
}
