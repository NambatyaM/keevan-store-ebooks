import { NextRequest } from "next/server";
import { apiError, json, readJson, withErrorHandling, requireUser } from "@/lib/api";

export const runtime = "nodejs";
export const maxDuration = 60;
import { paymentVerifySchema } from "@/lib/schemas";
import { verifyPesapalPayment } from "@/lib/pesapal";
import { getSupabaseAdminClient } from "@/lib/supabase";

export const POST = withErrorHandling(async (request: NextRequest) => {
  const input = await readJson(request, paymentVerifySchema);
  const { profile } = await requireUser(request);
  const supabase = getSupabaseAdminClient();

  // Verify the user owns this payment by checking the order's buyer_email or buyer_id
  const { data: payment } = await supabase
    .from("payments")
    .select("merchant_reference, order:order_id(buyer_email, buyer:buyer_id(user_id))")
    .eq("merchant_reference", input.merchantReference)
    .maybeSingle();

  if (!payment) {
    return apiError("Payment not found", 404);
  }

  const order = Array.isArray(payment.order) ? payment.order[0] : payment.order;
  if (order) {
    const orderBuyerArr = order.buyer as { user_id: string }[] | null;
    const orderBuyer = Array.isArray(orderBuyerArr) && orderBuyerArr.length > 0 ? orderBuyerArr[0] : null;
    const orderBuyerEmail = order.buyer_email as string | null;

    if (orderBuyer) {
      const buyerUserId = orderBuyer.user_id;
      if (profile.id !== buyerUserId) {
        return apiError("Access denied", 403);
      }
    } else {
      if (orderBuyerEmail?.toLowerCase() !== profile.email?.toLowerCase()) {
        return apiError("Access denied", 403);
      }
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
