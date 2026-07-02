import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { apiError, checkCSRF, readJson, withErrorHandling, requireAdmin, rateLimit } from "@/lib/api";
import { z } from "zod";

function mockFromChain(data: unknown, error: unknown = null, customCount?: number) {
  let countMode = false;
  const eq = vi.fn(() => chain);
  const resolveValue = { data, error };
  const chain = {
    select: vi.fn((_col: string, opts?: { count?: string }) => {
      if (opts?.count === "exact") countMode = true;
      return chain;
    }),
    eq,
    neq: vi.fn(() => chain),
    lt: vi.fn(() => chain),
    gt: vi.fn(() => chain),
    lte: vi.fn(() => chain),
    gte: vi.fn(() => chain),
    or: vi.fn(() => chain),
    order: vi.fn(() => chain),
    limit: vi.fn(() => chain),
    single: vi.fn().mockResolvedValue({ data, error }),
    maybeSingle: vi.fn().mockResolvedValue({ data, error }),
    insert: vi.fn(() => ({ select: vi.fn(() => ({ single: vi.fn().mockResolvedValue({ data, error }) })) })),
    update: vi.fn(() => ({ eq: vi.fn().mockResolvedValue({ data: null, error: null }) })),
    delete: vi.fn(() => ({ eq: vi.fn().mockResolvedValue({ data: null, error: null }) })),
    then: (resolve: (v: unknown) => void) => {
      if (countMode) resolve({ count: customCount ?? 0, data: null, error: null });
      else resolve(resolveValue);
    },
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
  getOptionalSupabaseAdminClient: vi.fn(() => null),
}));

vi.mock("@/lib/supabase-server", () => ({
  createServerSupabaseClient: vi.fn(() => ({
    auth: { getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }) },
  })),
}));

vi.mock("@/lib/pesapal", () => ({
  getPesapalTransactionStatus: vi.fn(),
  refundPesapalOrder: vi.fn(),
}));

vi.mock("@/lib/email", () => ({
  sendEmail: vi.fn(),
}));

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://keevanstore.in");
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://test.supabase.co");
  vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "test-key");
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "test-anon-key");
  mockSupabase.from.mockReturnValue(rateLimitChain);
  mockSupabase.rpc.mockResolvedValue({ data: null, error: null });
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

function setupAdminUser(user: { id: string; email: string; role: string }) {
  mockSupabase.auth.getUser.mockResolvedValue({
    data: { user: { id: user.id, email: user.email } },
    error: null,
  });
  const prevImpl = mockSupabase.from.getMockImplementation();
  mockSupabase.from.mockImplementation((table: string) => {
    if (table === "users") return mockFromChain({ id: user.id, email: user.email, role: user.role, full_name: "Test User" });
    if (prevImpl) return (prevImpl as (table: string) => unknown)(table);
    return rateLimitChain;
  });
}

function makeAdminRequest(url: string, user: { id: string; email: string; role: string }, overrides: Partial<RequestInit & { headers?: Record<string, string> }> = {}): NextRequest {
  setupAdminUser(user);
  return new NextRequest(new URL(url, "https://keevanstore.in"), {
    method: overrides.method ?? "POST",
    headers: {
      "Content-Type": "application/json",
      origin: "https://keevanstore.in",
      authorization: "Bearer mock-token",
      ...(overrides.headers ?? {}),
    },
    body: overrides.body,
  });
}

describe("withErrorHandling", () => {
  it("returns 429 when rate limited", async () => {
    const handler = vi.fn().mockResolvedValue(new Response("ok"));
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "");
    const wrapped = withErrorHandling(handler);
    const req = makeRequest("/api/test");
    const res = await wrapped(req);
    expect(res.status).toBe(200);
  });

  it("catches thrown errors and returns JSON", async () => {
    const handler = vi.fn().mockRejectedValue(Object.assign(new Error("Test error"), { status: 422 }));
    const wrapped = withErrorHandling(handler);
    const req = makeRequest("/api/test");
    const res = await wrapped(req);
    expect(res.status).toBe(422);
    const body = await res.json();
    expect(body.error.message).toBe("Test error");
  });

  it("masks 500 errors in production", async () => {
    const handler = vi.fn().mockRejectedValue(Object.assign(new Error("Internal details"), { status: 500 }));
    const wrapped = withErrorHandling(handler);
    const req = makeRequest("/api/test");
    const res = await wrapped(req);
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error.message).toBe("Unexpected server error");
  });
});

