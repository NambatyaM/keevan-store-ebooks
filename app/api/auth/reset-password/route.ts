import { NextRequest } from "next/server";
import { apiError, json, readJson, withErrorHandling } from "@/lib/api";
import { resetPasswordSchema } from "@/lib/schemas";
import { getSupabaseClient } from "@/lib/supabase";

export const POST = withErrorHandling(async (request: NextRequest) => {
  const input = await readJson(request, resetPasswordSchema);
  const supabase = getSupabaseClient();

  const origin = request.headers.get("origin") || process.env.NEXT_PUBLIC_SITE_URL || "https://keevanstore.in";
  const { error } = await supabase.auth.resetPasswordForEmail(input.email, {
    redirectTo: `${origin.replace(/\/+$/, "")}/update-password`
  });
  if (error) return apiError(error.message, 400);
  return json({ ok: true });
});
