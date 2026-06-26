import { describe, it, expect, vi, beforeEach } from "vitest";

const mockSignInWithPassword = vi.fn();
const mockSignOut = vi.fn();
const mockGetSession = vi.fn();
const mockGetUser = vi.fn();
const mockCreateClient = vi.fn(() => ({
  auth: {
    signInWithPassword: mockSignInWithPassword,
    signOut: mockSignOut,
    getSession: mockGetSession,
    getUser: mockGetUser,
  },
}));

vi.mock("@supabase/supabase-js", () => ({
  createClient: (...args: unknown[]) => mockCreateClient(...args),
}));

const OLD_ENV = process.env;

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://test.supabase.co");
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "test-anon-key");
});

afterAll(() => {
  process.env = OLD_ENV;
});

describe("createBrowserClient", () => {
  it("creates a Supabase client with env vars", async () => {
    const { createBrowserClient } = await import("@/lib/auth");
    const client = createBrowserClient();
    expect(mockCreateClient).toHaveBeenCalledWith("https://test.supabase.co", "test-anon-key");
    expect(client).toBeDefined();
  });

  it("throws when env vars are missing", async () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
    const { createBrowserClient } = await import("@/lib/auth");
    expect(() => createBrowserClient()).toThrow("Supabase public environment variables are missing");
  });
});

describe("login", () => {
  it("calls signInWithPassword and returns data", async () => {
    const mockData = { user: { id: "u1" }, session: { access_token: "tok" } };
    mockSignInWithPassword.mockResolvedValue({ data: mockData, error: null });
    const { login } = await import("@/lib/auth");
    const result = await login("test@test.com", "password123");
    expect(mockSignInWithPassword).toHaveBeenCalledWith({ email: "test@test.com", password: "password123" });
    expect(result).toEqual(mockData);
  });

  it("throws on error", async () => {
    mockSignInWithPassword.mockResolvedValue({ data: null, error: new Error("Invalid credentials") });
    const { login } = await import("@/lib/auth");
    await expect(login("test@test.com", "wrong")).rejects.toThrow("Invalid credentials");
  });
});

describe("logout", () => {
  it("calls signOut successfully", async () => {
    mockSignOut.mockResolvedValue({ error: null });
    const { logout } = await import("@/lib/auth");
    await expect(logout()).resolves.toBeUndefined();
    expect(mockSignOut).toHaveBeenCalled();
  });

  it("throws on error", async () => {
    mockSignOut.mockResolvedValue({ error: new Error("Session not found") });
    const { logout } = await import("@/lib/auth");
    await expect(logout()).rejects.toThrow("Session not found");
  });
});

describe("getSession", () => {
  it("returns the session", async () => {
    const session = { access_token: "tok", user: { id: "u1" } };
    mockGetSession.mockResolvedValue({ data: { session } });
    const { getSession } = await import("@/lib/auth");
    const result = await getSession();
    expect(result).toEqual(session);
  });

  it("returns null when no session", async () => {
    mockGetSession.mockResolvedValue({ data: { session: null } });
    const { getSession } = await import("@/lib/auth");
    const result = await getSession();
    expect(result).toBeNull();
  });
});

describe("getUser", () => {
  it("returns the user", async () => {
    const user = { id: "u1", email: "test@test.com" };
    mockGetUser.mockResolvedValue({ data: { user } });
    const { getUser } = await import("@/lib/auth");
    const result = await getUser();
    expect(result).toEqual(user);
  });

  it("returns null when no user", async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } });
    const { getUser } = await import("@/lib/auth");
    const result = await getUser();
    expect(result).toBeNull();
  });
});
