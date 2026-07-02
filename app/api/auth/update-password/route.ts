import { NextRequest } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { json, requireUser, withErrorHandling } from "@/lib/api";

export const POST = withErrorHandling(async (request: NextRequest) => {
  const { currentPassword, newPassword } = await request.json();

  if (!currentPassword || !newPassword) {
    return json({ error: { message: "Current password and new password are required" } }, { status: 400 });
  }

  if (newPassword.length < 8) {
    return json({ error: { message: "New password must be at least 8 characters" } }, { status: 400 });
  }

  // Verify current password by attempting to sign in
  const cookieClient = createServerSupabaseClient(request);
  const { data: sessionData, error: sessionError } = await cookieClient.auth.getUser();
  if (sessionError || !sessionData.user) {
    return json({ error: { message: "Authentication required" } }, { status: 401 });
  }

  const email = sessionData.user.email;
  if (!email) {
    return json({ error: { message: "Cannot determine user email" } }, { status: 400 });
  }

  // Verify current password
  const { error: signInError } = await cookieClient.auth.signInWithPassword({
    email,
    password: currentPassword,
  });

  if (signInError) {
    return json({ error: { message: "Current password is incorrect" } }, { status: 403 });
  }

  // Update password using admin client
  const adminClient = getSupabaseAdminClient();
  const { error: updateError } = await adminClient.auth.admin.updateUserById(
    sessionData.user.id,
    { password: newPassword }
  );

  if (updateError) {
    return json({ error: { message: updateError.message } }, { status: 400 });
  }

  // Sign out all other sessions
  await adminClient.auth.admin.signOut(sessionData.user.id);

  return json({ ok: true });
});
