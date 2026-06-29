import type { Metadata } from "next";
import { SimplePage } from "@/components/simple-page";
import { site } from "@/lib/constants";

export const metadata: Metadata = {
  title: "About Keevan Store — East African Creator Commerce Platform",
  description: "Keevan Store is a creator commerce platform built for East African authors, educators, coaches, and digital creators. Sell e-books, guides, templates, and digital products. No monthly fees. Pesapal payments. Serving Uganda, Kenya, Tanzania, Rwanda.",
  openGraph: {
    title: "About Keevan Store — Creator Commerce for East Africa",
    description: "Learn how Keevan Store helps East African authors, educators, and creators sell digital products online with zero monthly fees.",
    images: [{ url: `${site.url}/og-image.png`, width: 1200, height: 630, alt: "About Keevan Store" }]
  }
};

export default function AboutPage() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: site.name,
    description: "Keevan Store is a creator commerce platform for East African authors, educators, coaches, and digital creators to sell e-books, guides, templates, and digital products directly to customers through branded storefronts with Pesapal payment processing.",
    url: site.url,
    areaServed: ["Uganda", "Kenya", "Tanzania", "Rwanda"],
    foundingDate: "2025",
    founder: { "@type": "Person", name: "Keevan Store Team" }
  };

  return (
    <SimplePage title="About Keevan Store" eyebrow="For East African creators">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <p>
        Keevan Store is a creator commerce platform built for East African authors, educators, coaches, and independent digital creators. Our purpose is simple: give creators the tools to sell knowledge products directly to their audience without paying monthly fees, hiring developers, or setting up complex e-commerce infrastructure.
      </p>
      <p>
        The platform was designed around a specific set of constraints that matter to African creators. Pricing in Ugandan shillings. Payment processing through Pesapal, East Africa&apos;s leading payment gateway. WhatsApp-based customer support. Dashboards that focus on revenue instead of complexity. File delivery that works on mobile connections.
      </p>
      <p>
        Our first audience is creators in Uganda and across East Africa — Kenya, Tanzania, and Rwanda. These are writers publishing e-books, educators selling course materials, coaches offering worksheets and guides, and template designers distributing digital resources. Each of them needed a way to sell that did not require a technical background, a monthly budget, or a foreign payment account.
      </p>
      <section>
        <h2 className="text-2xl font-bold text-brand-black">How Keevan Store works</h2>
        <p>
          Creators sign up, upload their digital product, and receive a branded store URL. Customers visit that link, pay through Pesapal using mobile money or card, and download the file instantly after server-side payment verification. Creators track their sales, views, and earnings in a dashboard and request withdrawals once their balance reaches the minimum threshold.
        </p>
        <p>
          The platform handles payment processing, file storage with signed download URLs, analytics tracking, and admin moderation. Creators focus on creating content. Keevan Store handles the rest.
        </p>
      </section>
      <section>
        <h2 className="text-2xl font-bold text-brand-black">Why Keevan Store exists</h2>
        <p>
          Most e-commerce platforms are built for physical goods, Western markets, and monthly subscription models. They do not fit how African creators sell digital products. Keevan Store was built specifically for the East African digital creator economy — no foreign payment accounts, no complex tax setup, no monthly fees that eat into irregular income.
        </p>
        <p>
          According to industry data, the African creator economy is growing rapidly, yet most global platforms do not support local payment methods like mobile money. Keevan Store bridges this gap by integrating directly with Pesapal, which processes payments in UGX through MTN Mobile Money, Airtel Money, card payments, and bank transfers.
        </p>
      </section>
    </SimplePage>
  );
}
