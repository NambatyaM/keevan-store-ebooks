import { NextRequest } from "next/server";
import { json, withOptionalCsrf } from "@/lib/api";
import { normalizePesapalStatus, verifyPesapalPayment } from "@/lib/pesapal";
import { getSupabaseAdminClient } from "@/lib/supabase";

export const POST = withOptionalCsrf(async (request: NextRequest) => {
  const rawBody = await request.text();
  const rawPayload = JSON.parse(rawBody);
  const normalized = normalizePesapalStatus(rawPayload);

  if (!normalized.merchantReference || !normalized.trackingId) {
    console.warn("Pesapal webhook received with missing merchantReference or trackingId");
    return json({ ok: true });
  }

  const supabase = getSupabaseAdminClient();

  const result = await verifyPesapalPayment(supabase, normalized.merchantReference, normalized.trackingId);

  if (!result.ok) {
    console.error("Webhook payment verification failed:", { merchantRef: normalized.merchantReference, error: result.error });
  }

  return json({ ok: true, finalized: result.ok });
});
