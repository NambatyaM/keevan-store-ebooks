import type { Metadata } from "next";
import { ButtonLink } from "@/components/button";
import { SimplePage } from "@/components/simple-page";
import { formatUgx, site } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Pricing — Sell Digital Products with Zero Monthly Fees",
  description: "Keevan Store is free to join. No monthly subscriptions. Pay only 10% commission when you make a sale. Compare with Shopify, Gumroad, and self-hosted solutions. East African creators keep 90%.",
  openGraph: {
    title: "Keevan Store Pricing — No Monthly Fees, Pay Only When You Sell",
    description: "Free to join. 10% commission per sale. No monthly fees, no listing fees, no hidden charges. Compare with alternatives.",
    images: [{ url: `${site.url}/og-image.png`, width: 1200, height: 630, alt: "Keevan Store Pricing" }]
  }
};

export default function PricingPage() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: "Keevan Store Creator Plan",
    description: "Sell digital products online with zero monthly fees. Pay 10% commission only when you make a sale.",
    offers: [{
      "@type": "Offer",
      name: "Creator plan",
      price: "0",
      priceCurrency: "UGX",
      priceSpecification: { "@type": "UnitPriceSpecification", price: "0", priceCurrency: "UGX", unitText: "month" },
      availability: "https://schema.org/InStock"
    }],
    commissionRate: "10%",
    areaServed: ["Uganda", "Kenya", "Tanzania", "Rwanda"]
  };

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      { "@type": "Question", name: "Does Keevan Store charge monthly fees?", acceptedAnswer: { "@type": "Answer", text: "No. Keevan Store has no monthly subscription fee. You only pay a 10% commission when you make a sale." } },
      { "@type": "Question", name: "What is the minimum withdrawal amount?", acceptedAnswer: { "@type": "Answer", text: "Creators can request withdrawals once their available balance reaches the minimum threshold for their store's currency: 50,000 UGX, 1,500 KES, 30,000 TZS, 20,000 RWF, or 20 USD." } },
      { "@type": "Question", name: "Are there fees for withdrawing earnings?", acceptedAnswer: { "@type": "Answer", text: "Withdrawal requests are processed by platform administrators. There are no additional platform fees for withdrawals." } }
    ]
  };

  return (
    <SimplePage title="Pricing — No Monthly Fees, Pay Only When You Sell" eyebrow="Transparent pricing">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <p>
        Keevan Store is free to join. There are no monthly subscription fees, no listing fees, and no hidden charges. The only cost is a 10% platform commission deducted from each successful sale. If you do not make a sale, you pay nothing.
      </p>
      <section className="mt-8 rounded-lg border border-neutral-200 p-6">
        <p className="text-5xl font-black text-brand-green">10%</p>
        <p className="mt-2 text-lg font-semibold">platform commission per successful sale</p>
        <p className="mt-4 leading-7 text-neutral-700">
          Creators keep 90% of every paid order. Withdrawals can be requested once your available balance reaches the minimum threshold. There are no additional fees for requesting payouts.
        </p>
        <div className="mt-6">
          <ButtonLink href="/signup">Start Selling Free</ButtonLink>
        </div>
      </section>
      <section className="mt-8">
        <h2 className="text-2xl font-bold text-brand-black">What 10% covers</h2>
        <ul className="mt-4 grid gap-3 leading-7 text-neutral-700">
          <li><strong>Payment processing</strong> — Pesapal integration, transaction verification, and fraud prevention</li>
          <li><strong>File storage and delivery</strong> — Secure cloud storage, signed download URLs, and instant delivery servers</li>
          <li><strong>Analytics and dashboards</strong> — Sales tracking, view counts, download statistics, and revenue reporting</li>
          <li><strong>Customer support</strong> — WhatsApp-based help for creators and buyers</li>
          <li><strong>Admin moderation</strong> — Product review, creator management, withdrawal processing, and platform security</li>
        </ul>
        <p className="mt-6 leading-7 text-neutral-700">
          Compare that to running your own website hosting, payment gateway, file delivery system, and support desk. Keevan Store bundles everything into a single commission that only applies when you earn.
        </p>
      </section>
      <section className="mt-8">
        <h2 className="text-2xl font-bold text-brand-black">What it costs to sell with Keevan Store vs alternatives</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-neutral-300 text-left font-semibold">
                <th className="p-3">Fee type</th>
                <th className="p-3">Keevan Store</th>
                <th className="p-3">Shopify (basic)</th>
                <th className="p-3">Gumroad</th>
                <th className="p-3">Self-hosted</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-neutral-200">
                <td className="p-3 font-medium">Monthly fee</td>
                <td className="p-3 text-brand-green font-semibold">UGX 0</td>
                <td className="p-3">~$39 (~UGX 150,000)</td>
                <td className="p-3">$0 (free plan)</td>
                <td className="p-3">$10–$50 hosting</td>
              </tr>
              <tr className="border-b border-neutral-200">
                <td className="p-3 font-medium">Transaction fee</td>
                <td className="p-3 text-brand-green font-semibold">10%</td>
                <td className="p-3">2.9% + $0.30 + 2%</td>
                <td className="p-3">9% (free plan)</td>
                <td className="p-3">3–5% payment gateway</td>
              </tr>
              <tr className="border-b border-neutral-200">
                <td className="p-3 font-medium">Local payment support</td>
                <td className="p-3 text-brand-green font-semibold">Pesapal (mobile money)</td>
                <td className="p-3">Limited</td>
                <td className="p-3">No</td>
                <td className="p-3">Depends on gateway</td>
              </tr>
              <tr>
                <td className="p-3 font-medium">File delivery</td>
                <td className="p-3 text-brand-green font-semibold">Automated</td>
                <td className="p-3">App required</td>
                <td className="p-3">Automated</td>
                <td className="p-3">Self-built</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </SimplePage>
  );
}
