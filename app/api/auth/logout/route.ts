import { NextRequest } from "next/server";
import { json, requireUser, withErrorHandling } from "@/lib/api";

export const POST = withErrorHandling(async (request: NextRequest) => {
  const { supabase, authUser } = await requireUser(request);
  await supabase.auth.admin.signOut(authUser.id);
  return json({ ok: true });
});
