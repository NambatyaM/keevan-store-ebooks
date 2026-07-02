import { describe, it, expect, vi, beforeEach } from "vitest";

const mockSupabase = {
  rpc: vi.fn(),
  from: vi.fn(),
  auth: { getUser: vi.fn() },
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

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://keevanstore.in");
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://test.supabase.co");
  vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "test-key");
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "test-anon-key");
});

describe("rate_limit_check_and_increment RPC", () => {
  it("is called with correct parameters by the rateLimit function", async () => {
    mockSupabase.rpc.mockResolvedValue({ data: null, error: null });

    const { rateLimit } = await import("@/lib/api");
    const req = new (await import("next/server")).NextRequest(
      new URL("https://keevanstore.in/api/test"),
      { headers: { "x-forwarded-for": "192.168.1.1" } }
    );

    await rateLimit(req, 120, 60);

    expect(mockSupabase.rpc).toHaveBeenCalledWith("rate_limit_check_and_increment", {
      p_key: "192.168.1.1",
      p_window_start: expect.any(String),
      p_max_requests: 120,
      p_window_seconds: 60,
    });
  });

  it("falls back to x-real-ip when x-forwarded-for is absent", async () => {
    mockSupabase.rpc.mockResolvedValue({ data: null, error: null });

    const { rateLimit } = await import("@/lib/api");
    const req = new (await import("next/server")).NextRequest(
      new URL("https://keevanstore.in/api/test"),
      { headers: { "x-real-ip": "10.0.0.1" } }
    );

    await rateLimit(req, 120, 60);

    expect(mockSupabase.rpc).toHaveBeenCalledWith("rate_limit_check_and_increment", {
      p_key: "10.0.0.1",
      p_window_start: expect.any(String),
      p_max_requests: 120,
      p_window_seconds: 60,
    });
  });

  it("uses 'local' when no IP headers are present", async () => {
    mockSupabase.rpc.mockResolvedValue({ data: null, error: null });

    const { rateLimit } = await import("@/lib/api");
    const req = new (await import("next/server")).NextRequest(
      new URL("https://keevanstore.in/api/test")
    );

    await rateLimit(req, 120, 60);

    expect(mockSupabase.rpc).toHaveBeenCalledWith("rate_limit_check_and_increment", {
      p_key: "local",
      p_window_start: expect.any(String),
      p_max_requests: 120,
      p_window_seconds: 60,
    });
  });
});

describe("process_refund RPC", () => {
  it("is called with correct parameters from approve endpoint", async () => {
    const chain: Record<string, ReturnType<typeof vi.fn>> = {
      select: vi.fn(),
      eq: vi.fn(),
      single: vi.fn(),
      insert: vi.fn(),
      update: vi.fn(),
    };
    chain.select.mockReturnValue(chain);
    chain.eq.mockReturnValue(chain);
    chain.single.mockResolvedValue({
      data: {
        id: "r1", role: "admin", order_id: "o1", payment_id: "p1", status: "pending",
        orders: { amount: 50000, creator_id: "c1" },
        payments: { tracking_id: "trk1", merchant_reference: "mr1" },
      },
      error: null,
    });
    chain.insert.mockResolvedValue({ data: null, error: null });
    chain.update.mockReturnValue({ eq: vi.fn().mockResolvedValue({ data: null, error: null }) });
    mockSupabase.from.mockReturnValue(chain);
    mockSupabase.rpc.mockResolvedValue({ data: { id: "r1", status: "approved" }, error: null });
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: "admin-u1", email: "admin@test.com" } },
      error: null,
    });

    const pesapalModule = await import("@/lib/pesapal");
    pesapalModule.getPesapalTransactionStatus.mockResolvedValue({ confirmation_code: "CONF-001" });
    pesapalModule.refundPesapalOrder.mockResolvedValue({ ok: true, message: "ok", raw: {} });

    const POST = (await import("@/app/api/admin/refunds/[id]/approve/route")).POST;
    const { NextRequest } = await import("next/server");

    const req = new NextRequest(
      new URL("https://keevanstore.in/api/admin/refunds/r1/approve"),
      {
        method: "POST",
        headers: { "Content-Type": "application/json", origin: "https://keevanstore.in", authorization: "Bearer mock-token" },
        body: JSON.stringify({ notes: "Approved" }),
      }
    );

    await POST(req, { params: Promise.resolve({ id: "r1" }) });

    expect(mockSupabase.rpc).toHaveBeenCalledWith("process_refund", {
      p_refund_id: "r1",
      p_admin_user_id: "admin-u1",
      p_decision: "approved",
      p_admin_note: "Approved",
    });
  });
});

describe("admin_log insert RPC (via logAdminAction)", () => {
  it("inserts correct structure via logAdminAction", async () => {
    const chain = {
      insert: vi.fn().mockResolvedValue({ data: null, error: null }),
    };
    mockSupabase.from.mockReturnValue(chain);

    const { logAdminAction } = await import("@/lib/api");
    await logAdminAction({
      adminUserId: "u1",
      action: "refund.approve",
      targetTable: "refunds",
      targetId: "r1",
      metadata: { amount: 50000 },
    });

    expect(mockSupabase.from).toHaveBeenCalledWith("admin_logs");
    expect(chain.insert).toHaveBeenCalledWith({
      admin_user_id: "u1",
      action: "refund.approve",
      target_table: "refunds",
      target_id: "r1",
      metadata: { amount: 50000 },
    });
  });
});

describe("is_admin RPC patterns", () => {
  it("requireAdmin uses users table role check", async () => {
    const chain = {
      select: vi.fn(),
      eq: vi.fn(),
      single: vi.fn(),
    };
    chain.select.mockReturnValue(chain);
    chain.eq.mockReturnValue(chain);
    chain.single.mockResolvedValue({
      data: { id: "u1", email: "admin@test.com", role: "admin", full_name: "Admin" },
      error: null,
    });
    mockSupabase.from.mockReturnValue(chain);
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: "u1", email: "admin@test.com" } },
      error: null,
    });

    const { requireAdmin } = await import("@/lib/api");
    const { NextRequest } = await import("next/server");
    const req = new NextRequest(
      new URL("https://keevanstore.in/api/admin/test"),
      { headers: { origin: "https://keevanstore.in", authorization: "Bearer mock-token" } }
    );

    const session = await requireAdmin(req);
    expect(session.profile.role).toBe("admin");
  });
});
