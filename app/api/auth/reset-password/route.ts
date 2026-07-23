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

  // Look up user by email directly from the users table (avoids O(n) listUsers pagination)
  const { data: userData } = await supabase
    .from("users")
    .select("id")
    .eq("email", input.email.toLowerCase())
    .maybeSingle();

  if (!userData) {
    // Return success even if user not found to prevent email enumeration
    return json({ ok: true });
  }

  // Generate a reset token
  const { token } = await generateResetToken(userData.id);

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
    console.error(JSON.stringify({
      level: "error",
      timestamp: new Date().toISOString(),
      path: "/api/auth/reset-password",
      message: "Email send failed",
      resendError: result.error,
      hasApiKey: !!process.env.RESEND_API_KEY,
      smtpFrom: process.env.SMTP_FROM,
    }));
    return apiError("Failed to send reset email. Please try again.", 500);
  }

  return json({ ok: true });
});
