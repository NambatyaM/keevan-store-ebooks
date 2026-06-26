import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const mockGetAll = vi.fn(() => []);
const mockSet = vi.fn();
const mockCreateServerClient = vi.fn(() => ({ auth: {} }));

vi.mock("@supabase/ssr", () => ({
  createServerClient: (...args: unknown[]) => mockCreateServerClient(...args),
}));

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://test.supabase.co");
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "test-anon-key");
});

function makeRequest(): NextRequest {
  return new NextRequest(new URL("https://keevanstore.in/api/test"), {
    headers: { origin: "https://keevanstore.in" },
  });
}

describe("createServerSupabaseClient", () => {
  it("creates a server client with cookie handlers", async () => {
    const { createServerSupabaseClient } = await import("@/lib/supabase-server");
    const req = makeRequest();
    const client = createServerSupabaseClient(req);
    expect(mockCreateServerClient).toHaveBeenCalledWith(
      "https://test.supabase.co",
      "test-anon-key",
      expect.objectContaining({
        cookies: expect.objectContaining({
          getAll: expect.any(Function),
          setAll: expect.any(Function),
        }),
      })
    );
    expect(client).toBeDefined();
  });

  it("getAll delegates to request.cookies.getAll", async () => {
    const { createServerSupabaseClient } = await import("@/lib/supabase-server");
    const req = makeRequest();
    vi.spyOn(req.cookies, "getAll").mockReturnValue([{ name: "sb-token", value: "tok" }]);
    createServerSupabaseClient(req);
    const { cookies } = mockCreateServerClient.mock.calls[0][2];
    const result = cookies.getAll();
    expect(result).toEqual([{ name: "sb-token", value: "tok" }]);
  });

  it("setAll delegates to request.cookies.set", async () => {
    const { createServerSupabaseClient } = await import("@/lib/supabase-server");
    const req = makeRequest();
    vi.spyOn(req.cookies, "set").mockImplementation(mockSet);
    createServerSupabaseClient(req);
    const { cookies } = mockCreateServerClient.mock.calls[0][2];
    cookies.setAll([{ name: "sb-token", value: "new-tok", options: {} }]);
    expect(mockSet).toHaveBeenCalledWith("sb-token", "new-tok");
  });

  it("throws when env vars are missing", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
    const { createServerSupabaseClient } = await import("@/lib/supabase-server");
    expect(() => createServerSupabaseClient(makeRequest())).toThrow("Supabase public environment variables are missing");
  });
});
