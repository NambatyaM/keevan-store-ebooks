import { NextRequest } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase";
import { apiError, json, readJson, withErrorHandling } from "@/lib/api";
import { z } from "zod";

const registerBuyerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  fullName: z.string().min(2),
  phone: z.string().optional()
});

export const POST = withErrorHandling(async (request: NextRequest) => {
  const input = await readJson(request, registerBuyerSchema);
  const supabase = getSupabaseAdminClient();

  const { data, error } = await supabase.auth.admin.createUser({
    email: input.email,
    password: input.password,
    email_confirm: true,
    user_metadata: { full_name: input.fullName, role: "buyer" }
  });

  if (error || !data.user) return apiError(error?.message ?? "Unable to register", 400);

  const userId = data.user.id;

  const { error: userError } = await supabase.from("users").insert({
    id: userId,
    email: input.email,
    full_name: input.fullName,
    role: "buyer"
  });

  if (userError) {
    await supabase.auth.admin.deleteUser(userId);
    return apiError(userError.message, 400);
  }

  const { error: buyerError } = await supabase.from("buyers").insert({
    user_id: userId,
    display_name: input.fullName,
    phone: input.phone || null
  });

  if (buyerError) {
    await supabase.from("users").delete().eq("id", userId);
    await supabase.auth.admin.deleteUser(userId);
    return apiError(buyerError.message, 400);
  }

  return json({ userId, role: "buyer" }, { status: 201 });
});
