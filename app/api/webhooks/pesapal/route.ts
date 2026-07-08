import { NextRequest } from "next/server";
import { json, withOptionalCsrf } from "@/lib/api";

export const runtime = "nodejs";
export const maxDuration = 60;
import { normalizePesapalStatus, verifyPesapalPayment } from "@/lib/pesapal";
import { getSupabaseAdminClient } from "@/lib/supabase";

export const POST = withOptionalCsrf(async (request: NextRequest) => {
  // --- 1. IPN ID authentication ---
  // Validate the IPN ID if configured. If it doesn't match, log and return 200
  // to avoid Pesapal retrying indefinitely with a spoofed/wrong notification.
  const expectedIpnId = process.env.PESAPAL_IPN_ID;
  const receivedIpnId = request.nextUrl.searchParams.get("ipn_id") ?? "";
  if (expectedIpnId && receivedIpnId !== expectedIpnId) {
    console.warn("[PesapalIPN] IPN ID mismatch — received:", receivedIpnId, "expected:", expectedIpnId);
    // Return 200 so Pesapal stops retrying; we've logged the suspicious request.
    return json({ ok: true });
  }

  // --- 2. Parse body — malformed JSON must never return 500 or 4xx ---
  // Pesapal retries on any non-200 response, so always return 200 after logging.
  let rawPayload: unknown;
  try {
    rawPayload = await request.json();
  } catch {
    console.warn("[PesapalIPN] Malformed JSON body — ignoring");
    return json({ ok: true });
  }

  // --- 3. Normalize the notification payload ---
  const normalized = normalizePesapalStatus(rawPayload);

  if (!normalized.merchantReference || !normalized.trackingId) {
    // Not enough info to look up the payment — log and return 200.
    console.warn("[PesapalIPN] Missing merchantReference or trackingId in payload", JSON.stringify(rawPayload));
    return json({ ok: true });
  }

  // --- 4. Verify and finalize the payment ---
  // Any error inside verifyPesapalPayment (network, DB, etc.) must NOT surface as
  // a 4xx/5xx — Pesapal would retry endlessly. Catch and return 200 instead.
  let finalized = false;
  let alreadyVerified = false;
  try {
    const supabase = getSupabaseAdminClient();
    const result = await verifyPesapalPayment(
      supabase,
      normalized.merchantReference,
      normalized.trackingId
    );

    if (result.ok) {
      finalized = true;
      alreadyVerified = result.alreadyVerified;
    } else {
      // Log failures (amount mismatch, payment not found, etc.) but still return 200.
      console.error("[PesapalIPN] verifyPesapalPayment failed:", result.error, "ref:", normalized.merchantReference);
    }
  } catch (err) {
    // Unexpected error (network timeout, DB unavailable, etc.) — log and return 200.
    console.error("[PesapalIPN] Unexpected error during payment verification:", err, "ref:", normalized.merchantReference);
  }

  // Note: order confirmation email is enqueued automatically by the DB trigger
  // `trg_enqueue_order_confirmation` which fires on orders.status: pending → paid
  // inside finalize_pesapal_payment. No manual enqueue needed here.

  return json({ ok: true, finalized, alreadyVerified });
});
