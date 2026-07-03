import { NextRequest } from "next/server";
import { apiError, json, withErrorHandling } from "@/lib/api";
import { getSupabaseAdminClient } from "@/lib/supabase";
import { getPesapalTransactionStatus, normalizePesapalStatus, extractCurrency, sendOrderConfirmationEmail } from "@/lib/pesapal";

export const POST = withErrorHandling(async (request: NextRequest) => {
  const { orderId, trackingId } = await request.json().catch(() => ({}));
  if (!orderId || !trackingId) return apiError("Missing orderId or trackingId", 400);

  const adminSupabase = getSupabaseAdminClient();

  const { data: payment } = await adminSupabase
    .from("payments")
    .select("merchant_reference, pesapal_tracking_id")
    .eq("order_id", orderId)
    .maybeSingle();

  if (!payment?.merchant_reference) return apiError("Payment not found for this order", 404);

  let statusPayload: unknown;
  try {
    statusPayload = await getPesapalTransactionStatus(trackingId);
  } catch {
    return apiError("Could not verify payment with Pesapal", 502);
  }

  const normalized = normalizePesapalStatus(statusPayload);

  if (normalized.paymentStatus?.toLowerCase() !== "completed") {
    return apiError("Payment is not yet completed", 402);
  }

  const currency = extractCurrency(normalized.raw);

  const { error: apiKeyError } = await adminSupabase.rpc("set_app_api_key");
  if (apiKeyError) {
    console.warn("[payments/confirm] set_app_api_key warning:", apiKeyError.message);
  }

  const { data: finalized, error: rpcError } = await adminSupabase
    .rpc("finalize_pesapal_payment", {
      payment_reference: payment.merchant_reference,
      pesapal_tracking_id: normalized.trackingId ?? trackingId,
      status_payload: normalized.raw,
      payment_currency: currency,
    });

  if (rpcError || !finalized?.ok) {
    console.error("[payments/confirm] finalize_pesapal_payment failed:", rpcError?.message ?? finalized?.error, "order:", orderId);
    return apiError(rpcError?.message ?? finalized?.error ?? "Payment finalization failed", 500);
  }

  sendOrderConfirmationEmail(adminSupabase, orderId).catch(() => {});

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
