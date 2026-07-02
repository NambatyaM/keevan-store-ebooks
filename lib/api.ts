import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { captureException } from "@sentry/nextjs";
import { getSupabaseAdminClient } from "@/lib/supabase";
import { createServerSupabaseClient, applyPendingCookies } from "@/lib/supabase-server";

export function json(data: unknown, init?: ResponseInit) {
  return NextResponse.json(data, init);
}

export function checkCSRF(request: NextRequest) {
  const allowedOrigins = new Set<string>();

  // 1. From NEXT_PUBLIC_SITE_URL env var (configured domain)
  const configuredUrl = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/+$/, "");
  if (configuredUrl) {
    try { allowedOrigins.add(new URL(configuredUrl).origin); } catch {}
  }

  // 2. From the request Host header (covers www vs non-www, custom domains,
  //    preview deployments, etc. — the domain the user actually accessed)
  const host = request.headers.get("host");
  if (host) {
    const protocol = request.headers.get("x-forwarded-proto") || "https";
    try { allowedOrigins.add(new URL(`${protocol}://${host}`).origin); } catch {}
  }

  // 3. From VERCEL_URL for Vercel preview deployments
  const vercelUrl = process.env.VERCEL_URL;
  if (vercelUrl) {
    try { allowedOrigins.add(new URL(`https://${vercelUrl}`).origin); } catch {}
  }

  if (allowedOrigins.size === 0) {
    if (process.env.NODE_ENV === "development") return;
    console.warn("CSRF check skipped: no allowed origins configured");
    return;
  }

  const origin = request.headers.get("origin");
  const referer = request.headers.get("referer");
  const source = (origin && origin !== "null") ? origin : (referer && referer !== "null") ? referer : null;

  if (!source) {
    console.warn("CSRF check skipped: no Origin or Referer header");
    return;
  }

  try {
    const sourceOrigin = new URL(source).origin;
    if (allowedOrigins.has(sourceOrigin)) return;
    throw Object.assign(new Error("Cross-site request forbidden"), { status: 403 });
  } catch (e) {
    if (e instanceof TypeError) {
      throw Object.assign(new Error("Cross-site request forbidden"), { status: 403 });
    }
    throw e;
  }
}

export function apiError(message: string, status = 400, details?: unknown) {
  return json({ error: { message, details } }, { status });
}

export async function readJson<T>(request: NextRequest, schema: z.Schema<T>) {
  try {
    return schema.parse(await request.json());
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw Object.assign(new Error("Validation failed"), { status: 422, details: error.flatten() });
    }
    throw Object.assign(new Error("Invalid JSON body"), { status: 400 });
  }
}

export function withErrorHandling(handler: (request: NextRequest, context?: unknown) => Promise<Response>) {
  return async (request: NextRequest, context?: unknown) => {
    try {
      const limited = await rateLimit(request);
      if (limited) return limited;

      if (request.method !== "GET" && request.method !== "HEAD") {
        checkCSRF(request);
      }

      return await applyPendingCookies(request, await handler(request, context));
    } catch (error) {
      const err = error as Error & { status?: number; details?: unknown };
      const status = err.status ?? 500;

      if (status >= 500) {
        console.error(
          JSON.stringify({
            level: "error",
            timestamp: new Date().toISOString(),
            path: request.nextUrl?.pathname ?? "unknown",
            method: request.method,
            message: err.message,
            status,
            ...(process.env.NODE_ENV === "production" ? {} : { details: err.details, stack: err.stack })
          })
        );
        captureException(error);
      } else {
        console.warn(
          JSON.stringify({
            level: "warn",
            timestamp: new Date().toISOString(),
            path: request.nextUrl?.pathname ?? "unknown",
            method: request.method,
            message: err.message,
            status,
          })
        );
      }

      return await applyPendingCookies(request, apiError(status === 500 ? "Unexpected server error" : err.message, status, err.details));
    }
  };
}

