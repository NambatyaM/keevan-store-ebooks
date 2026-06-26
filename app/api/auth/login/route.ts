import { NextRequest } from "next/server";
import { apiError, json, readJson, withErrorHandling } from "@/lib/api";
import { getSupabaseClient } from "@/lib/supabase";
import { loginSchema } from "@/lib/schemas";

export const POST = withErrorHandling(async (request: NextRequest) => {
  const input = await readJson(request, loginSchema);
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.auth.signInWithPassword(input);
  if (error) {
    console.error(JSON.stringify({
      level: "warn", timestamp: new Date().toISOString(),
      event: "login.failed", email: input.email, reason: error.message
    }));
    return apiError(error.message, 401);
  }

  return json({ ok: true, role: data.user?.user_metadata?.role ?? "creator" });
});