describe("requireAdmin", () => {
  it("rejects unauthenticated requests", async () => {
    await expect(requireAdmin(makeRequest("/api/admin/test"))).rejects.toThrow("Authentication required");
  });

  it("rejects non-admin requests", async () => {
    setupAdminUser({ id: "u1", email: "creator@test.com", role: "creator" });
    mockSupabase.from.mockImplementation((table: string) => {
      if (table === "users") return mockFromChain({ id: "u1", email: "creator@test.com", role: "creator" });
      return rateLimitChain;
    });
    const req = makeAdminRequest("/api/admin/test", { id: "u1", email: "creator@test.com", role: "creator" });
    await expect(requireAdmin(req)).rejects.toThrow("Admin access required");
  });

  it("returns session for admin users", async () => {
    setupAdminUser({ id: "u1", email: "admin@test.com", role: "admin" });
    mockSupabase.from.mockImplementation((table: string) => {
      if (table === "users") return mockFromChain({ id: "u1", email: "admin@test.com", role: "admin" });
      return rateLimitChain;
    });
    const req = makeAdminRequest("/api/admin/test", { id: "u1", email: "admin@test.com", role: "admin" });
    const session = await requireAdmin(req);
    expect(session.profile.role).toBe("admin");
  });
});

describe("rateLimit behaviour", () => {
  it("returns null when within limit", async () => {
    mockSupabase.rpc.mockResolvedValue({ data: null, error: null });
    const req = makeRequest("/api/test");
    const result = await rateLimit(req, 10, 60);
    expect(result).toBeNull();
  });

  it("returns 429 when RPC returns rate limit error", async () => {
    mockSupabase.rpc.mockResolvedValue({ data: null, error: { message: "Rate limit exceeded" } });
    const req = makeRequest("/api/test");
    const result = await rateLimit(req, 100, 60);
    expect(result).not.toBeNull();
    expect(result!.status).toBe(429);
    const body = await result!.json();
    expect(body.error.message).toContain("Too many requests");
  });
});

describe("checkCSRF integration", () => {
  it("passes when origin matches", () => {
    expect(() => checkCSRF(makeRequest("/api/test"))).not.toThrow();
  });

  it("throws 403 when origin does not match", () => {
    const req = makeRequest("/api/test", { headers: { origin: "https://evil.com" } });
    expect(() => checkCSRF(req)).toThrow("Cross-site request forbidden");
  });
});

