"use client";

import { Component } from "react";
import { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { Loader2, CheckCircle, Download } from "lucide-react";
import { SimplePage } from "@/components/simple-page";

class ErrorBoundary extends Component<{ children: React.ReactNode }, { error: Error | null }> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error: Error) {
    return { error };
  }
  render() {
    if (this.state.error) {
      const err = this.state.error;
      return (
        <div>
          <h1>Error: {err.name}</h1>
          <p>{err.message}</p>
        </div>
      );
    }
    return this.props.children;
  }
}

function OrderSuccessContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("order_id");
  const trackingId = searchParams.get("OrderTrackingId") ?? "";
  const [state, setState] = useState<"loading" | "confirming" | "completed" | "error">("loading");
  const [downloadToken, setDownloadToken] = useState("");

  const doConfirm = useCallback(async () => {
    if (!orderId || !trackingId) { setState("error"); return; }
    setState("confirming");
    const res = await fetch("/api/payments/confirm", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId, trackingId }),
    });
    const body = await res.json().catch(() => ({}));
    if (res.ok && body.ok) {
      setDownloadToken(body.downloadToken);
      setState("completed");
    } else {
      setState("error");
    }
  }, [orderId, trackingId]);

  useEffect(() => {
    doConfirm();
  }, [doConfirm]);

  if (state === "error") {
    return (
      <SimplePage title="Order Error" eyebrow="Uh oh">
        <p>Payment could not be verified.</p>
      </SimplePage>
    );
  }

  if (state === "loading" || state === "confirming") {
    return (
      <SimplePage title="Confirming" eyebrow="Order">
        <p>Verifying payment...</p>
      </SimplePage>
    );
  }

  return (
    <SimplePage title="Purchase Successful!" eyebrow="Thank you">
      <div>
        <CheckCircle size={48} />
        <h2>Your purchase</h2>
        {downloadToken && (
          <div>
            <a href={`/api/downloads/${downloadToken}`}>
              <Download size={18} /> Download Now
            </a>
          </div>
        )}
      </div>
    </SimplePage>
  );
}

export default function OrderSuccessClient() {
  return (
    <ErrorBoundary>
      <OrderSuccessContent />
    </ErrorBoundary>
  );
}
