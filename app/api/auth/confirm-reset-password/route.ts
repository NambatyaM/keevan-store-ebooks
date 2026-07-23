import { NextRequest } from "next/server";
import { apiError, json, readJson, withErrorHandling } from "@/lib/api";
import { confirmResetPasswordSchema } from "@/lib/schemas";
import { getSupabaseAdminClient } from "@/lib/supabase";
import { verifyResetToken } from "@/lib/password-reset";

export const POST = withErrorHandling(async (request: NextRequest) => {
  const input = await readJson(request, confirmResetPasswordSchema);

  const result = await verifyResetToken(input.token);
  if (!result) {
    return apiError("Invalid or expired reset link. Please request a new one.", 400);
  }

  const supabase = getSupabaseAdminClient();
  const { error } = await supabase.auth.admin.updateUserById(result.userId, {
    password: input.password,
  });

  if (error) {
    return apiError(error.message, 400);
  }

  return json({ ok: true });
});
