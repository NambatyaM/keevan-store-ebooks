import { SimplePage } from "@/components/simple-page";
import { site } from "@/lib/constants";

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
          <li><strong>Failed delivery</strong> — if the signed download link cannot be generated or the file is corrupted after purchase.</li>
          <li><strong>Verified creator error</strong> — if the product delivered is materially different from its description and the creator agrees to a refund.</li>
        </ul>
      </section>
      <section>
        <h2 className="text-2xl font-bold text-brand-black">When refunds are not issued</h2>
        <p>Refunds are generally not issued for:</p>
        <ul className="list-disc pl-6 leading-7">
          <li>Change of mind after the file has been downloaded.</li>
          <li>Incompatibility with the buyer&apos;s device or software (file formats are listed on each product page).</li>
          <li>Disagreement with content that matches the product description.</li>
        </ul>
      </section>
      <section>
        <h2 className="text-2xl font-bold text-brand-black">How to request a refund</h2>
        <p>
          You can submit a refund request directly through our <a href="/request-refund" className="text-brand-green hover:underline">in-app refund request page</a>. Enter the email you used during checkout, select the order, and provide a reason. An administrator will review your request.
        </p>
        <p className="mt-3">
          Alternatively, contact support via WhatsApp at {site.supportPhone} with your order details, including the product name, payment reference, and reason for the request.
        </p>
      </section>
      <section>
        <h2 className="text-2xl font-bold text-brand-black">Dispute resolution</h2>
        <p>
          If a refund request cannot be resolved directly, Keevan Store will mediate between the buyer and creator to reach a fair outcome. Platform administrators reserve the right to issue refunds from platform funds in cases of verified platform error.
        </p>
      </section>
    </SimplePage>
  );
}
