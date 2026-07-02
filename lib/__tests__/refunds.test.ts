import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { refundRequestSchema, refundDecisionSchema, customerRefundLookupSchema } from "@/lib/schemas";
import { refundPesapalOrder, resetPesapalTokenCache } from "@/lib/pesapal";

describe("refundRequestSchema", () => {
  const valid = {
    orderId: "550e8400-e29b-41d4-a716-446655440000",
    buyerEmail: "buyer@example.com",
    reason: "Product did not match the description."
  };

  it("accepts valid refund request input", () => {
    expect(() => refundRequestSchema.parse(valid)).not.toThrow();
  });

  it("rejects invalid UUID for orderId", () => {
    expect(() => refundRequestSchema.parse({ ...valid, orderId: "not-a-uuid" })).toThrow();
  });

  it("rejects invalid email", () => {
    expect(() => refundRequestSchema.parse({ ...valid, buyerEmail: "notanemail" })).toThrow();
  });

  it("rejects reason shorter than 10 characters", () => {
    expect(() => refundRequestSchema.parse({ ...valid, reason: "Short" })).toThrow();
  });

  it("rejects reason exceeding 2000 characters", () => {
    expect(() => refundRequestSchema.parse({ ...valid, reason: "x".repeat(2001) })).toThrow();
  });

  it("accepts reason at max boundary (2000 chars)", () => {
    expect(() => refundRequestSchema.parse({ ...valid, reason: "x".repeat(2000) })).not.toThrow();
  });

  it("rejects missing orderId", () => {
    const { orderId, ...rest } = valid;
    expect(() => refundRequestSchema.parse(rest)).toThrow();
  });

  it("rejects missing buyerEmail", () => {
    const { buyerEmail, ...rest } = valid;
    expect(() => refundRequestSchema.parse(rest)).toThrow();
  });

  it("rejects missing reason", () => {
    const { reason, ...rest } = valid;
    expect(() => refundRequestSchema.parse(rest)).toThrow();
  });

  it("accepts SQL injection string in reason (Zod validates length, not content)", () => {
    const result = refundRequestSchema.safeParse({
      ...valid,
      reason: "'; DROP TABLE refunds; --"
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty string fields", () => {
    expect(() => refundRequestSchema.parse({
      orderId: "",
      buyerEmail: "",
      reason: ""
    })).toThrow();
  });

  it("rejects null/undefined values", () => {
    expect(() => refundRequestSchema.parse({
      orderId: null,
      buyerEmail: undefined,
      reason: "Valid reason here"
    })).toThrow();
  });

  it("rejects array injection for orderId", () => {
    expect(() => refundRequestSchema.parse({
      ...valid,
      orderId: ["id1", "id2"]
    })).toThrow();
  });

  it("rejects object injection for reason", () => {
    expect(() => refundRequestSchema.parse({
      ...valid,
      reason: { $ne: "admin" }
    })).toThrow();
  });
});

describe("refundDecisionSchema", () => {
  it("accepts empty input", () => {
    expect(() => refundDecisionSchema.parse({})).not.toThrow();
  });

  it("accepts notes", () => {
    expect(() => refundDecisionSchema.parse({ notes: "Refund approved after review" })).not.toThrow();
  });

  it("rejects notes exceeding 1000 chars", () => {
    expect(() => refundDecisionSchema.parse({ notes: "x".repeat(1001) })).toThrow();
  });

  it("accepts notes at max boundary (1000 chars)", () => {
    expect(() => refundDecisionSchema.parse({ notes: "x".repeat(1000) })).not.toThrow();
  });

  it("accepts SQL injection string in notes (Zod validates length, not content)", () => {
    const result = refundDecisionSchema.safeParse({
      notes: "'; UPDATE refunds SET status='approved'; --"
    });
    expect(result.success).toBe(true);
  });
});

describe("customerRefundLookupSchema", () => {
  it("accepts valid email", () => {
    expect(() => customerRefundLookupSchema.parse({ email: "buyer@example.com" })).not.toThrow();
  });

  it("rejects invalid email", () => {
    expect(() => customerRefundLookupSchema.parse({ email: "notanemail" })).toThrow();
  });

  it("rejects empty email", () => {
    expect(() => customerRefundLookupSchema.parse({ email: "" })).toThrow();
  });

  it("rejects missing email field", () => {
    expect(() => customerRefundLookupSchema.parse({})).toThrow();
  });

  it("rejects null email", () => {
    expect(() => customerRefundLookupSchema.parse({ email: null })).toThrow();
  });
});

describe("refundPesapalOrder", () => {
  let originalFetch: typeof globalThis.fetch;

  beforeEach(() => {
    originalFetch = globalThis.fetch;
    resetPesapalTokenCache();
    process.env.PESAPAL_CONSUMER_KEY = "test-key";
    process.env.PESAPAL_CONSUMER_SECRET = "test-secret";
    process.env.PESAPAL_IPN_ID = "test-ipn";
    globalThis.fetch = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    globalThis.fetch = originalFetch;
  });

  it("returns ok when Pesapal accepts refund request", async () => {
    vi.mocked(globalThis.fetch).mockImplementation((url: string) => {
      if (url.includes("RequestToken")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ token: "mock-token", expiryDate: new Date(Date.now() + 3600000).toISOString() }),
        });
      }
      if (url.includes("RefundRequest")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ error: 200, message: "Refund request received successfully" }),
        });
      }
      return Promise.resolve({ ok: false, json: () => Promise.resolve({}) });
    });

    const result = await refundPesapalOrder({
      confirmationCode: "CONF-001",
      amount: 50000,
      username: "admin@example.com",
      remarks: "Customer requested refund"
    });

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.message).toContain("Refund request received");
    }
  });

  it("returns error when Pesapal rejects refund", async () => {
    vi.mocked(globalThis.fetch).mockImplementation((url: string) => {
      if (url.includes("RequestToken")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ token: "mock-token", expiryDate: new Date(Date.now() + 3600000).toISOString() }),
        });
      }
      if (url.includes("RefundRequest")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ error: 500, message: "Refund rejected: payment already reversed" }),
        });
      }
      return Promise.resolve({ ok: false, json: () => Promise.resolve({}) });
    });

    const result = await refundPesapalOrder({
      confirmationCode: "CONF-002",
      amount: 50000,
      username: "admin@example.com",
      remarks: "Test refund"
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toContain("Refund rejected");
    }
  });

  it("handles network errors gracefully", async () => {
    vi.mocked(globalThis.fetch).mockImplementation((url: string) => {
      if (url.includes("RequestToken")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ token: "mock-token", expiryDate: new Date(Date.now() + 3600000).toISOString() }),
        });
      }
      if (url.includes("RefundRequest")) {
        return Promise.reject(new Error("Network error"));
      }
      return Promise.resolve({ ok: false, json: () => Promise.resolve({}) });
    });

    const result = await refundPesapalOrder({
      confirmationCode: "CONF-003",
      amount: 50000,
      username: "admin@example.com",
      remarks: "Test"
    });
    expect(result.ok).toBe(false);
    expect(result.error).toContain("Unable to reach Pesapal");
  });

  it("handles missing credentials", async () => {
    process.env.PESAPAL_CONSUMER_KEY = "";
    process.env.PESAPAL_CONSUMER_SECRET = "";

    const result = await refundPesapalOrder({
      confirmationCode: "CONF-004",
      amount: 50000,
      username: "admin@example.com",
      remarks: "Test"
    });
    expect(result.ok).toBe(false);
    expect(result.error).toContain("Pesapal credentials are missing.");
  });

  it("sends correct request parameters to Pesapal", async () => {
    let requestBody: string | null = null;

    vi.mocked(globalThis.fetch).mockImplementation((url: string, opts?: RequestInit) => {
      if (url.includes("RequestToken")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ token: "mock-token", expiryDate: new Date(Date.now() + 3600000).toISOString() }),
        });
      }
      if (url.includes("RefundRequest")) {
        requestBody = opts?.body as string;
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ error: 200, message: "ok" }),
        });
      }
      return Promise.resolve({ ok: false, json: () => Promise.resolve({}) });
    });

    await refundPesapalOrder({
      confirmationCode: "CONF-005",
      amount: 75000,
      username: "admin@test.com",
      remarks: "Duplicate payment"
    });

    expect(requestBody).not.toBeNull();
    const parsed = JSON.parse(requestBody!);
    expect(parsed.confirmation_code).toBe("CONF-005");
    expect(parsed.amount).toBe(75000);
    expect(parsed.username).toBe("admin@test.com");
    expect(parsed.remarks).toBe("Duplicate payment");
  });
});

