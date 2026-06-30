import { NextRequest } from "next/server";
import { apiError, json, requireUser, withErrorHandling } from "@/lib/api";
import { ebookUpload, imageUpload } from "@/lib/constants";
import { validateUploadFile } from "@/lib/file-validation";
import { randomUUID } from "crypto";

export const POST = withErrorHandling(async (request: NextRequest) => {
  const { supabase, authUser } = await requireUser(request);

  const { data: creator } = await supabase.from("creators").select("id").eq("user_id", authUser.id).single();
  if (!creator) return apiError("Creator profile not found", 404);

  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  const kind = formData.get("kind") as string | null;

  if (!file || !kind) return apiError("File and kind are required", 400);
  if (kind !== "ebook" && kind !== "image") return apiError("Kind must be 'ebook' or 'image'", 400);

  const rules = kind === "ebook" ? ebookUpload : imageUpload;
  if (file.size > rules.maxBytes) {
    return apiError(`${kind === "ebook" ? "E-book" : "Image"} must be ${rules.maxBytes / 1024 / 1024} MB or less.`, 400);
  }

  const validation = await validateUploadFile(file);
  if (!validation.ok) {
    return apiError(validation.message, 400);
  }

  const ext = file.name.split(".").pop() ?? "bin";
  const storagePath = `${creator.id}/${randomUUID()}.${ext}`;
  const bucket = kind === "image" ? "covers" : "products";

  const arrayBuffer = await file.arrayBuffer();
  const { error: uploadError } = await supabase.storage.from(bucket).upload(storagePath, new Uint8Array(arrayBuffer), {
    contentType: validation.mime,
    upsert: false
  });

  if (uploadError) return apiError(uploadError.message, 400);

  return json({
    path: storagePath,
    size: file.size,
    mime: validation.mime,
    originalName: file.name
  }, { status: 201 });
});
