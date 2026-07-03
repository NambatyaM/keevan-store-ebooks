import { Suspense } from "react";
import OrderSuccessClient from "./client";

function LoadingFallback() {
  return (
    <div style={{ textAlign: "center", padding: "40px" }}>
      <h1>Loading...</h1>
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
