"use client";

import { useEffect, useState, useCallback } from "react";
import { DashboardShell } from "@/components/dashboard-shell";
import { useAuth } from "@/components/auth-provider";
import {
  Check,
  Copy,
  Globe,
  Share2,
  MessageCircle,
  Calendar,
  Eye,
  MousePointerClick,
  TrendingUp,
  Rocket,
  CheckCircle2,
  Circle,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  ClipboardList,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/toast";

const STEPS = [
  {
    id: 1,
    title: "Share your store link",
    description: "Get your store link in front of as many people as possible",
    buttonLabel: "Copy WhatsApp Message",
    items: [
      { id: "s1", label: "Copy your store link" },
      { id: "s2", label: "Share on WhatsApp status (2\u20133 times today)" },
      { id: "s3", label: "Send to at least 10 contacts or friends" },
    ],
  },
  {
    id: 2,
    title: "Post on social media",
    description: "Share your store on LinkedIn, Facebook, or Instagram",
    buttonLabel: "Copy Social Post",
    items: [
      { id: "s4", label: "Post your store link on LinkedIn, Facebook, or Instagram" },
      { id: "s5", label: "Encourage reposting after a few hours" },
    ],
  },
  {
    id: 3,
    title: "Direct outreach",
    description: "Send personal messages to potential buyers",
    buttonLabel: "Copy DM Message",
    items: [
      { id: "s6", label: "Send your store link directly to 10\u201320 people" },
      { id: "s7", label: "Ask for feedback or interest" },
    ],
  },
];

const ALL_ITEM_IDS = STEPS.flatMap((s) => s.items.map((i) => i.id));

const SEVEN_DAY_PLAN = [
  { day: 1, task: "Share link on WhatsApp 3 times" },
  { day: 2, task: "Post on social media + DM 10 people" },
  { day: 3, task: "Ask for feedback" },
  { day: 4, task: "Repost with better hook" },
  { day: 5, task: "Share benefit-focused post" },
  { day: 6, task: "Engage communities/groups" },
  { day: 7, task: "Repeat best method" },
];

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  "not-started": { label: "Not started", color: "text-muted", bg: "bg-neutral-100" },
  "in-progress": { label: "In progress", color: "text-amber-600", bg: "bg-amber-100" },
  completed: { label: "Completed", color: "text-success", bg: "bg-green-100" },
};

function ProgressDots({ step, total }: { step: number; total: number }) {
  return (
    <div className="flex items-center gap-1.5">
      {Array.from({ length: total }, (_, i) => (
        <div
          key={i}
          className={cn(
            "h-2 w-2 rounded-full transition-all duration-300",
            i < step ? "bg-brand-green" : i === step ? "bg-brand-green/50" : "bg-neutral-200",
          )}
        />
      ))}
    </div>
  );
}

