import { describe, it, expect, vi, beforeEach } from "vitest";
import { normalizePesapalStatus, isPesapalPaymentCompleted } from "@/lib/pesapal";

const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

beforeEach(() => {
  vi.resetAllMocks();
  vi.unstubAllEnvs();
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-06-01T12:00:00Z"));
});

function stubPesapalEnv() {
  vi.stubEnv("PESAPAL_CONSUMER_KEY", "ck_test");
  vi.stubEnv("PESAPAL_CONSUMER_SECRET", "cs_test");
  vi.stubEnv("PESAPAL_BASE_URL", "https://pay.pesapal.com/v3");
  vi.stubEnv("PESAPAL_IPN_ID", "ipn-001");
}

describe("getPesapalToken", () => {
  it("fetches and caches a new token", async () => {
    stubPesapalEnv();
    vi.resetModules();
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ token: "tok-1", expiryDate: "2026-06-01T13:00:00Z" }),
    });
    const { getPesapalToken } = await import("@/lib/pesapal");
    const token = await getPesapalToken();
    expect(token.token).toBe("tok-1");
    expect(mockFetch).toHaveBeenCalledWith(
      "https://pay.pesapal.com/v3/api/Auth/RequestToken",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ consumer_key: "ck_test", consumer_secret: "cs_test" }),
      })
    );
  });

  it("returns cached token if not expired", async () => {
    stubPesapalEnv();
    vi.resetModules();
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ token: "tok-1", expiryDate: "2026-06-01T13:00:00Z" }),
    });
    const { getPesapalToken } = await import("@/lib/pesapal");
    await getPesapalToken();
    mockFetch.mockClear();

    const token = await getPesapalToken();
    expect(token.token).toBe("tok-1");
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("refreshes token when expired", async () => {
    stubPesapalEnv();
    vi.resetModules();
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ token: "tok-1", expiryDate: "2026-06-01T12:30:00Z" }),
    });
    const { getPesapalToken } = await import("@/lib/pesapal");
    await getPesapalToken();

    vi.advanceTimersByTime(31 * 60 * 1000);
    mockFetch.mockClear();
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ token: "tok-2", expiryDate: "2026-06-01T14:00:00Z" }),
    });

    const token = await getPesapalToken();
    expect(token.token).toBe("tok-2");
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  it("throws when credentials are missing", async () => {
    stubPesapalEnv();
    vi.stubEnv("PESAPAL_CONSUMER_KEY", "");
    vi.resetModules();
    const { getPesapalToken } = await import("@/lib/pesapal");
    await expect(getPesapalToken()).rejects.toThrow("Pesapal credentials are missing");
  });

  it("throws when response is not ok", async () => {
    stubPesapalEnv();
    vi.resetModules();
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ token: "tok-1", expiryDate: "2026-06-01T13:00:00Z" }),
    });
    const mod = await import("@/lib/pesapal");
    await mod.getPesapalToken();
    vi.advanceTimersByTime(61 * 60 * 1000);
    mockFetch.mockReset();
    mockFetch.mockResolvedValue({ ok: false });
    await expect(mod.getPesapalToken()).rejects.toThrow("Unable to authenticate with Pesapal");
  });
});

describe("createPesapalOrder", () => {
  it("creates an order and returns response", async () => {
    stubPesapalEnv();
    vi.resetModules();
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ token: "tok-1", expiryDate: "2026-06-01T13:00:00Z" }),
    });
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ redirect_url: "https://pay.pesapal.com/order/123", order_tracking_id: "trk-1" }),
    });

    const { createPesapalOrder } = await import("@/lib/pesapal");
    const result = await createPesapalOrder({
      id: "ref-1",
      amount: 50000,
      email: "buyer@test.com",
      firstName: "John",
      lastName: "Doe",
      description: "E-Book",
      callbackUrl: "https://keevanstore.in/callback",
    });

    expect(result.redirect_url).toBe("https://pay.pesapal.com/order/123");
    expect(mockFetch).toHaveBeenLastCalledWith(
      "https://pay.pesapal.com/v3/api/Transactions/SubmitOrderRequest",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({ Authorization: "Bearer tok-1" }),
      })
    );
  });

  it("throws when IPN ID is missing", async () => {
    stubPesapalEnv();
    vi.stubEnv("PESAPAL_IPN_ID", "");
    vi.resetModules();
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ token: "tok-1", expiryDate: "2026-06-01T13:00:00Z" }),
    });
    const { createPesapalOrder } = await import("@/lib/pesapal");
    await expect(createPesapalOrder({
      id: "ref-1", amount: 50000, email: "buyer@test.com",
      firstName: "John", lastName: "Doe",
      description: "E-Book", callbackUrl: "https://keevanstore.in/callback",
    })).rejects.toThrow("Pesapal IPN id is missing");
  });

  it("throws when order creation fails", async () => {
    stubPesapalEnv();
    vi.resetModules();
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ token: "tok-1", expiryDate: "2026-06-01T13:00:00Z" }),
    });
    mockFetch.mockResolvedValueOnce({ ok: false });
    const { createPesapalOrder } = await import("@/lib/pesapal");
    await expect(createPesapalOrder({
      id: "ref-1", amount: 50000, email: "buyer@test.com",
      firstName: "John", lastName: "Doe",
      description: "E-Book", callbackUrl: "https://keevanstore.in/callback",
    })).rejects.toThrow("Unable to create Pesapal order");
  });
});

