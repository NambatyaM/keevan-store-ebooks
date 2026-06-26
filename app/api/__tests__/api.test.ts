import { describe, it, expect, vi, beforeEach } from "vitest";
import { apiError, checkCSRF, readJson } from "@/lib/api";
import { NextRequest } from "next/server";
import { z } from "zod";

describe("apiError", () => {
  it("returns a JSON response with error message and default status 400", async () => {
    const res = apiError("Something went wrong");
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body).toEqual({ error: { message: "Something went wrong" } });
  });

  it("returns custom status code", async () => {
    const res = apiError("Not found", 404);
    expect(res.status).toBe(404);
    const body = await res.json();
    expect(body).toEqual({ error: { message: "Not found" } });
  });

  it("includes details when provided", async () => {
    const details = { field: "email", issue: "already taken" };
    const res = apiError("Validation failed", 422, details);
    const body = await res.json();
    expect(body).toEqual({ error: { message: "Validation failed", details } });
  });

  it("returns 500 status for server errors", async () => {
    const res = apiError("Internal error", 500);
    expect(res.status).toBe(500);
  });
});

describe("checkCSRF", () => {
  beforeEach(() => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://keevanstore.in");
  });

  function mockRequest(origin?: string, referer?: string): NextRequest {
    const headers = new Headers();
    if (origin) headers.set("origin", origin);
    if (referer) headers.set("referer", referer);
    return new NextRequest(new URL("https://keevanstore.in/api/test"), { headers });
  }

  it("passes when origin matches site URL", () => {
    const req = mockRequest("https://keevanstore.in");
    expect(() => checkCSRF(req)).not.toThrow();
  });

  it("passes when referer matches site URL", () => {
    const req = mockRequest(undefined, "https://keevanstore.in/some-page");
    expect(() => checkCSRF(req)).not.toThrow();
  });

  it("throws 403 when origin does not match", () => {
    const req = mockRequest("https://evil.com");
    expect(() => checkCSRF(req)).toThrow("Cross-site request forbidden");
    try {
      checkCSRF(req);
    } catch (e) {
      const err = e as Error & { status: number };
      expect(err.status).toBe(403);
    }
  });

  it("throws 403 when referer is from different origin", () => {
    const req = mockRequest(undefined, "https://malicious.net/page");
    expect(() => checkCSRF(req)).toThrow("Cross-site request forbidden");
  });

  it("throws 403 when no origin or referer provided", () => {
    const req = mockRequest();
    expect(() => checkCSRF(req)).toThrow("Cross-site request forbidden");
  });

  it("passes when ALLOWED_ORIGIN has trailing slash", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "https://keevanstore.in/");
    const req = mockRequest("https://keevanstore.in");
    expect(() => checkCSRF(req)).not.toThrow();
  });

  it("passes with www subdomain when allowed", () => {
    const req = mockRequest("https://www.keevanstore.in");
    expect(() => checkCSRF(req)).toThrow("Cross-site request forbidden");
  });

  it("passes when env var is not set", () => {
    vi.stubEnv("NEXT_PUBLIC_SITE_URL", "");
    const req = mockRequest("https://evil.com");
    expect(() => checkCSRF(req)).not.toThrow();
  });
});

describe("readJson", () => {
  const testSchema = z.object({
    name: z.string(),
    age: z.number()
  });

  it("parses valid JSON body against schema", async () => {
    const req = new NextRequest(new URL("http://localhost/api/test"), {
      method: "POST",
      body: JSON.stringify({ name: "Alice", age: 30 }),
      headers: { "Content-Type": "application/json" }
    });
    const result = await readJson(req, testSchema);
    expect(result).toEqual({ name: "Alice", age: 30 });
  });

  it("throws 422 on schema validation failure", async () => {
    const req = new NextRequest(new URL("http://localhost/api/test"), {
      method: "POST",
      body: JSON.stringify({ name: "Alice" }),
      headers: { "Content-Type": "application/json" }
    });
    try {
      await readJson(req, testSchema);
      expect.unreachable("Should have thrown");
    } catch (e) {
      const err = e as Error & { status: number; details: unknown };
      expect(err.message).toBe("Validation failed");
      expect(err.status).toBe(422);
      expect(err.details).toBeDefined();
    }
  });

  it("throws 400 on invalid JSON", async () => {
    const req = new NextRequest(new URL("http://localhost/api/test"), {
      method: "POST",
      body: "{invalid json}",
      headers: { "Content-Type": "application/json" }
    });
    try {
      await readJson(req, testSchema);
      expect.unreachable("Should have thrown");
    } catch (e) {
      const err = e as Error & { status: number };
      expect(err.message).toBe("Invalid JSON body");
      expect(err.status).toBe(400);
    }
  });

  it("throws 400 when body is empty", async () => {
    const req = new NextRequest(new URL("http://localhost/api/test"), {
      method: "POST",
      body: "",
      headers: { "Content-Type": "application/json" }
    });
    try {
      await readJson(req, testSchema);
      expect.unreachable("Should have thrown");
    } catch (e) {
      const err = e as Error & { status: number };
      expect(err.message).toBe("Invalid JSON body");
      expect(err.status).toBe(400);
    }
  });
});
