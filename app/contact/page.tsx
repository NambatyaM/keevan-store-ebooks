import { ButtonLink } from "@/components/button";
import { SimplePage } from "@/components/simple-page";
import { site } from "@/lib/constants";

export default function ContactPage() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "ContactPage",
    name: "Contact Keevan Store",
    description: "Get help with your Keevan Store creator account, product uploads, payments, withdrawals, or buyer issues.",
    contactPoint: {
      "@type": "ContactPoint",
      telephone: site.supportPhone,
      contactType: "customer support",
      availableLanguage: ["English"],
      areaServed: ["UG", "KE", "TZ", "RW"]
    }
  };

  return (
    <SimplePage title="Contact Keevan Store Support" eyebrow="We are here to help">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <p>
        Need help setting up your store, uploading a product, understanding your earnings, or processing a withdrawal? Our support team is available via WhatsApp.
      </p>
      <div className="mt-6 rounded-lg border border-neutral-200 p-5">
        <p className="font-semibold">WhatsApp Support</p>
        <p className="mt-1 text-lg">{site.supportPhone}</p>
        <p className="mt-2 text-sm text-neutral-600">Response time: typically within 24 hours on business days.</p>
        <div className="mt-4">
          <ButtonLink href={site.supportWhatsApp}>Chat on WhatsApp</ButtonLink>
        </div>
      </div>
      <section className="mt-8">
        <h2 className="text-2xl font-bold text-brand-black">Common support topics</h2>
        <ul className="mt-4 grid gap-3 leading-7 text-neutral-700">
          <li><strong>Store setup</strong> — Creating your account, uploading products, customizing your store</li>
          <li><strong>Payments and withdrawals</strong> — Understanding earnings, requesting payouts, withdrawal timing</li>
          <li><strong>Product uploads</strong> — File format support, size limits, cover images, product descriptions</li>
          <li><strong>Buyer issues</strong> — Purchase problems, download links, payment questions</li>
          <li><strong>Account management</strong> — Profile updates, password reset, account deletion requests</li>
        </ul>
      </section>
      <section className="mt-8">
        <h2 className="text-2xl font-bold text-brand-black">Before contacting support</h2>
        <p>
          Check the <a href="/faq" className="text-brand-green underline">FAQ page</a> for instant answers to common questions. Most issues — including account setup, product uploads, and withdrawal requests — are covered there.
        </p>
      </section>
    </SimplePage>
  );
}
