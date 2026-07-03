"use client";

import { Component } from "react";
import { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle, Loader2, Download, XCircle } from "lucide-react";

import { SimplePage } from "@/components/simple-page";
import { site } from "@/lib/constants";

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
  const [state, setState] = useState<"loading" | "confirming" | "completed" | "failed" | "error">("loading");
  const [downloadToken, setDownloadToken] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const confirm = useCallback(async () => {
    if (!orderId) { setState("error"); setErrorMsg("No order ID."); return; }
    if (!trackingId) { setState("error"); setErrorMsg("No tracking ID."); return; }
    setState("confirming");
    try {
      const res = await fetch("/api/payments/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, trackingId }),
      });
      const body = await res.json().catch(() => ({}));
      if (res.ok && body.ok) {
        setDownloadToken(body.downloadToken);
        setState("completed");
        return;
      }
      if (res.status === 402) {
        setState("confirming");
        setErrorMsg(body?.error ?? "Still confirming...");
        return;
      }
      setState("error");
      setErrorMsg(body?.error ?? "An error occurred.");
    } catch {
      setState("error");
      setErrorMsg("Unable to verify payment.");
    }
  }, [orderId, trackingId]);

  useEffect(() => {
    confirm();
  }, [confirm]);

  if (state === "error") {
    return (
      <SimplePage title="Order Error" eyebrow="Uh oh">
        <p>{errorMsg}</p>
      </SimplePage>
    );
  }

  if (state === "loading" || state === "confirming") {
    return (
      <SimplePage title="Confirming Your Payment" eyebrow="Order processing">
        <div>
          <Loader2 className="mx-auto animate-spin" size={48} />
          <h2>Confirming your payment...</h2>
          {errorMsg && <p>{errorMsg}</p>}
        </div>
      </SimplePage>
    );
  }

  if (state === "failed") {
    return (
      <SimplePage title="Payment Failed" eyebrow="Payment unsuccessful">
        <p>Payment did not go through.</p>
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
