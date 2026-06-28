import { NextRequest } from "next/server";
import { apiError, json, readJson, withErrorHandling, requireUser, checkCSRF } from "@/lib/api";
import { paymentVerifySchema } from "@/lib/schemas";
import { verifyPesapalPayment } from "@/lib/pesapal";
import { getSupabaseAdminClient } from "@/lib/supabase";

export const POST = withErrorHandling(async (request: NextRequest) => {
  checkCSRF(request);
  const input = await readJson(request, paymentVerifySchema);
  const { profile } = await requireUser(request);
  const supabase = getSupabaseAdminClient();

  // Verify the user owns this payment by checking the order's buyer_email or buyer_id
  const { data: payment } = await supabase
    .from("payments")
    .select("merchant_reference, order:order_id(buyer_email, buyer_id)")
    .eq("merchant_reference", input.merchantReference)
    .maybeSingle();

  if (!payment) {
    return apiError("Payment not found", 404);
  }

  const order = Array.isArray(payment.order) ? payment.order[0] : payment.order;
  if (order) {
    const orderBuyerId = order.buyer_id as string | null;
    const orderBuyerEmail = order.buyer_email as string | null;

    // Authenticated buyer must match the order buyer_id
    if (orderBuyerId && profile.id !== orderBuyerId) {
      return apiError("Access denied", 403);
    }
    // Guest buyers: verify by email match
    if (!orderBuyerId && orderBuyerEmail?.toLowerCase() !== profile.email?.toLowerCase()) {
      return apiError("Access denied", 403);
    }
  }

  const result = await verifyPesapalPayment(supabase, input.merchantReference, input.trackingId);

  if (!result.ok) {
    const status = result.error === "Payment not found" ? 404
      : result.error === "Payment is not completed" ? 402
      : 409;
    const raw = Object.keys(result.raw).length ? result.raw : undefined;
    return apiError(result.error, status, raw);
  }

  return json({ ok: true, downloadToken: result.downloadToken, alreadyVerified: result.alreadyVerified });
});
