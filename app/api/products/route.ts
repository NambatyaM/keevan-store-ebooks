import { NextRequest } from "next/server";
import { apiError, json, readJson, requireUser, requireAdmin, withErrorHandling } from "@/lib/api";
import { productSchema } from "@/lib/schemas";

export const GET = withErrorHandling(async (request: NextRequest) => {
  const { supabase, authUser, profile } = await requireUser(request);

  if (profile.role === "admin") {
    const { data } = await supabase.from("products").select("*,creators(display_name),stores(name,slug)").order("created_at", { ascending: false });
    return json({ products: data ?? [] });
  }

  const { data: creator } = await supabase.from("creators").select("id").eq("user_id", authUser.id).single();
  if (!creator) return json({ products: [] });

  const { data } = await supabase.from("products").select("*").eq("creator_id", creator.id).order("created_at", { ascending: false });
  return json({ products: data ?? [] });
});

export const POST = withErrorHandling(async (request: NextRequest) => {
  const input = await readJson(request, productSchema);
  const { supabase, authUser } = await requireUser(request);
  const { data: creator } = await supabase.from("creators").select("id").eq("user_id", authUser.id).single();
  if (!creator) return apiError("Creator profile not found", 404);

  const { data: store } = await supabase.from("stores").select("id").eq("id", input.storeId).eq("creator_id", creator.id).maybeSingle();
  if (!store) return apiError("Store not found", 404);

  const { data: fileExists } = await supabase.storage.from("products").info(input.filePath);
  if (!fileExists) return apiError("Uploaded file not found in storage. Please re-upload.", 400);

  if (input.coverPath) {
    const { data: coverExists } = await supabase.storage.from("products").info(input.coverPath);
    if (!coverExists) return apiError("Uploaded cover image not found in storage. Please re-upload.", 400);
  }

  // Default new products to "draft" regardless of client input to enforce moderation
  const { data, error } = await supabase
    .from("products")
    .insert({
      creator_id: creator.id,
      store_id: input.storeId,
      slug: input.slug,
      title: input.title,
      description: input.description,
      price: input.price,
      status: "draft",
      file_path: input.filePath,
      file_size: input.fileSize,
      file_mime: input.fileMime,
      cover_path: input.coverPath,
      cover_size: input.coverSize,
      cover_mime: input.coverMime
    })
    .select("*")
    .single();

  if (error) return apiError(error.message, 400);
  return json({ product: data }, { status: 201 });
});
