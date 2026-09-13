import { Resend } from "resend";
import type { SupabaseClient } from "@supabase/supabase-js";

function getResendClient(): Resend | null {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  return new Resend(key);
}

export async function logOrderEmailDelivery(opts: {
  supabase: SupabaseClient;
  orderId: string | null;
  toEmail: string;
  productTitle?: string;
  downloadToken?: string;
  resendId?: string;
}): Promise<void> {
  try {
    await opts.supabase.from("email_deliveries").insert({
      order_id: opts.orderId,
      to_email: opts.toEmail,
      type: "order_confirmation",
      product_title: opts.productTitle ?? null,
      download_token: opts.downloadToken ?? null,
      resend_id: opts.resendId ?? null,
      delivery_status: opts.resendId ? "sent" : "pending",
    });
  } catch (e) {
    console.warn("[logOrderEmailDelivery] insert failed:", e instanceof Error ? e.message : e);
  }
}

/**
 * Query Resend for the delivery status of recently sent order emails.
 * Only refreshes a bounded number of rows per call to keep the admin
 * response fast and avoid hammering the Resend API.
 */
export async function refreshOrderDeliveryStatuses(
  supabase: SupabaseClient,
  limit = 50,
): Promise<number> {
  const resend = getResendClient();
  if (!resend) return 0;

  const { data: rows, error } = await supabase
    .from("email_deliveries")
    .select("id, resend_id")
    .eq("delivery_status", "sent")
    .not("resend_id", "is", null)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error || !rows?.length) return 0;

  let updated = 0;

  for (const row of rows) {
    try {
      const { data } = await resend.emails.get(row.resend_id!);
      if (!data) continue;
      const status = (data as unknown as Record<string, unknown>).last_event ?? (data as unknown as Record<string, unknown>).status ?? "unknown";
      const isTerminal = ["delivered", "bounced", "complained", "failed", "undelivered"].includes(String(status));
      await supabase
        .from("email_deliveries")
        .update({
          delivery_status: String(status),
          delivered_at: status === "delivered" ? new Date().toISOString() : null,
        })
        .eq("id", row.id);
      if (isTerminal || status === "delivered") updated++;
    } catch {
      // Skip individual failures silently
    }
  }

  return updated;
}
