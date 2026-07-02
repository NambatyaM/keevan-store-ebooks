import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const mockSupabase = {
  rpc: vi.fn().mockResolvedValue({ data: null, error: null }),
  from: vi.fn(() => ({
    update: vi.fn(() => ({ eq: vi.fn().mockResolvedValue({ data: null, error: null }) })),
    maybeSingle: vi.fn().mockResolvedValue({ data: { count: 5 }, error: null }),
  })),
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
  mockSupabase.rpc.mockResolvedValue({ data: null, error: null });
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
    mockSupabase.rpc.mockResolvedValue({ data: [], error: null });

    const request = makeCronRequest("/api/cron/process-emails", "test-cron-secret-123");
    const response = await GET(request);
    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body.ok).toBe(true);
    expect(body.processed).toBe(0);
    expect(body.failed).toBe(0);
  });

  it("handles database fetch error", async () => {
    mockSupabase.rpc.mockResolvedValue({ data: null, error: { message: "DB error" } });

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
    mockSupabase.rpc.mockResolvedValue({ data: [], error: null });

    const request = makeCronRequest("/api/cron/process-emails", "test-cron-secret-123", "POST");
    const response = await POST(request);
    expect(response.status).toBe(200);

    const body = await response.json();
    expect(body.ok).toBe(true);
    expect(body.processed).toBe(0);
    expect(body.failed).toBe(0);
  });
});
