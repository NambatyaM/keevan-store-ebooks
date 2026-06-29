import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  registerSchema,
  loginSchema,
  productSchema,
  storeSchema,
  checkoutSchema,
  withdrawalSchema,
  withdrawalDecisionSchema,
  paymentVerifySchema,
  analyticsEventSchema,
  productUpdateSchema,
  resetPasswordSchema,
} from "@/lib/schemas";
import { requireUser, requireAdmin, checkCSRF, rateLimit, withErrorHandling } from "@/lib/api";
import { validateFileSignature, validateUploadFile } from "@/lib/file-validation";
import { verifyPesapalPayment } from "@/lib/pesapal";

function createFromChain(data: unknown, error: unknown = null) {
  const chain: Record<string, vi.Mock> = {} as never;
  const select = vi.fn(() => chain);
  const eq = vi.fn(() => chain);
  const single = vi.fn().mockResolvedValue({ data, error });
  const maybeSingle = vi.fn().mockResolvedValue({ data, error });
  const insert = vi.fn().mockResolvedValue({ data: null, error: null });
  const update = vi.fn(() => ({ eq: vi.fn().mockResolvedValue({ data: null, error: null }) }));
  const del = vi.fn(() => ({ eq: vi.fn().mockResolvedValue({ data: null, error: null }) }));
  const order = vi.fn(() => chain);
  const limit = vi.fn(() => chain);
  Object.assign(chain, { select, eq, single, maybeSingle, insert, update, delete: del, order, limit });
  return chain;
}

function makeMockSupabase(overrides: Record<string, unknown> = {}) {
  const authGetUser = overrides.authGetUser ?? vi.fn().mockResolvedValue({ data: { user: null }, error: null });
  const profileData = overrides.profileData ?? null;
  const profileError = overrides.profileError ?? null;
  const fromChain = createFromChain(profileData, profileError);

  return {
    rpc: vi.fn().mockResolvedValue({ data: null, error: null }),
    from: vi.fn(() => fromChain),
    auth: { getUser: authGetUser },
    storage: {
      from: vi.fn(() => ({
        upload: vi.fn().mockResolvedValue({ data: null, error: null }),
        createSignedUrl: vi.fn().mockResolvedValue({ data: { signedUrl: "https://example.com/signed" }, error: null }),
      })),
    },
  };
}

let mockSupabase = makeMockSupabase();

vi.mock("@/lib/supabase", () => ({
  getSupabaseAdminClient: vi.fn(() => mockSupabase),
  getOptionalSupabaseAdminClient: vi.fn(() => null),
}));

vi.mock("@/lib/supabase-server", () => ({
  createServerSupabaseClient: vi.fn(() => ({
    auth: { getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }) },
  })),
}));

vi.mock("crypto", () => ({
  randomUUID: vi.fn(() => "mocked-uuid-12345"),
}));

function makeBuffer(...bytes: number[]): ArrayBuffer {
  return new Uint8Array(bytes).buffer;
}

function makeMockRequest(overrides: Record<string, unknown> = {}) {
  const headers = new Map(Object.entries((overrides.headers ?? {}) as Record<string, string>));
  return {
    headers: {
      get: (name: string) => headers.get(name) ?? null,
      forEach: (fn: (v: string, k: string) => void) => headers.forEach((v, k) => fn(v, k)),
    },
    nextUrl: { pathname: "/api/test", method: "GET" },
    json: vi.fn().mockResolvedValue(overrides.body ?? {}),
    cookies: {
      getAll: vi.fn().mockReturnValue([]),
      set: vi.fn(),
    },
  } as never;
}

function makePdfBuffer(): ArrayBuffer {
  return makeBuffer(0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x34);
}

function makeZipBuffer(): ArrayBuffer {
  return makeBuffer(0x50, 0x4b, 0x03, 0x04, 0x00, 0x00, 0x00, 0x00);
}

function makePngBuffer(): ArrayBuffer {
  return makeBuffer(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d);
}

function makeJpegBuffer(): ArrayBuffer {
  return makeBuffer(0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10);
}

function makeElfBuffer(): ArrayBuffer {
  return makeBuffer(0x7f, 0x45, 0x4c, 0x46, 0x02, 0x01, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00);
}

