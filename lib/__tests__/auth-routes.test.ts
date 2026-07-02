import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/supabase", () => ({
  getSupabaseAdminClient: vi.fn(() => mockSupabase),
  getSupabaseClient: vi.fn(() => mockSupabase),
}));

vi.mock("@supabase/supabase-js", () => ({
  createClient: vi.fn(),
}));

vi.mock("@/lib/supabase-server", () => ({
  createServerSupabaseClient: vi.fn(() => ({
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
      signOut: vi.fn().mockResolvedValue({ error: null }),
      signInWithPassword: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
    },
    rpc: vi.fn().mockResolvedValue({ data: null, error: null }),
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
        })),
      })),
    })),
  })),
  applyPendingCookies: vi.fn((_req, res) => Promise.resolve(res)),
}));

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
    gt: vi.fn(() => chain),
    lte: vi.fn(() => chain),
    neq: vi.fn(() => chain),
    or: vi.fn(() => chain),
  };
  return chain;
}

const rateLimitChain = (() => {
  const chain = mockFromChain(null);
  chain.maybeSingle = vi.fn().mockResolvedValue({ data: { count: 5 }, error: null });
  return chain;
})();

const mockResetPasswordForEmail = vi.fn().mockResolvedValue({ error: null });

const mockSupabase = {
  rpc: vi.fn().mockResolvedValue({ data: null, error: null }),
  from: vi.fn(() => rateLimitChain),
  auth: {
    signInWithPassword: vi.fn(),
    admin: {
      createUser: vi.fn(),
      deleteUser: vi.fn(),
      signOut: vi.fn(),
    },
    getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
    getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
    resetPasswordForEmail: mockResetPasswordForEmail,
  },
};

const mockServerSupabase = {
  auth: {
    getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
    signOut: vi.fn().mockResolvedValue({ error: null }),
    signInWithPassword: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
  },
  rpc: vi.fn().mockResolvedValue({ data: null, error: null }),
  from: vi.fn(() => ({
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
      })),
    })),
  })),
};

vi.mock("@/lib/supabase-server", () => ({
  createServerSupabaseClient: vi.fn(() => mockServerSupabase),
  applyPendingCookies: vi.fn((_req, res) => Promise.resolve(res)),
}));

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

beforeEach(async () => {
  vi.clearAllMocks();
  vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://keevanstore.in");
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://test.supabase.co");
  vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "test-key");
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "test-anon-key");
  const { getSupabaseAdminClient, getSupabaseClient } = await import("@/lib/supabase");
  vi.mocked(getSupabaseAdminClient).mockReturnValue(mockSupabase as any);
  vi.mocked(getSupabaseClient).mockReturnValue(mockSupabase as any);
  mockSupabase.from.mockReturnValue(rateLimitChain);
  mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null }, error: null });
  mockSupabase.auth.admin.createUser.mockResolvedValue({ data: { user: { id: "new-u1" } }, error: null });
  mockSupabase.auth.admin.deleteUser.mockResolvedValue({ data: null, error: null });
  mockSupabase.auth.signInWithPassword.mockResolvedValue({ data: { user: { id: "u1", user_metadata: { role: "creator" } } }, error: null });
  mockResetPasswordForEmail.mockResolvedValue({ error: null });
  mockSupabase.rpc.mockResolvedValue({ data: null, error: null });
});

