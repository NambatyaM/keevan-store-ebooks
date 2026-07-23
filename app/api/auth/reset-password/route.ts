import { NextRequest } from "next/server";
import { apiError, json, readJson, withErrorHandling } from "@/lib/api";
import { resetPasswordSchema } from "@/lib/schemas";
import { getSupabaseAdminClient } from "@/lib/supabase";
import { generateResetToken, getResetTokenExpiryMinutes } from "@/lib/password-reset";
import { sendEmail } from "@/lib/email";
import { passwordResetHtml } from "@/lib/email-templates";

export const POST = withErrorHandling(async (request: NextRequest) => {
  const input = await readJson(request, resetPasswordSchema);
  const supabase = getSupabaseAdminClient();

  // Look up user by email
  const { data: userData, error: userError } = await supabase.auth.admin.listUsers();
  if (userError) return apiError("Failed to process request", 500);

  const user = userData.users.find((u) => u.email?.toLowerCase() === input.email.toLowerCase());
  if (!user) {
    // Return success even if user not found to prevent email enumeration
    return json({ ok: true });
  }

  // Generate a reset token
  const { token } = await generateResetToken(user.id);

  // Build reset URL
  const origin = process.env.NEXT_PUBLIC_SITE_URL || request.headers.get("origin") || new URL(request.url).origin;
  const resetUrl = `${origin.replace(/\/+$/, "")}/update-password?token=${token}`;

  // Send the email via Resend
  const result = await sendEmail({
    to: input.email,
    subject: "Reset Your Keevan Store Password",
    html: passwordResetHtml({
      resetUrl,
      expiresInMinutes: getResetTokenExpiryMinutes(),
    }),
  });

  if (!result.ok) {
    return apiError("Failed to send reset email. Please try again.", 500);
  }

  return json({ ok: true });
});
