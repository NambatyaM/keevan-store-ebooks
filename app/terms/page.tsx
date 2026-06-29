import type { Metadata } from "next";
import { SimplePage } from "@/components/simple-page";
import { site } from "@/lib/constants";

export const metadata: Metadata = {
  title: "Terms of Service | Keevan Store",
  description: "Terms of Service for using Keevan Store creator commerce platform. Covers creator responsibilities, intellectual property, payments, withdrawals, and platform rules.",
  robots: { index: true, follow: false }
};

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
          <li>Own the intellectual property rights or have obtained proper licenses for all uploaded content.</li>
          <li>Ensure product descriptions are accurate and not misleading.</li>
          <li>Comply with all applicable laws in their jurisdiction, including consumer protection and tax regulations.</li>
          <li>Not upload content that infringes on third-party rights, contains malware, or violates platform policies.</li>
        </ul>
        <p>
          Keevan Store reserves the right to remove content, suspend stores, or terminate accounts that violate these terms.
        </p>
      </section>
      <section>
        <h2 className="text-2xl font-bold text-brand-black">Intellectual property</h2>
        <p>
          Creators retain full ownership of their uploaded content. Keevan Store claims no intellectual property rights over creator content. By uploading content to the platform, creators grant Keevan Store a limited license to store, process, and deliver that content solely for the purpose of operating the platform.
        </p>
      </section>
      <section>
        <h2 className="text-2xl font-bold text-brand-black">Payments and fees</h2>
        <p>
          Keevan Store charges a 10% platform commission on each verified sale. This commission is deducted automatically before crediting creator earnings. There are no monthly fees, listing fees, or hidden charges. Creators can request withdrawals once their available balance reaches the minimum threshold.
        </p>
      </section>
      <section>
        <h2 className="text-2xl font-bold text-brand-black">Limitation of liability</h2>
        <p>
          Keevan Store provides the platform as-is. We are not liable for disputes between creators and buyers, losses from unauthorized account access, or interruptions to platform availability. Our total liability is limited to the fees paid by the creator in the 12 months preceding the claim.
        </p>
      </section>
    </SimplePage>
  );
}
