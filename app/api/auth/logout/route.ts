import { NextRequest } from "next/server";
import { json, requireUser, withOptionalCsrf } from "@/lib/api";
import { createServerSupabaseClient } from "@/lib/supabase-server";

export const POST = withOptionalCsrf(async (request: NextRequest) => {
  const { supabase, authUser } = await requireUser(request);

  // Invalidate all sessions for this user (covers both cookie and Bearer token)
  await supabase.auth.admin.signOut(authUser.id);

  const cookieClient = createServerSupabaseClient(request);
  await cookieClient.auth.signOut();

  return json({ ok: true });
});
