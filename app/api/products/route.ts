import { NextRequest } from "next/server";
import { apiError, json, readJson, requireUser, withErrorHandling } from "@/lib/api";
import { productSchema } from "@/lib/schemas";

export const POST = withErrorHandling(async (request: NextRequest) => {
  const input = await readJson(request, productSchema);
  const { supabase, authUser } = await requireUser(request);
  const { data: creator } = await supabase.from("creators").select("id").eq("user_id", authUser.id).single();
  if (!creator) return apiError("Creator profile not found", 404);

  const { data, error } = await supabase
    .from("products")
    .insert({
      creator_id: creator.id,
      store_id: input.storeId,
      slug: input.slug,
      title: input.title,
      description: input.description,
      price: input.price,
      status: input.status,
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
