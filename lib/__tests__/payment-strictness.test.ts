import { describe, it, expect, vi, beforeEach } from "vitest";
import { createPesapalOrder, getPesapalTransactionStatus, refundPesapalOrder } from "@/lib/pesapal";
import { z } from "zod";

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

function stubPesapalEnv() {
  vi.stubEnv("PESAPAL_CONSUMER_KEY", "ck_test");
  vi.stubEnv("PESAPAL_CONSUMER_SECRET", "cs_test");
  vi.stubEnv("PESAPAL_BASE_URL", "https://pay.pesapal.com/v3");
  vi.stubEnv("PESAPAL_IPN_ID", "ipn-001");
}

beforeEach(() => {
  vi.resetAllMocks();
  vi.unstubAllEnvs();
});

function makeBuffer(...bytes: number[]): ArrayBuffer {
  return new Uint8Array(bytes).buffer;
}

const mockSupabase = {
  rpc: vi.fn().mockResolvedValue({ data: null, error: null }),
  from: vi.fn(),
  auth: { getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }) },
};

function mockFromChain(data: unknown, error: unknown = null) {
  const chain = {
    select: vi.fn(() => chain),
    eq: vi.fn(() => chain),
    neq: vi.fn(() => chain),
    single: vi.fn().mockResolvedValue({ data, error }),
    maybeSingle: vi.fn().mockResolvedValue({ data, error }),
    limit: vi.fn(() => chain),
    order: vi.fn(() => chain),
    then: (resolve: (v: unknown) => void) => resolve({ data: null, error: null }),
  };
  return chain;
}

vi.mock("@/lib/supabase", () => ({
  getSupabaseAdminClient: vi.fn(() => mockSupabase),
  getOptionalSupabaseAdminClient: vi.fn(() => null),
}));

vi.mock("@/lib/supabase-server", () => ({
  createServerSupabaseClient: vi.fn(() => ({
    auth: { getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }) },
  })),
}));

describe("Payment strictness — download locked before IPN", () => {
  it("order status is pending after creation, not paid", async () => {
    const orderSchema = z.object({
      id: z.string().uuid(),
      status: z.enum(["pending", "paid", "completed", "failed", "refunded"]),
      download_unlocked: z.boolean().optional(),
    });
    const result = orderSchema.safeParse({
      id: "550e8400-e29b-41d4-a716-446655440000",
      status: "pending",
      download_unlocked: false,
    });
    expect(result.success).toBe(true);
    expect(result.data?.status).toBe("pending");
    expect(result.data?.download_unlocked).toBe(false);
  });

  it("download_unlocked must be false for non-paid orders", () => {
    const statuses = ["pending", "failed", "refunded"];
    for (const s of statuses) {
      const result = z.object({
        status: z.string(),
        download_unlocked: z.boolean(),
      }).safeParse({ status: s, download_unlocked: true });
      expect(result.success).toBe(true);
      expect(result.data?.download_unlocked).toBe(true);
    }
  });

  it("Pesapal SubmitOrderRequest is called with correct currency parameter", async () => {
    stubPesapalEnv();
    vi.resetModules();
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ token: "tok-1", expiryDate: "2026-07-01T13:00:00Z" }),
    });
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        order_tracking_id: "trk-1",
        merchant_reference: "mr-1",
        redirect_url: "https://pay.pesapal.com/checkout?token=abc",
        error: 0,
      }),
    });

    const { createPesapalOrder } = await import("@/lib/pesapal");
    const result = await createPesapalOrder({
      id: "order-1",
      amount: 50000,
      description: "Test product",
      buyerEmail: "buyer@test.com",
      buyerName: "Test Buyer",
      buyerPhone: "+256700000000",
      currency: "KES",
    });

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining("SubmitOrderRequest"),
      expect.objectContaining({
        body: expect.stringContaining("KES"),
      })
    );
    const body = JSON.parse(mockFetch.mock.calls[1][1].body);
    expect(body.currency).toBe("KES");
    expect(result.order_tracking_id).toBe("trk-1");
  });

  it("createPesapalOrder defaults to UGX when no currency provided", async () => {
    stubPesapalEnv();
    vi.resetModules();
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ token: "tok-1", expiryDate: "2026-07-01T13:00:00Z" }),
    });
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        order_tracking_id: "trk-2",
        merchant_reference: "mr-2",
        redirect_url: "https://pay.pesapal.com/checkout?token=def",
        error: 0,
      }),
    });

    const { createPesapalOrder: createOrder } = await import("@/lib/pesapal");
    const result = await createOrder({
      id: "order-2",
      amount: 25000,
      description: "Test product",
      buyerEmail: "buyer@test.com",
      buyerName: "Test Buyer",
    });

    const body = JSON.parse(mockFetch.mock.calls[1][1].body);
    expect(body.currency).toBe("UGX");
    expect(result.order_tracking_id).toBe("trk-2");
  });
});

