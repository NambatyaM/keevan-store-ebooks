import Image from "next/image";
import Link from "next/link";
import { BarChart3, Banknote, Download, LockKeyhole, ShieldCheck, Store, Upload } from "lucide-react";
import { ButtonLink } from "@/components/button";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { calculateSaleSplit, formatUgx, site } from "@/lib/constants";

const features = [
  { icon: Store, title: "Personal creator stores", text: "Each author gets a branded store URL and product links to share anywhere." },
  { icon: Banknote, title: "Pesapal payments", text: "Customers pay in a familiar checkout while Keevan Store verifies the transaction." },
  { icon: Download, title: "Instant delivery", text: "Secure downloads become available only after payment confirmation." },
  { icon: BarChart3, title: "Revenue analytics", text: "Track sales, views, downloads, conversion rate, traffic sources, and top products." },
  { icon: ShieldCheck, title: "Admin controls", text: "Moderate products, manage creators, approve withdrawals, and review platform health." },
  { icon: LockKeyhole, title: "Protected files", text: "Signed download URLs, role-based permissions, audit logs, and webhook verification." }
];

export default function Home() {
  const splitExample = calculateSaleSplit(10000);

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: site.name,
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    offers: { "@type": "Offer", price: "0", priceCurrency: "UGX" },
    areaServed: ["Uganda", "Kenya", "Tanzania", "Rwanda", "East Africa"]
  };

  return (
    <>
      <SiteHeader />
      <main>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
        <section className="bg-white">
          <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-16 sm:px-6 md:grid-cols-2 lg:px-8 lg:py-20">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-brand-green">Creator commerce for East Africa</p>
              <h1 className="mt-4 max-w-3xl text-4xl font-black leading-tight text-brand-black sm:text-5xl lg:text-6xl">
                Sell Your E-books Online in Minutes
              </h1>
              <p className="mt-5 max-w-2xl text-lg leading-8 text-neutral-700">
                Create your own digital store, accept payments through Pesapal, and deliver e-books instantly to customers across East Africa.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <ButtonLink href="/signup" icon>
                  Start Selling Free
                </ButtonLink>
                <ButtonLink href="/pricing" variant="secondary">
                  View Pricing
                </ButtonLink>
              </div>
              <div className="mt-8 grid max-w-xl grid-cols-3 gap-3 text-sm">
                <div className="rounded-lg bg-brand-mist p-4">
                  <p className="font-bold">10%</p>
                  <p className="text-neutral-600">Platform fee</p>
                </div>
                <div className="rounded-lg bg-neutral-100 p-4">
                  <p className="font-bold">{formatUgx(50000)}</p>
                  <p className="text-neutral-600">Minimum withdrawal</p>
                </div>
                <div className="rounded-lg bg-neutral-100 p-4">
                  <p className="font-bold">4 MB</p>
                  <p className="text-neutral-600">E-book uploads</p>
                </div>
              </div>
            </div>
            <div className="relative min-h-[520px] overflow-hidden rounded-lg bg-neutral-950 text-white">
              <Image
                src="https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=1200&q=80"
                alt="Creators working together"
                fill
                priority
                className="object-cover opacity-45"
              />
              <div className="absolute inset-x-6 bottom-6 rounded-lg bg-white p-5 text-brand-black shadow-soft">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm text-neutral-500">Sample fee split</p>
                    <p className="mt-1 text-2xl font-bold">{formatUgx(splitExample.grossAmount)}</p>
                  </div>
                  <Upload className="text-brand-green" aria-hidden />
                </div>
                <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
                  <div className="rounded-md bg-neutral-100 p-3">
                    <p className="text-neutral-500">Platform fee</p>
                    <p className="font-bold">{formatUgx(splitExample.platformFee)}</p>
                  </div>
                  <div className="rounded-md bg-brand-mist p-3">
                    <p className="text-neutral-600">Creator earns</p>
                    <p className="font-bold text-brand-green">{formatUgx(splitExample.creatorEarnings)}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="border-y border-neutral-200 bg-neutral-50">
          <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
            <div className="max-w-2xl">
              <h2 className="text-3xl font-bold text-brand-black">Everything authors need to sell directly</h2>
              <p className="mt-3 text-neutral-600">Built for simple launches, clean checkout, instant file delivery, and clear earnings.</p>
            </div>
            <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {features.map((feature) => (
                <div key={feature.title} className="rounded-lg border border-neutral-200 bg-white p-5">
                  <feature.icon className="text-brand-green" aria-hidden />
                  <h3 className="mt-4 text-lg font-bold">{feature.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-neutral-600">{feature.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
          <div className="grid gap-6 md:grid-cols-3">
            {["Customer lands on a product page", "Pays securely through Pesapal", "Downloads instantly after verification"].map((step, index) => (
              <div key={step} className="rounded-lg border border-neutral-200 p-6">
                <p className="text-sm font-bold text-brand-green">Step {index + 1}</p>
                <h3 className="mt-2 text-xl font-bold">{step}</h3>
              </div>
            ))}
          </div>
          <div className="mt-10 flex flex-col items-start justify-between gap-5 rounded-lg bg-brand-black p-6 text-white md:flex-row md:items-center">
            <div>
              <h2 className="text-2xl font-bold">Ready to build your author store?</h2>
              <p className="mt-2 text-neutral-300">Start free, upload your first e-book, and share your store link today.</p>
            </div>
            <ButtonLink href="/signup" variant="primary" icon>
              Start Selling Free
            </ButtonLink>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