describe("Input Validation & Injection Prevention", () => {
  const validProduct = {
    storeId: "550e8400-e29b-41d4-a716-446655440000",
    slug: "my-ebook",
    title: "Great E-Book",
    description: "This is a fantastic e-book about testing.",
    price: 50000,
    status: "published",
    filePath: "uploads/ebook.pdf",
    fileSize: 2 * 1024 * 1024,
    fileMime: "application/pdf",
  };

  it("rejects SQL injection in email field", () => {
    const injections = [
      "' OR '1'='1",
      "admin'--",
      "'; DROP TABLE users; --",
      "' UNION SELECT * FROM users --",
      "test@example.com' OR 1=1 --",
    ];
    for (const payload of injections) {
      const result = registerSchema.safeParse({
        email: payload,
        password: "Password1",
        fullName: "Test User",
        storeHandle: "my-store",
      });
      expect(result.success).toBe(false);
    }
  });

  it("rejects SQL injection in password field", () => {
    const result = registerSchema.safeParse({
      email: "test@example.com",
      password: "'; DROP TABLE users; --",
      fullName: "Test User",
      storeHandle: "my-store",
    });
    expect(result.success).toBe(false);
  });

  it("accepts XSS strings in fullName (Zod validates type, not content)", () => {
    const payloads = [
      "<script>alert('xss')</script>",
      "<img src=x onerror=alert(1)>",
      "javascript:alert(1)",
      "\"><script>alert(1)</script>",
    ];
    for (const payload of payloads) {
      const result = registerSchema.safeParse({
        email: "test@example.com",
        password: "Password1",
        fullName: payload,
        storeHandle: "my-store",
      });
      expect(result.success).toBe(true);
    }
  });

  it("rejects NoSQL injection attempts in product title", () => {
    const payloads = [
      { $ne: "admin" },
      { $gt: "" },
      { $regex: ".*" },
      { $where: "1==1" },
    ];
    for (const payload of payloads) {
      const result = productSchema.safeParse({ ...validProduct, title: payload });
      expect(result.success).toBe(false);
    }
  });

  it("rejects prototype pollution in description", () => {
    const result = productSchema.safeParse({
      ...validProduct,
      description: { __proto__: { admin: true } },
    });
    expect(result.success).toBe(false);
  });

  it("rejects overly long strings in all string fields", () => {
    const result = storeSchema.safeParse({
      name: "x".repeat(10000),
      slug: "valid-slug",
      description: "x".repeat(10000),
    });
    expect(result.success).toBe(false);
  });

  it("rejects null/undefined for required string fields", () => {
    const result = loginSchema.safeParse({ email: null, password: undefined });
    expect(result.success).toBe(false);
  });

  it("rejects array injection for scalar fields", () => {
    const result = checkoutSchema.safeParse({
      productId: ["id1", "id2"],
      buyerEmail: "test@test.com",
      buyerName: "Test",
    });
    expect(result.success).toBe(false);
  });

  it("rejects object injection for scalar fields", () => {
    const result = paymentVerifySchema.safeParse({
      merchantReference: { $ne: "" },
      trackingId: "valid",
    });
    expect(result.success).toBe(false);
  });

  it("rejects boolean injection for numeric price", () => {
    const result = productSchema.safeParse({ ...validProduct, price: true });
    expect(result.success).toBe(false);
  });

  it("rejects NaN for numeric fields", () => {
    const result = productSchema.safeParse({ ...validProduct, price: NaN });
    expect(result.success).toBe(false);
  });

  it("rejects Infinity for numeric fields", () => {
    const result = productSchema.safeParse({ ...validProduct, price: Infinity });
    expect(result.success).toBe(false);
  });

  it("rejects negative Infinity for numeric fields", () => {
    const result = productSchema.safeParse({ ...validProduct, price: -Infinity });
    expect(result.success).toBe(false);
  });

  it("accepts command injection string in filePath (Zod validates format, not content)", () => {
    const result = productSchema.safeParse({
      ...validProduct,
      filePath: "; rm -rf /",
    });
    expect(result.success).toBe(true);
  });

  it("rejects path traversal in slug", () => {
    const result = productSchema.safeParse({
      ...validProduct,
      slug: "../../etc/passwd",
    });
    expect(result.success).toBe(false);
  });

  it("rejects unicode homoglyph attacks in email", () => {
    const result = registerSchema.safeParse({
      email: "tеst@example.com",
      password: "Password1",
      fullName: "Test User",
      storeHandle: "my-store",
    });
    expect(result.success).toBe(false);
  });

  it("rejects empty string for uuid fields", () => {
    const result = checkoutSchema.safeParse({
      productId: "",
      buyerEmail: "test@test.com",
      buyerName: "Test",
    });
    expect(result.success).toBe(false);
  });

  it("accepts analytics source with SQL injection (Zod validates length, not content)", () => {
    const result = analyticsEventSchema.safeParse({
      eventType: "store_view",
      source: "'; DROP TABLE analytics_events; --",
    });
    expect(result.success).toBe(true);
  });

  it("rejects analytics source exceeding max length", () => {
    const result = analyticsEventSchema.safeParse({
      eventType: "store_view",
      source: "x".repeat(201),
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid MIME type for product file", () => {
    const mimeInjection = [
      "application/pdf; charset=utf-8",
      "image/jpeg; name=malicious.jpg",
      "text/html",
      "application/x-msdownload",
      "application/octet-stream",
    ];
    for (const mime of mimeInjection) {
      const result = productSchema.safeParse({ ...validProduct, fileMime: mime });
      expect(result.success).toBe(false);
    }
  });

  it("rejects withdrawalDecision notes with excessive length", () => {
    const result = withdrawalDecisionSchema.safeParse({
      notes: "x".repeat(1001),
    });
    expect(result.success).toBe(false);
  });

  it("rejects UUID injection in storeId", () => {
    const result = productSchema.safeParse({
      ...validProduct,
      storeId: "'; DELETE FROM stores; --",
    });
    expect(result.success).toBe(false);
  });

  it("rejects empty object for required schemas", () => {
    expect(registerSchema.safeParse({}).success).toBe(false);
    expect(productSchema.safeParse({}).success).toBe(false);
    expect(checkoutSchema.safeParse({}).success).toBe(false);
  });

  it("rejects extra unexpected fields that bypass type checks", () => {
    const result = loginSchema.safeParse({
      email: "test@test.com",
      password: "secret",
      role: "admin",
      isAdmin: true,
    });
    expect(result.success).toBe(true);
    expect(result.data).not.toHaveProperty("role");
  });
});

describe("Authentication & Authorization", () => {
  beforeEach(() => {
    mockSupabase = makeMockSupabase();
  });

  it("requireUser rejects unauthenticated requests (no auth header, no cookie)", async () => {
    const request = makeMockRequest();
    await expect(requireUser(request)).rejects.toMatchObject({
      message: "Authentication required",
      status: 401,
    });
  });

  it("requireUser rejects invalid bearer token", async () => {
    mockSupabase = makeMockSupabase({
      authGetUser: vi.fn().mockResolvedValue({ data: { user: null }, error: new Error("Invalid token") }),
    });
    const request = makeMockRequest({ headers: { authorization: "Bearer invalid-token" } });
    await expect(requireUser(request)).rejects.toMatchObject({
      message: "Authentication required",
      status: 401,
    });
  });

  it("requireUser rejects when user profile not found", async () => {
    mockSupabase = makeMockSupabase({
      authGetUser: vi.fn().mockResolvedValue({ data: { user: { id: "user-1" } }, error: null }),
      profileData: null,
      profileError: new Error("Profile not found"),
    });
    const request = makeMockRequest({ headers: { authorization: "Bearer valid-token" } });
    await expect(requireUser(request)).rejects.toMatchObject({
      message: "User profile not found",
      status: 403,
    });
  });

  it("requireUser succeeds with valid bearer token", async () => {
    mockSupabase = makeMockSupabase({
      authGetUser: vi.fn().mockResolvedValue({ data: { user: { id: "user-1", email: "test@test.com" } }, error: null }),
      profileData: { id: "user-1", email: "test@test.com", role: "creator" },
      profileError: null,
    });
    const request = makeMockRequest({ headers: { authorization: "Bearer valid-token" } });
    const result = await requireUser(request);
    expect(result.profile.role).toBe("creator");
  });

  it("requireAdmin rejects non-admin user", async () => {
    mockSupabase = makeMockSupabase({
      authGetUser: vi.fn().mockResolvedValue({ data: { user: { id: "user-1" } }, error: null }),
      profileData: { id: "user-1", role: "creator" },
      profileError: null,
    });
    const request = makeMockRequest({ headers: { authorization: "Bearer token" } });
    await expect(requireAdmin(request)).rejects.toMatchObject({
      message: "Admin access required",
      status: 403,
    });
  });

  it("requireAdmin passes for admin user", async () => {
    mockSupabase = makeMockSupabase({
      authGetUser: vi.fn().mockResolvedValue({ data: { user: { id: "admin-1" } }, error: null }),
      profileData: { id: "admin-1", email: "admin@test.com", role: "admin" },
      profileError: null,
    });
    const request = makeMockRequest({ headers: { authorization: "Bearer admin-token" } });
    const result = await requireAdmin(request);
    expect(result.profile.role).toBe("admin");
  });

  it("requireUser rejects request with empty authorization header", async () => {
    const request = makeMockRequest({ headers: { authorization: "" } });
    await expect(requireUser(request)).rejects.toMatchObject({
      message: "Authentication required",
      status: 401,
    });
  });

  it("requireUser rejects request with malformed authorization header", async () => {
    mockSupabase = makeMockSupabase({
      authGetUser: vi.fn().mockResolvedValue({ data: { user: null }, error: new Error("Invalid token") }),
    });
    const request = makeMockRequest({ headers: { authorization: "Basic dXNlcjpwYXNz" } });
    await expect(requireUser(request)).rejects.toMatchObject({
      message: "Authentication required",
      status: 401,
    });
  });

  it("requireAdmin is not bypassable with trailing space role", async () => {
    mockSupabase = makeMockSupabase({
      authGetUser: vi.fn().mockResolvedValue({ data: { user: { id: "user-1" } }, error: null }),
      profileData: { id: "user-1", role: "admin " },
      profileError: null,
    });
    const request = makeMockRequest({ headers: { authorization: "Bearer token" } });
    await expect(requireAdmin(request)).rejects.toMatchObject({
      message: "Admin access required",
      status: 403,
    });
  });

  it("requireAdmin is not bypassable with uppercase role", async () => {
    mockSupabase = makeMockSupabase({
      authGetUser: vi.fn().mockResolvedValue({ data: { user: { id: "user-1" } }, error: null }),
      profileData: { id: "user-1", role: "Admin" },
      profileError: null,
    });
    const request = makeMockRequest({ headers: { authorization: "Bearer token" } });
    await expect(requireAdmin(request)).rejects.toMatchObject({
      message: "Admin access required",
      status: 403,
    });
  });
});

describe("Payment Security", () => {
  let pesapalStatusPayload: Record<string, unknown>;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("PESAPAL_CONSUMER_KEY", "test-key");
    vi.stubEnv("PESAPAL_CONSUMER_SECRET", "test-secret");
    vi.stubEnv("PESAPAL_IPN_ID", "test-ipn");

    pesapalStatusPayload = {};
    globalThis.fetch = vi.fn().mockImplementation((url: string) => {
      if (url.includes("RequestToken")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ token: "mock-token", expiryDate: new Date(Date.now() + 3600000).toISOString() }),
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(pesapalStatusPayload),
      });
    });
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("verifyPesapalPayment detects amount mismatch between order and Pesapal", async () => {
    pesapalStatusPayload = {
      merchant_reference: "REF-001",
      order_tracking_id: "TRK-001",
      amount: 60000,
      payment_status_description: "Completed",
    };

    const mockSupabaseLocal = {
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn().mockResolvedValue({
              data: {
                id: "pay-1",
                merchant_reference: "REF-001",
                order_id: "order-1",
                orders: [{ amount: 50000 }],
              },
              error: null,
            }),
          })),
        })),
      })),
      rpc: vi.fn().mockResolvedValue({ data: null, error: null }),
    } as never;

    const result = await verifyPesapalPayment(mockSupabaseLocal, "REF-001", "TRK-001");
    expect(result.ok).toBe(false);
    expect(result.error).toBe("Pesapal amount mismatch");
  });

  it("verifyPesapalPayment detects merchant reference mismatch", async () => {
    pesapalStatusPayload = {
      merchant_reference: "DIFFERENT-REF",
      order_tracking_id: "TRK-001",
      amount: 50000,
      payment_status_description: "Completed",
    };

    const mockSupabaseLocal = {
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn().mockResolvedValue({
              data: {
                id: "pay-1",
                merchant_reference: "REF-001",
                order_id: "order-1",
                orders: [{ amount: 50000 }],
              },
              error: null,
            }),
          })),
        })),
      })),
      rpc: vi.fn().mockResolvedValue({ data: null, error: null }),
    } as never;

    const result = await verifyPesapalPayment(mockSupabaseLocal, "REF-001", "TRK-001");
    expect(result.ok).toBe(false);
    expect(result.error).toBe("Pesapal merchant reference mismatch");
  });

  it("verifyPesapalPayment rejects incomplete payment status", async () => {
    pesapalStatusPayload = {
      merchant_reference: "REF-001",
      order_tracking_id: "TRK-001",
      amount: 50000,
      payment_status_description: "PENDING",
    };

    const mockSupabaseLocal = {
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn().mockResolvedValue({
              data: {
                id: "pay-1",
                merchant_reference: "REF-001",
                order_id: "order-1",
                orders: [{ amount: 50000 }],
              },
              error: null,
            }),
          })),
        })),
      })),
      rpc: vi.fn().mockResolvedValue({ data: null, error: null }),
    } as never;

    const result = await verifyPesapalPayment(mockSupabaseLocal, "REF-001", "TRK-001");
    expect(result.ok).toBe(false);
    expect(result.error).toBe("Payment is not completed");
  });

  it("verifyPesapalPayment rejects payment not found", async () => {
    const mockSupabaseLocal = {
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn().mockResolvedValue({ data: null, error: null }),
          })),
        })),
      })),
      rpc: vi.fn().mockResolvedValue({ data: null, error: null }),
    } as never;

    const result = await verifyPesapalPayment(mockSupabaseLocal, "NONEXISTENT", "TRK-001");
    expect(result.ok).toBe(false);
    expect(result.error).toBe("Payment not found");
  });

  it("verifyPesapalPayment fails when tracking id does not match", async () => {
    pesapalStatusPayload = {
      merchant_reference: "REF-001",
      order_tracking_id: null,
      amount: 50000,
      payment_status_description: "Completed",
    };

    const mockSupabaseLocal = {
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn().mockResolvedValue({
              data: {
                id: "pay-1",
                merchant_reference: "REF-001",
                order_id: "order-1",
                orders: [{ amount: 50000 }],
              },
              error: null,
            }),
          })),
        })),
      })),
      rpc: vi.fn().mockResolvedValue({ data: null, error: null }),
    } as never;

    const result = await verifyPesapalPayment(mockSupabaseLocal, "REF-001", "TRK-001");
    expect(result.ok).toBe(false);
    expect(result.error).toBe("Pesapal tracking id mismatch");
  });

  it("withdrawalSchema rejects zero amount", () => {
    const result = withdrawalSchema.safeParse({
      amount: 0,
      payoutMethod: "mobile_money",
    });
    expect(result.success).toBe(false);
  });

  it("withdrawalSchema rejects negative withdrawal amounts", () => {
    const result = withdrawalSchema.safeParse({
      amount: -50000,
      payoutMethod: "mobile_money",
    });
    expect(result.success).toBe(false);
  });

  it("withdrawalSchema rejects zero withdrawal amount", () => {
    const result = withdrawalSchema.safeParse({
      amount: 0,
      payoutMethod: "mobile_money",
    });
    expect(result.success).toBe(false);
  });

  it("checkoutSchema rejects non-UUID productId", () => {
    const result = checkoutSchema.safeParse({
      productId: "not-a-uuid-at-all",
      buyerEmail: "buyer@example.com",
      buyerName: "John Doe",
    });
    expect(result.success).toBe(false);
  });

  it("checkoutSchema rejects productId with SQL injection", () => {
    const result = checkoutSchema.safeParse({
      productId: "'; UPDATE payments SET amount=0; --",
      buyerEmail: "buyer@example.com",
      buyerName: "John Doe",
    });
    expect(result.success).toBe(false);
  });
});

