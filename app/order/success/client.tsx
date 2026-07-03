"use client";

import { Component } from "react";
import { useEffect, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { Loader2, CheckCircle } from "lucide-react";
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
  const [state, setState] = useState<"loading" | "confirming" | "completed" | "failed" | "error">("loading");
  const [errorMsg, setErrorMsg] = useState("");

  const doConfirm = useCallback(async () => {
    setState("completed");
  }, []);

  useEffect(() => {
    doConfirm();
  }, [doConfirm]);

  if (state === "loading" || state === "confirming") {
    return (
      <SimplePage title="Confirming" eyebrow="Order">
        <p>Loading state: {state}</p>
      </SimplePage>
    );
  }

  if (state === "error") {
    return (
      <SimplePage title="Error" eyebrow="Uh oh">
        <p>{errorMsg}</p>
      </SimplePage>
    );
  }

  return (
    <SimplePage title="Done" eyebrow="Success">
      <div>
        <CheckCircle size={48} />
        <p>Completed!</p>
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
