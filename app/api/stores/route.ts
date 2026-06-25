import { NextRequest } from "next/server";
import { apiError, json, readJson, requireUser, withErrorHandling } from "@/lib/api";
import { storeSchema } from "@/lib/schemas";

export const POST = withErrorHandling(async (request: NextRequest) => {
  const input = await readJson(request, storeSchema);
  const { supabase, authUser } = await requireUser(request);

  const { data: creator } = await supabase.from("creators").select("id").eq("user_id", authUser.id).single();
  if (!creator) return apiError("Creator profile not found", 404);

  const { data, error } = await supabase.from("stores").insert({ creator_id: creator.id, ...input }).select("*").single();
  if (error) return apiError(error.message, 400);
  return json({ store: data }, { status: 201 });
});
