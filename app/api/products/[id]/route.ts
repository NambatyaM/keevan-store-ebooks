import { NextRequest } from "next/server";
import { apiError, json, readJson, requireUser, withErrorHandling } from "@/lib/api";
import { productUpdateSchema } from "@/lib/schemas";
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
      .maybeSingle();

    if (error || !data) return apiError("Product not found", 404);
    return json({ product: data });
  }

  const { supabase, authUser, profile } = await requireUser(request);
  const { data, error } = await supabase.from("products").select("*").eq("id", id).maybeSingle();

  if (error || !data) return apiError("Product not found", 404);

  if (profile.role !== "admin") {
    const { data: creator } = await supabase
      .from("creators")
      .select("id")
      .eq("user_id", authUser.id)
      .maybeSingle();

    if (!creator || creator.id !== data.creator_id) {
      return apiError("Product not found", 404);
    }
  }

  return json({ product: data });
});

export const PATCH = withErrorHandling(async (request: NextRequest, context?: unknown) => {
  const { params } = context as { params: Promise<{ id: string }> };
  const { id } = await params;
  const input = await readJson(request, productUpdateSchema.partial());
  const { supabase, authUser, profile } = await requireUser(request);

  const { data: product } = await supabase.from("products").select("creator_id").eq("id", id).maybeSingle();
  if (!product) return apiError("Product not found", 404);

  if (profile.role !== "admin") {
    const { data: creator } = await supabase.from("creators").select("id").eq("user_id", authUser.id).maybeSingle();
    if (!creator || product.creator_id !== creator.id) {
      return apiError("Product not found", 404);
    }
  }

  const { data, error } = await supabase.from("products").update(input).eq("id", id).select("*").single();
  if (error) return apiError(error.message, 400);
  return json({ product: data });
});

export const DELETE = withErrorHandling(async (request: NextRequest, context?: unknown) => {
  const { params } = context as { params: Promise<{ id: string }> };
  const { id } = await params;
  const { supabase, authUser, profile } = await requireUser(request);

  const { data: product } = await supabase.from("products").select("file_path,cover_path,creator_id,title,slug").eq("id", id).maybeSingle();
  if (!product) return apiError("Product not found", 404);

  if (profile.role !== "admin") {
    const { data: creator } = await supabase.from("creators").select("id").eq("user_id", authUser.id).maybeSingle();
    if (!creator || product.creator_id !== creator.id) {
      return apiError("Product not found", 404);
    }
  }

  const { error } = await supabase.from("products").delete().eq("id", id);
  if (error) return apiError(error.message, 400);

  const removePaths = [product.file_path].filter(Boolean);
  if (product.cover_path) removePaths.push(product.cover_path);
  if (removePaths.length > 0) {
    await supabase.storage.from("products").remove(removePaths);
  }

  return json({ ok: true });
});
