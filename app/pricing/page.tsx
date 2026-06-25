import { ButtonLink } from "@/components/button";
import { SimplePage } from "@/components/simple-page";
import { formatUgx, site } from "@/lib/constants";

export default function PricingPage() {
  return (
    <SimplePage title="Simple Pricing" eyebrow="No monthly fee">
      <div className="rounded-lg border border-neutral-200 p-6">
        <p className="text-5xl font-black text-brand-black">10%</p>
        <p className="mt-2 text-lg font-semibold">platform commission per successful sale</p>
        <p className="mt-4">
          Creators keep 90% of each paid order. Withdrawals can be requested once the available balance reaches{" "}
          {formatUgx(site.minimumWithdrawal)}.
        </p>
        <div className="mt-6">
          <ButtonLink href="/signup">Start Selling Free</ButtonLink>
        </div>
      </div>
    </SimplePage>
  );
}
