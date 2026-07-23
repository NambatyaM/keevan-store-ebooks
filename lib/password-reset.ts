import crypto from "crypto";
import { getSupabaseAdminClient } from "@/lib/supabase";

const TOKEN_EXPIRY_MINUTES = 30;

function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export async function generateResetToken(userId: string): Promise<{ token: string; expiresAt: Date }> {
  const supabase = getSupabaseAdminClient();
  const rawToken = crypto.randomBytes(32).toString("hex");
  const tokenHash = hashToken(rawToken);
  const expiresAt = new Date(Date.now() + TOKEN_EXPIRY_MINUTES * 60 * 1000);

  await supabase.from("password_reset_tokens").insert({
    user_id: userId,
    token_hash: tokenHash,
    expires_at: expiresAt.toISOString(),
  });

  return { token: rawToken, expiresAt };
}

export async function verifyResetToken(token: string): Promise<{ userId: string } | null> {
  const supabase = getSupabaseAdminClient();
  const tokenHash = hashToken(token);

  const { data, error } = await supabase
    .from("password_reset_tokens")
    .select("id, user_id")
    .eq("token_hash", tokenHash)
    .eq("used", false)
    .gt("expires_at", new Date().toISOString())
    .single();

  if (error || !data) return null;

  // Mark token as used
  await supabase
    .from("password_reset_tokens")
    .update({ used: true })
    .eq("id", data.id);

  return { userId: data.user_id };
}

export function getResetTokenExpiryMinutes(): number {
  return TOKEN_EXPIRY_MINUTES;
}