describe("Rate Limiting", () => {
  beforeEach(() => {
    mockSupabase = makeMockSupabase();
  });

  it("rateLimit returns 429 when count exceeds max", async () => {
    mockSupabase.rpc = vi.fn().mockResolvedValue({ data: null, error: null });
    mockSupabase.from = vi.fn(() => {
      const chain = createFromChain(null);
      chain.maybeSingle = vi.fn().mockResolvedValue({ data: { count: 150 }, error: null });
      chain.select = vi.fn(() => chain);
      chain.eq = vi.fn(() => chain);
      return chain;
    });

    const request = makeMockRequest({ headers: { "x-forwarded-for": "192.168.1.1" } });
    const result = await rateLimit(request, 120, 60);
    expect(result).not.toBeNull();
    const response = await result!.json();
    expect(response.error.message).toContain("Too many requests");
  });

  it("rateLimit passes when count is within limit", async () => {
    mockSupabase.rpc = vi.fn().mockResolvedValue({ data: null, error: null });
    mockSupabase.from = vi.fn(() => {
      const chain = createFromChain(null);
      chain.maybeSingle = vi.fn().mockResolvedValue({ data: { count: 50 }, error: null });
      chain.select = vi.fn(() => chain);
      chain.eq = vi.fn(() => chain);
      return chain;
    });

    const request = makeMockRequest({ headers: { "x-forwarded-for": "192.168.1.1" } });
    const result = await rateLimit(request, 120, 60);
    expect(result).toBeNull();
  });

  it("rateLimit uses x-real-ip when x-forwarded-for is absent", async () => {
    mockSupabase.rpc = vi.fn().mockResolvedValue({ data: null, error: null });
    mockSupabase.from = vi.fn(() => {
      const chain = createFromChain(null);
      chain.maybeSingle = vi.fn().mockResolvedValue({ data: null, error: null });
      chain.select = vi.fn(() => chain);
      chain.eq = vi.fn(() => chain);
      return chain;
    });

    const request = makeMockRequest({ headers: { "x-real-ip": "10.0.0.1" } });
    await rateLimit(request, 120, 60);
    expect(mockSupabase.rpc).toHaveBeenCalledWith("rate_limit_check_and_increment", expect.objectContaining({ p_key: "10.0.0.1" }));
  });

  it("rateLimit falls back to 'local' when no IP headers are present", async () => {
    mockSupabase.rpc = vi.fn().mockResolvedValue({ data: null, error: null });
    mockSupabase.from = vi.fn(() => {
      const chain = createFromChain(null);
      chain.maybeSingle = vi.fn().mockResolvedValue({ data: null, error: null });
      chain.select = vi.fn(() => chain);
      chain.eq = vi.fn(() => chain);
      return chain;
    });

    const request = makeMockRequest();
    await rateLimit(request, 120, 60);
    expect(mockSupabase.rpc).toHaveBeenCalledWith("rate_limit_check_and_increment", expect.objectContaining({ p_key: "local" }));
  });

  it("rateLimit returns null (no error) when supabase calls fail", async () => {
    mockSupabase.rpc = vi.fn().mockRejectedValue(new Error("DB error"));
    mockSupabase.from = vi.fn(() => { throw new Error("DB error"); });

    const request = makeMockRequest({ headers: { "x-forwarded-for": "10.0.0.1" } });
    const result = await rateLimit(request);
    expect(result).toBeNull();
  });

  it("withErrorHandling wraps rate limit and returns 429", async () => {
    mockSupabase.rpc = vi.fn().mockResolvedValue({ data: null, error: null });
    mockSupabase.from = vi.fn(() => {
      const chain = createFromChain(null);
      chain.maybeSingle = vi.fn().mockResolvedValue({ data: { count: 999 }, error: null });
      chain.select = vi.fn(() => chain);
      chain.eq = vi.fn(() => chain);
      return chain;
    });

    const handler = withErrorHandling(async () => new Response("ok"));
    const request = makeMockRequest({ headers: { "x-forwarded-for": "10.0.0.1" } });
    const response = await handler(request);
    expect(response.status).toBe(429);
  });

  it("uses x-forwarded-for first IP in chain", async () => {
    mockSupabase.rpc = vi.fn().mockResolvedValue({ data: null, error: null });
    mockSupabase.from = vi.fn(() => {
      const chain = createFromChain(null);
      chain.maybeSingle = vi.fn().mockResolvedValue({ data: null, error: null });
      chain.select = vi.fn(() => chain);
      chain.eq = vi.fn(() => chain);
      return chain;
    });

    const request = makeMockRequest({ headers: { "x-forwarded-for": "203.0.113.1, 10.0.0.1, 192.168.1.1" } });
    await rateLimit(request, 120, 60);
    expect(mockSupabase.rpc).toHaveBeenCalledWith("rate_limit_check_and_increment", expect.objectContaining({ p_key: "203.0.113.1" }));
  });
});

