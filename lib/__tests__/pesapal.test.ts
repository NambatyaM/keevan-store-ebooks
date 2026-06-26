import { describe, it, expect } from "vitest";
import { normalizePesapalStatus, isPesapalPaymentCompleted } from "@/lib/pesapal";

describe("normalizePesapalStatus", () => {
  it("handles null/undefined payload", () => {
    const result = normalizePesapalStatus(null);
    expect(result.merchantReference).toBeNull();
    expect(result.trackingId).toBeNull();
    expect(result.amount).toBeNull();
    expect(result.paymentStatus).toBeNull();
    expect(result.raw).toEqual({});
  });

  it("handles non-object payload", () => {
    const result = normalizePesapalStatus("string");
    expect(result.merchantReference).toBeNull();
    expect(result.raw).toEqual({});
  });

  it("normalizes snake_case keys (Pesapal v2 style)", () => {
    const payload = {
      merchant_reference: "REF-001",
      order_tracking_id: "TRK-001",
      amount: 50000,
      payment_status_description: "Completed"
    };
    const result = normalizePesapalStatus(payload);
    expect(result.merchantReference).toBe("REF-001");
    expect(result.trackingId).toBe("TRK-001");
    expect(result.amount).toBe(50000);
    expect(result.paymentStatus).toBe("Completed");
    expect(result.raw).toEqual(payload);
  });

  it("normalizes camelCase keys (Pesapal v3 style)", () => {
    const payload = {
      merchantReference: "REF-002",
      orderTrackingId: "TRK-002",
      amount: 75000,
      paymentStatusDescription: "Completed"
    };
    const result = normalizePesapalStatus(payload);
    expect(result.merchantReference).toBe("REF-002");
    expect(result.trackingId).toBe("TRK-002");
    expect(result.amount).toBe(75000);
    expect(result.paymentStatus).toBe("Completed");
  });

  it("normalizes alternate key names", () => {
    const payload = {
      OrderMerchantReference: "REF-003",
      OrderTrackingId: "TRK-003",
      Amount: "100000",
      Status: "PENDING"
    };
    const result = normalizePesapalStatus(payload);
    expect(result.merchantReference).toBe("REF-003");
    expect(result.trackingId).toBe("TRK-003");
    expect(result.amount).toBe(100000);
    expect(result.paymentStatus).toBe("PENDING");
  });

  it("prioritizes first matching key", () => {
    const payload = {
      merchant_reference: "snake-ref",
      merchantReference: "camel-ref",
      amount: 1000,
      Amount: 2000
    };
    const result = normalizePesapalStatus(payload);
    expect(result.merchantReference).toBe("snake-ref");
    expect(result.amount).toBe(1000);
  });

  it("parses amount from string", () => {
    const result = normalizePesapalStatus({ amount: "50000" });
    expect(result.amount).toBe(50000);
  });

  it("returns null for non-numeric amount string", () => {
    const result = normalizePesapalStatus({ amount: "not-a-number" });
    expect(result.amount).toBeNull();
  });

  it("returns null for NaN amount", () => {
    const result = normalizePesapalStatus({ amount: NaN });
    expect(result.amount).toBeNull();
  });

  it("returns null for Infinity amount", () => {
    const result = normalizePesapalStatus({ amount: Infinity });
    expect(result.amount).toBeNull();
  });

  it("trims whitespace from strings", () => {
    const result = normalizePesapalStatus({
      merchantReference: "  REF-001  ",
      paymentStatusDescription: "  Completed  "
    });
    expect(result.merchantReference).toBe("REF-001");
    expect(result.paymentStatus).toBe("Completed");
  });

  it("returns null for empty string values", () => {
    const result = normalizePesapalStatus({
      merchantReference: "",
      trackingId: "   ",
      amount: "",
      paymentStatusDescription: ""
    });
    expect(result.merchantReference).toBeNull();
    expect(result.trackingId).toBeNull();
    expect(result.amount).toBeNull();
    expect(result.paymentStatus).toBeNull();
  });
});

describe("isPesapalPaymentCompleted", () => {
  it("returns true when status is 'Completed'", () => {
    expect(isPesapalPaymentCompleted({ payment_status_description: "Completed" })).toBe(true);
  });

  it("returns true when status is 'completed' (lowercase)", () => {
    expect(isPesapalPaymentCompleted({ paymentStatusDescription: "completed" })).toBe(true);
  });

  it("returns true when status is 'COMPLETED' (uppercase)", () => {
    expect(isPesapalPaymentCompleted({ Status: "COMPLETED" })).toBe(true);
  });

  it("returns false when status is 'PENDING'", () => {
    expect(isPesapalPaymentCompleted({ payment_status_description: "PENDING" })).toBe(false);
  });

  it("returns false when status is 'FAILED'", () => {
    expect(isPesapalPaymentCompleted({ payment_status_description: "FAILED" })).toBe(false);
  });

  it("returns false for null payload", () => {
    expect(isPesapalPaymentCompleted(null)).toBe(false);
  });

  it("returns false when status field is missing", () => {
    expect(isPesapalPaymentCompleted({})).toBe(false);
  });
});
