"use client";

import { Component, useEffect, useState, useCallback } from "react";
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
          <h1>Error caught: {err.name}</h1>
          <p>{err.message}</p>
        </div>
      );
    }
    return this.props.children;
  }
}

function OrderSuccessContent() {
  const searchParams = useSearchParams();
  const [state, setState] = useState<"loading" | "completed">("loading");

  useEffect(() => {
    setState("completed");
  }, []);

  const doThing = useCallback(() => {
    console.log("test");
  }, []);

  if (state === "completed") {
    return (
      <SimplePage title="Done" eyebrow="Success">
        <div>
          <CheckCircle size={48} />
          <p>order_id: {searchParams.get("order_id") ?? "none"}</p>
          <Link href="/">Go home</Link>
          <a href={site.supportWhatsApp}>Support</a>
        </div>
      </SimplePage>
    );
  }

  return (
    <SimplePage title="Loading..." eyebrow="Please wait">
      <div>
        <Loader2 size={48} />
        <p>Loading...</p>
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
