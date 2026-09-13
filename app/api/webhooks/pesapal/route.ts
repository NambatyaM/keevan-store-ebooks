import { NextRequest } from "next/server";
import { json, withOptionalCsrf } from "@/lib/api";
import { processPesapalIpn } from "@/lib/pesapal";
import { getSupabaseAdminClient } from "@/lib/supabase";

export const runtime = "nodejs";
export const maxDuration = 60;
export const dynamic = "force-dynamic";

function extractIpnFields(
  params: URLSearchParams,
  body: Record<string, unknown>
): { trackingId: string | null; merchantReference: string | null } {
  const get = (name: string) => params.get(name)?.trim() ?? "";

  const trackingId =
    get("OrderTrackingId") ||
    get("order_tracking_id") ||
    (typeof body.OrderTrackingId === "string" ? String(body.OrderTrackingId).trim() : "") ||
    (typeof body.order_tracking_id === "string" ? String(body.order_tracking_id).trim() : "") ||
    (typeof body.tracking_id === "string" ? String(body.tracking_id).trim() : "");

  const merchantReference =
    get("OrderMerchantReference") ||
    get("order_merchant_reference") ||
    (typeof body.OrderMerchantReference === "string" ? String(body.OrderMerchantReference).trim() : "") ||
    (typeof body.order_merchant_reference === "string" ? String(body.order_merchant_reference).trim() : "") ||
    (typeof body.merchant_reference === "string" ? String(body.merchant_reference).trim() : "");

  return {
    trackingId: trackingId || null,
    merchantReference: merchantReference || null,
  };
}

async function handlePesapalIpn(request: NextRequest) {
  // --- IPN ID is an identifier, not a secret. The real security check is the
  // server-side re-verification against Pesapal inside processPesapalIpn —
  // a spoofed notification can never pass it. So a missing/mismatched ipn_id
  // is logged but NOT fatal (Pesapal sends it in the query string for GET IPNs
  // and in the body for POST IPNs — rejecting based on only one of those was
  // silently dropping real notifications).
  let body: Record<string, unknown> = {};
  let invalidJson = false;
  if (request.method === "POST") {
    try {
      body = (await request.json()) as Record<string, unknown>;
    } catch {
      invalidJson = true;
    }
  }

  const queryIpnId = request.nextUrl.searchParams.get("ipn_id")?.trim() ?? "";
  const bodyIpnId = typeof body.ipn_id === "string" ? String(body.ipn_id).trim() : "";
  const receivedIpnId = queryIpnId || bodyIpnId;
  const expectedIpnId = process.env.PESAPAL_IPN_ID?.trim() ?? "";

  if (expectedIpnId && receivedIpnId && receivedIpnId !== expectedIpnId) {
    console.warn("[PesapalIPN] IPN ID mismatch — received:", receivedIpnId, "expected:", expectedIpnId);
  }

  // Malformed JSON in a POST body. Returning 400 makes Pesapal retry, but a
  // permanently malformed payload would loop forever — so log and accept.
  if (invalidJson) {
    console.warn("[PesapalIPN] POST body was not valid JSON — ignoring", String(request.body ?? ""));
    return json({ ok: true, ignored: "malformed_json" });
  }

  const { trackingId, merchantReference } = extractIpnFields(request.nextUrl.searchParams, body);

  if (!merchantReference || !trackingId) {
    console.warn("[PesapalIPN] Missing tracking/merchant reference — ignoring", JSON.stringify(body));
    return json({ ok: true, ignored: "missing_reference" });
  }

  try {
    const supabase = getSupabaseAdminClient();
    const outcome = await processPesapalIpn({ supabase, merchantReference, trackingId });

    if (outcome.action === "need_retry") {
      // Transient failure (Pesapal API timeout, DB hiccup, etc.). Return 5xx
      // so Pesapal retries — this is what keeps paid orders from getting
      // stranded at "pending" after a single transient error.
      console.warn("[PesapalIPN] Transient verification failure — returning 503 for retry:", outcome.error, "ref:", merchantReference);
      return json({ ok: false, error: outcome.error }, { status: 503 });
    }

    if (outcome.action === "ignored") {
      return json({ ok: true, ignored: outcome.reason });
    }

    return json({
      ok: true,
      finalized: outcome.action === "finalized",
      alreadyVerified: outcome.action === "finalized" ? outcome.alreadyProcessed : false,
      outcome: outcome.action,
    });
  } catch (err) {
    // Unexpected error → 500 so Pesapal retries instead of stranding the order.
    console.error("[PesapalIPN] Unexpected error during payment verification:", err, "ref:", merchantReference);
    return json({ ok: false, error: "internal_error" }, { status: 500 });
  }
}

export const GET = withOptionalCsrf(handlePesapalIpn);
export const POST = withOptionalCsrf(handlePesapalIpn);