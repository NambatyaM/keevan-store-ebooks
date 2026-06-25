import { NextRequest } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase";
import { apiError, json, readJson, withErrorHandling } from "@/lib/api";
import { registerSchema } from "@/lib/schemas";

export const POST = withErrorHandling(async (request: NextRequest) => {
  const input = await readJson(request, registerSchema);
  const supabase = getSupabaseAdminClient();

  const { data, error } = await supabase.auth.admin.createUser({
    email: input.email,
    password: input.password,
    email_confirm: true,
    user_metadata: { full_name: input.fullName }
  });

  if (error || !data.user) return apiError(error?.message ?? "Unable to register user", 400);

  await supabase.from("users").insert({ id: data.user.id, email: input.email, full_name: input.fullName, role: "creator" });
  const { data: creator, error: creatorError } = await supabase
    .from("creators")
    .insert({ user_id: data.user.id, display_name: input.fullName })
    .select("id")
    .single();

  if (creatorError || !creator) return apiError(creatorError?.message ?? "Unable to create creator profile", 400);

  const { error: storeError } = await supabase.from("stores").insert({
    creator_id: creator.id,
    slug: input.storeHandle,
    name: `${input.fullName}'s Store`
  });

  if (storeError) return apiError(storeError.message, 400);

  return json({ userId: data.user.id, creatorId: creator.id, storeHandle: input.storeHandle }, { status: 201 });
});
