import { NextRequest, NextResponse } from "next/server";
import { getPesapalToken, getPesapalTransactionStatus } from "@/lib/pesapal";
import { getSupabaseAdminClient } from "@/lib/supabase";
import { rateLimit, withOptionalCsrf } from "@/lib/api";

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
  const limited = await rateLimit(request, 30, 60);
  if (limited) return limited;

  const searchParams = request.nextUrl.searchParams;
  const orderTrackingId = searchParams.get("OrderTrackingId") ?? "";
  const orderMerchantReference = searchParams.get("OrderMerchantReference") ?? "";
  const orderNotificationType = searchParams.get("OrderNotificationType") ?? "IPNCHANGE";

  console.log("[Pesapal IPN] Received", { orderTrackingId, orderMerchantReference, orderNotificationType });

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

  const supabase = getSupabaseAdminClient();

  let merchantRef = orderMerchantReference;
  if (!merchantRef) {
    merchantRef = extractMerchantReference(transactionStatus) ?? "";
    if (!merchantRef) {
      console.warn("[Pesapal IPN] Missing OrderMerchantReference in both params and transaction");
      return ipnResponse(orderTrackingId, "", orderNotificationType);
    }
  }

  const { data: payment, error: lookupError } = await supabase
    .from("payments")
    .select("id, order_id, status")
    .eq("merchant_reference", merchantRef)
    .maybeSingle();

  if (lookupError) {
    console.error("[Pesapal IPN] DB lookup error:", lookupError);
    return ipnResponse(orderTrackingId, merchantRef, orderNotificationType);
  }

  if (!payment) {
    console.warn("[Pesapal IPN] No payment for merchant_reference:", merchantRef);
    return ipnResponse(orderTrackingId, merchantRef, orderNotificationType);
  }

  console.log("[Pesapal IPN] Found payment:", { id: payment.id, order_id: payment.order_id, currentStatus: payment.status });

  const statusLower = paymentStatus.toLowerCase();

  if (statusLower === "completed") {
    await handleCompleted(supabase, payment, orderTrackingId, merchantRef, transactionStatus);
  } else if (statusLower === "failed") {
    await handleFailed(supabase, payment, merchantRef, transactionStatus);
  } else {
    console.log("[Pesapal IPN] Unhandled status — logging only:", paymentStatus, transactionStatus);
  }

  return ipnResponse(orderTrackingId, merchantRef, orderNotificationType);
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const limited = await rateLimit(request, 30, 60);
  if (limited) return limited;

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ status: 400, error: "Invalid JSON" }, { status: 400 });
  }

  const orderTrackingId = (body.OrderTrackingId as string) ?? (body.order_tracking_id as string) ?? "";
  const orderMerchantReference = (body.OrderMerchantReference as string) ?? (body.merchant_reference as string) ?? "";

  const queryTrackingId = request.nextUrl.searchParams.get("OrderTrackingId");
  const trackingId = queryTrackingId || orderTrackingId;

  if (!trackingId) {
    return NextResponse.json({ status: 400, error: "Missing OrderTrackingId" }, { status: 400 });
  }
  if (!orderMerchantReference) {
    return NextResponse.json({ status: 400, error: "Missing OrderMerchantReference" }, { status: 400 });
  }

  return GET(new NextRequest(
    new URL(`/api/pesapal/ipn?OrderTrackingId=${encodeURIComponent(trackingId)}&OrderMerchantReference=${encodeURIComponent(orderMerchantReference)}`, request.url),
    request
  ));
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

function extractMerchantReference(payload: Record<string, unknown>): string | null {
  return (
    (payload.merchant_reference as string) ??
    (payload.merchantReference as string) ??
    (payload.order_merchant_reference as string) ??
    (payload.OrderMerchantReference as string) ??
    null
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

  const { error: finalizeError } = await supabase.rpc("finalize_pesapal_payment", {
    payment_reference: merchantReference,
    pesapal_tracking_id: trackingId,
    status_payload: transactionStatus
  });

  if (finalizeError) {
    console.error("[Pesapal IPN] finalize_pesapal_payment RPC failed:", finalizeError);
  } else {
    console.log("[Pesapal IPN] Payment finalized via RPC");
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
