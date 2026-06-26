import { SimplePage } from "@/components/simple-page";
import { site } from "@/lib/constants";

export default function PrivacyPage() {
  return (
    <SimplePage title="Privacy Policy" eyebrow="Legal">
      <p><strong>Last updated:</strong> June 2026</p>
      <p>
        Keevan Store (operated by Keevan Store, {"contact via WhatsApp at "}{site.supportPhone}) respects your privacy and is committed to protecting the personal data you share with us. This policy explains what data we collect, why we collect it, and how it is used.
      </p>
      <section>
        <h2 className="text-2xl font-bold text-brand-black">Data we collect</h2>
        <p>We collect the following categories of data to operate the platform:</p>
        <ul className="list-disc pl-6 leading-7">
          <li><strong>Creator account data</strong> — name, email address, phone number, profile information, and payout details provided during registration.</li>
          <li><strong>Product data</strong> — titles, descriptions, pricing, file uploads (PDF, EPUB, MOBI, ZIP), and cover images that creators publish on the platform.</li>
          <li><strong>Purchase data</strong> — buyer email address, name, phone number, and transaction reference IDs collected at checkout for payment verification and file delivery.</li>
          <li><strong>Analytics events</strong> — anonymized page views, product views, download events, and purchase events used to power platform analytics dashboards.</li>
          <li><strong>Technical data</strong> — IP addresses, browser user agent strings, and request timestamps used for rate limiting, abuse prevention, and platform security.</li>
        </ul>
      </section>
      <section>
        <h2 className="text-2xl font-bold text-brand-black">How we use your data</h2>
        <p>
          Creator data is used to maintain accounts, process withdrawals, and communicate platform updates. Product data is displayed publicly on storefronts and product pages. Purchase data is used to verify payments via Pesapal and deliver signed download links to paying customers. Analytics events are aggregated to show sales performance and traffic data to creators and administrators. Technical data is used for rate limiting, abuse detection, and platform security monitoring.
        </p>
      </section>
      <section>
        <h2 className="text-2xl font-bold text-brand-black">Data sharing</h2>
        <p>
          We share payment-related data (transaction amount, buyer email, phone number, and merchant reference) with Pesapal to process and verify payments. We do not sell personal data to third parties. We do not use personal data for advertising or marketing purposes beyond platform communications.
        </p>
      </section>
      <section>
        <h2 className="text-2xl font-bold text-brand-black">Data retention</h2>
        <p>
          Creator account data is retained as long as the account remains active. Purchase records are retained for financial reconciliation and platform operations. Analytics events are retained in aggregate form. Creators may request deletion of their account and associated data by contacting support.
        </p>
      </section>
      <section>
        <h2 className="text-2xl font-bold text-brand-black">Your rights</h2>
        <p>
          You have the right to request access to the personal data we hold about you, request correction of inaccurate data, request deletion of your data (subject to legal obligations), and withdraw consent where processing is based on consent. To exercise these rights, contact us via WhatsApp.
        </p>
      </section>
      <section>
        <h2 className="text-2xl font-bold text-brand-black">Security</h2>
        <p>
          We implement appropriate technical measures to protect your data, including encrypted connections (HTTPS), server-side payment verification, signed download URLs with expiration, and role-based access control for platform administration. No security measure is completely infallible, and we cannot guarantee absolute security.
        </p>
      </section>
      <section>
        <h2 className="text-2xl font-bold text-brand-black">Changes to this policy</h2>
        <p>
          We may update this privacy policy from time to time. Changes will be posted on this page with an updated effective date.
        </p>
      </section>
      <section>
        <h2 className="text-2xl font-bold text-brand-black">Contact</h2>
        <p>
          For questions about this policy or to exercise your data rights, contact us on WhatsApp at {site.supportPhone}.
        </p>
      </section>
    </SimplePage>
  );
}
