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
    admin: { signOut: vi.fn() },
  },
};

vi.mock("@/lib/supabase", () => ({
  getSupabaseAdminClient: vi.fn(() => mockSupabase),
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

describe("GET /api/admin/creators", () => {
  async function importCreators() {
    return import("@/app/api/admin/creators/route").then((m) => m.GET);
  }

  it("rejects non-admin users", async () => {
    const GET = await importCreators();
    const req = makeRequest("/api/admin/creators", { headers: { authorization: "Bearer tok" } });
    const res = await GET(req);
    expect(res.status === 401 || res.status === 403).toBe(true);
  });

  it("returns creators list for admin", async () => {
    mockSupabase.from.mockImplementation((table: string) => {
      if (table === "creators") {
        const chain = mockFromChain([
          { id: "c1", user_id: "u1", display_name: "Creator 1", bio: "Bio", phone: "+256700000000", available_balance: 10000, total_earnings: 50000, created_at: "2026-01-01T00:00:00Z", users: { full_name: "Full Name", email: "creator@test.com" }, stores: [{ id: "s1", slug: "my-store", name: "My Store", status: "active" }] },
        ]);
        return chain;
      }
      return rateLimitChain;
    });
    setupAdminUser({ id: "u1", email: "admin@test.com", role: "admin" });
    const GET = await importCreators();
    const req = makeRequest("/api/admin/creators", { headers: { authorization: "Bearer tok" } });
    const res = await GET(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.creators).toHaveLength(1);
    expect(body.creators[0].display_name).toBe("Creator 1");
    expect(body.creators[0].store_slug).toBe("my-store");
  });

  it("supports pagination", async () => {
    mockSupabase.from.mockImplementation((table: string) => {
      if (table === "creators") return mockFromChain([]);
      return rateLimitChain;
    });
    setupAdminUser({ id: "u1", email: "admin@test.com", role: "admin" });
    const GET = await importCreators();
    const req = makeRequest("/api/admin/creators?page=2&limit=10", { headers: { authorization: "Bearer tok" } });
    const res = await GET(req);
    expect(res.status).toBe(200);
  });
});

describe("GET /api/admin/orders", () => {
  async function importOrders() {
    return import("@/app/api/admin/orders/route").then((m) => m.GET);
  }

  it("rejects non-admin users", async () => {
    const GET = await importOrders();
    const req = makeRequest("/api/admin/orders", { headers: { authorization: "Bearer tok" } });
    const res = await GET(req);
    expect(res.status === 401 || res.status === 403).toBe(true);
  });

  it("returns orders list for admin", async () => {
    mockSupabase.from.mockImplementation((table: string) => {
      if (table === "orders") return mockFromChain([{ id: "o1", amount: 50000, status: "paid", products: { title: "E-Book", slug: "my-ebook" }, creators: { display_name: "Creator" } }]);
      return rateLimitChain;
    });
    setupAdminUser({ id: "u1", email: "admin@test.com", role: "admin" });
    const GET = await importOrders();
    const req = makeRequest("/api/admin/orders", { headers: { authorization: "Bearer tok" } });
    const res = await GET(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.orders).toHaveLength(1);
  });

  it("filters by status", async () => {
    mockSupabase.from.mockImplementation((table: string) => {
      if (table === "orders") return mockFromChain([]);
      return rateLimitChain;
    });
    setupAdminUser({ id: "u1", email: "admin@test.com", role: "admin" });
    const GET = await importOrders();
    const req = makeRequest("/api/admin/orders?status=paid", { headers: { authorization: "Bearer tok" } });
    const res = await GET(req);
    expect(res.status).toBe(200);
  });
});

describe("GET /api/admin/refunds", () => {
  async function importRefunds() {
    return import("@/app/api/admin/refunds/route").then((m) => m.GET);
  }

  it("rejects non-admin users", async () => {
    const GET = await importRefunds();
    const req = makeRequest("/api/admin/refunds", { headers: { authorization: "Bearer tok" } });
    const res = await GET(req);
    expect(res.status === 401 || res.status === 403).toBe(true);
  });

  it("returns refunds list for admin", async () => {
    mockSupabase.from.mockImplementation((table: string) => {
      if (table === "refunds") return mockFromChain([{ id: "r1", status: "pending", orders: { amount: 50000, products: { title: "E-Book" } }, admin_users: null }]);
      return rateLimitChain;
    });
    setupAdminUser({ id: "u1", email: "admin@test.com", role: "admin" });
    const GET = await importRefunds();
    const req = makeRequest("/api/admin/refunds", { headers: { authorization: "Bearer tok" } });
    const res = await GET(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.refunds).toHaveLength(1);
  });
});

describe("GET /api/admin/withdrawals", () => {
  async function importWithdrawals() {
    return import("@/app/api/admin/withdrawals/route").then((m) => m.GET);
  }

  it("rejects non-admin users", async () => {
    const GET = await importWithdrawals();
    const req = makeRequest("/api/admin/withdrawals", { headers: { authorization: "Bearer tok" } });
    const res = await GET(req);
    expect(res.status === 401 || res.status === 403).toBe(true);
  });

  it("returns withdrawals list for admin", async () => {
    mockSupabase.from.mockImplementation((table: string) => {
      if (table === "withdrawal_requests") return mockFromChain([{ id: "w1", amount: 100000, status: "pending", creators: { display_name: "Creator", users: { email: "creator@test.com" } } }]);
      return rateLimitChain;
    });
    setupAdminUser({ id: "u1", email: "admin@test.com", role: "admin" });
    const GET = await importWithdrawals();
    const req = makeRequest("/api/admin/withdrawals", { headers: { authorization: "Bearer tok" } });
    const res = await GET(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.withdrawals).toHaveLength(1);
  });
});

describe("GET /api/admin/audit-log", () => {
  // Tests already exist in api-integration.test.ts - adding edge cases
  async function importAuditLog() {
    return import("@/app/api/admin/audit-log/route").then((m) => m.GET);
  }

  it("filters by action and targetTable", async () => {
    mockSupabase.from.mockImplementation((table: string) => {
      if (table === "admin_logs") return mockFromChain([{ id: "1", action: "withdrawal.approve", admin_user_id: "u1", target_table: "withdrawals", target_id: "w1", created_at: "2026-01-01T00:00:00Z", metadata: {}, users: { full_name: "Admin", email: "admin@test.com" } }]);
      return rateLimitChain;
    });
    setupAdminUser({ id: "u1", email: "admin@test.com", role: "admin" });
    const GET = await importAuditLog();
    const req = makeRequest("/api/admin/audit-log?action=withdrawal.approve&targetTable=withdrawals", { headers: { authorization: "Bearer tok" } });
    const res = await GET(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.logs[0].action).toBe("withdrawal.approve");
  });
});

describe("POST /api/admin/stores/[id]/suspend and reactivate", () => {
  async function importSuspend() {
    return import("@/app/api/admin/stores/[id]/suspend/route").then((m) => m.POST);
  }
  async function importReactivate() {
    return import("@/app/api/admin/stores/[id]/reactivate/route").then((m) => m.POST);
  }

  it("suspends a store", async () => {
    mockSupabase.from.mockImplementation((table: string) => {
      if (table === "stores") return mockFromChain({ id: "s1", status: "suspended" });
      return rateLimitChain;
    });
    setupAdminUser({ id: "u1", email: "admin@test.com", role: "admin" });
    const POST = await importSuspend();
    const params = Promise.resolve({ id: "s1" });
    const req = new NextRequest(new URL("https://keevanstore.in/api/admin/stores/s1/suspend"), {
      method: "POST",
      headers: { "Content-Type": "application/json", origin: "https://keevanstore.in", authorization: "Bearer tok" },
    });
    const res = await POST(req, { params });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.store.status).toBe("suspended");
  });

  it("reactivates a store", async () => {
    mockSupabase.from.mockImplementation((table: string) => {
      if (table === "stores") return mockFromChain({ id: "s1", status: "active" });
      return rateLimitChain;
    });
    setupAdminUser({ id: "u1", email: "admin@test.com", role: "admin" });
    const POST = await importReactivate();
    const params = Promise.resolve({ id: "s1" });
    const req = new NextRequest(new URL("https://keevanstore.in/api/admin/stores/s1/reactivate"), {
      method: "POST",
      headers: { "Content-Type": "application/json", origin: "https://keevanstore.in", authorization: "Bearer tok" },
    });
    const res = await POST(req, { params });
    expect(res.status).toBe(200);
    expect((await res.json()).store.status).toBe("active");
  });

  it("rejects non-admin for suspend", async () => {
    const POST = await importSuspend();
    const params = Promise.resolve({ id: "s1" });
    const req = makeRequest("/api/admin/stores/s1/suspend", { method: "POST", headers: { authorization: "Bearer tok" } });
    const res = await POST(req, { params });
    expect(res.status === 401 || res.status === 403).toBe(true);
  });
});

describe("POST /api/admin/products/[id]/disable and reactivate", () => {
  async function importDisable() {
    return import("@/app/api/admin/products/[id]/disable/route").then((m) => m.POST);
  }
  async function importReactivate() {
    return import("@/app/api/admin/products/[id]/reactivate/route").then((m) => m.POST);
  }

  it("disables a product", async () => {
    mockSupabase.from.mockImplementation((table: string) => {
      if (table === "products") return mockFromChain({ id: "p1", status: "disabled" });
      return rateLimitChain;
    });
    setupAdminUser({ id: "u1", email: "admin@test.com", role: "admin" });
    const POST = await importDisable();
    const params = Promise.resolve({ id: "p1" });
    const req = new NextRequest(new URL("https://keevanstore.in/api/admin/products/p1/disable"), {
      method: "POST",
      headers: { "Content-Type": "application/json", origin: "https://keevanstore.in", authorization: "Bearer tok" },
    });
    const res = await POST(req, { params });
    expect(res.status).toBe(200);
    expect((await res.json()).product.status).toBe("disabled");
  });

  it("reactivates a product", async () => {
    mockSupabase.from.mockImplementation((table: string) => {
      if (table === "products") return mockFromChain({ id: "p1", status: "published" });
      return rateLimitChain;
    });
    setupAdminUser({ id: "u1", email: "admin@test.com", role: "admin" });
    const POST = await importReactivate();
    const params = Promise.resolve({ id: "p1" });
    const req = new NextRequest(new URL("https://keevanstore.in/api/admin/products/p1/reactivate"), {
      method: "POST",
      headers: { "Content-Type": "application/json", origin: "https://keevanstore.in", authorization: "Bearer tok" },
    });
    const res = await POST(req, { params });
    expect(res.status).toBe(200);
    expect((await res.json()).product.status).toBe("published");
  });
});

describe("POST /api/admin/withdrawals/[id]/approve, reject, mark-paid", () => {
  async function importApprove() {
    return import("@/app/api/admin/withdrawals/[id]/approve/route").then((m) => m.POST);
  }
  async function importReject() {
    return import("@/app/api/admin/withdrawals/[id]/reject/route").then((m) => m.POST);
  }
  async function importMarkPaid() {
    return import("@/app/api/admin/withdrawals/[id]/mark-paid/route").then((m) => m.POST);
  }

  const reqOptions = {
    method: "POST" as const,
    headers: { "Content-Type": "application/json", origin: "https://keevanstore.in", authorization: "Bearer tok" },
    body: JSON.stringify({ notes: "Processed" }),
  };

  it("approves a withdrawal", async () => {
    mockSupabase.rpc.mockResolvedValue({ data: [{ id: "w1", status: "approved" }], error: null });
    setupAdminUser({ id: "u1", email: "admin@test.com", role: "admin" });
    const POST = await importApprove();
    const params = Promise.resolve({ id: "w1" });
    const req = new NextRequest(new URL("https://keevanstore.in/api/admin/withdrawals/w1/approve"), reqOptions);
    const res = await POST(req, { params });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.withdrawal.status).toBe("approved");
  });

  it("rejects a withdrawal", async () => {
    mockSupabase.rpc.mockResolvedValue({ data: [{ id: "w1", status: "rejected" }], error: null });
    setupAdminUser({ id: "u1", email: "admin@test.com", role: "admin" });
    const POST = await importReject();
    const params = Promise.resolve({ id: "w1" });
    const req = new NextRequest(new URL("https://keevanstore.in/api/admin/withdrawals/w1/reject"), reqOptions);
    const res = await POST(req, { params });
    expect(res.status).toBe(200);
    expect((await res.json()).withdrawal.status).toBe("rejected");
  });

  it("marks a withdrawal as paid", async () => {
    mockSupabase.rpc.mockResolvedValue({ data: [{ id: "w1", status: "paid" }], error: null });
    setupAdminUser({ id: "u1", email: "admin@test.com", role: "admin" });
    const POST = await importMarkPaid();
    const params = Promise.resolve({ id: "w1" });
    const req = new NextRequest(new URL("https://keevanstore.in/api/admin/withdrawals/w1/mark-paid"), reqOptions);
    const res = await POST(req, { params });
    expect(res.status).toBe(200);
    expect((await res.json()).withdrawal.status).toBe("paid");
  });

  it("returns 400 when RPC fails", async () => {
    mockSupabase.rpc.mockResolvedValue({ data: null, error: new Error("Invalid transition") });
    setupAdminUser({ id: "u1", email: "admin@test.com", role: "admin" });
    const POST = await importApprove();
    const params = Promise.resolve({ id: "w1" });
    const req = new NextRequest(new URL("https://keevanstore.in/api/admin/withdrawals/w1/approve"), reqOptions);
    const res = await POST(req, { params });
    expect(res.status).toBe(400);
  });
});

describe("POST /api/admin/refunds/[id]/reject", () => {
  async function importReject() {
    return import("@/app/api/admin/refunds/[id]/reject/route").then((m) => m.POST);
  }

  it("rejects a refund", async () => {
    mockSupabase.rpc.mockResolvedValue({ data: { id: "r1", status: "rejected" }, error: null });
    setupAdminUser({ id: "u1", email: "admin@test.com", role: "admin" });
    const POST = await importReject();
    const params = Promise.resolve({ id: "r1" });
    const req = new NextRequest(new URL("https://keevanstore.in/api/admin/refunds/r1/reject"), {
      method: "POST",
      headers: { "Content-Type": "application/json", origin: "https://keevanstore.in", authorization: "Bearer tok" },
      body: JSON.stringify({ notes: "Not eligible" }),
    });
    const res = await POST(req, { params });
    expect(res.status).toBe(200);
    expect((await res.json()).refund.status).toBe("rejected");
  });

  it("returns 400 when RPC fails", async () => {
    mockSupabase.rpc.mockResolvedValue({ data: null, error: new Error("Already processed") });
    setupAdminUser({ id: "u1", email: "admin@test.com", role: "admin" });
    const POST = await importReject();
    const params = Promise.resolve({ id: "r1" });
    const req = new NextRequest(new URL("https://keevanstore.in/api/admin/refunds/r1/reject"), {
      method: "POST",
      headers: { "Content-Type": "application/json", origin: "https://keevanstore.in", authorization: "Bearer tok" },
      body: JSON.stringify({}),
    });
    const res = await POST(req, { params });
    expect(res.status).toBe(400);
  });
});
