import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSupabaseAdminClient } from "@/lib/supabase";

const buckets = new Map<string, { count: number; resetAt: number }>();

export function json(data: unknown, init?: ResponseInit) {
  return NextResponse.json(data, init);
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
      const limited = rateLimit(request);
      if (limited) return limited;
      return await handler(request, context);
    } catch (error) {
      const err = error as Error & { status?: number; details?: unknown };
      return apiError(err.message || "Unexpected server error", err.status ?? 500, err.details);
    }
  };
}

export function rateLimit(request: NextRequest) {
  const key = request.headers.get("x-forwarded-for") ?? "local";
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || bucket.resetAt < now) {
    buckets.set(key, { count: 1, resetAt: now + 60_000 });
    return null;
  }

  if (bucket.count >= 120) {
    return apiError("Too many requests. Please try again shortly.", 429);
  }

  bucket.count += 1;
  return null;
}

export async function requireUser(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const token = authHeader?.replace(/^Bearer\s+/i, "");

  if (!token) {
    throw Object.assign(new Error("Authentication required"), { status: 401 });
  }

  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase.auth.getUser(token);

  if (error || !data.user) {
    throw Object.assign(new Error("Invalid authentication token"), { status: 401 });
  }

  const { data: profile, error: profileError } = await supabase.from("users").select("*").eq("id", data.user.id).single();

  if (profileError || !profile) {
    throw Object.assign(new Error("User profile not found"), { status: 403 });
  }

  return { supabase, authUser: data.user, profile };
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
