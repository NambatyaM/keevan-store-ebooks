import { NextRequest } from "next/server";
import { json, requireUser, withErrorHandling } from "@/lib/api";
import { createServerSupabaseClient } from "@/lib/supabase-server";

export const POST = withErrorHandling(async (request: NextRequest) => {
  await requireUser(request);

  const cookieClient = createServerSupabaseClient(request);
  await cookieClient.auth.signOut();

  return json({ ok: true });
});
