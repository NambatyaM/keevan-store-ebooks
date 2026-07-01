import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

function mockFromChain(data: unknown, error: unknown = null) {
  const eq = vi.fn(() => chain);
  const resolveValue = { data, error };
  const chain: Record<string, unknown> = {
    select: vi.fn(() => chain),
    eq,
    single: vi.fn().mockResolvedValue({ data, error }),
    maybeSingle: vi.fn().mockResolvedValue({ data, error }),
    insert: vi.fn(() => ({
      select: vi.fn(() => ({ single: vi.fn().mockResolvedValue({ data, error }) })),
      then: (resolve: (v: unknown) => void) => resolve({ data, error }),
    })),
    update: vi.fn(() => ({
      eq: vi.fn(() => ({ select: vi.fn(() => ({ single: vi.fn().mockResolvedValue({ data, error }) })) })),
      then: (resolve: (v: unknown) => void) => resolve({ data: null, error: null }),
    })),
    delete: vi.fn(() => ({
      eq: vi.fn(() => ({ then: (resolve: (v: unknown) => void) => resolve({ data: null, error: null }) })),
      then: (resolve: (v: unknown) => void) => resolve({ data: null, error: null }),
    })),
    then: (resolve: (v: unknown) => void) => resolve(resolveValue),
    order: vi.fn(() => chain),
    range: vi.fn(() => chain),
    limit: vi.fn(() => chain),
    gte: vi.fn(() => chain),
    lt: vi.fn(() => chain),
    lte: vi.fn(() => chain),
  };
  return chain;
}

const rateLimitChain = (() => {
  const chain = mockFromChain(null);
  chain.maybeSingle = vi.fn().mockResolvedValue({ data: { count: 5 }, error: null });
  return chain;
})();

const mockSupabase = {
  rpc: vi.fn().mockResolvedValue({ data: null, error: null }),
  from: vi.fn(() => rateLimitChain),
  auth: { getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }) },
};

vi.mock("@/lib/supabase", () => ({
  getSupabaseAdminClient: vi.fn(() => mockSupabase),
}));

const mockCreatePesapalOrder = vi.fn();
const mockVerifyPesapalPayment = vi.fn();
const mockNormalizePesapalStatus = vi.fn();
const mockCalculateSaleSplit = vi.fn();

vi.mock("@/lib/pesapal", () => ({
  createPesapalOrder: (...args: unknown[]) => mockCreatePesapalOrder(...args),
  verifyPesapalPayment: (...args: unknown[]) => mockVerifyPesapalPayment(...args),
  normalizePesapalStatus: (...args: unknown[]) => mockNormalizePesapalStatus(...args),
}));

vi.mock("@/lib/constants", () => ({
  calculateSaleSplit: (...args: unknown[]) => mockCalculateSaleSplit(...args),
  site: { url: "https://keevanstore.in" },
}));

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://keevanstore.in");
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://test.supabase.co");
  vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "test-key");
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "test-anon-key");
  mockSupabase.from.mockReturnValue(rateLimitChain);
  mockCalculateSaleSplit.mockReturnValue({ grossAmount: 50000, platformFee: 5000, creatorEarnings: 45000 });
  mockCreatePesapalOrder.mockResolvedValue({ redirect_url: "https://pay.pesapal.com/order/123", order_tracking_id: "trk-1" });
  mockVerifyPesapalPayment.mockResolvedValue({ ok: true, downloadToken: "dt-1", alreadyVerified: false });
  mockNormalizePesapalStatus.mockReturnValue({
    merchantReference: "mr-1",
    trackingId: "trk-1",
    amount: 50000,
    paymentStatus: "Completed",
    raw: {},
  });
});

function makeRequest(url: string, overrides: Partial<RequestInit & { headers?: Record<string, string> }> = {}): NextRequest {
  return new NextRequest(new URL(url, "https://keevanstore.in"), {
    method: overrides.method ?? "POST",
    headers: {
      "Content-Type": "application/json",
      origin: "https://keevanstore.in",
      ...(overrides.headers ?? {}),
    },
    body: overrides.body,
  });
}

function queryChain(data: unknown, error: unknown = null) {
  const chain = mockFromChain(data, error);
  chain.maybeSingle = vi.fn().mockResolvedValue({ data, error });
  return chain;
}