describe("Refund request API flow", () => {
  async function importRefundRequest() {
    return import("@/app/api/refunds/request/route").then((m) => m.POST);
  }

  beforeEach(() => {
    mockSupabase.from.mockImplementation((table: string) => {
      if (table === "refunds") return mockFromChain(null);
      if (table === "orders") return mockFromChain({
        id: "550e8400-e29b-41d4-a716-446655440000",
        buyer_email: "buyer@test.com",
        buyer_name: "Buyer",
        status: "paid",
        payments: [{ id: "p1", status: "completed" }],
      });
      return rateLimitChain;
    });
  });

  it("rejects invalid request body (empty)", async () => {
    const POST = await importRefundRequest();
    const res = await POST(makeRequest("/api/refunds/request", { body: JSON.stringify({}) }));
    expect(res.status).toBe(422);
  });

  it("rejects invalid UUID for orderId", async () => {
    const POST = await importRefundRequest();
    const res = await POST(makeRequest("/api/refunds/request", {
      body: JSON.stringify({ orderId: "not-a-uuid", buyerEmail: "buyer@test.com", reason: "Product not as described" }),
    }));
    expect(res.status).toBe(422);
  });

  it("rejects missing buyer email", async () => {
    const POST = await importRefundRequest();
    const res = await POST(makeRequest("/api/refunds/request", {
      body: JSON.stringify({ orderId: "550e8400-e29b-41d4-a716-446655440000", reason: "Product not as described" }),
    }));
    expect(res.status).toBe(422);
  });

  it("returns 404 when order not found", async () => {
    mockSupabase.from.mockImplementation((table: string) => {
      if (table === "orders") return mockFromChain(null, null);
      return rateLimitChain;
    });
    const POST = await importRefundRequest();
    const res = await POST(makeRequest("/api/refunds/request", {
      body: JSON.stringify({ orderId: "550e8400-e29b-41d4-a716-446655440000", buyerEmail: "buyer@test.com", reason: "Product not as described" }),
    }));
    expect(res.status).toBe(404);
  });

  it("returns 403 when email does not match order", async () => {
    mockSupabase.from.mockImplementation((table: string) => {
      if (table === "orders") return mockFromChain({
        id: "550e8400-e29b-41d4-a716-446655440000",
        buyer_email: "other@test.com",
        buyer_name: "Other",
        status: "paid",
        payments: [{ id: "p1", status: "completed" }],
      });
      if (table === "refunds") return mockFromChain(null);
      return rateLimitChain;
    });
    const POST = await importRefundRequest();
    const res = await POST(makeRequest("/api/refunds/request", {
      body: JSON.stringify({ orderId: "550e8400-e29b-41d4-a716-446655440000", buyerEmail: "buyer@test.com", reason: "Product not as described" }),
    }));
    expect(res.status).toBe(403);
  });

  it("returns 400 when order is not paid", async () => {
    mockSupabase.from.mockImplementation((table: string) => {
      if (table === "orders") return mockFromChain({
        id: "550e8400-e29b-41d4-a716-446655440000",
        buyer_email: "buyer@test.com",
        buyer_name: "Buyer",
        status: "pending",
        payments: [{ id: "p1", status: "completed" }],
      });
      if (table === "refunds") return mockFromChain(null);
      return rateLimitChain;
    });
    const POST = await importRefundRequest();
    const res = await POST(makeRequest("/api/refunds/request", {
      body: JSON.stringify({ orderId: "550e8400-e29b-41d4-a716-446655440000", buyerEmail: "buyer@test.com", reason: "Product not as described" }),
    }));
    expect(res.status).toBe(400);
  });

  it("returns 409 when refund already exists", async () => {
    mockSupabase.from.mockImplementation((table: string) => {
      if (table === "orders") return mockFromChain({
        id: "550e8400-e29b-41d4-a716-446655440000",
        buyer_email: "buyer@test.com",
        buyer_name: "Buyer",
        status: "paid",
        payments: [{ id: "p1", status: "completed" }],
      });
      if (table === "refunds") return mockFromChain({ id: "r1", status: "pending" });
      return rateLimitChain;
    });
    const POST = await importRefundRequest();
    const res = await POST(makeRequest("/api/refunds/request", {
      body: JSON.stringify({ orderId: "550e8400-e29b-41d4-a716-446655440000", buyerEmail: "buyer@test.com", reason: "Product not as described" }),
    }));
    expect(res.status).toBe(409);
  });

  it("creates refund request successfully", async () => {
    const createdRefund = { id: "r1", order_id: "550e8400-e29b-41d4-a716-446655440000", status: "pending" };
    let refundsCalled = 0;
    mockSupabase.from.mockImplementation((table: string) => {
      if (table === "orders") {
        return mockFromChain({
          id: "550e8400-e29b-41d4-a716-446655440000",
          buyer_email: "buyer@test.com",
          buyer_name: "Buyer",
          status: "paid",
          payments: [{ id: "p1", status: "completed" }],
        });
      }
      if (table === "refunds") {
        refundsCalled++;
        if (refundsCalled === 1) return mockFromChain(null);
        const chain = mockFromChain(createdRefund);
        chain.single.mockResolvedValue({ data: createdRefund, error: null });
        return chain;
      }
      return rateLimitChain;
    });
    const POST = await importRefundRequest();
    const res = await POST(makeRequest("/api/refunds/request", {
      body: JSON.stringify({ orderId: "550e8400-e29b-41d4-a716-446655440000", buyerEmail: "buyer@test.com", reason: "Product not as described" }),
    }));
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.refund.order_id).toBe("550e8400-e29b-41d4-a716-446655440000");
    expect(body.message).toContain("Refund request submitted");
  });
});

describe("Admin refund approval API", () => {
  async function importRefundApprove() {
    return import("@/app/api/admin/refunds/[id]/approve/route").then((m) => m.POST);
  }

  it("returns 404 when refund not found (no context passed)", async () => {
    const POST = await importRefundApprove();
    const req = makeAdminRequest("/api/admin/refunds/r1/approve", { id: "u1", email: "admin@test.com", role: "admin" }, { body: JSON.stringify({}) });
    const res = await POST(req);
    expect(res.status).toBe(404);
  });

  it("approves refund successfully", async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: "u1", email: "admin@test.com" } },
      error: null,
    });
    mockSupabase.from.mockImplementation((table: string) => {
      if (table === "users") return mockFromChain({ id: "u1", email: "admin@test.com", role: "admin", full_name: "Test User" });
      if (table === "refunds") return mockFromChain({
        id: "r1", order_id: "o1", payment_id: "p1", status: "pending",
        orders: { amount: 50000, creator_id: "c1" },
        payments: { tracking_id: "trk1", merchant_reference: "mr1" },
      });
      if (table === "admin_logs") return mockFromChain(null);
      return rateLimitChain;
    });
    mockSupabase.rpc.mockResolvedValue({ data: { id: "r1", status: "approved" }, error: null });
    const pesapalModule = await import("@/lib/pesapal");
    (pesapalModule.getPesapalTransactionStatus as ReturnType<typeof vi.fn>).mockResolvedValue({ confirmation_code: "CONF-001" });
    (pesapalModule.refundPesapalOrder as ReturnType<typeof vi.fn>).mockResolvedValue({ ok: true, message: "Refund processed", raw: {} });

    const POST = await importRefundApprove();
    const params = Promise.resolve({ id: "r1" });
    const req = new NextRequest(new URL("https://keevanstore.in/api/admin/refunds/r1/approve"), {
      method: "POST",
      headers: { "Content-Type": "application/json", origin: "https://keevanstore.in", authorization: "Bearer mock-token" },
      body: JSON.stringify({ notes: "Approved after review" }),
    });
    const res = await POST(req, { params });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.refund.status).toBe("approved");
  });
});

