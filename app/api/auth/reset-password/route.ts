import { NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { apiError, json, readJson, withErrorHandling } from "@/lib/api";
import { resetPasswordSchema } from "@/lib/schemas";

export const POST = withErrorHandling(async (request: NextRequest) => {
  const input = await readJson(request, resetPasswordSchema);
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return apiError("Supabase public environment variables are missing.", 500);

  const supabase = createClient(url, key);
  const { error } = await supabase.auth.resetPasswordForEmail(input.email, {
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || "https://keevanstore.in"}/update-password`
  });
  if (error) return apiError(error.message, 400);
  return json({ ok: true });
});