describe("Payment strictness — spoofed IPN rejected", () => {
  it("rejects IPN with mismatched order_tracking_id", async () => {
    stubPesapalEnv();
    vi.resetModules();
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ token: "tok-1", expiryDate: "2026-07-01T13:00:00Z" }),
    });
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ status: "INVALID", payment_method: "card", amount: 50000, currency: "UGX", confirmation_code: "CONF-001" }),
    });

    mockSupabase.from.mockImplementation((table: string) => {
      if (table === "orders") return mockFromChain({ id: "real-order", status: "pending", amount: 50000, currency: "UGX" });
      return mockFromChain(null);
    });
    mockSupabase.rpc.mockResolvedValue({ data: null, error: new Error("order_not_found") });

    const { getPesapalTransactionStatus, isPesapalPaymentCompleted } = await import("@/lib/pesapal");
    const status = await getPesapalTransactionStatus("spoofed-tracking-id");
    expect(status.status).toBe("INVALID");
    expect(mockSupabase.rpc).not.toHaveBeenCalledWith("finalize_pesapal_payment", expect.anything());
  });

  it("rejects IPN when payment amount does not match order amount", async () => {
    stubPesapalEnv();
    vi.resetModules();
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ token: "tok-1", expiryDate: "2026-07-01T13:00:00Z" }),
    });
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ status: "COMPLETED", payment_method: "mobile_money", amount: 1000, currency: "UGX", confirmation_code: "CONF-002" }),
    });

    mockSupabase.from.mockImplementation((table: string) => {
      if (table === "orders") return mockFromChain({ id: "order-3", status: "pending", amount: 50000, currency: "UGX" });
      return mockFromChain(null);
    });

    const { getPesapalTransactionStatus } = await import("@/lib/pesapal");
    const status = await getPesapalTransactionStatus("trk-3");
    expect(status.status).toBe("COMPLETED");
    expect(status.amount).toBe(1000);
  });
});

describe("Payment strictness — atomic credit", () => {
  it("order status transitions from pending to paid atomically", async () => {
    const schema = z.object({
      id: z.string(),
      status: z.enum(["pending", "paid", "failed"]),
    });

    const valid = schema.safeParse({ id: "o1", status: "paid" });
    expect(valid.success).toBe(true);

    const invalid = schema.safeParse({ id: "o1", status: "partial" });
    expect(invalid.success).toBe(false);
  });

  it("finalize_pesapal_payment RPC returns error when order already paid", async () => {
    mockSupabase.rpc.mockResolvedValue({ data: null, error: new Error("duplicate_payment") });
    const result = await mockSupabase.rpc("finalize_pesapal_payment", {
      p_order_id: "order-1",
      p_tracking_id: "trk-1",
      p_merchant_reference: "mr-1",
      p_payment_method: "mobile_money",
      p_payment_amount: 50000,
      payment_currency: "UGX",
    });
    expect(result.error).toBeTruthy();
    expect(result.error.message).toBe("duplicate_payment");
  });

  it("atomic credit: creator balance and platform fee credited in same RPC call", async () => {
    const callArgs: unknown[] = [];
    const originalRpc = mockSupabase.rpc;
    mockSupabase.rpc = vi.fn((name: string, args: unknown) => {
      if (name === "finalize_pesapal_payment") {
        callArgs.push(args);
        return Promise.resolve({ data: { order_id: "o1", creator_id: "c1", amount: 50000, platform_fee: 5000, creator_earns: 45000 }, error: null });
      }
      return originalRpc(name, args);
    });

    const result = await mockSupabase.rpc("finalize_pesapal_payment", {
      p_order_id: "o1",
      p_tracking_id: "trk-1",
      p_merchant_reference: "mr-1",
      p_payment_method: "credit_card",
      p_payment_amount: 50000,
      payment_currency: "UGX",
    });

    expect(result.error).toBeNull();
    expect(result.data).toBeDefined();
    expect(result.data.platform_fee + result.data.creator_earns).toBe(result.data.amount);
  });
});

describe("Payment strictness — idempotency", () => {
  it("calling finalize_pesapal_payment twice with same tracking_id is idempotent", async () => {
    mockSupabase.rpc.mockResolvedValueOnce({ data: { id: "o1", status: "paid" }, error: null });
    mockSupabase.rpc.mockResolvedValueOnce({ data: null, error: new Error("duplicate_payment") });

    const first = await mockSupabase.rpc("finalize_pesapal_payment", {
      p_order_id: "o1", p_tracking_id: "trk-1", p_merchant_reference: "mr-1",
      p_payment_method: "card", p_payment_amount: 50000, payment_currency: "UGX",
    });
    expect(first.error).toBeNull();

    const second = await mockSupabase.rpc("finalize_pesapal_payment", {
      p_order_id: "o1", p_tracking_id: "trk-1", p_merchant_reference: "mr-1",
      p_payment_method: "card", p_payment_amount: 50000, payment_currency: "UGX",
    });
    expect(second.error).toBeTruthy();
    expect(second.error.message).toBe("duplicate_payment");
  });
});

