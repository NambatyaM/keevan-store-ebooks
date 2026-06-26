import { notFound } from "next/navigation";
import { Download, LockKeyhole, CheckCircle, WifiOff } from "lucide-react";
import { PaymentStatusCard } from "@/components/payment-status-card";
import { SimplePage } from "@/components/simple-page";
import { site } from "@/lib/constants";
import { getDownloadPageState } from "@/lib/storefront";
import Link from "next/link";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return {
    title: "Download Your Digital Product",
    description: "Access your purchased digital product. Secure signed download link after payment verification.",
    robots: { index: false, follow: false }
  };
}

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

  if (!state.serviceAvailable) {
    return (
      <SimplePage title="Service Unavailable" eyebrow="Temporarily offline">
        <div className="rounded-lg border border-neutral-200 p-6">
          <WifiOff className="text-brand-green" aria-hidden />
          <h2 className="mt-4 text-2xl font-bold">Service Temporarily Unavailable</h2>
          <p className="mt-3">
            Our database service is currently unavailable. Please try again in a few minutes.
          </p>
          <div className="mt-6">
            <Link href="/" className="text-brand-green hover:underline">Return to home</Link>
          </div>
        </div>
      </SimplePage>
    );
  }

  if (!state.product) notFound();

  const trackingId = OrderTrackingId ?? orderTrackingId;
  const isVerified = Boolean(state.verifiedToken);

  return (
    <SimplePage title={isVerified ? "Your Download Is Ready" : "Payment Verification Pending"} eyebrow="Instant delivery">
      <div className="rounded-lg border border-neutral-200 p-6">
        {isVerified ? (
          <CheckCircle className="text-brand-green" aria-hidden />
        ) : (
          <LockKeyhole className="text-brand-green" aria-hidden />
        )}
        <h2 className="mt-4 text-2xl font-bold">{state.product.title}</h2>
        <p className="mt-3">
          {isVerified
            ? "Your payment is confirmed. The download link below is signed and ready to use."
            : "Your download link will appear here once the Pesapal transaction is verified on the server. This usually takes a few seconds."}
        </p>
        <PaymentStatusCard
          slug={state.product.slug}
          merchantReference={merchantReference}
          trackingId={trackingId}
          initialDownloadToken={state.verifiedToken}
          expired={state.expired}
        />
        {isVerified && (
          <p className="mt-4 text-sm text-neutral-500">
            Need help?{" "}
            <Link href="/request-refund" className="text-brand-green hover:underline">
              Request a refund
            </Link>
          </p>
        )}
      </div>
    </SimplePage>
  );
}
