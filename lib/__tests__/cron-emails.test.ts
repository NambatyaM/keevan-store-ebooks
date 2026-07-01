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
    single: vi.fn().mockResolvedValue(resolveValue),
    maybeSingle: vi.fn().mockResolvedValue(resolveValue),
    insert: vi.fn(() => ({ select: vi.fn(() => ({ single: vi.fn().mockResolvedValue(resolveValue) })) })),
    update: vi.fn(() => ({ eq: vi.fn().mockResolvedValue({ data: null, error: null }) })),
    then: (resolve: (v: unknown) => void) => {
      if (countMode) resolve({ count: customCount ?? 0, data: null, error: null });
      else resolve(resolveValue);
    },
    order: vi.fn(() => chain),
    limit: vi.fn(() => chain),
    lt: vi.fn(() => chain),
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
}));

vi.mock("@/lib/email", () => ({
  sendEmail: vi.fn(),
}));

import { GET, POST } from "@/app/api/cron/process-emails/route";

function makeCronRequest(url: string, secret?: string, method: string = "GET"): NextRequest {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    origin: "https://keevanstore.in",
  };
  if (secret) {
    headers["x-vercel-cron-secret"] = secret;
  }
  return new NextRequest(new URL(url, "https://keevanstore.in"), {
    method,
    headers,
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://keevanstore.in");
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://test.supabase.co");
  vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "test-key");
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "test-anon-key");
  vi.stubEnv("CRON_SECRET", "test-cron-secret-123");
  mockSupabase.from.mockReturnValue(rateLimitChain);
});

describe("GET /api/cron/process-emails", () => {
  it("returns 401 without cron secret", async () => {
    const request = makeCronRequest("/api/cron/process-emails");
    const response = await GET(request);
    expect(response.status).toBe(401);
  });

  it("returns 401 with wrong cron secret", async () => {
    const request = makeCronRequest("/api/cron/process-emails", "wrong-secret");
    const response = await GET(request);
    expect(response.status).toBe(401);
  });

  it("processes queue with valid cron secret", async () => {
    const supabase = mockSupabase;
    const chain = supabase.from("email_queue") as ReturnType<typeof mockFromChain>;
    chain.then = (resolve: (v: unknown) => void) => resolve({
      data: [],
      error: null,
      count: 0,
    });

    const request = makeCronRequest("/api/cron/process-emails", "test-cron-secret-123");
    const response = await GET(request);
    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body.ok).toBe(true);
    expect(body.processed).toBe(0);
    expect(body.failed).toBe(0);
  });

  it("handles database fetch error", async () => {
    const supabase = mockSupabase;

    const errorChain = {
      select: vi.fn(() => errorChain),
      eq: vi.fn(() => errorChain),
      lt: vi.fn(() => errorChain),
      order: vi.fn(() => errorChain),
      limit: vi.fn(() => errorChain),
      single: vi.fn(),
      maybeSingle: vi.fn(),
      insert: vi.fn(),
      update: vi.fn(),
      then: (resolve: (v: unknown) => void) => resolve({ data: null, error: { message: "DB error" } }),
    };

    supabase.from.mockReturnValue(errorChain);

    const request = makeCronRequest("/api/cron/process-emails", "test-cron-secret-123");
    const response = await GET(request);
    expect(response.status).toBe(500);

    const body = await response.json();
    expect(body.ok).toBe(false);
    expect(body.error).toBe("DB error");
  });
});

describe("POST /api/cron/process-emails", () => {
  it("rejects unauthorized POST requests", async () => {
    const request = makeCronRequest("/api/cron/process-emails", undefined, "POST");
    const response = await POST(request);
    expect(response.status).toBe(401);
  });

  it("processes queue via POST with valid secret", async () => {
    const supabase = mockSupabase;
    const chain = supabase.from("email_queue") as ReturnType<typeof mockFromChain>;
    chain.then = (resolve: (v: unknown) => void) => resolve({
      data: [],
      error: null,
      count: 0,
    });

    const request = makeCronRequest("/api/cron/process-emails", "test-cron-secret-123", "POST");
    const response = await POST(request);
    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body.ok).toBe(true);
    expect(body.processed).toBe(0);
    expect(body.failed).toBe(0);
  });
});
