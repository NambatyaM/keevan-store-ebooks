import { NextRequest } from "next/server";
import { apiError, json, requireUser, withErrorHandling } from "@/lib/api";
import { randomUUID } from "crypto";

export const runtime = "nodejs";
export const maxDuration = 60;

const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const ALLOWED_EXTENSIONS: Record<string, string[]> = {
  "image/jpeg": ["jpg", "jpeg"],
  "image/png": ["png"],
  "image/webp": ["webp"],
};

export const POST = withErrorHandling(async (request: NextRequest, context?: unknown) => {
  if (!context) return apiError("Not found", 404);
  const { params } = context as { params: Promise<{ id: string }> };
  const { id } = await params;
  if (!id) return apiError("Not found", 404);

  const { supabase, authUser, profile } = await requireUser(request);

  const { data: store } = await supabase.from("stores").select("id,creator_id,avatar_path").eq("id", id).maybeSingle();
  if (!store) return apiError("Store not found", 404);

  if (profile.role !== "admin") {
    const { data: creator } = await supabase.from("creators").select("id").eq("user_id", authUser.id).maybeSingle();
    if (!creator || store.creator_id !== creator.id) {
      return apiError("Store not found", 404);
    }
  }

  const formData = await request.formData();
  const file = formData.get("file") as File | null;
  if (!file) return apiError("File is required", 400);

  if (file.size === 0) return apiError("File is empty.", 400);
  if (file.size > 2 * 1024 * 1024) {
    return apiError("Avatar must be 2 MB or less.", 400);
  }

  const mime = file.type;
  if (!ALLOWED_TYPES.has(mime)) {
    return apiError("Avatar must be a JPEG, PNG, or WebP image.", 400);
  }

  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  const allowedExts = ALLOWED_EXTENSIONS[mime] ?? [];
  if (!allowedExts.includes(ext)) {
    return apiError(`File extension must be one of: ${allowedExts.join(", ")}.`, 400);
  }

  // Delete old avatar if one exists
  if (store.avatar_path) {
    try {
      await supabase.storage.from("avatars").remove([store.avatar_path]);
    } catch {
      // Best-effort cleanup
    }
  }

  const storageExt = file.name.split(".").pop() ?? "jpg";
  const storagePath = `${authUser.id}/${randomUUID()}.${storageExt}`;

  const arrayBuffer = await file.arrayBuffer();
  const { error: uploadError } = await supabase.storage.from("avatars").upload(storagePath, new Uint8Array(arrayBuffer), {
    contentType: mime,
    upsert: false
  });

  if (uploadError) {
    console.error(JSON.stringify({ level: "error", message: "Supabase storage upload failed", path: storagePath, bucket: "avatars", error: uploadError.message }));
    return apiError("Failed to save avatar. Please try again.", 500);
  }

  const { error: updateError } = await supabase
    .from("stores")
    .update({ avatar_path: storagePath })
    .eq("id", id);

  if (updateError) {
    return apiError("Failed to update store.", 500);
  }

  return json({ avatarPath: storagePath }, { status: 201 });
});

export const DELETE = withErrorHandling(async (request: NextRequest, context?: unknown) => {
  if (!context) return apiError("Not found", 404);
  const { params } = context as { params: Promise<{ id: string }> };
  const { id } = await params;
  if (!id) return apiError("Not found", 404);

  const { supabase, authUser, profile } = await requireUser(request);

  const { data: store } = await supabase.from("stores").select("id,creator_id,avatar_path").eq("id", id).maybeSingle();
  if (!store) return apiError("Store not found", 404);

  if (profile.role !== "admin") {
    const { data: creator } = await supabase.from("creators").select("id").eq("user_id", authUser.id).maybeSingle();
    if (!creator || store.creator_id !== creator.id) {
      return apiError("Store not found", 404);
    }
  }

  if (!store.avatar_path) return apiError("No avatar to remove.", 400);

  try {
    await supabase.storage.from("avatars").remove([store.avatar_path]);
  } catch {
    // Best-effort cleanup
  }

  const { error } = await supabase.from("stores").update({ avatar_path: null }).eq("id", id);
  if (error) return apiError("Failed to update store.", 500);

  return json({ ok: true });
});