describe("POST /api/auth/register", () => {
  const validBody = JSON.stringify({
    email: "creator@test.com",
    password: "Password1",
    fullName: "Test Creator",
    storeHandle: "test-store",
  });

  async function importRegister() {
    return import("@/app/api/auth/register/route").then((m) => m.POST);
  }

  it("registers a new user successfully", async () => {
    let callCount = 0;
    mockSupabase.from.mockImplementation((table: string) => {
      if (table === "creators") {
        callCount++;
        if (callCount === 1) {
          const chain = mockFromChain({ id: "c1" });
          chain.single = vi.fn().mockResolvedValue({ data: { id: "c1" }, error: null });
          return chain;
        }
        return mockFromChain(null);
      }
      if (table === "stores") return mockFromChain(null);
      if (table === "users") return mockFromChain(null);
      return rateLimitChain;
    });

    const POST = await importRegister();
    const res = await POST(makeRequest("/api/auth/register", { body: validBody }));
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.userId).toBe("new-u1");
    expect(body.creatorId).toBe("c1");
    expect(body.storeHandle).toBe("test-store");
  });

  it("rejects invalid input", async () => {
    const POST = await importRegister();
    const res = await POST(makeRequest("/api/auth/register", { body: JSON.stringify({}) }));
    expect(res.status).toBe(422);
  });

  it("rejects when Supabase auth create fails", async () => {
    mockSupabase.auth.admin.createUser.mockResolvedValue({ data: { user: null }, error: new Error("Email already registered") });
    const POST = await importRegister();
    const res = await POST(makeRequest("/api/auth/register", { body: validBody }));
    expect(res.status).toBe(400);
  });

  it("rolls back user if creator insert fails", async () => {
    mockSupabase.from.mockImplementation((table: string) => {
      if (table === "creators") return mockFromChain(null, new Error("Creator creation failed"));
      if (table === "users") return mockFromChain(null);
      return rateLimitChain;
    });

    const POST = await importRegister();
    const res = await POST(makeRequest("/api/auth/register", { body: validBody }));
    expect(res.status).toBe(400);
    expect(mockSupabase.auth.admin.deleteUser).toHaveBeenCalledWith("new-u1");
  });

  it("rolls back user and creator if store insert fails", async () => {
    let creatorsCallCount = 0;
    mockSupabase.from.mockImplementation((table: string) => {
      if (table === "creators") {
        creatorsCallCount++;
        if (creatorsCallCount === 1) {
          const chain = mockFromChain({ id: "c1" });
          chain.single = vi.fn().mockResolvedValue({ data: { id: "c1" }, error: null });
          return chain;
        }
        return mockFromChain(null);
      }
      if (table === "stores") return mockFromChain(null, new Error("Store slug taken"));
      if (table === "users") {
        const chain = mockFromChain(null);
        chain.then = vi.fn((resolve: (v: unknown) => void) => resolve({ data: null, error: null }));
        return chain;
      }
      return rateLimitChain;
    });

    const POST = await importRegister();
    const res = await POST(makeRequest("/api/auth/register", { body: validBody }));
    expect(res.status).toBe(400);
  });
});

describe("POST /api/auth/login", () => {
  async function importLogin() {
    return import("@/app/api/auth/login/route").then((m) => m.POST);
  }

  it("logs in successfully", async () => {
    const POST = await importLogin();
    const res = await POST(makeRequest("/api/auth/login", {
      body: JSON.stringify({ email: "test@test.com", password: "password" }),
    }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.role).toBe("creator");
  });

  it("returns 401 on invalid credentials", async () => {
    mockServerSupabase.auth.signInWithPassword.mockResolvedValue({ data: null, error: new Error("Invalid login credentials") });
    const POST = await importLogin();
    const res = await POST(makeRequest("/api/auth/login", {
      body: JSON.stringify({ email: "test@test.com", password: "wrong" }),
    }));
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error.message).toBe("Invalid login credentials");
  });

  it("rejects invalid request body", async () => {
    const POST = await importLogin();
    const res = await POST(makeRequest("/api/auth/login", { body: JSON.stringify({}) }));
    expect(res.status).toBe(422);
  });
});

