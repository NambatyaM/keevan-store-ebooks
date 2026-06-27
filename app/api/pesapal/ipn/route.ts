import { NextRequest, NextResponse } from "next/server";
import { getPesapalToken, getPesapalTransactionStatus } from "@/lib/pesapal";
import { getSupabaseAdminClient } from "@/lib/supabase";

export const dynamic = "force-dynamic";

type PesapalIpnResponse = {
  orderNotificationType: string;
  orderTrackingId: string;
  orderMerchantReference: string;
  status: number;
};

function ipnResponse(
  orderTrackingId: string,
  orderMerchantReference: string,
  orderNotificationType: string
): NextResponse<PesapalIpnResponse> {
  return NextResponse.json({
    orderNotificationType,
    orderTrackingId,
    orderMerchantReference,
    status: 200,
  });
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  const searchParams = request.nextUrl.searchParams;
  const orderTrackingId = searchParams.get("OrderTrackingId") ?? "";
  const orderMerchantReference = searchParams.get("OrderMerchantReference") ?? "";
  const orderNotificationType = searchParams.get("OrderNotificationType") ?? "IPNCHANGE";

  console.log("[Pesapal IPN] Received", {
    orderTrackingId,
    orderMerchantReference,
    orderNotificationType,
  });

  if (!orderTrackingId) {
    console.warn("[Pesapal IPN] Missing OrderTrackingId");
    return ipnResponse("", orderMerchantReference, orderNotificationType);
  }

  let transactionStatus: Record<string, unknown>;
  try {
    await getPesapalToken();
    transactionStatus = await getPesapalTransactionStatus(orderTrackingId);
    console.log("[Pesapal IPN] Transaction status:", JSON.stringify(transactionStatus));
  } catch (err) {
    console.error("[Pesapal IPN] Failed to verify with Pesapal:", err);
    return ipnResponse(orderTrackingId, orderMerchantReference, orderNotificationType);
  }

  const paymentStatus = extractPaymentStatus(transactionStatus);
  console.log("[Pesapal IPN] Payment status:", paymentStatus);

  if (!orderMerchantReference) {
    console.warn("[Pesapal IPN] Missing OrderMerchantReference");
    return ipnResponse(orderTrackingId, "", orderNotificationType);
  }

  const supabase = getSupabaseAdminClient();

  const { data: payment, error: lookupError } = await supabase
    .from("payments")
    .select("id, order_id, status")
    .eq("merchant_reference", orderMerchantReference)
    .maybeSingle();

  if (lookupError) {
    console.error("[Pesapal IPN] DB lookup error:", lookupError);
    return ipnResponse(orderTrackingId, orderMerchantReference, orderNotificationType);
  }

  if (!payment) {
    console.warn("[Pesapal IPN] No payment for merchant_reference:", orderMerchantReference);
    return ipnResponse(orderTrackingId, orderMerchantReference, orderNotificationType);
  }

  console.log("[Pesapal IPN] Found payment:", {
    id: payment.id,
    order_id: payment.order_id,
    currentStatus: payment.status,
  });

  const statusLower = paymentStatus.toLowerCase();

  if (statusLower === "completed") {
    await handleCompleted(supabase, payment, orderTrackingId, orderMerchantReference, transactionStatus);
  } else if (statusLower === "failed") {
    await handleFailed(supabase, payment, orderMerchantReference, transactionStatus);
  } else {
    console.log("[Pesapal IPN] Unhandled status — logging only:", paymentStatus, transactionStatus);
  }

  return ipnResponse(orderTrackingId, orderMerchantReference, orderNotificationType);
}

function extractPaymentStatus(payload: Record<string, unknown>): string {
  return (
    (payload.payment_status_description as string) ??
    (payload.paymentStatusDescription as string) ??
    (payload.status as string) ??
    (payload.Status as string) ??
    (payload.payment_status as string) ??
    ""
  );
}

