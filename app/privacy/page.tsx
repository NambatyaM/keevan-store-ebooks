import type { Metadata } from "next";
import { SimplePage } from "@/components/simple-page";
import { site } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Privacy Policy | Keevan Store",
  description: "Keevan Store privacy policy explains what personal data we collect from creators and buyers, how we use it, and your rights under data protection laws.",
  robots: { index: true, follow: false }
};

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
          <li><strong>Buyer purchase data</strong> — name, email address, phone number, and payment information collected during checkout.</li>
          <li><strong>Product and store data</strong> — files, descriptions, prices, cover images, and analytics events (page views, purchases, downloads).</li>
          <li><strong>Technical data</strong> — IP addresses, browser information, device type, and session data for security and analytics purposes.</li>
        </ul>
      </section>
      <section>
        <h2 className="text-2xl font-bold text-brand-black">How we use your data</h2>
        <ul className="list-disc pl-6 leading-7">
          <li>To process payments and deliver digital products to buyers.</li>
          <li>To provide creator dashboards with earnings, sales, and analytics data.</li>
          <li>To communicate with creators and buyers about their accounts, transactions, and support requests.</li>
          <li>To prevent fraud, enforce platform policies, and maintain platform security.</li>
          <li>To improve the platform through aggregated analytics and user behavior analysis.</li>
        </ul>
      </section>
      <section>
        <h2 className="text-2xl font-bold text-brand-black">Data sharing</h2>
        <p>
          We share data with trusted third-party services necessary to operate the platform: Supabase (database and file storage), Pesapal (payment processing), Vercel (hosting and analytics), and WhatsApp (customer support). These providers process data under our instructions and are contractually bound to protect it.
        </p>
      </section>
      <section>
        <h2 className="text-2xl font-bold text-brand-black">Data retention</h2>
        <p>
          We retain creator account data for the duration of the account plus 12 months after closure. Buyer purchase data is retained for 3 years for tax and dispute resolution purposes. Analytics data is aggregated and anonymized after 24 months.
        </p>
      </section>
      <section>
        <h2 className="text-2xl font-bold text-brand-black">Your rights</h2>
        <p>
          You have the right to access, correct, or delete your personal data. To exercise these rights, contact us via WhatsApp. We will respond within 30 days.
        </p>
      </section>
    </SimplePage>
  );
}