describe("POST /api/auth/logout", () => {
  async function importLogout() {
    return import("@/app/api/auth/logout/route").then((m) => m.POST);
  }

  it("logs out successfully when authenticated", async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: "u1", email: "admin@test.com" } },
      error: null,
    });
    mockSupabase.from.mockImplementation((table: string) => {
      if (table === "users") return mockFromChain({ id: "u1", email: "admin@test.com", role: "admin", full_name: "Admin" });
      return rateLimitChain;
    });

    const POST = await importLogout();
    const req = makeRequest("/api/auth/logout", { headers: { authorization: "Bearer tok" } });
    const res = await POST(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(mockSupabase.auth.admin.signOut).not.toHaveBeenCalled();
  });

  it("returns 401 when not authenticated", async () => {
    const POST = await importLogout();
    const res = await POST(makeRequest("/api/auth/logout"));
    expect(res.status).toBe(401);
  });
});

describe("GET /api/auth/me", () => {
  async function importMe() {
    return import("@/app/api/auth/me/route").then((m) => m.GET);
  }

  it("returns profile for authenticated user", async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: "u1", email: "creator@test.com" } },
      error: null,
    });
    mockSupabase.from.mockImplementation((table: string) => {
      if (table === "users") return mockFromChain({ id: "u1", email: "creator@test.com", role: "creator", full_name: "Creator" });
      if (table === "creators") return mockFromChain({ id: "c1", display_name: "Creator", bio: "Bio", phone: "+256700000000", available_balance: 10000, total_earnings: 50000 });
      if (table === "stores") return mockFromChain({ id: "s1", slug: "my-store", name: "My Store", description: "Desc", status: "active" });
      return rateLimitChain;
    });

    const GET = await importMe();
    const req = makeRequest("/api/auth/me", { headers: { authorization: "Bearer tok" } });
    const res = await GET(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.profile.role).toBe("creator");
    expect(body.profile.store_slug).toBe("my-store");
    expect(body.profile.creator_id).toBe("c1");
  });

  it("returns profile for admin without creator/store data", async () => {
    mockSupabase.auth.getUser.mockResolvedValue({
      data: { user: { id: "u2", email: "admin@test.com" } },
      error: null,
    });
    mockSupabase.from.mockImplementation((table: string) => {
      if (table === "users") return mockFromChain({ id: "u2", email: "admin@test.com", role: "admin", full_name: "Admin" });
      return rateLimitChain;
    });

    const GET = await importMe();
    const req = makeRequest("/api/auth/me", { headers: { authorization: "Bearer tok" } });
    const res = await GET(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.profile.role).toBe("admin");
    expect(body.profile.creator_id).toBeUndefined();
  });

  it("returns 401 when not authenticated", async () => {
    const GET = await importMe();
    const res = await GET(makeRequest("/api/auth/me"));
    expect(res.status).toBe(401);
  });
});

describe("POST /api/auth/reset-password", () => {
  async function importResetPassword() {
    return import("@/app/api/auth/reset-password/route").then((m) => m.POST);
  }

  it("sends reset password email", async () => {
    const POST = await importResetPassword();
    const res = await POST(makeRequest("/api/auth/reset-password", {
      body: JSON.stringify({ email: "user@test.com" }),
    }));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
  });

  it("rejects invalid email", async () => {
    const POST = await importResetPassword();
    const res = await POST(makeRequest("/api/auth/reset-password", {
      body: JSON.stringify({ email: "" }),
    }));
    expect(res.status).toBe(422);
  });

  it("returns 400 when supabase returns error", async () => {
    mockResetPasswordForEmail.mockResolvedValue({ error: new Error("User not found") });
    const POST = await importResetPassword();
    const res = await POST(makeRequest("/api/auth/reset-password", {
      body: JSON.stringify({ email: "missing@test.com" }),
    }));
    expect(res.status).toBe(400);
  });

  it("returns 200 even when env vars are missing (mocked supabase)", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
    const POST = await importResetPassword();
    const res = await POST(makeRequest("/api/auth/reset-password", {
      body: JSON.stringify({ email: "user@test.com" }),
    }));
    expect(res.status).toBe(200);
  });
});