describe("getPesapalTransactionStatus", () => {
  it("fetches transaction status", async () => {
    stubPesapalEnv();
    vi.resetModules();
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ token: "tok-1", expiryDate: "2026-06-01T13:00:00Z" }),
    });
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ status: "COMPLETED", amount: 50000 }),
    });

    const { getPesapalTransactionStatus } = await import("@/lib/pesapal");
    const result = await getPesapalTransactionStatus("trk-1");
    expect(result.status).toBe("COMPLETED");
    expect(mockFetch).toHaveBeenLastCalledWith(
      "https://pay.pesapal.com/v3/api/Transactions/GetTransactionStatus?orderTrackingId=trk-1",
      expect.objectContaining({ headers: { Authorization: "Bearer tok-1" } })
    );
  });

  it("throws when request fails", async () => {
    stubPesapalEnv();
    vi.resetModules();
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ token: "tok-1", expiryDate: "2026-06-01T13:00:00Z" }),
    });
    mockFetch.mockResolvedValueOnce({ ok: false });
    const { getPesapalTransactionStatus } = await import("@/lib/pesapal");
    await expect(getPesapalTransactionStatus("trk-1")).rejects.toThrow("Unable to verify Pesapal transaction");
  });
});

describe("refundPesapalOrder", () => {
  it("returns ok on successful refund", async () => {
    stubPesapalEnv();
    vi.resetModules();
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ token: "tok-1", expiryDate: "2026-06-01T13:00:00Z" }),
    });
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ message: "Refund submitted", error: 0 }),
    });

    const { refundPesapalOrder } = await import("@/lib/pesapal");
    const result = await refundPesapalOrder({ confirmationCode: "CONF-1", amount: 50000, username: "admin", remarks: "Refund" });
    expect(result.ok).toBe(true);
    expect(result.message).toBe("Refund submitted");
  });

  it("returns ok false with error message when response is 500", async () => {
    stubPesapalEnv();
    vi.resetModules();
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ token: "tok-1", expiryDate: "2026-06-01T13:00:00Z" }),
    });
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ message: "Refund failed", error: 500 }),
    });

    const { refundPesapalOrder } = await import("@/lib/pesapal");
    const result = await refundPesapalOrder({ confirmationCode: "CONF-1", amount: 50000, username: "admin", remarks: "Refund" });
    expect(result.ok).toBe(false);
    expect(result.error).toBe("Refund failed");
  });
});

