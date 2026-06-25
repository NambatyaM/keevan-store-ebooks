import { NextRequest } from "next/server";
import { apiError, json, readJson, requireUser, withErrorHandling } from "@/lib/api";
import { productSchema } from "@/lib/schemas";
import { getSupabaseClient } from "@/lib/supabase";

export const GET = withErrorHandling(async (request: NextRequest, context?: unknown) => {
  const { params } = context as { params: Promise<{ id: string }> };
  const { id } = await params;
  const authHeader = request.headers.get("authorization");

  if (!authHeader) {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from("products")
      .select("id,store_id,slug,title,description,price,currency,status,cover_path,cover_size,cover_mime,created_at,updated_at")
      .eq("id", id)
      .eq("status", "published")
      .single();

    if (error || !data) return apiError("Product not found", 404);
    return json({ product: data });
  }

  const { supabase, authUser, profile } = await requireUser(request);
  const { data, error } = await supabase.from("products").select("*").eq("id", id).single();

  if (error || !data) return apiError("Product not found", 404);

  if (profile.role !== "admin") {
    const { data: creator, error: creatorError } = await supabase
      .from("creators")
      .select("id")
      .eq("user_id", authUser.id)
      .single();

    if (creatorError || !creator || creator.id !== data.creator_id) {
      return apiError("Product not found", 404);
    }
  }

  return json({ product: data });
});

export const PATCH = withErrorHandling(async (request: NextRequest, context?: unknown) => {
  const { params } = context as { params: Promise<{ id: string }> };
  const { id } = await params;
  const input = await readJson(request, productSchema.partial());
  const { supabase } = await requireUser(request);
  const { data, error } = await supabase.from("products").update(input).eq("id", id).select("*").single();
  if (error) return apiError(error.message, 400);
  return json({ product: data });
});

export const DELETE = withErrorHandling(async (request: NextRequest, context?: unknown) => {
  const { params } = context as { params: Promise<{ id: string }> };
  const { id } = await params;
  const { supabase } = await requireUser(request);
  const { error } = await supabase.from("products").delete().eq("id", id);
  if (error) return apiError(error.message, 400);
  return json({ ok: true });
});
