"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Gauge,
  Package,
  ShoppingCart,
  BarChart3,
  Wallet,
  Store,
  Settings,
  HelpCircle,
  LogOut,
  Bell,
  ChevronDown,
  Menu,
  X,
  ExternalLink,
  ChevronRight,
  Users,
  DollarSign,
  Receipt,
  FileText,
  RefreshCw,
  ShieldAlert,
  Mail,
  ClipboardList,
  UserCheck,
  Ban,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/components/auth-provider";

type NavItem = {
  href: string;
  label: string;
  icon: React.ReactNode;
};

type NavSection = {
  label: string;
  items: NavItem[];
};

const creatorNav: NavSection[] = [
  {
    label: "Main",
    items: [
      { href: "/creator/dashboard", label: "Overview", icon: <Gauge size={18} /> },
      { href: "/creator/products", label: "Products", icon: <Package size={18} /> },
      { href: "/creator/orders", label: "Orders", icon: <ShoppingCart size={18} /> },
      { href: "/creator/analytics", label: "Analytics", icon: <BarChart3 size={18} /> },
      { href: "/creator/earnings", label: "Earnings & Withdrawals", icon: <Wallet size={18} /> },
      { href: "/creator/settings?tab=store", label: "My Store", icon: <Store size={18} /> },
    ],
  },
  {
    label: "Account",
    items: [
      { href: "/creator/settings", label: "Settings", icon: <Settings size={18} /> },
      { href: "/faq", label: "Help", icon: <HelpCircle size={18} /> },
    ],
  },
];

const adminNav: NavSection[] = [
  {
    label: "Platform",
    items: [
      { href: "/admin/dashboard", label: "Overview", icon: <Gauge size={18} /> },
      { href: "/admin/reports", label: "Revenue & Reports", icon: <BarChart3 size={18} /> },
      { href: "/admin/sales", label: "Sales", icon: <ShoppingCart size={18} /> },
    ],
  },
  {
    label: "Users",
    items: [
      { href: "/admin/creators", label: "Creators", icon: <Users size={18} /> },
      { href: "/admin/buyers", label: "Buyers", icon: <UserCheck size={18} /> },
      { href: "/admin/stores", label: "Stores", icon: <Store size={18} /> },
    ],
  },
  {
    label: "Content",
    items: [
      { href: "/admin/products", label: "Products", icon: <Package size={18} /> },
      { href: "/admin/orders", label: "Orders", icon: <Receipt size={18} /> },
    ],
  },
  {
    label: "Financial",
    items: [
      { href: "/admin/withdrawals", label: "Withdrawals", icon: <DollarSign size={18} /> },
      { href: "/admin/refunds", label: "Refunds", icon: <RefreshCw size={18} /> },
    ],
  },
  {
    label: "Moderation",
    items: [
      { href: "/admin/reports", label: "Reports", icon: <ShieldAlert size={18} /> },
    ],
  },
  {
    label: "System",
    items: [
      { href: "/admin/emails", label: "Email Queue", icon: <Mail size={18} /> },
      { href: "/admin/audit-log", label: "Audit Log", icon: <ClipboardList size={18} /> },
      { href: "/admin/settings", label: "Settings", icon: <Settings size={18} /> },
    ],
  },
];

function Sidebar({
  nav,
  storeSlug,
  storeName,
  isAdmin,
}: {
  nav: NavSection[];
  storeSlug?: string;
  storeName?: string;
  isAdmin?: boolean;
}) {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/creator/dashboard" || href === "/admin/dashboard") {
      return pathname === href;
    }
    return pathname.startsWith(href);
  };

  return (
    <aside className="flex h-full flex-col bg-white">
      {/* Logo area */}
      <div className="flex items-center gap-3 border-b border-border px-5 py-4">
        <div className="grid h-9 w-9 place-items-center rounded-lg bg-brand-green text-sm font-bold text-white">
          K
        </div>
        <div className="min-w-0">
          <p className="text-sm font-bold text-brand-black">{isAdmin ? "Keevan Admin" : (storeName || "Keevan Store")}</p>
          {!isAdmin && storeSlug && (
            <Link
              href={`/store/${storeSlug}`}
              className="flex items-center gap-1 text-xs font-medium text-brand-green hover:underline"
              target="_blank"
            >
              View my store <ExternalLink size={10} />
            </Link>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        {nav.map((section) => (
          <div key={section.label} className="mb-5">
            <p className="mb-1.5 px-2 text-[11px] font-bold uppercase tracking-[0.12em] text-muted">
              {section.label}
            </p>
            {section.items.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-150",
                  isActive(item.href)
                    ? "bg-brand-green text-white shadow-sm"
                    : "text-brand-black hover:bg-brand-mist",
                )}
              >
                <span className="shrink-0">{item.icon}</span>
                <span className="truncate">{item.label}</span>
              </Link>
            ))}
          </div>
        ))}
      </nav>

      {/* Logout */}
      <div className="border-t border-border p-3">
        <Link
          href={isAdmin ? "/admin/logout" : "/logout"}
          className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted transition hover:bg-red-50 hover:text-error"
        >
          <LogOut size={18} />
          Logout
        </Link>
      </div>
    </aside>
  );
}