export function withOptionalCsrf(handler: (request: NextRequest, context?: unknown) => Promise<Response>) {
  return async (request: NextRequest, context?: unknown) => {
    try {
      const limited = await rateLimit(request);
      if (limited) return limited;
      return await applyPendingCookies(request, await handler(request, context));
    } catch (error) {
      const err = error as Error & { status?: number; details?: unknown };
      const status = err.status ?? 500;

      if (status >= 500) {
        console.error(
          JSON.stringify({
            level: "error",
            timestamp: new Date().toISOString(),
            path: request.nextUrl?.pathname ?? "unknown",
            method: request.method,
            message: err.message,
            status,
            ...(process.env.NODE_ENV === "production" ? {} : { details: err.details, stack: err.stack })
          })
        );
        captureException(error);
      } else {
        console.warn(
          JSON.stringify({
            level: "warn",
            timestamp: new Date().toISOString(),
            path: request.nextUrl?.pathname ?? "unknown",
            method: request.method,
            message: err.message,
            status,
          })
        );
      }

      return await applyPendingCookies(request, apiError(status === 500 ? "Unexpected server error" : err.message, status, err.details));
    }
  };
}

export async function rateLimit(request: NextRequest, maxRequests = 60, windowSeconds = 60) {
  const forwardedFor = request.headers.get("x-forwarded-for");
  const realIp = request.headers.get("x-real-ip");
  const ip = forwardedFor?.split(",")[0]?.trim() || realIp || "local";
  const windowStart = new Date(Math.floor(Date.now() / (windowSeconds * 1000)) * (windowSeconds * 1000)).toISOString();

  try {
    const supabase = getSupabaseAdminClient();
    const { error } = await supabase.rpc("rate_limit_check_and_increment", {
      p_key: ip,
      p_window_start: windowStart,
      p_max_requests: maxRequests,
      p_window_seconds: windowSeconds
    });

    if (error) {
      if (error.message?.includes("Rate limit exceeded") || error.message?.includes("Too many requests")) {
        return apiError("Too many requests. Please try again shortly.", 429);
      }
      console.warn("[RateLimit] RPC error:", error.message, "— allowing request");
      return null;
    }

    return null;
  } catch (e) {
    console.warn("[RateLimit] DB call failed — allowing request:", e instanceof Error ? e.message : e);
    return null;
  }
}

export async function resolveUser(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const token = authHeader?.replace(/^Bearer\s+/i, "");

  if (token) {
    const supabase = getSupabaseAdminClient();
    const { data, error } = await supabase.auth.getUser(token);
    if (!error && data.user) {
      return { user: data.user };
    }
  }

  const cookieClient = createServerSupabaseClient(request);
  const { data: userData } = await cookieClient.auth.getUser();
  if (userData.user) {
    return { user: userData.user };
  }

  return { user: null };
}

export async function requireUser(request: NextRequest) {
  const { user } = await resolveUser(request);

  if (!user) {
    throw Object.assign(new Error("Authentication required"), { status: 401 });
  }

  const supabase = getSupabaseAdminClient();

  try { await supabase.rpc("set_app_api_key"); } catch {}

  const { data: profile, error: profileError } = await supabase.from("users").select("*").eq("id", user.id).single();

  if (profileError || !profile) {
    throw Object.assign(new Error("User profile not found"), { status: 403 });
  }

  return { supabase, authUser: user, profile };
}

export async function requireAdmin(request: NextRequest) {
  const session = await requireUser(request);
  if (session.profile.role !== "admin") {
    throw Object.assign(new Error("Admin access required"), { status: 403 });
  }
  return session;
}

export async function logAdminAction(input: {
  adminUserId: string;
  action: string;
  targetTable: string;
  targetId?: string;
  metadata?: Record<string, unknown>;
}) {
  const supabase = getSupabaseAdminClient();
  await supabase.from("admin_logs").insert({
    admin_user_id: input.adminUserId,
    action: input.action,
    target_table: input.targetTable,
    target_id: input.targetId,
    metadata: input.metadata ?? {}
  });
}
