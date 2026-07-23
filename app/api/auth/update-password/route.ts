import { NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getSupabaseAdminClient } from "@/lib/supabase";
import { createServerSupabaseClient } from "@/lib/supabase-server";
import { json, withErrorHandling } from "@/lib/api";

export const POST = withErrorHandling(async (request: NextRequest) => {
  const { currentPassword, newPassword } = await request.json();

  if (!currentPassword || !newPassword) {
    return json({ error: { message: "Current password and new password are required" } }, { status: 400 });
  }

  if (newPassword.length < 8) {
    return json({ error: { message: "New password must be at least 8 characters" } }, { status: 400 });
  }

  if (currentPassword === newPassword) {
    return json({ error: { message: "New password must be different from current password" } }, { status: 400 });
  }

  const cookieClient = createServerSupabaseClient(request);
  const { data: sessionData, error: sessionError } = await cookieClient.auth.getUser();
  if (sessionError || !sessionData.user) {
    return json({ error: { message: "Authentication required" } }, { status: 401 });
  }

  const email = sessionData.user.email;
  if (!email) {
    return json({ error: { message: "Cannot determine user email" } }, { status: 400 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) {
    return json({ error: { message: "Server configuration error" } }, { status: 500 });
  }

  const verifyClient = createClient(supabaseUrl, supabaseAnonKey);
  const { error: signInError } = await verifyClient.auth.signInWithPassword({
    email,
    password: currentPassword,
  });

  if (signInError) {
    return json({ error: { message: "Current password is incorrect" } }, { status: 403 });
  }

  const adminClient = getSupabaseAdminClient();
  const { error: updateError } = await adminClient.auth.admin.updateUserById(
    sessionData.user.id,
    { password: newPassword }
  );

  if (updateError) {
    console.error(JSON.stringify({
      level: "error",
      timestamp: new Date().toISOString(),
      path: "/api/auth/update-password",
      message: updateError.message,
      code: updateError.code,
      userId: sessionData.user.id,
    }));
    return json({ error: { message: updateError.message } }, { status: 400 });
  }

  return json({ ok: true });
});
