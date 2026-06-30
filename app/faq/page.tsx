import type { Metadata } from "next";
import { SimplePage } from "@/components/simple-page";
import { site } from "@/lib/constants";
import { FAQContent } from "./faq-content";
import { faqs } from "./faq-data";

export const metadata: Metadata = {
  title: "FAQ — Selling and Buying Digital Products in East Africa",
  description: "Answers to common questions about selling e-books and digital products on Keevan Store. Learn about pricing, payments, withdrawals, file formats, refunds, and more. Serving Uganda, Kenya, Tanzania, Rwanda.",
  openGraph: {
    title: "Keevan Store FAQ — Frequently Asked Questions",
    description: "Find answers about selling digital products in East Africa: pricing, Pesapal payments, withdrawals, file formats, refunds, and account management.",
    images: [{ url: `${site.url}/og-image.png`, width: 1200, height: 630, alt: "Keevan Store FAQ" }]
  }
};

const schema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqs.map(({ q, a }) => ({
    "@type": "Question",
    name: q,
    acceptedAnswer: { "@type": "Answer", text: a }
  }))
};

export default function FAQPage() {
  return (
    <SimplePage title="Frequently Asked Questions" eyebrow="Answers">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <FAQContent />
    </SimplePage>
  );
}
