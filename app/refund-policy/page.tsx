import type { Metadata } from "next";
import { SimplePage } from "@/components/simple-page";
import { site } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Refund Policy | Keevan Store",
  description: "Keevan Store refund policy for digital products. Learn when refunds may be issued for duplicate payments, failed delivery, or billing errors.",
  robots: { index: true, follow: false }
};

export default function RefundPolicyPage() {
  return (
    <SimplePage title="Refund Policy" eyebrow="Legal">
      <p><strong>Last updated:</strong> June 2026</p>
      <p>
        Because digital products on Keevan Store are delivered instantly after payment confirmation, refunds are not automatic. Each request is reviewed case by case based on the specific circumstances.
      </p>
      <section>
        <h2 className="text-2xl font-bold text-brand-black">When refunds may be issued</h2>
        <p>Refunds may be considered in the following situations:</p>
        <ul className="list-disc pl-6 leading-7">
          <li><strong>Duplicate payment</strong> — if a buyer was charged more than once for the same product due to a technical error.</li>
          <li><strong>Failed delivery</strong> — if the download link does not work and support cannot resolve the issue.</li>
          <li><strong>Unauthorized purchase</strong> — if a transaction was made without the buyer&apos;s consent.</li>
          <li><strong>Technical error</strong> — if a platform bug caused incorrect pricing, file mismatch, or other verifiable issues.</li>
        </ul>
      </section>
      <section>
        <h2 className="text-2xl font-bold text-brand-black">How to request a refund</h2>
        <p>
          Buyers can initiate a refund request at <a href="/request-refund" className="text-brand-green underline">/request-refund</a> by looking up their order using the email address used at checkout. After submitting a reason, the request is reviewed by platform administrators.
        </p>
        <p className="mt-4">
          Once a refund is approved, the amount is reversed through the original payment method via Pesapal. Refunds typically process within 5–10 business days depending on the payment method.
        </p>
      </section>
    </SimplePage>
  );
}
