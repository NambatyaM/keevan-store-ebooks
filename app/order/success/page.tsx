import { Suspense } from "react";
import OrderSuccessClient from "./client";

function LoadingFallback() {
  return (
    <div style={{ textAlign: "center", padding: "40px" }}>
      <h1>Confirming your payment...</h1>
      <p>We are verifying your payment with Pesapal.</p>
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
