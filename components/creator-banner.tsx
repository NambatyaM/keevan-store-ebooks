"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Megaphone, Link2, Share2, TrendingUp, X, ArrowRight, Store } from "lucide-react";

const STORAGE_KEY = "ks-creator-promo-banner-dismissed";

const STEPS = [
  { icon: Link2, label: "Copy your store link" },
  { icon: Share2, label: "Share it on WhatsApp & social media" },
  { icon: TrendingUp, label: "Watch sales grow" },
];

export function CreatorBanner({ show }: { show?: boolean }) {
  const [render, setRender] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const decide = (visible: boolean) => {
      if (cancelled || !visible) return;
      try {
        if (localStorage.getItem(STORAGE_KEY)) {
          setDismissed(true);
          return;
        }
      } catch {}
      setRender(true);
    };

    if (show === false) return () => { cancelled = true; };
    if (show === true) {
      decide(true);
      return () => { cancelled = true; };
    }

    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => decide(d.profile?.role === "creator"))
      .catch(() => {});
    return () => { cancelled = true; };
  }, [show]);

  if (dismissed || !render) return null;

  const handleDismiss = () => {
    try {
      localStorage.setItem(STORAGE_KEY, "1");
    } catch {}
    setDismissed(true);
  };

  return (
    <div className="relative z-50 overflow-hidden border-b border-brand-green-deep bg-gradient-to-r from-brand-green via-[#007C46] to-brand-green-deep text-white">
      <div className="pointer-events-none absolute -left-10 -top-16 h-48 w-48 rounded-full bg-white/10" />
      <div className="pointer-events-none absolute -bottom-20 right-1/4 h-52 w-52 rounded-full bg-white/5" />

      <div className="relative mx-auto flex max-w-7xl flex-col gap-4 px-4 py-4 sm:px-6 lg:flex-row lg:items-center lg:gap-6 lg:px-8">
        <div className="flex items-start gap-3 lg:min-w-0 lg:flex-1">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-brand-gold text-brand-green-deep shadow-sm">
            <Megaphone size={20} />
          </span>
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-brand-gold">
              Creator action needed
            </p>
            <h2 className="font-display text-lg font-black leading-tight sm:text-xl">
              Bring buyers to your store
            </h2>
            <p className="mt-1 text-sm text-white/85">
              We deliver your products, but you bring the buyers. Share your store link with your
              audience so more people discover and buy what you sell.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {STEPS.map(({ icon: Icon, label }, i) => (
            <span
              key={label}
              className="flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5 text-xs font-semibold backdrop-blur-sm"
            >
              <Icon size={14} className="text-brand-gold" />
              <span>{label}</span>
              {i < STEPS.length - 1 && <ArrowRight size={12} className="text-white/50" />}
            </span>
          ))}
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <Link
            href="/creator/first-sale"
            className="inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2.5 text-sm font-bold text-brand-green shadow-sm transition hover:bg-brand-mist"
          >
            <TrendingUp size={16} />
            Get your sales plan
          </Link>
          <Link
            href="/creator/settings?tab=store"
            className="inline-flex items-center gap-2 rounded-lg border border-white/40 bg-white/10 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/20"
          >
            <Store size={16} />
            My store &amp; link
          </Link>
          <button
            onClick={handleDismiss}
            className="ml-1 grid h-9 w-9 place-items-center rounded-lg text-white/70 transition hover:bg-white/10 hover:text-white"
            aria-label="Dismiss banner"
          >
            <X size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}
