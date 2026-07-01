import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

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
    single: vi.fn().mockResolvedValue({ data, error }),
    maybeSingle: vi.fn().mockResolvedValue({ data, error }),
    insert: vi.fn(() => ({ select: vi.fn(() => ({ single: vi.fn().mockResolvedValue({ data, error }) })) })),
    update: vi.fn(() => chain),
    delete: vi.fn(() => ({ eq: vi.fn().mockResolvedValue({ data: null, error: null }) })),
    then: (resolve: (v: unknown) => void) => {
      if (countMode) resolve({ count: customCount ?? 0, data: null, error: null });
      else resolve(resolveValue);
    },
    order: vi.fn(() => chain),
    range: vi.fn(() => chain),
    limit: vi.fn(() => chain),
    gte: vi.fn(() => chain),
    lte: vi.fn(() => chain),
    in: vi.fn(() => chain),
  };
  return chain;
}

const rateLimitChain = (() => {
  const chain = mockFromChain(null);
  chain.maybeSingle = vi.fn().mockResolvedValue({ data: { count: 5 }, error: null });
  return chain;
})();

const mockStorage = {
  from: vi.fn(() => ({
    info: vi.fn().mockResolvedValue({ data: { name: "test.pdf" }, error: null }),
    upload: vi.fn().mockResolvedValue({ data: { path: "test-path" }, error: null }),
    remove: vi.fn().mockResolvedValue({ data: null, error: null }),
    createSignedUrl: vi.fn().mockResolvedValue({ data: { signedUrl: "https://example.com/download" }, error: null }),
  })),
};

const mockSupabase = {
  rpc: vi.fn().mockResolvedValue({ data: null, error: null }),
  from: vi.fn(() => rateLimitChain),
  auth: {
    getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
    admin: { signOut: vi.fn() },
  },
  storage: mockStorage,
};

vi.mock("@/lib/supabase", () => ({
  getSupabaseAdminClient: vi.fn(() => mockSupabase),
  getSupabaseClient: vi.fn(() => mockSupabase),
}));

vi.mock("@/lib/supabase-server", () => ({
  createServerSupabaseClient: vi.fn(() => ({
    auth: { getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }) },
  })),
}));

function makeRequest(url: string, overrides: Partial<RequestInit & { headers?: Record<string, string> }> = {}): NextRequest {
  return new NextRequest(new URL(url, "https://keevanstore.in"), {
    method: overrides.method ?? "GET",
    headers: {
      "Content-Type": "application/json",
      origin: "https://keevanstore.in",
      ...(overrides.headers ?? {}),
    },
    body: overrides.body,
  });
}

function setupAuthUser(user: { id: string; email: string; role: string }) {
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

function authRequest(url: string, overrides: Partial<RequestInit & { headers?: Record<string, string> }> = {}) {
  return makeRequest(url, {
    ...overrides,
    headers: {
      authorization: "Bearer test-token",
      ...(overrides.headers ?? {}),
    },
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://keevanstore.in");
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://test.supabase.co");
  vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "test-key");
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "test-anon-key");
  mockSupabase.from.mockReturnValue(rateLimitChain);
  mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null }, error: null });
  mockSupabase.rpc.mockResolvedValue({ data: null, error: null });
});

describe("GET /api/products", () => {
  async function importHandler() {
    return import("@/app/api/products/route").then((m) => m.GET);
  }

  it("returns products array", async () => {
    mockSupabase.from.mockImplementation((table: string) => {
      if (table === "products") return mockFromChain([]);
      return rateLimitChain;
    });
    setupAuthUser({ id: "u1", email: "admin@test.com", role: "admin" });
    const GET = await importHandler();
    const req = authRequest("/api/products");
    const res = await GET(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body).toEqual({ products: [] });
  });
});

describe("POST /api/products", () => {
  async function importHandler() {
    return import("@/app/api/products/route").then((m) => m.POST);
  }

  it("rejects unauthenticated requests (401)", async () => {
    const POST = await importHandler();
    const req = makeRequest("/api/products", {
      method: "POST",
      headers: { authorization: "Bearer tok" },
      body: JSON.stringify({
        storeId: "550e8400-e29b-41d4-a716-446655440000",
        slug: "my-ebook",
        title: "My E-Book",
        description: "A great e-book about something interesting",
        price: 50000,
        filePath: "uploads/test.pdf",
        fileSize: 102400,
        fileMime: "application/pdf",
      }),
    });
    const res = await POST(req);
    expect(res.status).toBe(401);
  });
});

