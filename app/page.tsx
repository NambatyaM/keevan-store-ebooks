import Image from "next/image";
import Link from "next/link";
import { BarChart3, Banknote, Download, LockKeyhole, ShieldCheck, Store, Users, BookOpen, ArrowRight } from "lucide-react";
import type { Metadata } from "next";
import { ButtonLink } from "@/components/button";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { formatUgx, site } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Sell E-books Online in East Africa — Keep 90% of Every Sale | Keevan Store",
  description: "Sell e-books, PDFs, guides, and digital products online in Uganda, Kenya, Tanzania, and Rwanda. Free to join. Pesapal payments. Instant file delivery. Pay only 10% when you sell.",
  openGraph: {
    title: "Sell E-books Online in East Africa — Keep 90% of Every Sale | Keevan Store",
    description: "Free platform for East African creators to sell digital products. Pesapal payments, instant delivery, no monthly fees.",
    type: "website",
    images: [{ url: `${site.url}/og-image.png`, width: 1200, height: 630, alt: "Keevan Store — Sell E-books Online" }]
  },
  twitter: {
    title: "Sell E-books Online in East Africa — Keep 90% of Every Sale | Keevan Store",
    description: "Free platform for East African creators to sell digital products. Pesapal payments, instant delivery, no monthly fees.",
    card: "summary_large_image"
  }
};

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    { "@type": "Question", name: "How much does Keevan Store cost?", acceptedAnswer: { "@type": "Answer", text: "Keevan Store charges no monthly fees. Creators pay a 10% platform commission only when a product sells. If you do not make a sale, you pay nothing." } },
    { "@type": "Question", name: "Who can sell on Keevan Store?", acceptedAnswer: { "@type": "Answer", text: "Any East African author, educator, coach, or digital creator who owns the rights to their content can sell on Keevan Store. Currently serving Uganda, Kenya, Tanzania, and Rwanda." } },
    { "@type": "Question", name: "What payment methods does Keevan Store support?", acceptedAnswer: { "@type": "Answer", text: "Keevan Store uses Pesapal, the leading East African payment gateway. Buyers pay via mobile money (MTN, Airtel), card, or bank transfer in UGX, KES, TZS, RWF, or USD." } },
    { "@type": "Question", name: "How do creators receive their earnings?", acceptedAnswer: { "@type": "Answer", text: "Earnings accumulate in your creator dashboard. Once your balance reaches the minimum withdrawal amount for your currency, you can request a manual payout. Minimums are 50,000 UGX, 1,500 KES, 30,000 TZS, 20,000 RWF, or 20 USD." } },
    { "@type": "Question", name: "Do buyers need an account to purchase?", acceptedAnswer: { "@type": "Answer", text: "No. Buyers pay through Pesapal and receive a signed download link instantly — no account creation required." } }
  ]
};

const statsSchema = {
  "@context": "https://schema.org",
  "@type": "Product",
  name: "Keevan Store Platform",
  applicationCategory: "EcommercePlatform",
  description: "East African creator commerce platform for selling digital products. Zero monthly fees, 10% per-sale commission.",
  offers: { "@type": "AggregateOffer", priceCurrency: "UGX", lowPrice: "0", offerCount: "1", availability: "https://schema.org/InStock" },
  areaServed: ["Uganda", "Kenya", "Tanzania", "Rwanda"]
};