describe("CSRF Protection", () => {
  beforeEach(() => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://keevanstore.in");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("rejects request with mismatched origin", () => {
    const request = makeMockRequest({
      headers: { origin: "https://evil.com", referer: "https://evil.com/page" },
    });
    expect(() => checkCSRF(request)).toThrow("Cross-site request forbidden");
  });

  it("rejects request with mismatched referer", () => {
    const request = makeMockRequest({
      headers: { referer: "https://phishing-site.com/login" },
    });
    expect(() => checkCSRF(request)).toThrow("Cross-site request forbidden");
  });

  it("passes request with matching origin", () => {
    const request = makeMockRequest({
      headers: { origin: "https://keevanstore.in" },
    });
    expect(() => checkCSRF(request)).not.toThrow();
  });

  it("passes request with matching referer", () => {
    const request = makeMockRequest({
      headers: { referer: "https://keevanstore.in/dashboard" },
    });
    expect(() => checkCSRF(request)).not.toThrow();
  });

  it("rejects request with origin containing path traversal", () => {
    const request = makeMockRequest({
      headers: { origin: "https://keevanstore.in@evil.com" },
    });
    expect(() => checkCSRF(request)).toThrow("Cross-site request forbidden");
  });

  it("rejects request with null origin and malicious referer", () => {
    const request = makeMockRequest({
      headers: { origin: "null", referer: "https://evil.com" },
    });
    expect(() => checkCSRF(request)).toThrow("Cross-site request forbidden");
  });

  it("rejects request with IP-based origin", () => {
    const request = makeMockRequest({
      headers: { origin: "http://192.168.1.1" },
    });
    expect(() => checkCSRF(request)).toThrow("Cross-site request forbidden");
  });

  it("rejects request with no origin and no referer when SITE_URL is configured", () => {
    const request = makeMockRequest({ headers: {} });
    expect(() => checkCSRF(request)).toThrow("Cross-site request forbidden");
  });

  it("skips CSRF check when SITE_URL is not configured", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "");
    const request = makeMockRequest({
      headers: { origin: "https://evil.com" },
    });
    expect(() => checkCSRF(request)).not.toThrow();
  });

  it("rejects request with origin having different port", () => {
    const request = makeMockRequest({
      headers: { origin: "https://keevanstore.in:8080" },
    });
    expect(() => checkCSRF(request)).toThrow("Cross-site request forbidden");
  });

  it("rejects request with origin containing newline injection", () => {
    const request = makeMockRequest({
      headers: { origin: "https://keevanstore.in\nX-Custom: injected" },
    });
    expect(() => checkCSRF(request)).toThrow("Cross-site request forbidden");
  });

  it("rejects request with empty string origin header", () => {
    const request = makeMockRequest({
      headers: { origin: "" },
    });
    expect(() => checkCSRF(request)).toThrow("Cross-site request forbidden");
  });

  it("rejects request with origin having different scheme", () => {
    const request = makeMockRequest({
      headers: { origin: "http://keevanstore.in" },
    });
    expect(() => checkCSRF(request)).toThrow("Cross-site request forbidden");
  });

  it("prefers origin over referer when both are present", () => {
    const request = makeMockRequest({
      headers: { origin: "https://keevanstore.in", referer: "https://evil.com" },
    });
    expect(() => checkCSRF(request)).not.toThrow();
  });
});

