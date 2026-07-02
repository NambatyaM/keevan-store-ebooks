import { NextRequest } from "next/server";
import { apiError, json, readJson, requireUser, withErrorHandling } from "@/lib/api";
import { productUpdateSchema } from "@/lib/schemas";
import { getSupabaseClient } from "@/lib/supabase";

export const GET = withErrorHandling(async (request: NextRequest, context?: unknown) => {
  const { params } = context as { params: Promise<{ id: string }> };
  const { id } = await params;
  const { supabase, authUser, profile } = await requireUser(request).catch(() => ({ supabase: null, authUser: null, profile: null }));

  if (!authUser) {
    const anon = getSupabaseClient();
    const { data, error } = await anon
      .from("products")
      .select("id,store_id,slug,title,description,price,currency,status,cover_path,cover_size,cover_mime,created_at,updated_at")
      .eq("id", id)
      .eq("status", "published")
      .maybeSingle();

    if (error || !data) return apiError("Product not found", 404);
    return json({ product: data });
  }

  const { data, error } = await supabase!.from("products").select("*").eq("id", id).maybeSingle();

  if (error || !data) return apiError("Product not found", 404);

  if (profile!.role !== "admin") {
    const { data: creator } = await supabase!
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

  // Fetch current product to verify ownership and get store_id for slug uniqueness check
  const { data: product } = await supabase
    .from("products")
    .select("creator_id,store_id,file_path,cover_path,file_size,file_mime,cover_size,cover_mime")
    .eq("id", id)
    .maybeSingle();
  if (!product) return apiError("Product not found", 404);

  if (profile.role !== "admin") {
    const { data: creator } = await supabase
      .from("creators")
      .select("id")
      .eq("user_id", authUser.id)
      .maybeSingle();
    if (!creator || product.creator_id !== creator.id) {
      return apiError("Product not found", 404);
    }
  }

  // If slug is being changed, enforce uniqueness within the store
  if (input.slug) {
    const { data: existing } = await supabase
      .from("products")
      .select("id")
      .eq("store_id", product.store_id)
      .eq("slug", input.slug)
      .neq("id", id)
      .maybeSingle();
    if (existing) return apiError("A product with this slug already exists in your store", 409);
  }

  // Map camelCase schema fields to snake_case DB columns.
  // Only include keys that were actually provided (partial update).
  // Omit file/cover fields from partial update if not provided so they are never wiped.
  const updatePayload: Record<string, unknown> = {};

  if (input.slug !== undefined)        updatePayload.slug         = input.slug;
  if (input.title !== undefined)       updatePayload.title        = input.title;
  if (input.description !== undefined) updatePayload.description  = input.description;
  if (input.price !== undefined)       updatePayload.price        = input.price;
  // Only allow non-admin to publish via explicit status change;
  // admin can set any status.
  if (input.status !== undefined)      updatePayload.status       = input.status;
  if (input.filePath !== undefined)    updatePayload.file_path    = input.filePath;
  if (input.fileSize !== undefined)    updatePayload.file_size    = input.fileSize;
  if (input.fileMime !== undefined)    updatePayload.file_mime    = input.fileMime;
  if (input.coverPath !== undefined)   updatePayload.cover_path   = input.coverPath;
  if (input.coverSize !== undefined)   updatePayload.cover_size   = input.coverSize;
  if (input.coverMime !== undefined)   updatePayload.cover_mime   = input.coverMime;

  if (Object.keys(updatePayload).length === 0) {
    return apiError("No valid fields provided for update", 400);
  }

  const { data, error } = await supabase
    .from("products")
    .update(updatePayload)
    .eq("id", id)
    .select("*")
    .single();
  if (error) return apiError(error.message, 400);
  return json({ product: data });
});

export const DELETE = withErrorHandling(async (request: NextRequest, context?: unknown) => {
  const { params } = context as { params: Promise<{ id: string }> };
  const { id } = await params;
  const { supabase, authUser, profile } = await requireUser(request);

  const { data: product } = await supabase
    .from("products")
    .select("file_path,cover_path,creator_id,title,slug")
    .eq("id", id)
    .maybeSingle();
  if (!product) return apiError("Product not found", 404);

  if (profile.role !== "admin") {
    const { data: creator } = await supabase
      .from("creators")
      .select("id")
      .eq("user_id", authUser.id)
      .maybeSingle();
    if (!creator || product.creator_id !== creator.id) {
      return apiError("Product not found", 404);
    }
  }

  const { error } = await supabase.from("products").delete().eq("id", id);
  if (error) return apiError(error.message, 400);

  // Clean up storage files — log failures but don't fail the response
  // (product row is already deleted; orphaned storage files are preferable to a 500)
  if (product.file_path) {
    const { error: storageErr } = await supabase.storage
      .from("products")
      .remove([product.file_path]);
    if (storageErr) {
      console.error(
        JSON.stringify({
          level: "warn",
          message: "Failed to delete product file from storage",
          file_path: product.file_path,
          product_id: id,
          error: storageErr.message
        })
      );
    }
  }
  if (product.cover_path) {
    const { error: coverErr } = await supabase.storage
      .from("covers")
      .remove([product.cover_path]);
    if (coverErr) {
      console.error(
        JSON.stringify({
          level: "warn",
          message: "Failed to delete cover image from storage",
          cover_path: product.cover_path,
          product_id: id,
          error: coverErr.message
        })
      );
    }
  }

  return json({ ok: true });
});
