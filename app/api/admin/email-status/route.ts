import { NextRequest } from "next/server";
import { json, requireAdmin, withErrorHandling } from "@/lib/api";

export const GET = withErrorHandling(async (request: NextRequest) => {
  const { supabase } = await requireAdmin(request);

  const smtpConfigured = !!process.env.RESEND_API_KEY;
  const cronConfigured = !!process.env.CRON_SECRET;

  const [{ count: pending }, { count: processing }, { count: sent }, { count: failed }] = await Promise.all([
    supabase.from("email_queue").select("*", { count: "exact", head: true }).eq("status", "pending"),
    supabase.from("email_queue").select("*", { count: "exact", head: true }).eq("status", "processing"),
    supabase.from("email_queue").select("*", { count: "exact", head: true }).eq("status", "sent"),
    supabase.from("email_queue").select("*", { count: "exact", head: true }).eq("status", "failed"),
  ]);

  return json({
    smtp_configured: smtpConfigured,
    cron_configured: cronConfigured,
    queue_counts: {
      pending: pending ?? 0,
      processing: processing ?? 0,
      sent: sent ?? 0,
      failed: failed ?? 0,
    },
  });
});
