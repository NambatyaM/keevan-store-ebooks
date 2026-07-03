"use client";

import { Component } from "react";
import { useSearchParams } from "next/navigation";

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
  return (
    <div>
      <h1>useSearchParams works</h1>
      <p>order_id: {searchParams.get("order_id") ?? "none"}</p>
    </div>
  );
}

export default function OrderSuccessClient() {
  return (
    <ErrorBoundary>
      <OrderSuccessContent />
    </ErrorBoundary>
  );
}
