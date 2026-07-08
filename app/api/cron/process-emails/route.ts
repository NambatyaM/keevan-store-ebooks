import { NextRequest } from "next/server";
import { json, withOptionalCsrf } from "@/lib/api";
import { getSupabaseAdminClient } from "@/lib/supabase";
import { renderAndSend } from "@/lib/email-processor";

export const runtime = "nodejs";
export const maxDuration = 120;

async function authorizeCron(request: NextRequest): Promise<void> {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    throw Object.assign(new Error("CRON_SECRET not configured"), { status: 500 });
  }

  const authHeader = request.headers.get("authorization");
  const headerSecret = request.headers.get("x-vercel-cron-secret");

  if (authHeader === `Bearer ${secret}` || headerSecret === secret) {
    return;
  }

  throw Object.assign(new Error("Unauthorized"), { status: 401 });
}

async function processEmails(request: NextRequest): Promise<Response> {
  await authorizeCron(request);

  const supabase = getSupabaseAdminClient();

  const url = new URL(request.url);
  const limit = Math.min(Number(url.searchParams.get("limit")) || 100, 500);

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

  return json({ ok: true, processed, failed, total: queueItems.length });
}

export const GET = withOptionalCsrf(processEmails);
export const POST = withOptionalCsrf(processEmails);
