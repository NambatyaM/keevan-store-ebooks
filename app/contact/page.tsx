import type { Metadata } from "next";
import { ButtonLink } from "@/components/button";
import { SimplePage } from "@/components/simple-page";
import { site } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Contact Support — WhatsApp for Creators and Buyers",
  description: "Contact Keevan Store support via WhatsApp. Get help with store setup, product uploads, payments, withdrawals, and buyer issues. Serving Uganda, Kenya, Tanzania, Rwanda.",
  openGraph: {
    title: "Contact Keevan Store — Support for East African Creators",
    description: "Need help with your creator account, payments, or withdrawals? Contact Keevan Store support via WhatsApp.",
    images: [{ url: `${site.url}/og-image.png`, width: 1200, height: 630, alt: "Contact Keevan Store" }]
  }
};

export default function ContactPage() {
  const schema = {
    "@context": "https://schema.org",
    "@type": "ContactPage",
    name: "Contact Keevan Store",
    description: "Get help with your Keevan Store creator account, product uploads, payments, withdrawals, or buyer issues.",
    contactPoint: [{
      "@type": "ContactPoint",
      telephone: site.supportPhone,
      contactType: "customer support",
      availableLanguage: ["English"],
      areaServed: ["UG", "KE", "TZ", "RW"]
    }, {
      "@type": "ContactPoint",
      email: "support@keevanstore.in",
      contactType: "customer support",
      availableLanguage: ["English"],
      areaServed: ["UG", "KE", "TZ", "RW"]
    }]
  };

  return (
    <SimplePage title="Contact Keevan Store Support" eyebrow="We are here to help">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <p>
        Need help setting up your store, uploading a product, understanding your earnings, or processing a withdrawal? Our support team is ready to help.
      </p>
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className="rounded-lg border border-neutral-200 p-5">
          <p className="font-semibold">WhatsApp Support</p>
          <p className="mt-1 text-lg">{site.supportPhone}</p>
          <p className="mt-2 text-sm text-neutral-600">Response time: typically within 24 hours on business days.</p>
          <p className="mt-2 text-sm text-neutral-600">Best for: urgent issues, payment problems, account questions.</p>
          <p className="mt-2 text-sm text-neutral-500">Include your store name or order ID to help us help you faster.</p>
          <div className="mt-4">
            <ButtonLink href={site.supportWhatsApp}>Chat on WhatsApp</ButtonLink>
          </div>
        </div>
        <div className="rounded-lg border border-neutral-200 p-5">
          <p className="font-semibold">Email Support</p>
          <p className="mt-1 text-lg">support@keevanstore.in</p>
          <p className="mt-2 text-sm text-neutral-600">Response time: typically within 48 hours on business days.</p>
          <p className="mt-2 text-sm text-neutral-600">Best for: detailed inquiries, document attachments, account verification.</p>
          <p className="mt-2 text-sm text-neutral-500">We reply from support@keevanstore.in — add us to your contacts.</p>
        </div>
      </div>
      <section className="mt-8">
        <h2 className="text-2xl font-bold text-brand-black">Expected response times</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-neutral-300 text-left font-semibold">
                <th className="p-3">Issue type</th>
                <th className="p-3">WhatsApp response</th>
                <th className="p-3">Email response</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-neutral-200">
                <td className="p-3 font-medium">Store setup help</td>
                <td className="p-3">&lt; 12 hours</td>
                <td className="p-3">&lt; 24 hours</td>
              </tr>
              <tr className="border-b border-neutral-200">
                <td className="p-3 font-medium">Payment problems</td>
                <td className="p-3">&lt; 6 hours</td>
                <td className="p-3">&lt; 24 hours</td>
              </tr>
              <tr className="border-b border-neutral-200">
                <td className="p-3 font-medium">Withdrawal questions</td>
                <td className="p-3">&lt; 24 hours</td>
                <td className="p-3">&lt; 48 hours</td>
              </tr>
              <tr>
                <td className="p-3 font-medium">General inquiries</td>
                <td className="p-3">&lt; 24 hours</td>
                <td className="p-3">&lt; 48 hours</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
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
