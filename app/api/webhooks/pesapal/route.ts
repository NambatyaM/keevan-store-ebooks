import { NextRequest } from "next/server";
import { apiError, json, withErrorHandling } from "@/lib/api";
import { getPesapalTransactionStatus, isPesapalPaymentCompleted, normalizePesapalStatus } from "@/lib/pesapal";
import { getSupabaseAdminClient } from "@/lib/supabase";

export const POST = withErrorHandling(async (request: NextRequest) => {
  const secret = process.env.WEBHOOK_SECRET;
  if (!secret) {
    return apiError("Webhook secret is not configured", 503);
  }

  if (request.headers.get("x-keevan-webhook-secret") !== secret) {
    return apiError("Invalid webhook signature", 401);
  }

  const payload = await request.json();
  const normalizedWebhook = normalizePesapalStatus(payload);
  if (!normalizedWebhook.merchantReference || !normalizedWebhook.trackingId) {
    return apiError("Missing merchant reference or tracking id", 400);
  }

  const supabase = getSupabaseAdminClient();
  const { data: payment, error } = await supabase
    .from("payments")
    .select("id,order_id,merchant_reference,status,orders(amount)")
    .eq("merchant_reference", normalizedWebhook.merchantReference)
    .single();

  if (error || !payment) {
    return apiError("Payment not found", 404);
  }

  const verifiedStatus = normalizePesapalStatus(await getPesapalTransactionStatus(normalizedWebhook.trackingId));
  const paymentOrder = Array.isArray(payment.orders) ? payment.orders[0] : payment.orders;

  if (!verifiedStatus.merchantReference || verifiedStatus.merchantReference !== normalizedWebhook.merchantReference) {
    return apiError("Pesapal merchant reference mismatch", 409, verifiedStatus.raw);
  }

  if (typeof paymentOrder?.amount !== "number" || verifiedStatus.amount !== paymentOrder.amount) {
    return apiError("Pesapal amount mismatch", 409, verifiedStatus.raw);
  }

  if (!isPesapalPaymentCompleted(verifiedStatus.raw)) {
    await supabase
      .from("payments")
      .update({
        tracking_id: verifiedStatus.trackingId,
        status: "failed",
        raw_payload: verifiedStatus.raw
      })
      .eq("id", payment.id)
      .eq("status", "pending");

    await supabase
      .from("orders")
      .update({ status: "failed" })
      .eq("id", payment.order_id)
      .neq("status", "paid");

    return json({ ok: true, finalized: false });
  }

  const { error: finalizeError } = await supabase.rpc("finalize_pesapal_payment", {
    payment_reference: normalizedWebhook.merchantReference,
    pesapal_tracking_id: verifiedStatus.trackingId,
    status_payload: verifiedStatus.raw
  });

  if (finalizeError) {
    return apiError(finalizeError.message, 400);
  }

  return json({ ok: true, finalized: true });
});