async function handleCompleted(
  supabase: ReturnType<typeof getSupabaseAdminClient>,
  payment: { id: string; order_id: string; status: string },
  trackingId: string,
  merchantReference: string,
  transactionStatus: Record<string, unknown>
) {
  if (payment.status === "completed") {
    console.log("[Pesapal IPN] Payment already completed — skip:", merchantReference);
    return;
  }

  const { error: payUpdateError } = await supabase
    .from("payments")
    .update({
      status: "completed",
      tracking_id: trackingId,
      raw_payload: transactionStatus,
      verified_at: new Date().toISOString(),
    })
    .eq("id", payment.id)
    .eq("status", "pending");

  if (payUpdateError) {
    console.error("[Pesapal IPN] Failed to update payment:", payUpdateError);
    return;
  }

  console.log("[Pesapal IPN] Payment marked completed");

  const { data: order, error: orderError } = await supabase
    .from("orders")
    .select("id, creator_id, amount, creator_earnings, product_id, status")
    .eq("id", payment.order_id)
    .single();

  if (orderError || !order) {
    console.error("[Pesapal IPN] Failed to fetch order:", orderError);
    return;
  }

  if (order.status === "paid") {
    console.log("[Pesapal IPN] Order already paid — skip");
    return;
  }

  const { error: orderUpdateError } = await supabase
    .from("orders")
    .update({ status: "paid", paid_at: new Date().toISOString() })
    .eq("id", order.id)
    .eq("status", "pending");

  if (orderUpdateError) {
    console.error("[Pesapal IPN] Failed to update order:", orderUpdateError);
    return;
  }

  console.log("[Pesapal IPN] Order marked paid");

  const { error: dlError } = await supabase.from("downloads").insert({
    order_id: order.id,
    product_id: order.product_id,
    token: crypto.randomUUID(),
    expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
  });

  if (dlError) {
    console.error("[Pesapal IPN] Failed to create download:", dlError);
  } else {
    console.log("[Pesapal IPN] Download token created");
  }

  const earnings = order.creator_earnings ?? order.amount;

  try {
    const { error: balanceError } = await supabase.rpc("increment_creator_balance", {
      creator_row_id: order.creator_id,
      amount: earnings,
    });
    if (balanceError) {
      console.error("[Pesapal IPN] RPC balance update failed, trying direct update:", balanceError);
      const { data: creator } = await supabase
        .from("creators")
        .select("available_balance, total_earnings")
        .eq("id", order.creator_id)
        .single();
      if (creator) {
        await supabase
          .from("creators")
          .update({
            available_balance: creator.available_balance + earnings,
            total_earnings: creator.total_earnings + earnings,
            updated_at: new Date().toISOString(),
          })
          .eq("id", order.creator_id);
        console.log("[Pesapal IPN] Creator balance updated via direct update");
      }
    } else {
      console.log("[Pesapal IPN] Creator balance updated via RPC");
    }
  } catch (err) {
    console.error("[Pesapal IPN] Balance update failed:", err);
  }
}

async function handleFailed(
  supabase: ReturnType<typeof getSupabaseAdminClient>,
  payment: { id: string; order_id: string; status: string },
  merchantReference: string,
  transactionStatus: Record<string, unknown>
) {
  if (payment.status === "failed") {
    console.log("[Pesapal IPN] Payment already failed — skip");
    return;
  }

  const { error: payUpdateError } = await supabase
    .from("payments")
    .update({ status: "failed", raw_payload: transactionStatus })
    .eq("id", payment.id)
    .eq("status", "pending");

  if (payUpdateError) {
    console.error("[Pesapal IPN] Failed to mark payment failed:", payUpdateError);
    return;
  }

  const { error: orderUpdateError } = await supabase
    .from("orders")
    .update({ status: "failed" })
    .eq("id", payment.order_id)
    .eq("status", "pending");

  if (orderUpdateError) {
    console.error("[Pesapal IPN] Failed to mark order failed:", orderUpdateError);
  } else {
    console.log("[Pesapal IPN] Payment and order marked failed");
  }
}