describe("POST /api/payments/create", () => {
  const validBody = JSON.stringify({
    productId: "550e8400-e29b-41d4-a716-446655440000",
    buyerEmail: "buyer@test.com",
    buyerName: "John Doe",
  });

  async function importCreate() {
    return import("@/app/api/payments/create/route").then((m) => m.POST);
  }

  function setupDefaultMocks() {
    let orderCallCount = 0;
    mockSupabase.from.mockImplementation((table: string) => {
      if (table === "products") return queryChain({ id: "prod-1", slug: "my-ebook", title: "E-Book", price: 50000, creator_id: "c1", status: "published", store_id: "s1", file_path: "products/file.pdf", currency: "UGX" });
      if (table === "stores") return queryChain({ status: "active", currency: "UGX" });
      if (table === "orders") {
        orderCallCount++;
        if (orderCallCount <= 2) {
          return queryChain(null);
        }
        return mockFromChain({ id: "o1", amount: 50000, platform_fee: 5000, creator_earnings: 45000 });
      }
      if (table === "discounts") return queryChain(null);
      if (table === "buyers") return mockFromChain({ id: "b1" });
      if (table === "payments") return mockFromChain(null);
      return rateLimitChain;
    });
  }

  it("creates a payment order successfully", async () => {
    setupDefaultMocks();
    const POST = await importCreate();
    const res = await POST(makeRequest("/api/payments/create", { body: validBody }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.orderId).toBe("o1");
    expect(body.merchantReference).toBeDefined();
    expect(body.redirectUrl).toBe("https://pay.pesapal.com/order/123");
  });

  it("rejects invalid request body", async () => {
    const POST = await importCreate();
    const res = await POST(makeRequest("/api/payments/create", { body: JSON.stringify({}) }));
    expect(res.status).toBe(422);
  });

  it("returns 404 when product not found or not published", async () => {
    mockSupabase.from.mockImplementation((table: string) => {
      if (table === "products") return mockFromChain(null);
      return rateLimitChain;
    });
    const POST = await importCreate();
    const res = await POST(makeRequest("/api/payments/create", { body: validBody }));
    expect(res.status).toBe(404);
  });

  it("returns 404 when store is not active", async () => {
    mockSupabase.from.mockImplementation((table: string) => {
      if (table === "products") return mockFromChain({ id: "prod-1", slug: "my-ebook", title: "E-Book", price: 50000, creator_id: "c1", status: "published", store_id: "s1", file_path: "products/file.pdf", currency: "UGX" });
      if (table === "stores") return mockFromChain({ status: "suspended" });
      return rateLimitChain;
    });
    const POST = await importCreate();
    const res = await POST(makeRequest("/api/payments/create", { body: validBody }));
    expect(res.status).toBe(404);
  });

  it("returns 409 when pending order exists", async () => {
    mockSupabase.from.mockImplementation((table: string) => {
      if (table === "products") return queryChain({ id: "prod-1", slug: "my-ebook", title: "E-Book", price: 50000, creator_id: "c1", status: "published", store_id: "s1", file_path: "products/file.pdf", currency: "UGX" });
      if (table === "stores") return queryChain({ status: "active", currency: "UGX" });
      if (table === "orders") return queryChain({ id: "existing-order" });
      if (table === "discounts") return queryChain(null);
      if (table === "buyers") return mockFromChain({ id: "b1" });
      return rateLimitChain;
    });
    const POST = await importCreate();
    const res = await POST(makeRequest("/api/payments/create", { body: validBody }));
    expect(res.status).toBe(409);
  });

  it("rolls back order when payment insert fails", async () => {
    let orderCallCount = 0;
    mockSupabase.from.mockImplementation((table: string) => {
      if (table === "products") return queryChain({ id: "prod-1", slug: "my-ebook", title: "E-Book", price: 50000, creator_id: "c1", status: "published", store_id: "s1", file_path: "products/file.pdf", currency: "UGX" });
      if (table === "stores") return queryChain({ status: "active", currency: "UGX" });
      if (table === "orders") {
        orderCallCount++;
        if (orderCallCount <= 2) return queryChain(null);
        return mockFromChain({ id: "o1", amount: 50000, platform_fee: 5000, creator_earnings: 45000 });
      }
      if (table === "discounts") return queryChain(null);
      if (table === "buyers") return mockFromChain({ id: "b1" });
      if (table === "payments") return mockFromChain(null, new Error("Insert failed"));
      return rateLimitChain;
    });
    const POST = await importCreate();
    const res = await POST(makeRequest("/api/payments/create", { body: validBody }));
    expect(res.status).toBe(400);
  });

  it("returns 502 when Pesapal order creation fails", async () => {
    mockCreatePesapalOrder.mockRejectedValue(new Error("Pesapal error"));
    let orderCallCount = 0;
    mockSupabase.from.mockImplementation((table: string) => {
      if (table === "products") return queryChain({ id: "prod-1", slug: "my-ebook", title: "E-Book", price: 50000, creator_id: "c1", status: "published", store_id: "s1", file_path: "products/file.pdf", currency: "UGX" });
      if (table === "stores") return queryChain({ status: "active", currency: "UGX" });
      if (table === "orders") {
        orderCallCount++;
        if (orderCallCount <= 2) return queryChain(null);
        return mockFromChain({ id: "o1", amount: 50000, platform_fee: 5000, creator_earnings: 45000 });
      }
      if (table === "discounts") return queryChain(null);
      if (table === "buyers") return mockFromChain({ id: "b1" });
      if (table === "payments") return mockFromChain(null);
      return rateLimitChain;
    });
    const POST = await importCreate();
    const res = await POST(makeRequest("/api/payments/create", { body: validBody }));
    expect(res.status).toBe(502);
  });

  it("rejects request with wrong origin (CSRF)", async () => {
    const POST = await importCreate();
    const res = await POST(makeRequest("/api/payments/create", {
      body: validBody,
      headers: { origin: "https://evil.com" },
    }));
    expect(res.status).toBe(403);
  });
});

describe("POST /api/payments/verify", () => {
  const validBody = JSON.stringify({ merchantReference: "mr-1", trackingId: "trk-1" });

  async function importVerify() {
    return import("@/app/api/payments/verify/route").then((m) => m.POST);
  }

  function setupAuthUser() {
    const user = { id: "buyer-1", email: "buyer@test.com" };
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user },
      error: null,
    });
    const prevImpl = mockSupabase.from.getMockImplementation();
    mockSupabase.from.mockImplementation((table: string) => {
      if (table === "users") return mockFromChain({ id: user.id, email: user.email, role: "buyer", full_name: "Test Buyer" });
      if (table === "payments") return queryChain({ merchant_reference: "mr-1", order: [{ buyer_id: user.id, buyer_email: user.email }] });
      if (prevImpl) return (prevImpl as (table: string) => unknown)(table);
      return rateLimitChain;
    });
  }

  function authRequest(url: string, body: string) {
    return makeRequest(url, { body, headers: { authorization: "Bearer test-token" } });
  }

  it("verifies payment successfully", async () => {
    setupAuthUser();
    const POST = await importVerify();
    const res = await POST(authRequest("/api/payments/verify", validBody));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.downloadToken).toBe("dt-1");
  });

  it("rejects invalid request body", async () => {
    const POST = await importVerify();
    const res = await POST(makeRequest("/api/payments/verify", { body: JSON.stringify({}) }));
    expect(res.status).toBe(422);
  });

  it("returns 404 when payment not found", async () => {
    setupAuthUser();
    mockVerifyPesapalPayment.mockResolvedValue({ ok: false, error: "Payment not found", raw: {} });
    const POST = await importVerify();
    const res = await POST(authRequest("/api/payments/verify", validBody));
    expect(res.status).toBe(404);
  });

  it("returns 402 when payment not completed", async () => {
    setupAuthUser();
    mockVerifyPesapalPayment.mockResolvedValue({ ok: false, error: "Payment is not completed", raw: {} });
    const POST = await importVerify();
    const res = await POST(authRequest("/api/payments/verify", validBody));
    expect(res.status).toBe(402);
  });

  it("returns 409 on other verification errors", async () => {
    setupAuthUser();
    mockVerifyPesapalPayment.mockResolvedValue({ ok: false, error: "Pesapal amount mismatch", raw: {} });
    const POST = await importVerify();
    const res = await POST(authRequest("/api/payments/verify", validBody));
    expect(res.status).toBe(409);
  });
});

