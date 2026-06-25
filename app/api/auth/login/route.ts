import { NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { apiError, json, readJson, withErrorHandling } from "@/lib/api";
import { loginSchema } from "@/lib/schemas";

export const POST = withErrorHandling(async (request: NextRequest) => {
  const input = await readJson(request, loginSchema);
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return apiError("Supabase public environment variables are missing.", 500);

  const supabase = createClient(url, key);
  const { data, error } = await supabase.auth.signInWithPassword(input);
  if (error) return apiError(error.message, 401);

  return json({ session: data.session, user: data.user });
});