describe("verifyPesapalPayment", () => {
  function makeMockSupabase(paymentData: unknown, finalizeResult: { data: unknown; error: unknown }) {
    const chain = {
      select: vi.fn(() => chain),
      eq: vi.fn(() => chain),
      single: vi.fn().mockResolvedValue({ data: paymentData, error: paymentData ? null : new Error("Not found") }),
      insert: vi.fn(() => ({
        select: vi.fn(() => ({ single: vi.fn().mockResolvedValue({ data: null, error: null }) })),
        then: (resolve: (v: unknown) => void) => resolve({ data: null, error: null }),
      })),
      then: (resolve: (v: unknown) => void) => resolve({ data: paymentData, error: null }),
    };
    return {
      from: vi.fn(() => chain),
      rpc: vi.fn().mockImplementation((rpcName: string) => {
        if (rpcName === "fail_pesapal_payment") return Promise.resolve({ data: null, error: null });
        if (rpcName === "finalize_pesapal_payment") return Promise.resolve(finalizeResult);
        return Promise.resolve({ data: null, error: null });
      }),
    };
  }

  it("verifies payment successfully", async () => {
    stubPesapalEnv();
    vi.resetModules();
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ token: "tok-1", expiryDate: "2026-06-01T13:00:00Z" }),
    });
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        merchant_reference: "mr-1",
        order_tracking_id: "trk-1",
        amount: 50000,
        payment_status_description: "Completed",
      }),
    });

    const supabase = makeMockSupabase(
      { id: "p1", merchant_reference: "mr-1", order_id: "o1", orders: [{ amount: 50000 }] },
      { data: { ok: true, download_token: "dt-1", product_id: "prod-1", order_id: "o1", already_processed: false }, error: null }
    );
    const { verifyPesapalPayment } = await import("@/lib/pesapal");
    const result = await verifyPesapalPayment(supabase, "mr-1", "trk-1");
    expect(result.ok).toBe(true);
    expect((result as { ok: true; downloadToken: string }).downloadToken).toBe("dt-1");
    expect((result as { ok: true; alreadyVerified: boolean }).alreadyVerified).toBe(false);
  });

  it("returns error when payment not found", async () => {
    stubPesapalEnv();
    vi.resetModules();
    const supabase = makeMockSupabase(null, { data: null, error: null });
    const { verifyPesapalPayment } = await import("@/lib/pesapal");
    const result = await verifyPesapalPayment(supabase, "mr-1", "trk-1");
    expect(result.ok).toBe(false);
    expect((result as { ok: false; error: string }).error).toBe("Payment not found");
  });

  it("returns error on merchant reference mismatch", async () => {
    stubPesapalEnv();
    vi.resetModules();
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ token: "tok-1", expiryDate: "2026-06-01T13:00:00Z" }),
    });
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        merchant_reference: "mr-different",
        order_tracking_id: "trk-1",
        amount: 50000,
        payment_status_description: "Completed",
      }),
    });
    const supabase = makeMockSupabase(
      { id: "p1", merchant_reference: "mr-1", order_id: "o1", orders: [{ amount: 50000 }] },
      { data: [{ download_token: "dt-x", product_id: "prod-1", order_id: "o1", already_processed: false }], error: null }
    );
    const { verifyPesapalPayment } = await import("@/lib/pesapal");
    const result = await verifyPesapalPayment(supabase, "mr-1", "trk-1");
    expect(result.ok).toBe(false);
    expect((result as { ok: false; error: string }).error).toBe("Pesapal merchant reference mismatch");
  });

  it("returns error on amount mismatch", async () => {
    stubPesapalEnv();
    vi.resetModules();
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ token: "tok-1", expiryDate: "2026-06-01T13:00:00Z" }),
    });
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        merchant_reference: "mr-1",
        order_tracking_id: "trk-1",
        amount: 99999,
        payment_status_description: "Completed",
      }),
    });
    const supabase = makeMockSupabase(
      { id: "p1", merchant_reference: "mr-1", order_id: "o1", orders: [{ amount: 50000 }] },
      { data: [{ download_token: null, product_id: null, order_id: "o1", already_processed: false }], error: null }
    );
    const { verifyPesapalPayment } = await import("@/lib/pesapal");
    const result = await verifyPesapalPayment(supabase, "mr-1", "trk-1");
    expect(result.ok).toBe(false);
    expect((result as { ok: false; error: string }).error).toBe("Pesapal amount mismatch");
  });

  it("returns error when payment not completed", async () => {
    stubPesapalEnv();
    vi.resetModules();
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ token: "tok-1", expiryDate: "2026-06-01T13:00:00Z" }),
    });
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        merchant_reference: "mr-1",
        order_tracking_id: "trk-1",
        amount: 50000,
        payment_status_description: "FAILED",
      }),
    });
    const supabase = makeMockSupabase(
      { id: "p1", merchant_reference: "mr-1", order_id: "o1", orders: [{ amount: 50000 }] },
      { data: null, error: null }
    );
    const { verifyPesapalPayment } = await import("@/lib/pesapal");
    const result = await verifyPesapalPayment(supabase, "mr-1", "trk-1");
    expect(result.ok).toBe(false);
    expect((result as { ok: false; error: string }).error).toBe("Payment is not completed");
  });

  it("returns error when finalize RPC fails", async () => {
    stubPesapalEnv();
    vi.resetModules();
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ token: "tok-1", expiryDate: "2026-06-01T13:00:00Z" }),
    });
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        merchant_reference: "mr-1",
        order_tracking_id: "trk-1",
        amount: 50000,
        payment_status_description: "Completed",
      }),
    });
    const supabase = makeMockSupabase(
      { id: "p1", merchant_reference: "mr-1", order_id: "o1", orders: [{ amount: 50000 }] },
      { data: null, error: new Error("RPC failed") }
    );
    const { verifyPesapalPayment } = await import("@/lib/pesapal");
    const result = await verifyPesapalPayment(supabase, "mr-1", "trk-1");
    expect(result.ok).toBe(false);
    expect((result as { ok: false; error: string }).error).toBe("RPC failed");
  });

  it("returns error when no download token", async () => {
    stubPesapalEnv();
    vi.resetModules();
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ token: "tok-1", expiryDate: "2026-06-01T13:00:00Z" }),
    });
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        merchant_reference: "mr-1",
        order_tracking_id: "trk-1",
        amount: 50000,
        payment_status_description: "Completed",
      }),
    });
    const supabase = makeMockSupabase(
      { id: "p1", merchant_reference: "mr-1", order_id: "o1", orders: [{ amount: 50000 }] },
      { data: [{ download_token: null, product_id: null, order_id: "o1", already_processed: false }], error: null }
    );
    const { verifyPesapalPayment } = await import("@/lib/pesapal");
    const result = await verifyPesapalPayment(supabase, "mr-1", "trk-1");
    expect(result.ok).toBe(false);
    expect((result as { ok: false; error: string }).error).toBe("Unable to issue download token");
  });
});
