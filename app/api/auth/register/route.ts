import { NextRequest } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase";
import { apiError, json, readJson, withErrorHandling } from "@/lib/api";
import { registerSchema } from "@/lib/schemas";

export const POST = withErrorHandling(async (request: NextRequest) => {
  const input = await readJson(request, registerSchema);
  const supabase = getSupabaseAdminClient();

  const { data: existingSlug } = await supabase
    .from("stores")
    .select("slug")
    .eq("slug", input.storeHandle)
    .maybeSingle();

  if (existingSlug) {
    return apiError("This store URL handle is already taken. Please choose another one.", 409);
  }

  const { data, error } = await supabase.auth.admin.createUser({
    email: input.email,
    password: input.password,
    email_confirm: true,
    user_metadata: { full_name: input.fullName, role: "creator" }
  });

  if (error || !data.user) return apiError(error?.message ?? "Unable to register user", 400);

  const userId = data.user.id;

  const { error: userError } = await supabase.from("users").insert({ id: userId, email: input.email, full_name: input.fullName, role: "creator" });
  if (userError) {
    await supabase.auth.admin.deleteUser(userId);
    return apiError(userError.message, 400);
  }

  const { data: creator, error: creatorError } = await supabase
    .from("creators")
    .insert({ user_id: userId, display_name: input.fullName })
    .select("id")
    .single();

  if (creatorError || !creator) {
    await supabase.from("users").delete().eq("id", userId);
    await supabase.auth.admin.deleteUser(userId);
    return apiError(creatorError?.message ?? "Unable to create creator profile", 400);
  }

  const { error: storeError } = await supabase.from("stores").insert({
    creator_id: creator.id,
    slug: input.storeHandle,
    name: `${input.fullName}'s Store`,
    currency: input.currency
  });

  if (storeError) {
    await supabase.from("creators").delete().eq("id", creator.id);
    await supabase.from("users").delete().eq("id", userId);
    await supabase.auth.admin.deleteUser(userId);
    return apiError(storeError.message, 400);
  }

  return json({ userId, creatorId: creator.id, storeHandle: input.storeHandle }, { status: 201 });
});
