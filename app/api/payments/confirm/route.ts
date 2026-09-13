import { NextRequest } from "next/server";
import { apiError, json, withErrorHandling } from "@/lib/api";

export const runtime = "nodejs";
export const maxDuration = 60;
import { getSupabaseAdminClient } from "@/lib/supabase";
import { getPesapalTransactionStatus, normalizePesapalStatus, extractCurrency } from "@/lib/pesapal";

export const POST = withErrorHandling(async (request: NextRequest) => {
  const { orderId, trackingId } = await request.json().catch(() => ({}));
  if (!orderId) return apiError("Missing orderId", 400);

  const adminSupabase = getSupabaseAdminClient();

  const { data: payment } = await adminSupabase
    .from("payments")
    .select("merchant_reference, tracking_id")
    .eq("order_id", orderId)
    .maybeSingle();

  if (!payment?.merchant_reference) return apiError("Payment not found for this order", 404);

  // Prefer the tracking ID from the Pesapal redirect, but fall back to the one
  // we stored at order creation — some Pesapal callback redirects omit it and
  // the customer would otherwise be stuck at "pending" with no way to verify.
  const resolvedTrackingId = (trackingId as string | undefined)?.trim() || (payment.tracking_id as string | undefined)?.trim() || "";

  if (!resolvedTrackingId) return apiError("Payment is missing a tracking ID", 400);

  let statusPayload: unknown;
  try {
    statusPayload = await getPesapalTransactionStatus(resolvedTrackingId);
  } catch {
    return apiError("Could not verify payment with Pesapal", 502);
  }

  const normalized = normalizePesapalStatus(statusPayload);

  if (normalized.paymentStatus?.toLowerCase() !== "completed") {
    return apiError("Payment is not yet completed", 402);
  }

  const currency = extractCurrency(normalized.raw);

  const { data: finalized, error: rpcError } = await adminSupabase
    .rpc("finalize_pesapal_payment", {
      payment_reference: payment.merchant_reference,
      pesapal_tracking_id: normalized.trackingId ?? resolvedTrackingId,
      status_payload: normalized.raw,
      payment_currency: currency,
    });

  if (rpcError || !finalized?.ok) {
    console.error("[payments/confirm] finalize_pesapal_payment failed:", rpcError?.message ?? finalized?.error, "order:", orderId);
    return apiError(rpcError?.message ?? finalized?.error ?? "Payment finalization failed", 500);
  }

  // Confirmation email is enqueued by the DB trigger; no manual send needed.

  const { data: download } = await adminSupabase
    .from("downloads")
    .select("token")
    .eq("order_id", orderId)
    .maybeSingle();

  return json({
    ok: true,
    downloadToken: finalized.download_token ?? download?.token ?? "",
    alreadyVerified: finalized.already_processed === true,
  });
});
