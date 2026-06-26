import { describe, it, expect, vi, beforeEach } from "vitest";

const mockCreateClient = vi.fn(() => ({ auth: {} }));

vi.mock("@supabase/supabase-js", () => ({
  createClient: (...args: unknown[]) => mockCreateClient(...args),
}));

beforeEach(() => {
  mockCreateClient.mockClear();
  vi.unstubAllEnvs();
});

describe("getSupabaseClient", () => {
  it("creates a client with anon key", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://test.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "test-anon-key");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "test-service-role-key");
    vi.resetModules();
    const { getSupabaseClient } = await import("@/lib/supabase");
    const client = getSupabaseClient();
    expect(mockCreateClient).toHaveBeenCalledWith("https://test.supabase.co", "test-anon-key");
    expect(client).toBeDefined();
  });

  it("throws when public env vars are missing", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "test-service-role-key");
    vi.resetModules();
    const { getSupabaseClient } = await import("@/lib/supabase");
    expect(() => getSupabaseClient()).toThrow("Supabase public environment variables are missing");
  });
});

describe("getSupabaseAdminClient", () => {
  it("creates a client with service role key and persistSession:false", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://test.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "test-anon-key");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "test-service-role-key");
    vi.resetModules();
    const { getSupabaseAdminClient } = await import("@/lib/supabase");
    const client = getSupabaseAdminClient();
    expect(mockCreateClient).toHaveBeenCalledWith("https://test.supabase.co", "test-service-role-key", {
      auth: { persistSession: false },
    });
    expect(client).toBeDefined();
  });

  it("throws when admin env vars are missing", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://test.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "test-anon-key");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "");
    vi.resetModules();
    const { getSupabaseAdminClient } = await import("@/lib/supabase");
    expect(() => getSupabaseAdminClient()).toThrow("Supabase admin environment variables are missing");
  });
});

describe("getOptionalSupabaseAdminClient", () => {
  it("returns a client when env vars are present", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://test.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "test-anon-key");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "test-service-role-key");
    vi.resetModules();
    const { getOptionalSupabaseAdminClient } = await import("@/lib/supabase");
    const client = getOptionalSupabaseAdminClient();
    expect(mockCreateClient).toHaveBeenCalled();
    expect(client).toBeDefined();
  });

  it("returns null when admin env vars are missing", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://test.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "test-anon-key");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "");
    vi.resetModules();
    const { getOptionalSupabaseAdminClient } = await import("@/lib/supabase");
    const client = getOptionalSupabaseAdminClient();
    expect(client).toBeNull();
  });

  it("returns null when url is missing", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "test-anon-key");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "test-service-role-key");
    vi.resetModules();
    const { getOptionalSupabaseAdminClient } = await import("@/lib/supabase");
    const client = getOptionalSupabaseAdminClient();
    expect(client).toBeNull();
  });
});