export default function FirstSalePage() {
  const { toast } = useToast();
  const { profile } = useAuth();
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set());
  const [copiedTemplate, setCopiedTemplate] = useState<string | null>(null);
  const [summaryToday, setSummaryToday] = useState<Record<string, number>>({});
  const [summaryWeek, setSummaryWeek] = useState<Record<string, number>>({});
  const [analyticsLoading, setAnalyticsLoading] = useState(true);
  const [storeLink, setStoreLink] = useState("");

  useEffect(() => {
    if (profile?.store_slug) {
      setStoreLink(`${window.location.origin}/store/${profile.store_slug}`);
    } else {
      setStoreLink("");
    }
  }, [profile]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("ks-first-sale-checklist");
      if (saved) {
        setCheckedItems(new Set(JSON.parse(saved)));
      }
    } catch {}
  }, []);

  const toggleItem = useCallback((itemId: string) => {
    setCheckedItems((prev) => {
      const next = new Set(prev);
      if (next.has(itemId)) {
        next.delete(itemId);
      } else {
        next.add(itemId);
      }
      localStorage.setItem("ks-first-sale-checklist", JSON.stringify([...next]));
      return next;
    });
  }, []);

  useEffect(() => {
    setAnalyticsLoading(true);
    Promise.all([
      fetch("/api/analytics/summary?days=1").then((r) => r.json()).catch(() => ({ summary: {} })),
      fetch("/api/analytics/summary?days=7").then((r) => r.json()).catch(() => ({ summary: {} })),
    ])
      .then(([today, week]) => {
        setSummaryToday(today.summary ?? {});
        setSummaryWeek(week.summary ?? {});
      })
      .catch(() => {})
      .finally(() => setAnalyticsLoading(false));
  }, []);

  const totalItems = ALL_ITEM_IDS.length;
  const completedCount = ALL_ITEM_IDS.filter((id) => checkedItems.has(id)).length;
  const progress = totalItems > 0 ? Math.round((completedCount / totalItems) * 100) : 0;

  const getStepStatus = (stepItems: { id: string }[]) => {
    const done = stepItems.every((i) => checkedItems.has(i.id));
    const inProgress = stepItems.some((i) => checkedItems.has(i.id));
    if (done) return "completed";
    if (inProgress) return "in-progress";
    return "not-started";
  };

  const completedSteps = STEPS.filter((s) => getStepStatus(s.items) === "completed").length;

  const handleCopy = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedTemplate(label);
      toast("success", "Copied to clipboard!");
      setTimeout(() => setCopiedTemplate(null), 2000);
    } catch {
      toast("error", "Failed to copy");
    }
  };

  const whatsappMessage = storeLink
    ? `Hey \uD83D\uDC4B I just launched my digital product on Keevan Store. If you're interested in [topic], check it out here: ${storeLink}`
    : "";
  const socialPost = storeLink
    ? `I just published my first digital product \uD83D\uDE80\nWould love your feedback \uD83D\uDE4F\nHere's the link: ${storeLink}`
    : "";
  const dmMessage = storeLink
    ? `Hey, I just launched something you might find useful. Would love your thoughts: ${storeLink}`
    : "";

  const storeViewsToday = summaryToday.store_view ?? 0;
  const productViewsToday = summaryToday.product_view ?? 0;
  const totalViewsWeek = (summaryWeek.store_view ?? 0) + (summaryWeek.product_view ?? 0);

  return (
    <DashboardShell title="Get Your First Sale" subtitle="Your store is live. Now follow these simple steps to get your first customers." role="creator">
      {/* Progress indicator */}
      <div className="mb-8 rounded-xl border border-border bg-surface-card p-5 shadow-card">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-lg bg-brand-green text-white">
              <Rocket size={20} />
            </div>
            <div>
              <p className="font-bold text-brand-black">Getting started progress</p>
              <p className="text-sm text-muted">{completedCount} of {totalItems} actions done</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              {STEPS.map((step) => {
                const status = getStepStatus(step.items);
                const cfg = STATUS_CONFIG[status];
                return (
                  <div key={step.id} className="flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold" style={{ backgroundColor: cfg.bg }}>
                    <div className={cn("h-1.5 w-1.5 rounded-full", status === "completed" ? "bg-success" : status === "in-progress" ? "bg-amber-500" : "bg-neutral-300")} />
                    <span className={cfg.color}>Step {step.id}: {cfg.label}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
        <div className="mt-4 h-2 overflow-hidden rounded-full bg-neutral-100">
          <div
            className="h-full rounded-full bg-brand-green transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <div className="mb-8 grid gap-6 lg:grid-cols-[1fr_1fr]">
        {/* Left column - Action Checklist */}
        <div className="space-y-6">
          <h2 className="font-display text-xl font-bold text-brand-black">Action Checklist</h2>

          {STEPS.map((step) => {
            const status = getStepStatus(step.items);
            const stepItems = step.items.map((item) => ({
              ...item,
              done: checkedItems.has(item.id),
            }));

            return (
              <div
                key={step.id}
                className={cn(
                  "rounded-xl border bg-surface-card p-5 shadow-card transition-all",
                  status === "completed" ? "border-success/30" : "border-border",
                )}
              >
                <div className="mb-3 flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        "grid h-8 w-8 shrink-0 place-items-center rounded-full text-sm font-bold",
                        status === "completed"
                          ? "bg-success text-white"
                          : status === "in-progress"
                            ? "border-2 border-amber-400 text-amber-600"
                            : "border-2 border-neutral-200 text-muted",
                      )}
                    >
                      {status === "completed" ? <Check size={14} /> : step.id}
                    </div>
                    <div>
                      <h3 className="font-bold text-brand-black">{step.title}</h3>
                      <p className="text-xs text-muted">{step.description}</p>
                    </div>
                  </div>
                  <div className={cn(
                    "rounded-full px-2.5 py-0.5 text-[11px] font-semibold",
                    STATUS_CONFIG[status].bg,
                    STATUS_CONFIG[status].color,
                  )}>
                    {STATUS_CONFIG[status].label}
                  </div>
                </div>

                <div className="ml-11 space-y-2">
                  {stepItems.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => toggleItem(item.id)}
                      className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition hover:bg-brand-mist"
                    >
                      <div
                        className={cn(
                          "grid h-5 w-5 shrink-0 place-items-center rounded-full border-2 transition-all",
                          item.done
                            ? "border-success bg-success text-white"
                            : "border-neutral-300",
                        )}
                      >
                        {item.done && <Check size={10} />}
                      </div>
                      <span className={cn(item.done && "text-muted line-through")}>
                        {item.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            );
          })}

          <div className="rounded-xl border border-border bg-surface-card p-5 shadow-card">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <ClipboardList size={20} className="text-brand-green" />
                <div>
                  <h3 className="font-bold text-brand-black">Copy ready-to-use messages</h3>
                  <p className="text-xs text-muted">Pre-written templates you can send right now</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right column - Templates + 7-day plan + Analytics + Motivation */}
        <div className="space-y-6">
          {/* Copy-Paste Message Block */}
          <div className="rounded-xl border border-border bg-surface-card p-5 shadow-card">
            <h3 className="mb-4 text-lg font-bold text-brand-black">Ready-Made Messages</h3>

            <div className="space-y-4">
              {/* WhatsApp Message */}
              <div className="rounded-lg border border-border bg-surface p-4">
                <div className="mb-2 flex items-center gap-2">
                  <MessageCircle size={16} className="text-success" />
                  <span className="text-xs font-bold uppercase tracking-wide text-muted">WhatsApp</span>
                </div>
                <p className="mb-3 text-sm leading-relaxed text-brand-black">
                  Hey 👋 I just launched my digital product on Keevan Store. If you&apos;re interested in [topic], check it out here: {storeLink || "[STORE LINK]"}
                </p>
                <button
                  onClick={() => handleCopy(whatsappMessage, "whatsapp")}
                  disabled={!storeLink}
                  className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-xs font-semibold text-brand-green transition hover:bg-brand-mist disabled:opacity-50"
                >
                  {copiedTemplate === "whatsapp" ? <Check size={14} /> : <Copy size={14} />}
                  {copiedTemplate === "whatsapp" ? "Copied!" : "Copy WhatsApp Message"}
                </button>
              </div>

              {/* Social Media Post */}
              <div className="rounded-lg border border-border bg-surface p-4">
                <div className="mb-2 flex items-center gap-2">
                  <Globe size={16} className="text-blue-500" />
                  <span className="text-xs font-bold uppercase tracking-wide text-muted">LinkedIn / Facebook</span>
                </div>
                <p className="mb-3 text-sm leading-relaxed text-brand-black whitespace-pre-line">
                  {`I just published my first digital product 🚀\nWould love your feedback 🙏\nHere's the link: ${storeLink || "[STORE LINK]"}`}
                </p>
                <button
                  onClick={() => handleCopy(socialPost, "social")}
                  disabled={!storeLink}
                  className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-xs font-semibold text-brand-green transition hover:bg-brand-mist disabled:opacity-50"
                >
                  {copiedTemplate === "social" ? <Check size={14} /> : <Copy size={14} />}
                  {copiedTemplate === "social" ? "Copied!" : "Copy Social Post"}
                </button>
              </div>

              {/* DM Message */}
              <div className="rounded-lg border border-border bg-surface p-4">
                <div className="mb-2 flex items-center gap-2">
                  <MessageCircle size={16} className="text-brand-green" />
                  <span className="text-xs font-bold uppercase tracking-wide text-muted">Direct Message</span>
                </div>
                <p className="mb-3 text-sm leading-relaxed text-brand-black">
                  Hey, I just launched something you might find useful. Would love your thoughts: {storeLink || "[STORE LINK]"}
                </p>
                <button
                  onClick={() => handleCopy(dmMessage, "dm")}
                  disabled={!storeLink}
                  className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-xs font-semibold text-brand-green transition hover:bg-brand-mist disabled:opacity-50"
                >
                  {copiedTemplate === "dm" ? <Check size={14} /> : <Copy size={14} />}
                  {copiedTemplate === "dm" ? "Copied!" : "Copy DM Message"}
                </button>
              </div>
            </div>
          </div>

          {/* 7-Day Plan */}
          <div className="rounded-xl border border-border bg-surface-card p-5 shadow-card">
            <div className="mb-4 flex items-center gap-2">
              <Calendar size={18} className="text-brand-green" />
              <h3 className="text-lg font-bold text-brand-black">7-Day Simple Plan</h3>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              {SEVEN_DAY_PLAN.map((item) => (
                <div key={item.day} className="flex items-center gap-3 rounded-lg border border-border bg-surface px-3 py-2.5">
                  <div className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-brand-green text-[11px] font-bold text-white">
                    {item.day}
                  </div>
                  <span className="text-sm text-brand-black">{item.task}</span>
                </div>
              ))}
            </div>
            <p className="mt-3 text-center text-xs italic text-muted">
              Consistency creates sales, not one-time posting.
            </p>
          </div>

          {/* Analytics Preview */}
          <div className="rounded-xl border border-border bg-surface-card p-5 shadow-card">
            <div className="mb-4 flex items-center gap-2">
              <Eye size={18} className="text-brand-green" />
              <h3 className="text-lg font-bold text-brand-black">Your Traffic Snapshot</h3>
            </div>
            {analyticsLoading ? (
              <div className="flex items-center justify-center py-4">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-brand-green border-t-transparent" />
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-lg border border-border bg-surface p-3 text-center">
                  <p className="text-2xl font-black text-brand-green">{storeViewsToday}</p>
                  <p className="text-xs text-muted">Store views today</p>
                </div>
                <div className="rounded-lg border border-border bg-surface p-3 text-center">
                  <p className="text-2xl font-black text-brand-green">{productViewsToday}</p>
                  <p className="text-xs text-muted">Product page views</p>
                </div>
                <div className="rounded-lg border border-border bg-surface p-3 text-center">
                  <p className="text-2xl font-black text-brand-green">{totalViewsWeek}</p>
                  <p className="text-xs text-muted">Total views this week</p>
                </div>
              </div>
            )}
          </div>

          {/* Motivation Message */}
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-5 shadow-card">
            <div className="flex items-start gap-3">
              <TrendingUp size={20} className="mt-0.5 shrink-0 text-amber-600" />
              <div>
                <p className="text-sm font-semibold text-amber-900">
                  Most creators make their first sale after 20–100 clicks. Your focus is to generate traffic, not wait for it.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