describe("GET /api/products/[id]", () => {
  async function importHandler() {
    return import("@/app/api/products/[id]/route").then((m) => m.GET);
  }

  it("returns 404 for unknown id", async () => {
    mockSupabase.from.mockImplementation((table: string) => {
      if (table === "products") return mockFromChain(null);
      return rateLimitChain;
    });
    setupAuthUser({ id: "u1", email: "admin@test.com", role: "admin" });
    const GET = await importHandler();
    const req = authRequest("/api/products/unknown-id");
    const params = Promise.resolve({ id: "unknown-id" });
    const res = await GET(req, { params });
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body.error.message).toBe("Product not found");
  });
});

describe("PATCH /api/products/[id]", () => {
  async function importHandler() {
    return import("@/app/api/products/[id]/route").then((m) => m.PATCH);
  }

  it("rejects unauthenticated requests (401)", async () => {
    const PATCH = await importHandler();
    const req = makeRequest("/api/products/some-id", {
      method: "PATCH",
      headers: { authorization: "Bearer tok" },
      body: JSON.stringify({ title: "Updated" }),
    });
    const params = Promise.resolve({ id: "some-id" });
    const res = await PATCH(req, { params });
    expect(res.status).toBe(401);
  });
});

describe("DELETE /api/products/[id]", () => {
  async function importHandler() {
    return import("@/app/api/products/[id]/route").then((m) => m.DELETE);
  }

  it("rejects unauthenticated requests (401)", async () => {
    const DELETE = await importHandler();
    const req = makeRequest("/api/products/some-id", {
      method: "DELETE",
      headers: { authorization: "Bearer tok" },
    });
    const params = Promise.resolve({ id: "some-id" });
    const res = await DELETE(req, { params });
    expect(res.status).toBe(401);
  });
});

describe("GET /api/buyer/download", () => {
  async function importHandler() {
    return import("@/app/api/buyer/download/route").then((m) => m.GET);
  }

  it("rejects unauthenticated requests (401)", async () => {
    const GET = await importHandler();
    const req = authRequest("/api/buyer/download?slug=my-ebook");
    const res = await GET(req);
    expect(res.status).toBe(401);
  });
});

describe("GET /api/buyer/purchases", () => {
  async function importHandler() {
    return import("@/app/api/buyer/purchases/route").then((m) => m.GET);
  }

  it("rejects unauthenticated requests (401)", async () => {
    const GET = await importHandler();
    const req = authRequest("/api/buyer/purchases");
    const res = await GET(req);
    expect(res.status).toBe(401);
  });
});

describe("GET /api/discounts/active", () => {
  async function importHandler() {
    return import("@/app/api/discounts/active/route").then((m) => m.GET);
  }

  it("returns discount data", async () => {
    const mockDiscount = {
      id: "d1",
      product_id: "p1",
      discount_percent: 20,
      is_active: true,
      starts_at: "2026-01-01T00:00:00Z",
      expires_at: "2027-01-01T00:00:00Z",
    };
    mockSupabase.from.mockImplementation((table: string) => {
      if (table === "discounts") return mockFromChain(mockDiscount);
      return rateLimitChain;
    });
    const GET = await importHandler();
    const req = makeRequest("/api/discounts/active?productId=p1");
    const res = await GET(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.discount).toEqual(mockDiscount);
  });

  it("returns null discount when no productId given", async () => {
    const GET = await importHandler();
    const req = makeRequest("/api/discounts/active");
    const res = await GET(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.discount).toBeNull();
  });
});

describe("GET /api/orders", () => {
  async function importHandler() {
    return import("@/app/api/orders/route").then((m) => m.GET);
  }

  it("returns orders for authenticated creator", async () => {
    const mockOrders = [
      { id: "o1", amount: 50000, status: "paid", products: { title: "E-Book", slug: "my-ebook" } },
    ];
    mockSupabase.from.mockImplementation((table: string) => {
      if (table === "creators") return mockFromChain({ id: "c1", user_id: "u1" });
      if (table === "orders") return mockFromChain(mockOrders);
      return rateLimitChain;
    });
    setupAuthUser({ id: "u1", email: "creator@test.com", role: "creator" });
    const GET = await importHandler();
    const req = authRequest("/api/orders");
    const res = await GET(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.orders).toHaveLength(1);
    expect(body.orders[0].id).toBe("o1");
  });
});

describe("GET /api/analytics/summary", () => {
  async function importHandler() {
    return import("@/app/api/analytics/summary/route").then((m) => m.GET);
  }

  it("returns empty summary for unauthenticated requests", async () => {
    const GET = await importHandler();
    const req = authRequest("/api/analytics/summary");
    const res = await GET(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.summary).toEqual({});
  });
});

describe("POST /api/upload", () => {
  async function importHandler() {
    return import("@/app/api/upload/route").then((m) => m.POST);
  }

  it("rejects unauthenticated requests (401)", async () => {
    const POST = await importHandler();
    const req = makeRequest("/api/upload", {
      method: "POST",
      headers: { authorization: "Bearer tok" },
    });
    const res = await POST(req);
    expect(res.status).toBe(401);
  });
});
