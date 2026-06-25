import { notFound } from "next/navigation";
import { Download, LockKeyhole } from "lucide-react";
import { PaymentStatusCard } from "@/components/payment-status-card";
import { SimplePage } from "@/components/simple-page";
import { getDownloadPageState } from "@/lib/storefront";

export default async function DownloadPage({
  params,
  searchParams
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ token?: string; merchantReference?: string; OrderTrackingId?: string; orderTrackingId?: string }>;
}) {
  const { slug } = await params;
  const { token, merchantReference, OrderTrackingId, orderTrackingId } = await searchParams;
  const state = await getDownloadPageState(slug, token);
  if (!state.product) notFound();

  const trackingId = OrderTrackingId ?? orderTrackingId;
  const isVerified = Boolean(state.verifiedToken);

  return (
    <SimplePage title={isVerified ? "Your Download Is Ready" : "Payment Verification Pending"} eyebrow="Instant delivery">
      <div className="rounded-lg border border-neutral-200 p-6">
        {isVerified ? <Download className="text-brand-green" aria-hidden /> : <LockKeyhole className="text-brand-green" aria-hidden />}
        <h2 className="mt-4 text-2xl font-bold">{state.product.title}</h2>
        <p className="mt-3">
          {isVerified
            ? "Your payment is confirmed and the download link is signed server-side."
            : "Downloads stay locked until the Pesapal transaction is verified on the server."}
        </p>
        <PaymentStatusCard
          slug={state.product.slug}
          merchantReference={merchantReference}
          trackingId={trackingId}
          initialDownloadToken={state.verifiedToken}
          expired={state.expired}
        />
      </div>
    </SimplePage>
  );
}
