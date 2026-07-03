import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import { SimplePage } from "@/components/simple-page";
import OrderSuccessClient from "./client";

function LoadingFallback() {
  return (
    <SimplePage title="Confirming Your Payment" eyebrow="Order processing">
      <div className="rounded-lg border border-neutral-200 p-6 text-center">
        <Loader2 className="mx-auto animate-spin text-brand-green" size={48} aria-hidden />
        <h2 className="mt-4 text-xl font-bold">Confirming your payment...</h2>
        <p className="mt-2 text-neutral-600">
          We are verifying your payment with Pesapal.
        </p>
      </div>
    </SimplePage>
  );
}

export default function OrderSuccessPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <OrderSuccessClient />
    </Suspense>
  );
}