describe("Email process API", () => {
  async function importEmailProcess() {
    return import("@/app/api/emails/process/route").then((m) => m.POST);
  }

  it("rejects non-admin users", async () => {
    const POST = await importEmailProcess();
    const req = makeAdminRequest("/api/emails/process", { id: "u1", email: "creator@test.com", role: "creator" });
    const res = await POST(req);
    expect(res.status === 401 || res.status === 403).toBe(true);
  });

  it("returns success with zero when queue is empty", async () => {
    mockSupabase.from.mockImplementation((table: string) => {
      if (table === "email_queue") return mockFromChain([], null);
      return rateLimitChain;
    });
    setupAdminUser({ id: "u1", email: "admin@test.com", role: "admin" });
    const POST = await importEmailProcess();
    const req = makeAdminRequest("/api/emails/process", { id: "u1", email: "admin@test.com", role: "admin" });
    const res = await POST(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.processed).toBe(0);
    expect(body.failed).toBe(0);
  });
});

describe("Admin stats API", () => {
  async function importAdminStats() {
    return import("@/app/api/admin/stats/route").then((m) => m.GET);
  }

  it("rejects non-admin users", async () => {
    const GET = await importAdminStats();
    const req = makeAdminRequest("/api/admin/stats", { id: "u1", email: "creator@test.com", role: "creator" });
    const res = await GET(req);
    expect(res.status === 401 || res.status === 403).toBe(true);
  });

  it("returns stats for admin", async () => {
    mockSupabase.from.mockImplementation((table: string) => {
      if (table === "creators") return mockFromChain(null, null, 10);
      if (table === "stores") return mockFromChain(null, null, 5);
      if (table === "products") return mockFromChain(null, null, 20);
      if (table === "withdrawal_requests") return mockFromChain(null, null, 3);
      if (table === "users") return mockFromChain(null, null, 8);
      if (table === "orders") return mockFromChain([{ amount: 100, platform_fee: 10 }], null, 50);
      return rateLimitChain;
    });
    setupAdminUser({ id: "u1", email: "admin@test.com", role: "admin" });
    const GET = await importAdminStats();
    const req = makeAdminRequest("/api/admin/stats", { id: "u1", email: "admin@test.com", role: "admin" });
    const res = await GET(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.stats.totalCreators).toBe(10);
  });
});

describe("Admin audit log API", () => {
  async function importAuditLog() {
    return import("@/app/api/admin/audit-log/route").then((m) => m.GET);
  }

  it("rejects non-admin users", async () => {
    const GET = await importAuditLog();
    const req = makeAdminRequest("/api/admin/audit-log", { id: "u1", email: "creator@test.com", role: "creator" });
    const res = await GET(req);
    expect(res.status === 401 || res.status === 403).toBe(true);
  });

  it("returns audit logs for admin", async () => {
    mockSupabase.from.mockImplementation((table: string) => {
      if (table === "admin_logs") return mockFromChain([{ id: "1", action: "withdrawal.approve", admin_user_id: "u1", target_table: "withdrawals", target_id: "w1", created_at: "2026-01-01T00:00:00Z", metadata: {} }]);
      return rateLimitChain;
    });
    setupAdminUser({ id: "u1", email: "admin@test.com", role: "admin" });
    const GET = await importAuditLog();
    const req = makeAdminRequest("/api/admin/audit-log", { id: "u1", email: "admin@test.com", role: "admin" });
    const res = await GET(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.logs).toHaveLength(1);
  });

  it("supports pagination", async () => {
    mockSupabase.from.mockImplementation((table: string) => {
      if (table === "admin_logs") return mockFromChain([]);
      return rateLimitChain;
    });
    setupAdminUser({ id: "u1", email: "admin@test.com", role: "admin" });
    const GET = await importAuditLog();
    const req = makeAdminRequest("/api/admin/audit-log?page=2&limit=5", { id: "u1", email: "admin@test.com", role: "admin" });
    const res = await GET(req);
    expect(res.status).toBe(200);
  });
});
