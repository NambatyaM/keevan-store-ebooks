import { NextRequest } from "next/server";
import { apiError, json, readJson, requireUser, withErrorHandling } from "@/lib/api";
import { creatorSchema } from "@/lib/schemas";

export const PATCH = withErrorHandling(async (request: NextRequest, context?: unknown) => {
  const { params } = context as { params: Promise<{ id: string }> };
  const { id } = await params;
  const input = await readJson(request, creatorSchema.partial());
  const { supabase, authUser, profile } = await requireUser(request);

  if (profile.role !== "admin") {
    const { data: creator, error: creatorError } = await supabase.from("creators").select("user_id").eq("id", id).single();
    if (creatorError) return apiError(creatorError.message, 500);
    if (!creator || creator.user_id !== authUser.id) {
      return apiError("Creator not found", 404);
    }
  }

  const { data, error } = await supabase.from("creators").update(input).eq("id", id).select("*").single();
  if (error) return apiError(error.message, 400);
  return json({ creator: data });
});
