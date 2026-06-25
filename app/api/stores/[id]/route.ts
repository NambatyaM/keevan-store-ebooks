import { NextRequest } from "next/server";
import { apiError, json, readJson, requireUser, withErrorHandling } from "@/lib/api";
import { storeSchema } from "@/lib/schemas";

export const PATCH = withErrorHandling(async (request: NextRequest, context?: unknown) => {
  const { params } = context as { params: Promise<{ id: string }> };
  const { id } = await params;
  const input = await readJson(request, storeSchema.partial());
  const { supabase } = await requireUser(request);
  const { data, error } = await supabase.from("stores").update(input).eq("id", id).select("*").single();
  if (error) return apiError(error.message, 400);
  return json({ store: data });
});

export const DELETE = withErrorHandling(async (request: NextRequest, context?: unknown) => {
  const { params } = context as { params: Promise<{ id: string }> };
  const { id } = await params;
  const { supabase } = await requireUser(request);
  const { error } = await supabase.from("stores").delete().eq("id", id);
  if (error) return apiError(error.message, 400);
  return json({ ok: true });
});