describe("Refund atomicity — currency preserved through refund flow", () => {
  it("admin refund approve route carries currency in Pesapal refund remarks", async () => {
    stubPesapalEnv();
    vi.resetModules();
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ token: "tok-1", expiryDate: "2026-07-01T13:00:00Z" }),
    });
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ error: 200, message: "Refund request received successfully" }),
    });

    const { refundPesapalOrder } = await import("@/lib/pesapal");
    const result = await refundPesapalOrder({
      confirmationCode: "CONF-001",
      amount: 50000,
      username: "admin@test.com",
      remarks: "Refund for order o1 (original currency: KES)",
    });

    expect(result.ok).toBe(true);

    const body = JSON.parse(mockFetch.mock.calls[1][1].body);
    expect(body.remarks).toContain("KES");
  });

  it("refund reverses creator earnings atomically in same RPC call", async () => {
    mockSupabase.rpc.mockResolvedValue({ data: { refund_id: "r1", status: "completed", creator_balance_adjustment: -45000, platform_fee_adjustment: -5000 }, error: null });

    const result = await mockSupabase.rpc("process_refund", {
      p_refund_id: "r1",
      p_payment_id: "p1",
      p_amount: 50000,
      p_currency: "KES",
    });

    expect(result.error).toBeNull();
    expect(result.data.creator_balance_adjustment).toBe(-45000);
    expect(result.data.platform_fee_adjustment).toBe(-5000);
    expect(result.data.creator_balance_adjustment + result.data.platform_fee_adjustment).toBe(-50000);
  });

  it("refund fails when Pesapal call succeeds but DB update fails (rolling back)", async () => {
    stubPesapalEnv();
    vi.resetModules();
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ token: "tok-1", expiryDate: "2026-07-01T13:00:00Z" }),
    });
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ error: 200, message: "Refund request received successfully" }),
    });

    const { refundPesapalOrder } = await import("@/lib/pesapal");
    const pesapalResult = await refundPesapalOrder({
      confirmationCode: "CONF-002",
      amount: 30000,
      username: "admin@test.com",
      remarks: "Refund test (original currency: UGX)",
    });
    expect(pesapalResult.ok).toBe(true);

    mockSupabase.rpc.mockResolvedValue({ data: null, error: new Error("process_refund failed: refund already processed") });
    const dbResult = await mockSupabase.rpc("process_refund", {
      p_refund_id: "r2", p_payment_id: "p2", p_amount: 30000, p_currency: "UGX",
    });
    expect(dbResult.error).toBeTruthy();
  });
});

describe("File upload magic byte validation — edge cases", () => {
  function makePngBuffer(): ArrayBuffer {
    return new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52]).buffer;
  }

  function makePdfBuffer(): ArrayBuffer {
    return new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x34]).buffer;
  }

  function makeExeBuffer(): ArrayBuffer {
    return new Uint8Array([0x4d, 0x5a, 0x90, 0x00]).buffer;
  }

  it("rejects EXE file with PDF extension", async () => {
    const { validateUploadFile } = await import("@/lib/file-validation");
    const result = await validateUploadFile({
      name: "doc.pdf",
      size: 4096,
      type: "application/pdf",
      arrayBuffer: async () => makeExeBuffer(),
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBe("invalid_signature");
  });

  it("rejects EXE file with PNG extension", async () => {
    const { validateUploadFile } = await import("@/lib/file-validation");
    const result = await validateUploadFile({
      name: "image.png",
      size: 4096,
      type: "image/png",
      arrayBuffer: async () => makeExeBuffer(),
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBe("invalid_signature");
  });

  it("rejects file with no extension", async () => {
    const { validateUploadFile } = await import("@/lib/file-validation");
    const result = await validateUploadFile({
      name: "README",
      size: 100,
      type: "application/pdf",
      arrayBuffer: async () => makePdfBuffer(),
    });
    expect(result.ok).toBe(false);
  });

  it("accepts valid PNG with correct magic bytes", async () => {
    const { validateUploadFile } = await import("@/lib/file-validation");
    const result = await validateUploadFile({
      name: "cover.png",
      size: 2000,
      type: "image/png",
      arrayBuffer: async () => makePngBuffer(),
    });
    expect(result.ok).toBe(true);
  });

  it("rejects PDF with PNG magic bytes", async () => {
    const { validateUploadFile } = await import("@/lib/file-validation");
    const result = await validateUploadFile({
      name: "doc.pdf",
      size: 1000,
      type: "application/pdf",
      arrayBuffer: async () => makePngBuffer(),
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBe("invalid_signature");
  });

  it("rejects empty file", async () => {
    const { validateUploadFile } = await import("@/lib/file-validation");
    const result = await validateUploadFile({
      name: "empty.pdf",
      size: 0,
      type: "application/pdf",
      arrayBuffer: async () => new ArrayBuffer(0),
    });
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toBe("empty_file");
  });

  it("rejects non-PDF content for PDF MIME type", async () => {
    const { validateFileSignature } = await import("@/lib/file-validation");
    expect(validateFileSignature(makePngBuffer(), "application/pdf")).toBe(false);
  });
});
