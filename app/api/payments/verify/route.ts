import { NextRequest } from "next/server";
import { apiError, json, readJson, withErrorHandling } from "@/lib/api";
import { paymentVerifySchema } from "@/lib/schemas";
 import { getPesapalTransactionStatus, isPesapalPaymentCompleted, normalizePesapalStatus } from "@/lib/pesapal";
import { getSupabaseAdminClient } from "@/lib/supabase";

export const POST = withErrorHandling(async (request: NextRequest) => {
  const input = await readJson(request, paymentVerifySchema);
  const supabase = getSupabaseAdminClient();
  const { data: payment, error } = await supabase
    .from("payments")
    .select("id,merchant_reference,status,tracking_id,order_id,orders(amount)")
    .eq("merchant_reference", input.merchantReference)
    .single();

  if (error || !payment) {
    return apiError("Payment not found", 404);
  }

  const transactionStatus = normalizePesapalStatus(await getPesapalTransactionStatus(input.trackingId));
  const paymentOrder = Array.isArray(payment.orders) ? payment.orders[0] : payment.orders;

  if (!transactionStatus.merchantReference || transactionStatus.merchantReference !== input.merchantReference) {
    return apiError("Pesapal merchant reference mismatch", 409, transactionStatus.raw);
  }

  if (!transactionStatus.trackingId || transactionStatus.trackingId !== input.trackingId) {
    return apiError("Pesapal tracking id mismatch", 409, transactionStatus.raw);
  }

  if (typeof paymentOrder?.amount !== "number" || transactionStatus.amount !== paymentOrder.amount) {
    return apiError("Pesapal amount mismatch", 409, transactionStatus.raw);
  }

  if (!isPesapalPaymentCompleted(transactionStatus.raw)) {
    await supabase
      .from("payments")
      .update({
        tracking_id: transactionStatus.trackingId,
        status: "failed",
        raw_payload: transactionStatus.raw
      })
      .eq("id", payment.id)
      .eq("status", "pending");

    await supabase
      .from("orders")
      .update({ status: "failed" })
      .eq("id", payment.order_id)
      .neq("status", "paid");

    return apiError("Payment is not completed", 402, transactionStatus.raw);
  }

  const { data: finalizedRows, error: finalizeError } = await supabase.rpc("finalize_pesapal_payment", {
    payment_reference: input.merchantReference,
    pesapal_tracking_id: transactionStatus.trackingId,
    status_payload: transactionStatus.raw
  });

  if (finalizeError) {
    return apiError(finalizeError.message, 400);
  }

  const finalized = finalizedRows?.[0];
  if (!finalized?.download_token) {
    return apiError("Unable to issue download token", 500);
  }

  return json({
    ok: true,
    downloadToken: finalized.download_token,
    alreadyVerified: finalized.already_processed
  });
});