describe("Refund System Integration Safeguards", () => {
  it("refundRequestSchema rejects non-string reason that could bypass validation", () => {
    const result = refundRequestSchema.safeParse({
      orderId: "550e8400-e29b-41d4-a716-446655440000",
      buyerEmail: "buyer@example.com",
      reason: true
    });
    expect(result.success).toBe(false);
  });

  it("refundDecisionSchema strips extra fields", () => {
    const result = refundDecisionSchema.safeParse({
      notes: "Approved",
      adminId: "should-not-exist",
      isAdmin: true,
      decision: "approve"
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).not.toHaveProperty("adminId");
      expect(result.data).not.toHaveProperty("isAdmin");
      expect(result.data).not.toHaveProperty("decision");
    }
  });

  it("refundRequestSchema rejects prototype pollution", () => {
    const result = refundRequestSchema.safeParse({
      orderId: "550e8400-e29b-41d4-a716-446655440000",
      buyerEmail: "buyer@example.com",
      reason: { __proto__: { admin: true } }
    });
    expect(result.success).toBe(false);
  });

  it("refundRequestSchema rejects NoSQL injection in reason", () => {
    const payloads = [
      { $ne: "" },
      { $gt: "" },
      { $regex: ".*" },
      { $where: "1==1" }
    ];
    for (const payload of payloads) {
      const result = refundRequestSchema.safeParse({
        orderId: "550e8400-e29b-41d4-a716-446655440000",
        buyerEmail: "buyer@example.com",
        reason: payload
      });
      expect(result.success).toBe(false);
    }
  });

  it("refundRequestSchema accepts reason with special characters", () => {
    const specialChars = [
      "Product didn't work. Very disappointed! <broken>",
      "Item not as described. Price: $50.",
      "Reçu le mauvais produit (wrong item received)",
      "产品与描述不符 (product mismatch)",
      "Reason with\nnewlines and\ttabs"
    ];
    for (const reason of specialChars) {
      const result = refundRequestSchema.safeParse({
        orderId: "550e8400-e29b-41d4-a716-446655440000",
        buyerEmail: "buyer@example.com",
        reason
      });
      expect(result.success).toBe(true);
    }
  });

  it("customerRefundLookupSchema rejects object injection", () => {
    const result = customerRefundLookupSchema.safeParse({
      email: { $ne: "" }
    });
    expect(result.success).toBe(false);
  });

  it("customerRefundLookupSchema rejects array injection", () => {
    const result = customerRefundLookupSchema.safeParse({
      email: ["test@test.com"]
    });
    expect(result.success).toBe(false);
  });
});