describe("POST /api/webhooks/pesapal", () => {
  async function importWebhook() {
    return import("@/app/api/webhooks/pesapal/route").then((m) => m.POST);
  }

  it("processes webhook successfully", async () => {
    const POST = await importWebhook();
    const res = await POST(makeRequest("/api/webhooks/pesapal", {
      body: JSON.stringify({ merchant_reference: "mr-1", order_tracking_id: "trk-1", amount: 50000, payment_status_description: "Completed" }),
    }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.finalized).toBe(true);
  });

  it("accepts webhook with missing merchant reference", async () => {
    mockNormalizePesapalStatus.mockReturnValue({ merchantReference: null, trackingId: null, amount: null, paymentStatus: null, raw: {} });
    const POST = await importWebhook();
    const res = await POST(makeRequest("/api/webhooks/pesapal", {
      body: JSON.stringify({}),
    }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(mockVerifyPesapalPayment).not.toHaveBeenCalled();
  });

  it("handles webhook verification failure gracefully", async () => {
    mockVerifyPesapalPayment.mockResolvedValue({ ok: false, error: "Payment not found", raw: {} });
    const POST = await importWebhook();
    const res = await POST(makeRequest("/api/webhooks/pesapal", {
      body: JSON.stringify({ merchant_reference: "mr-1", order_tracking_id: "trk-1", amount: 50000, payment_status_description: "Completed" }),
    }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.finalized).toBe(false);
  });
});