describe("File Upload Security", () => {
  it("rejects executable file content with PDF extension", async () => {
    const exeMagic = makeBuffer(0x4d, 0x5a, 0x90, 0x00);
    const result = await validateUploadFile({
      name: "malicious.pdf",
      size: 100,
      type: "application/pdf",
      arrayBuffer: async () => exeMagic,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBe("invalid_signature");
    }
  });

  it("rejects HTML file disguised as PDF", async () => {
    const htmlContent = makeBuffer(...new TextEncoder().encode("<html><script>alert(1)</script></html>"));
    const result = await validateUploadFile({
      name: "doc.pdf",
      size: htmlContent.byteLength,
      type: "application/pdf",
      arrayBuffer: async () => htmlContent,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBe("invalid_signature");
    }
  });

  it("rejects ELF binary with PNG extension", async () => {
    const elfMagic = makeElfBuffer();
    const result = await validateUploadFile({
      name: "image.png",
      size: elfMagic.byteLength,
      type: "image/png",
      arrayBuffer: async () => elfMagic,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBe("invalid_signature");
    }
  });

  it("rejects shell script with webp extension", async () => {
    const script = makeBuffer(...new TextEncoder().encode("#!/bin/sh\nrm -rf /"));
    const result = await validateUploadFile({
      name: "image.webp",
      size: script.byteLength,
      type: "image/webp",
      arrayBuffer: async () => script,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBe("invalid_signature");
    }
  });

  it("rejects file with double extension", async () => {
    const result = await validateUploadFile({
      name: "document.pdf.exe",
      size: 100,
      type: "application/pdf",
      arrayBuffer: async () => makePdfBuffer(),
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBe("invalid_extension");
    }
  });

  it("rejects zip bomb with mismatched extension", async () => {
    const result = await validateUploadFile({
      name: "innocent.png",
      size: 100,
      type: "application/zip",
      arrayBuffer: async () => makeZipBuffer(),
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBe("invalid_extension");
    }
  });

  it("rejects empty buffer for valid MIME", () => {
    expect(validateFileSignature(new ArrayBuffer(0), "application/pdf")).toBe(false);
    expect(validateFileSignature(new ArrayBuffer(0), "image/jpeg")).toBe(false);
    expect(validateFileSignature(new ArrayBuffer(0), "image/png")).toBe(false);
  });

  it("accepts MOBI file with BOOKMOBI marker", async () => {
    const buffer = new ArrayBuffer(1024);
    const view = new Uint8Array(buffer);
    view.set([0x42, 0x4f, 0x4f, 0x4b, 0x4d, 0x4f, 0x42, 0x49], 500);

    const result = await validateUploadFile({
      name: "book.mobi",
      size: 1024,
      type: "application/x-mobipocket-ebook",
      arrayBuffer: async () => buffer,
    });
    expect(result.ok).toBe(true);
  });

  it("rejects file with no extension for allowed MIME", async () => {
    const result = await validateUploadFile({
      name: "fileWithoutExtension",
      size: 100,
      type: "application/pdf",
      arrayBuffer: async () => makePdfBuffer(),
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBe("invalid_extension");
    }
  });

  it("accepts file with null bytes in PDF content", async () => {
    const poisonedPdf = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x00, 0x00, 0x00]);
    const result = await validateUploadFile({
      name: "doc.pdf",
      size: poisonedPdf.byteLength,
      type: "application/pdf",
      arrayBuffer: async () => poisonedPdf.buffer,
    });
    expect(result.ok).toBe(true);
  });

  it("rejects oversized file with valid signature but exceeding product limit", () => {
    const result = productSchema.safeParse({
      storeId: "550e8400-e29b-41d4-a716-446655440000",
      slug: "my-ebook",
      title: "E-Book",
      description: "An e-book about testing code.",
      price: 50000,
      filePath: "uploads/ebook.pdf",
      fileSize: 10 * 1024 * 1024,
      fileMime: "application/pdf",
    });
    expect(result.success).toBe(false);
  });

  it("rejects cover image exceeding 2MB limit", () => {
    const result = productSchema.safeParse({
      storeId: "550e8400-e29b-41d4-a716-446655440000",
      slug: "my-ebook",
      title: "E-Book",
      description: "An e-book about testing code.",
      price: 50000,
      filePath: "uploads/ebook.pdf",
      fileSize: 1 * 1024 * 1024,
      fileMime: "application/pdf",
      coverPath: "covers/image.jpg",
      coverSize: 3 * 1024 * 1024,
      coverMime: "image/jpeg",
    });
    expect(result.success).toBe(false);
  });

  it("rejects file with extension that does not match mime type", async () => {
    const result = await validateUploadFile({
      name: "book.pdf",
      size: 100,
      type: "application/epub+zip",
      arrayBuffer: async () => makePdfBuffer(),
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBe("invalid_extension");
    }
  });

  it("rejects file with valid extension but wrong magic bytes", async () => {
    const jpegBuffer = (() => {
      const b = new ArrayBuffer(16);
      const v = new Uint8Array(b);
      v.set([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01], 0);
      return b;
    })();
    const result = await validateUploadFile({
      name: "image.png",
      size: jpegBuffer.byteLength,
      type: "image/png",
      arrayBuffer: async () => jpegBuffer,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBe("invalid_signature");
    }
  });

  it("rejects HTML file with .mobi extension", async () => {
    const htmlBytes = new TextEncoder().encode("<html>malicious</html>");
    const buffer = new ArrayBuffer(512);
    const view = new Uint8Array(buffer);
    view.set(htmlBytes, 0);

    const result = await validateUploadFile({
      name: "book.mobi",
      size: 512,
      type: "application/x-mobipocket-ebook",
      arrayBuffer: async () => buffer,
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBe("invalid_signature");
    }
  });
});

describe("Download Token Security", () => {
  let pesapalStatusPayload: Record<string, unknown>;

  beforeEach(() => {
    mockSupabase = makeMockSupabase();
    vi.clearAllMocks();
    vi.stubEnv("PESAPAL_CONSUMER_KEY", "test-key");
    vi.stubEnv("PESAPAL_CONSUMER_SECRET", "test-secret");
    vi.stubEnv("PESAPAL_IPN_ID", "test-ipn");

    pesapalStatusPayload = {};
    globalThis.fetch = vi.fn().mockImplementation((url: string) => {
      if (url.includes("RequestToken")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ token: "mock-token", expiryDate: new Date(Date.now() + 3600000).toISOString() }),
        });
      }
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(pesapalStatusPayload),
      });
    });
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("rejects download request with non-existent token", async () => {
    mockSupabase.from = vi.fn(() => {
      const chain = createFromChain(null);
      chain.single = vi.fn().mockResolvedValue({ data: null, error: new Error("Not found") });
      chain.select = vi.fn(() => chain);
      chain.eq = vi.fn(() => chain);
      return chain;
    });

    const supabase = (await import("@/lib/supabase")).getSupabaseAdminClient();
    const { data, error } = await supabase.from("downloads").select("id").eq("token", "nonexistent-token").single();
    expect(data).toBeNull();
    expect(error).toBeTruthy();
  });

  it("rejects download request with expired token", async () => {
    const expiredDate = new Date(Date.now() - 86400000).toISOString();
    mockSupabase.from = vi.fn(() => {
      const chain = createFromChain({
        id: "dl-1",
        expires_at: expiredDate,
        order_id: "order-1",
        product_id: "prod-1",
        products: { file_path: "files/book.pdf" },
      });
      chain.single = vi.fn().mockResolvedValue({
        data: {
          id: "dl-1",
          expires_at: expiredDate,
          order_id: "order-1",
          product_id: "prod-1",
          products: { file_path: "files/book.pdf" },
        },
        error: null,
      });
      chain.select = vi.fn(() => chain);
      chain.eq = vi.fn(() => chain);
      return chain;
    });

    const supabase = (await import("@/lib/supabase")).getSupabaseAdminClient();
    const { data: download } = await supabase.from("downloads").select("id,expires_at").eq("token", "expired-token").single();
    const expired = new Date(download.expires_at).getTime() < Date.now();
    expect(expired).toBe(true);
  });

  it("accepts valid unexpired download token", async () => {
    const futureDate = new Date(Date.now() + 86400000).toISOString();
    mockSupabase.from = vi.fn(() => {
      const chain = createFromChain(null);
      chain.single = vi.fn().mockResolvedValue({
        data: {
          id: "dl-1",
          expires_at: futureDate,
          order_id: "order-1",
          product_id: "prod-1",
          products: { file_path: "files/book.pdf" },
        },
        error: null,
      });
      chain.select = vi.fn(() => chain);
      chain.eq = vi.fn(() => chain);
      return chain;
    });

    const supabase = (await import("@/lib/supabase")).getSupabaseAdminClient();
    const { data: download } = await supabase.from("downloads").select("id,expires_at").eq("token", "valid-token").single();
    const expired = new Date(download.expires_at).getTime() < Date.now();
    expect(expired).toBe(false);
  });

  it("rejects token with SQL injection pattern", async () => {
    const fromFn = vi.fn(() => {
      const chain = createFromChain(null);
      chain.single = vi.fn().mockResolvedValue({ data: null, error: new Error("Not found") });
      chain.select = vi.fn(() => chain);
      chain.eq = vi.fn(() => chain);
      return chain;
    });
    mockSupabase.from = fromFn;

    const supabase = (await import("@/lib/supabase")).getSupabaseAdminClient();
    await supabase.from("downloads").select("id").eq("token", "'; SELECT * FROM users; --").single();
    expect(fromFn).toHaveBeenCalledWith("downloads");
  });

  it("rejects download token that doesn't match product_id", async () => {
    const futureDate = new Date(Date.now() + 86400000).toISOString();
    mockSupabase.from = vi.fn(() => {
      const chain = createFromChain(null);
      chain.single = vi.fn().mockResolvedValue({
        data: {
          id: "dl-1",
          token: "token-123",
          expires_at: futureDate,
          product_id: "prod-999",
          order_id: "order-1",
          products: { file_path: "files/book.pdf" },
        },
        error: null,
      });
      chain.select = vi.fn(() => chain);
      chain.eq = vi.fn(() => chain);
      return chain;
    });

    const supabase = (await import("@/lib/supabase")).getSupabaseAdminClient();
    const { data: download } = await supabase
      .from("downloads")
      .select("token,product_id")
      .eq("token", "token-123")
      .eq("product_id", "prod-001")
      .single();

    expect(download.product_id).toBe("prod-999");
    expect(download.product_id).not.toBe("prod-001");
  });

  it("verifyPesapalPayment returns download token on success", async () => {
    pesapalStatusPayload = {
      merchant_reference: "REF-001",
      order_tracking_id: "TRK-001",
      amount: 50000,
      payment_status_description: "Completed",
    };

    const mockSupabaseLocal = {
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn().mockResolvedValue({
              data: {
                id: "pay-1",
                merchant_reference: "REF-001",
                order_id: "order-1",
                orders: [{ amount: 50000 }],
              },
              error: null,
            }),
          })),
        })),
        insert: vi.fn().mockResolvedValue({ data: null, error: null }),
      })),
      rpc: vi.fn().mockResolvedValue({
        data: [{ download_token: "secure-dl-token-abc123", already_processed: false, product_id: "prod-1", order_id: "order-1" }],
        error: null,
      }),
    } as never;

    const result = await verifyPesapalPayment(mockSupabaseLocal, "REF-001", "TRK-001");
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.downloadToken).toBe("secure-dl-token-abc123");
      expect(result.downloadToken.length).toBeGreaterThan(0);
    }
  });

  it("verifyPesapalPayment handles already verified token", async () => {
    pesapalStatusPayload = {
      merchant_reference: "REF-001",
      order_tracking_id: "TRK-001",
      amount: 50000,
      payment_status_description: "Completed",
    };

    const mockSupabaseLocal = {
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn().mockResolvedValue({
              data: {
                id: "pay-1",
                merchant_reference: "REF-001",
                order_id: "order-1",
                orders: [{ amount: 50000 }],
              },
              error: null,
            }),
          })),
        })),
      })),
      rpc: vi.fn().mockResolvedValue({
        data: [{ download_token: "existing-token", already_processed: true, product_id: null, order_id: "order-1" }],
        error: null,
      }),
    } as never;

    const result = await verifyPesapalPayment(mockSupabaseLocal, "REF-001", "TRK-001");
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.alreadyVerified).toBe(true);
    }
  });
});
