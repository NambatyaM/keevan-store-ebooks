import type { Metadata } from "next";
import { ButtonLink } from "@/components/button";
import { SimplePage } from "@/components/simple-page";
import { site } from "@/lib/constants";
import { Store, Banknote, Download, BarChart3, ShieldCheck, LockKeyhole, Users, BookOpen, Globe, Smartphone, RefreshCcw, Search } from "lucide-react";

export const metadata: Metadata = {
  title: "Features — Sell Digital Products in East Africa",
  description: "Explore all features of Keevan Store: branded storefronts, Pesapal payments, instant file delivery, analytics dashboard, secure storage, and more. Everything East African creators need to sell online.",
  openGraph: {
    title: "Keevan Store Features — Everything You Need to Sell Digital Products",
    description: "Branded storefronts, Pesapal mobile money payments, instant file delivery, sales analytics, and more. No monthly fees.",
    images: [{ url: `${site.url}/og-image.png`, width: 1200, height: 630, alt: "Keevan Store Features" }]
  }
};

const featureList = [
  {
    icon: Store,
    title: "Branded creator storefront",
    desc: "Every creator gets a personalized store URL and unlimited product links to share on social media, WhatsApp groups, email, or their website. No store builder to learn."
  },
  {
    icon: Users,
    title: "Friction-free checkout",
    desc: "Buyers do not need an account to purchase. They pay through Pesapal with mobile money, card, or bank transfer and download the file immediately after verification."
  },
  {
    icon: Banknote,
    title: "Pesapal payment processing",
    desc: "Keevan Store integrates with Pesapal, East Africa's leading payment gateway. All transactions use server-side verification to prevent fraud and confirm payment before delivery."
  },
  {
    icon: Download,
    title: "Instant file delivery",
    desc: "When payment is confirmed, customers receive a signed download link valid for their purchase. Files are delivered in seconds, not hours."
  },
  {
    icon: BookOpen,
    title: "Multiple file format support",
    desc: "Upload PDF, EPUB, MOBI, and ZIP files up to 4 MB. Customers download in the format that works on their device."
  },
  {
    icon: BarChart3,
    title: "Revenue and analytics dashboard",
    desc: "Track views, purchases, download counts, conversion rates, and earnings. See which products perform best and where your traffic comes from."
  },
  {
    icon: RefreshCcw,
    title: "Product management",
    desc: "Add, edit, or update products anytime. Change prices, replace files, update descriptions, or unpublish products — all from your dashboard."
  },
  {
    icon: LockKeyhole,
    title: "Secure file storage",
    desc: "Files are stored in Supabase cloud storage with signed, time-limited download URLs. Payment verification happens server-side before any download is permitted."
  },
  {
    icon: Smartphone,
    title: "Mobile-friendly storefronts",
    desc: "Customer-facing store pages and product pages work on any device. No app required. Share links that open instantly on any phone."
  },
  {
    icon: Globe,
    title: "Multi-currency, East Africa focused",
    desc: "Buyers pay in UGX, KES, TZS, RWF, or USD. Your store currency is locked after your first sale. All payouts are processed in your chosen currency."
  },
  {
    icon: Search,
    title: "SEO-optimized product pages",
    desc: "Each product page includes structured data, canonical URLs, Open Graph tags, and semantic HTML for search engine discoverability."
  },
  {
    icon: ShieldCheck,
    title: "Withdrawal to mobile money",
    desc: "Request payouts directly to your MTN or Airtel Money account. Minimums: 50,000 UGX, 1,500 KES, 30,000 TZS, 20,000 RWF, or 20 USD."
  }
];

export default function FeaturesPage() {
  return (
    <SimplePage title="Features" eyebrow="Everything you need to sell digital products">
      <p>
        Keevan Store gives East African creators everything required to publish, sell, and deliver digital products without managing hosting, payments, or file storage. Every feature is designed for the way African creators actually work.
      </p>
      <div className="mt-6">
        <ButtonLink href="/signup" icon>Create Your Free Store</ButtonLink>
      </div>
      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {featureList.map(({ icon: Icon, title, desc }) => (
          <div key={title} className="rounded-lg border border-neutral-200 p-4">
            <Icon className="text-brand-green" aria-hidden />
            <h3 className="mt-3 text-lg font-bold">{title}</h3>
            <p className="mt-2 text-sm leading-6 text-neutral-600">{desc}</p>
          </div>
        ))}
      </div>
      <div className="mt-10 text-center">
        <ButtonLink href="/signup" icon>Create Your Free Store</ButtonLink>
      </div>
    </SimplePage>
  );
}
