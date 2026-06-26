import { SimplePage } from "@/components/simple-page";
import { site } from "@/lib/constants";

export default function TermsPage() {
  return (
    <SimplePage title="Terms of Service" eyebrow="Legal">
      <p><strong>Last updated:</strong> June 2026</p>
      <p>
        These terms govern your use of Keevan Store (operated by Keevan Store). By creating an account or using the platform, you agree to these terms.
      </p>
      <section>
        <h2 className="text-2xl font-bold text-brand-black">Creator responsibilities</h2>
        <p>
          Creators are solely responsible for the content they upload, publish, and sell on Keevan Store. Each creator must:
        </p>
        <ul className="list-disc pl-6 leading-7">
          <li>Own or have obtained all necessary rights and permissions for every digital product listed.</li>
          <li>Ensure products do not infringe on any copyright, trademark, or other intellectual property right.</li>
          <li>Provide accurate product descriptions, pricing, and file content.</li>
          <li>Not upload content that is illegal, harmful, fraudulent, or violates any applicable law.</li>
          <li>Comply with all applicable tax and legal obligations related to their sales.</li>
        </ul>
        <p className="mt-4">
          Keevan Store reserves the right to remove products, suspend stores, or terminate accounts that violate these terms, applicable law, or platform trust.
        </p>
      </section>
      <section>
        <h2 className="text-2xl font-bold text-brand-black">Payments and payouts</h2>
        <p>
          Payments are processed through the platform-owned Pesapal account. Buyers pay in UGX. Keevan Store deducts a 10% platform commission from each sale before recording creator earnings. Creators may request manual withdrawals once their available balance reaches {site.minimumWithdrawal.toLocaleString()} UGX. Withdrawals are processed by platform administrators. Keevan Store is not liable for delays caused by third-party payment processors or financial institutions.
        </p>
      </section>
      <section>
        <h2 className="text-2xl font-bold text-brand-black">Buyer terms</h2>
        <p>
          Buyers do not need an account to purchase from Keevan Store. By making a purchase, buyers agree to provide accurate contact information for payment verification and file delivery. Digital products are delivered via signed download links after payment is confirmed. Because digital goods are delivered instantly, refunds are reviewed on a case-by-case basis for duplicate payments, failed delivery, or verified creator error.
        </p>
      </section>
      <section>
        <h2 className="text-2xl font-bold text-brand-black">Platform rights</h2>
        <p>
          Keevan Store may update, modify, or discontinue features at any time. We will make reasonable efforts to notify creators of material changes. Keevan Store is not liable for indirect, incidental, or consequential damages arising from platform use. These terms are governed by the laws of Uganda.
        </p>
      </section>
      <section>
        <h2 className="text-2xl font-bold text-brand-black">Contact</h2>
        <p>
          For questions about these terms, contact us on WhatsApp at {site.supportPhone}.
        </p>
      </section>
    </SimplePage>
  );
}
