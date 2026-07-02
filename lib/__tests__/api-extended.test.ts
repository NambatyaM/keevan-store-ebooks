import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { z } from "zod";

function mockFromChain(data: unknown, error: unknown = null) {
  const eq = vi.fn(() => chain);
  const resolveValue = { data, error };
  const chain = {
    select: vi.fn(() => chain),
    eq,
    single: vi.fn().mockResolvedValue({ data, error }),
    maybeSingle: vi.fn().mockResolvedValue({ data, error }),
    insert: vi.fn(() => ({ select: vi.fn(() => ({ single: vi.fn().mockResolvedValue({ data, error }) })) })),
    update: vi.fn(() => ({ eq: vi.fn().mockResolvedValue({ data: null, error: null }) })),
    delete: vi.fn(() => ({ eq: vi.fn().mockResolvedValue({ data: null, error: null }) })),
    then: (resolve: (v: unknown) => void) => resolve(resolveValue),
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
  auth: {
    getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
    getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
  },
};

vi.mock("@/lib/supabase", () => ({
  getSupabaseAdminClient: vi.fn(() => mockSupabase),
  getOptionalSupabaseAdminClient: vi.fn(() => null),
}));

vi.mock("@/lib/supabase-server", () => ({
  createServerSupabaseClient: vi.fn(() => ({
    auth: { getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }) },
  })),
  applyPendingCookies: vi.fn((r) => Promise.resolve(r)),
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
  mockSupabase.auth.getSession.mockResolvedValue({ data: { session: null }, error: null });
  mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null }, error: null });
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

describe("readJson", () => {
  const testSchema = z.object({ name: z.string() });

  it("parses valid JSON body against schema", async () => {
    const { readJson } = await import("@/lib/api");
    const req = makeRequest("/api/test", { body: JSON.stringify({ name: "test" }) });
    const result = await readJson(req, testSchema);
    expect(result).toEqual({ name: "test" });
  });

  it("throws 422 on validation failure", async () => {
    const { readJson } = await import("@/lib/api");
    const req = makeRequest("/api/test", { body: JSON.stringify({ name: 123 }) });
    await expect(readJson(req, testSchema)).rejects.toMatchObject({
      message: "Validation failed",
      status: 422,
    });
  });

  it("throws 400 on invalid JSON", async () => {
    const { readJson } = await import("@/lib/api");
    const req = makeRequest("/api/test", { body: "not-json" });
    await expect(readJson(req, testSchema)).rejects.toMatchObject({
      message: "Invalid JSON body",
      status: 400,
    });
  });
});

describe("requireUser", () => {
  it("rejects unauthenticated requests", async () => {
    const { requireUser } = await import("@/lib/api");
    await expect(requireUser(makeRequest("/api/test"))).rejects.toThrow("Authentication required");
  });

  it("rejects when user profile not found", async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: "u1", email: "test@test.com" } },
      error: null,
    });
    mockSupabase.from.mockImplementation((table: string) => {
      if (table === "users") return mockFromChain(null, new Error("Not found"));
      return rateLimitChain;
    });

    const { requireUser } = await import("@/lib/api");
    const req = makeRequest("/api/test", { headers: { authorization: "Bearer tok" } });
    await expect(requireUser(req)).rejects.toThrow("User profile not found");
  });

  it("returns session for authenticated user", async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: "u1", email: "test@test.com" } },
      error: null,
    });
    mockSupabase.from.mockImplementation((table: string) => {
      if (table === "users") return mockFromChain({ id: "u1", email: "test@test.com", role: "creator", full_name: "Test" });
      return rateLimitChain;
    });

    const { requireUser } = await import("@/lib/api");
    const req = makeRequest("/api/test", { headers: { authorization: "Bearer tok" } });
    const session = await requireUser(req);
    expect(session.profile.role).toBe("creator");
    expect(session.authUser.email).toBe("test@test.com");
  });

  it("falls back to cookie auth when no bearer token", async () => {
    const mockGetUser = vi.fn().mockResolvedValue({
      data: { user: { id: "u2", email: "cookie@test.com" } },
      error: null,
    });

    const supabaseServerModule = await import("@/lib/supabase-server");
    (supabaseServerModule.createServerSupabaseClient as ReturnType<typeof vi.fn>).mockReturnValue({
      auth: { getUser: mockGetUser },
    });

    mockSupabase.from.mockImplementation((table: string) => {
      if (table === "users") return mockFromChain({ id: "u2", email: "cookie@test.com", role: "admin", full_name: "Cookie" });
      return rateLimitChain;
    });

    const { requireUser } = await import("@/lib/api");
    const req = makeRequest("/api/test");
    const session = await requireUser(req);
    expect(session.profile.role).toBe("admin");
  });
});

describe("requireAdmin", () => {
  it("rejects non-admin role", async () => {
    setupAdminUser({ id: "u1", email: "creator@test.com", role: "creator" });
    const { requireAdmin } = await import("@/lib/api");
    const req = makeRequest("/api/admin/test", { headers: { authorization: "Bearer tok" } });
    await expect(requireAdmin(req)).rejects.toThrow("Admin access required");
  });

  it("returns session for admin", async () => {
    setupAdminUser({ id: "u1", email: "admin@test.com", role: "admin" });
    const { requireAdmin } = await import("@/lib/api");
    const req = makeRequest("/api/admin/test", { headers: { authorization: "Bearer tok" } });
    const session = await requireAdmin(req);
    expect(session.profile.role).toBe("admin");
  });
});

describe("logAdminAction", () => {
  it("inserts a row in admin_logs", async () => {
    const { logAdminAction } = await import("@/lib/api");
    await logAdminAction({
      adminUserId: "u1",
      action: "test.action",
      targetTable: "test_table",
      targetId: "t1",
      metadata: { key: "value" },
    });

    expect(mockSupabase.from).toHaveBeenCalledWith("admin_logs");
    expect(mockSupabase.from("admin_logs").insert).toHaveBeenCalledWith({
      admin_user_id: "u1",
      action: "test.action",
      target_table: "test_table",
      target_id: "t1",
      metadata: { key: "value" },
    });
  });

  it("works without optional targetId and metadata", async () => {
    const { logAdminAction } = await import("@/lib/api");
    await logAdminAction({
      adminUserId: "u1",
      action: "test.action",
      targetTable: "test_table",
    });

    expect(mockSupabase.from("admin_logs").insert).toHaveBeenCalledWith({
      admin_user_id: "u1",
      action: "test.action",
      target_table: "test_table",
      target_id: undefined,
      metadata: {},
    });
  });
});

describe("apiError", () => {
  it("returns a JSON response with error details", async () => {
    const { apiError } = await import("@/lib/api");
    const res = apiError("Something went wrong", 400, { field: "name" });
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error.message).toBe("Something went wrong");
    expect(body.error.details).toEqual({ field: "name" });
  });
});

describe("json helper", () => {
  it("returns a JSON response", async () => {
    const { json } = await import("@/lib/api");
    const res = json({ ok: true }, { status: 201 });
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body).toEqual({ ok: true });
  });
});
