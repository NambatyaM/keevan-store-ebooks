import { NextRequest } from "next/server";
import { json, logAdminAction, requireAdmin, withErrorHandling } from "@/lib/api";
import { renderAndSend } from "@/lib/email-processor";

export const runtime = "nodejs";
export const maxDuration = 60;

export const POST = withErrorHandling(async (request: NextRequest) => {
  const { supabase, authUser } = await requireAdmin(request);

  const url = new URL(request.url);
  const limit = Math.min(Number(url.searchParams.get("limit")) || 50, 100);

  // Reset items stuck in "processing" for more than 5 minutes (stale recovery)
  await supabase
    .from("email_queue")
    .update({ status: "pending", error_message: null })
    .eq("status", "processing")
    .lt("updated_at", new Date(Date.now() - 5 * 60 * 1000).toISOString());

  // Use atomic claim to prevent race conditions with cron
  const { data: queueItems, error: claimError } = await supabase
    .rpc("claim_email_queue_items", { p_limit: limit });

  if (claimError) {
    return json({ ok: false, error: claimError.message, processed: 0, failed: 0 }, { status: 500 });
  }

  if (!queueItems || queueItems.length === 0) {
    return json({ ok: true, processed: 0, failed: 0, message: "No pending emails" });
  }

  let processed = 0;
  let failed = 0;

  for (const item of queueItems) {
    try {
      const result = await renderAndSend(item);

      if (result.ok) {
        await supabase
          .from("email_queue")
          .update({ status: "sent", sent_at: new Date().toISOString(), error_message: null })
          .eq("id", item.id);

        processed++;
      } else {
        const newRetryCount = (item.retry_count ?? 0) + 1;
        await supabase
          .from("email_queue")
          .update({
            status: newRetryCount >= 3 ? "failed" : "pending",
            error_message: result.error,
            retry_count: newRetryCount,
          })
          .eq("id", item.id);

        failed++;
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      const newRetryCount = (item.retry_count ?? 0) + 1;
      await supabase
        .from("email_queue")
        .update({
          status: newRetryCount >= 3 ? "failed" : "pending",
          error_message: message,
          retry_count: newRetryCount,
        })
        .eq("id", item.id);

      failed++;
    }
  }

  await logAdminAction({
    adminUserId: authUser.id,
    action: "email.process",
    targetTable: "email_queue",
    metadata: { processed, failed, total: queueItems.length },
  });

  return json({ ok: true, processed, failed, total: queueItems.length });
});