export default function Home() {
  return (
    <>
      <SiteHeader />
      <main>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(statsSchema) }} />

        <section className="bg-white">
          <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-16 sm:px-6 md:grid-cols-2 lg:px-8 lg:py-20">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-brand-green">East African creator commerce</p>
              <h1 className="mt-4 max-w-3xl text-4xl font-black leading-tight text-brand-black sm:text-5xl lg:text-6xl">
                Sell E-books Online. Keep 90% of Every Sale.
              </h1>
              <p className="mt-5 max-w-2xl text-lg leading-8 text-neutral-700">
                Keevan Store is the simplest way for East African authors, educators, and creators to sell digital products online. Create a branded store, upload your PDFs or e-books, accept Pesapal payments, and deliver files instantly. No monthly fees. No technical skills required.
              </p>
              <p className="mt-3 max-w-2xl leading-7 text-neutral-600">
                If you write guides, design templates, record courses, or publish e-books, you can start selling in under 10 minutes.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <ButtonLink href="/signup" icon>
                  Create Your Free Store
                </ButtonLink>
                <ButtonLink href="/features" variant="secondary">
                  See How It Works
                </ButtonLink>
              </div>
              <p className="mt-3 text-sm text-neutral-500">
                No credit card required. Your store is live the moment you sign up.
              </p>
              <div className="mt-8 grid max-w-xl grid-cols-3 gap-3 text-sm">
                <div className="rounded-lg bg-brand-mist p-4">
                  <p className="font-bold">10%</p>
                  <p className="text-neutral-600">Platform fee</p>
                </div>
                <div className="rounded-lg bg-neutral-100 p-4">
                  <p className="font-bold">{formatUgx(50000)}</p>
                  <p className="text-neutral-600">Min withdrawal</p>
                </div>
                <div className="rounded-lg bg-neutral-100 p-4">
                  <p className="font-bold">4 MB</p>
                  <p className="text-neutral-600">File upload limit</p>
                </div>
              </div>
            </div>
            <div className="relative min-h-[520px] overflow-hidden rounded-lg bg-neutral-950 text-white">
              <Image
                src="/hero.webp"
                alt="African author reading an e-book on a laptop surrounded by books in a library"
                fill
                priority
                className="object-cover"
              />
              <div className="absolute inset-x-6 bottom-6 rounded-lg bg-white p-5 text-brand-black shadow-soft">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm text-neutral-500">Revenue split per sale</p>
                    <p className="mt-1 text-2xl font-bold">{(site.commissionRate * 100).toFixed(0)}% platform / {(1 - site.commissionRate) * 100}% creator</p>
                  </div>
                  <BarChart3 className="text-brand-green" aria-hidden />
                </div>
                <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
                  <div className="rounded-md bg-neutral-100 p-3">
                    <p className="text-neutral-500">Platform commission</p>
                    <p className="font-bold">{(site.commissionRate * 100).toFixed(0)}%</p>
                  </div>
                  <div className="rounded-md bg-brand-mist p-3">
                    <p className="text-neutral-600">You keep</p>
                    <p className="font-bold text-brand-green">{(1 - site.commissionRate) * 100}%</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="border-y border-neutral-200 bg-neutral-50">
          <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
            <div className="max-w-2xl">
              <h2 className="text-3xl font-bold text-brand-black">What you get when you sell on Keevan Store</h2>
              <p className="mt-3 text-neutral-600">Every tool an East African creator needs to sell digital products directly to customers.</p>
            </div>
            <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {[
                { icon: Store, title: "Your own branded store", text: "Every author gets a personalized store URL and shareable product links. No website builder required." },
                { icon: Users, title: "No buyer accounts needed", text: "Customers pay through Pesapal and download instantly. No sign-up friction means more sales." },
                { icon: Banknote, title: "Pesapal payments in your currency", text: "Buyers pay with mobile money, card, or bank transfer in UGX, KES, TZS, RWF, or USD. Keevan Store verifies every transaction server-side." },
                { icon: Download, title: "Instant file delivery", text: "After payment verification, customers get a signed download link. Files arrive seconds after purchase." },
                { icon: BarChart3, title: "Sales and revenue analytics", text: "Track views, purchases, download counts, and earnings in your dashboard. Know exactly what sells." },
                { icon: BookOpen, title: "Multiple file formats", text: "Upload PDF, EPUB, MOBI, or ZIP files up to 4 MB. Customers download in their preferred format." },
                { icon: LockKeyhole, title: "Protected file storage", text: "Files are stored securely with signed download URLs and server-side payment verification. No leaks." },
                { icon: ShieldCheck, title: "Admin moderation tools", text: "Platform administrators can review products, manage creators, approve withdrawals, and monitor activity." }
              ].map(({ icon: Icon, title, text }) => (
                <div key={title} className="rounded-lg border border-neutral-200 bg-white p-5">
                  <Icon className="text-brand-green" aria-hidden />
                  <h3 className="mt-4 text-lg font-bold">{title}</h3>
                  <p className="mt-2 text-sm leading-6 text-neutral-600">{text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-brand-black">How selling on Keevan Store works</h2>
          <p className="mt-3 text-neutral-600">From upload to payout in four steps.</p>
          <div className="mt-8 grid gap-6 md:grid-cols-4">
            {[
              ["Sign up free", "Create your creator account. No credit card. No monthly fee."],
              ["Upload your product", "Add a PDF, EPUB, MOBI, or ZIP file. Set your price in UGX, KES, TZS, RWF, or USD."],
              ["Share your store", "Your branded store link goes live immediately. Share it anywhere."],
              ["Get paid", "Keevan Store collects payments. You keep 90%. Request withdrawal anytime."]
            ].map(([step, detail], index) => (
              <div key={step} className="rounded-lg border border-neutral-200 p-6">
                <p className="text-sm font-bold text-brand-green">Step {index + 1}</p>
                <h3 className="mt-2 text-xl font-bold">{step}</h3>
                <p className="mt-2 text-sm leading-6 text-neutral-600">{detail}</p>
              </div>
            ))}
          </div>

          <div className="mt-12 flex flex-col items-start justify-between gap-5 rounded-lg bg-brand-black p-6 text-white md:flex-row md:items-center">
            <div>
              <h2 className="text-2xl font-bold">Ready to start selling your digital products?</h2>
              <p className="mt-2 text-neutral-300">Join East African creators already using Keevan Store. Free to start. Pay only when you sell.</p>
            </div>
            <ButtonLink href="/signup" variant="primary" icon>
              Create Your Free Store
            </ButtonLink>
          </div>
        </section>

        <section className="border-t border-neutral-200 bg-neutral-50">
          <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-brand-black">Frequently asked questions about selling e-books online</h2>
            <p className="mt-3 text-neutral-600">Honest answers about how Keevan Store works for creators.</p>
            <div className="mt-8 grid gap-4 lg:grid-cols-2">
              {[
                ["How much does Keevan Store cost?", "Keevan Store charges zero monthly fees. The only cost is a 10% platform commission deducted when a product sells. If you do not make a sale, you pay nothing. Withdrawals to your mobile money or bank account are free."],
                ["Who can sell on Keevan Store?", "Any East African creator who owns the rights to their digital content. Authors, educators, coaches, template designers, and course creators all use Keevan Store. We currently serve Uganda, Kenya, Tanzania, and Rwanda."],
                ["What file formats can I upload?", "You can upload PDF, EPUB, MOBI, and ZIP files up to 4 MB. These cover e-books, guides, templates, worksheets, and bundled resources."],
                ["How do payments work?", "Keevan Store uses Pesapal, East Africa's leading payment gateway. Buyers pay via mobile money (MTN, Airtel), debit or credit card, or bank transfer in the store's currency (UGX, KES, TZS, RWF, or USD)."],
                ["When and how do I get paid?", "Earnings accumulate in your creator dashboard. Once your balance reaches the minimum withdrawal threshold for your currency, you can request a payout. Minimums are 50,000 UGX, 1,500 KES, 30,000 TZS, 20,000 RWF, or 20 USD. Platform administrators review and process payouts manually."],
                ["Do I need technical skills to set up my store?", "No. Sign up, upload your product, and your store is live. There is no coding, no design work, and no hosting setup required."],
                ["Can I edit my product after publishing?", "Yes. Your creator dashboard lets you update product titles, descriptions, prices, and files anytime."],
                ["What if someone buys my product and wants a refund?", "Because digital products are delivered instantly, refunds are handled case by case. Contact support if there is an issue with delivery or payment."]
              ].map(([q, a]) => (
                <section key={q} className="rounded-lg border border-neutral-200 bg-white p-5">
                  <h3 className="text-lg font-bold text-brand-black">{q}</h3>
                  <p className="mt-2 text-sm leading-6 text-neutral-600">{a}</p>
                </section>
              ))}
            </div>
            <div className="mt-8 text-center">
              <Link href="/faq" className="text-sm font-semibold text-brand-green hover:underline">
                View all FAQ &rarr;
              </Link>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
