import { ButtonLink } from "@/components/button";
import { SimplePage } from "@/components/simple-page";
import { site } from "@/lib/constants";

export default function ContactPage() {
  return (
    <SimplePage title="Contact" eyebrow="Support">
      <p>Need help setting up your store, uploading an e-book, or understanding withdrawals?</p>
      <div className="mt-6 rounded-lg border border-neutral-200 p-5">
        <p className="font-semibold">WhatsApp Support</p>
        <p className="mt-1">{site.supportPhone}</p>
        <div className="mt-4">
          <ButtonLink href={site.supportWhatsApp}>Chat on WhatsApp</ButtonLink>
        </div>
      </div>
    </SimplePage>
  );
}