export function DashboardShell({
  title,
  subtitle,
  children,
  action,
  role = "creator",
  navItems,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  action?: { href: string; label: string };
  role?: "creator" | "admin";
  navItems?: Array<{ href: string; label: string }>;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { profile } = useAuth();
  const pathname = usePathname();
  const isAdmin = role === "admin";

  const nav = isAdmin ? adminNav : creatorNav;
  const storeSlug = (profile as any)?.store_slug;
  const storeName = (profile as any)?.store_name || (profile as any)?.display_name;

  // Breadcrumb from pathname
  const segments = pathname.split("/").filter(Boolean);
  const breadcrumbs = segments.map((seg, i) => ({
    label: seg.charAt(0).toUpperCase() + seg.slice(1).replace(/-/g, " "),
    href: "/" + segments.slice(0, i + 1).join("/"),
  }));

  return (
    <div className="flex min-h-screen bg-surface">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar - desktop fixed, mobile overlay */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-[240px] shrink-0 border-r border-border transition-transform duration-200 lg:relative lg:translate-x-0",
          sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        )}
      >
        <Sidebar nav={nav} storeSlug={storeSlug} storeName={storeName} isAdmin={isAdmin} />
      </div>

      {/* Main content */}
      <div className="flex flex-1 flex-col min-w-0">
        {/* Top header bar */}
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-border bg-white/95 px-4 py-3 backdrop-blur sm:px-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="rounded-lg p-2 text-muted transition hover:bg-neutral-100 lg:hidden"
              aria-label="Toggle sidebar"
            >
              {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
            <div className="hidden sm:block">
              <nav className="flex items-center gap-1.5 text-sm text-muted" aria-label="Breadcrumb">
                <Link href={isAdmin ? "/admin/dashboard" : "/creator/dashboard"} className="hover:text-brand-green">
                  {isAdmin ? "Admin" : "Dashboard"}
                </Link>
                {breadcrumbs.slice(1).map((crumb, i) => (
                  <span key={crumb.href} className="flex items-center gap-1.5">
                    <ChevronRight size={14} />
                    <Link
                      href={crumb.href}
                      className={cn(
                        "hover:text-brand-green",
                        i === breadcrumbs.length - 2 && "font-semibold text-brand-black",
                      )}
                    >
                      {crumb.label}
                    </Link>
                  </span>
                ))}
              </nav>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              className="relative rounded-lg p-2 text-muted transition hover:bg-neutral-100"
              aria-label="Notifications"
            >
              <Bell size={20} />
              <span className="absolute right-1.5 top-1.5 grid h-4 w-4 place-items-center rounded-full bg-error text-[10px] font-bold text-white">
                3
              </span>
            </button>

            <div className="flex items-center gap-2 border-l border-border pl-3">
              <div className="grid h-8 w-8 place-items-center rounded-full bg-brand-green text-sm font-bold text-white">
                {(profile as any)?.display_name?.charAt(0)?.toUpperCase() || "C"}
              </div>
              <div className="hidden sm:block">
                <p className="text-sm font-semibold text-brand-black">
                  {(profile as any)?.display_name || "Creator"}
                </p>
                <p className="text-xs text-muted">{(profile as any)?.email || ""}</p>
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            {/* Page header */}
            <div className="mb-6">
              <h1 className="font-display text-3xl font-black text-brand-black">
                {title}
              </h1>
              <p className="mt-1 max-w-2xl text-sm text-muted">{subtitle}</p>
            </div>

            {action && (
              <div className="mb-6">
                <Link
                  href={action.href}
                  className="inline-flex items-center gap-2 rounded-lg bg-brand-green px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-green-deep"
                >
                  {action.label}
                </Link>
              </div>
            )}

            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
