import { NextRequest } from "next/server";
import { apiError, json, readJson, withErrorHandling } from "@/lib/api";
import { refundRequestSchema } from "@/lib/schemas";
import { getSupabaseAdminClient } from "@/lib/supabase";
import { createServerSupabaseClient } from "@/lib/supabase-server";

export const POST = withErrorHandling(async (request: NextRequest) => {
  const input = await readJson(request, refundRequestSchema);
  const supabase = getSupabaseAdminClient();

  const { data: order, error: orderError } = await supabase
    .from("orders")
    .select("id, buyer_email, buyer_name, status, buyer_id, payments!inner(id,status)")
    .eq("id", input.orderId)
    .maybeSingle();

  if (orderError || !order) {
    return apiError("Order not found", 404);
  }

  if (order.buyer_email.toLowerCase() !== input.buyerEmail.toLowerCase()) {
    return apiError("Email does not match the order", 403);
  }

  if (order.status !== "paid") {
    return apiError("Only completed orders can be refunded", 400);
  }

  // Verify authenticated user owns this order (if buyer is logged in)
  const cookieClient = createServerSupabaseClient(request);
  const { data: userData } = await cookieClient.auth.getUser();
  const sessionUser = userData.user;

  if (sessionUser) {
    const { data: buyerRecord } = await supabase
      .from("buyers")
      .select("id")
      .eq("user_id", sessionUser.id)
      .maybeSingle();

    if (buyerRecord && order.buyer_id && order.buyer_id !== buyerRecord.id) {
      return apiError("Access denied: you do not own this order", 403);
    }
  }

  const payment = Array.isArray(order.payments) ? order.payments[0] : order.payments;
  if (!payment || payment.status !== "completed") {
    return apiError("Payment is not in a refundable state", 400);
  }

  const { data: existingRefund } = await supabase
    .from("refunds")
    .select("id, status")
    .eq("order_id", input.orderId)
    .maybeSingle();

  if (existingRefund) {
    return apiError(`A refund request already exists (${existingRefund.status})`, 409);
  }

  const { data: refund, error: insertError } = await supabase
    .from("refunds")
    .insert({
      order_id: input.orderId,
      payment_id: payment.id,
      buyer_email: order.buyer_email,
      buyer_name: order.buyer_name,
      reason: input.reason
    })
    .select()
    .single();

  if (insertError) {
    return apiError(insertError.message || "Failed to submit refund request", 500);
  }

  return json({ refund, message: "Refund request submitted. An admin will review it shortly." }, { status: 201 });
});
