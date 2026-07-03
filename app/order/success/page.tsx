import { Suspense } from "react";
import OrderSuccessClient from "./client";

function LoadingFallback() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-14 text-center sm:px-6 lg:px-8">
      <p className="text-sm font-bold uppercase tracking-[0.18em] text-brand-green">Order processing</p>
      <h1 className="mt-3 text-3xl font-black text-brand-black sm:text-4xl">Confirming Your Payment</h1>
      <div className="mt-7">
        <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-brand-green border-t-transparent" />
        <p className="mt-4 text-neutral-600">We are verifying your payment with Pesapal.</p>
      </div>
    </div>
  );
}

export default function OrderSuccessPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <OrderSuccessClient />
    </Suspense>
  );
}
