import { NextRequest, NextResponse } from "next/server";
import { getPesapalToken, getPesapalTransactionStatus } from "@/lib/pesapal";
import { getSupabaseAdminClient } from "@/lib/supabase";
import { rateLimit } from "@/lib/api";

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

async function handleIpn(
  trackingId: string,
  merchantReference: string,
  notificationType: string
): Promise<NextResponse> {
  if (!trackingId) {
    console.warn("[Pesapal IPN] Missing OrderTrackingId");
    return ipnResponse("", merchantReference, notificationType);
  }

  const supabase = getSupabaseAdminClient();

  // Idempotency: check if this tracking ID was already processed
  const { data: existingByTracking } = await supabase
    .from("payments")
    .select("id, status, order_id")
    .eq("tracking_id", trackingId)
    .maybeSingle();

  if (existingByTracking && existingByTracking.status === "completed") {
    console.log("[Pesapal IPN] Already processed tracking ID — skip:", trackingId);
    return ipnResponse(trackingId, merchantReference, notificationType);
  }

  // Verify transaction status with Pesapal API (never trust IPN payload alone)
  let transactionStatus: Record<string, unknown>;
  try {
    await getPesapalToken();
    transactionStatus = await getPesapalTransactionStatus(trackingId);
    console.log("[Pesapal IPN] Transaction status:", JSON.stringify(transactionStatus));
  } catch (err) {
    console.error("[Pesapal IPN] Failed to verify with Pesapal:", err);
    return ipnResponse(trackingId, merchantReference, notificationType);
  }

  const paymentStatusRaw = extractPaymentStatus(transactionStatus);
  const paymentStatus = paymentStatusRaw.toLowerCase();
  console.log("[Pesapal IPN] Payment status:", paymentStatus);

  // Resolve merchant reference from transaction response if not in params
  let resolvedRef = merchantReference;
  if (!resolvedRef) {
    resolvedRef = extractMerchantReference(transactionStatus) ?? "";
    if (!resolvedRef) {
      console.warn("[Pesapal IPN] Missing merchant reference in both params and transaction");
      return ipnResponse(trackingId, "", notificationType);
    }
  }

  // Find payment record
  const { data: payment, error: lookupError } = await supabase
    .from("payments")
    .select("id, order_id, status")
    .eq("merchant_reference", resolvedRef)
    .maybeSingle();

  if (lookupError) {
    console.error("[Pesapal IPN] DB lookup error:", lookupError);
    return ipnResponse(trackingId, resolvedRef, notificationType);
  }

  if (!payment) {
    console.warn("[Pesapal IPN] No payment for merchant_reference:", resolvedRef);
    return ipnResponse(trackingId, resolvedRef, notificationType);
  }

  console.log("[Pesapal IPN] Found payment:", { id: payment.id, order_id: payment.order_id, currentStatus: payment.status });

  if (paymentStatus === "completed") {
    await handleCompleted(supabase, payment, trackingId, resolvedRef, transactionStatus);
  } else if (paymentStatus === "failed") {
    await handleFailed(supabase, payment, resolvedRef, transactionStatus);
  } else {
    console.log("[Pesapal IPN] Unhandled status — logging only:", paymentStatus, transactionStatus);
  }

  return ipnResponse(trackingId, resolvedRef, notificationType);
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  const limited = await rateLimit(request, 30, 60);
  if (limited) return limited;

  const searchParams = request.nextUrl.searchParams;
  const orderTrackingId = searchParams.get("OrderTrackingId") ?? "";
  const orderMerchantReference = searchParams.get("OrderMerchantReference") ?? "";
  const orderNotificationType = searchParams.get("OrderNotificationType") ?? "IPNCHANGE";

  console.log("[Pesapal IPN] Received GET", { orderTrackingId, orderMerchantReference, orderNotificationType });

  return handleIpn(orderTrackingId, orderMerchantReference, orderNotificationType);
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

  console.log("[Pesapal IPN] Received POST", { trackingId, orderMerchantReference });

  return handleIpn(trackingId, orderMerchantReference, "IPNCHANGE");
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

function extractCurrency(payload: Record<string, unknown>): string {
  return (
    (payload.currency as string) ??
    (payload.Currency as string) ??
    (payload.payment_currency as string) ??
    "UGX"
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

  const currency = extractCurrency(transactionStatus);
  console.log("[Pesapal IPN] Extracted currency:", currency);

  const { error: finalizeError } = await supabase.rpc("finalize_pesapal_payment", {
    payment_reference: merchantReference,
    pesapal_tracking_id: trackingId,
    status_payload: transactionStatus,
    payment_currency: currency,
  });

  if (finalizeError) {
    console.error("[Pesapal IPN] finalize_pesapal_payment RPC failed:", finalizeError);
  } else {
    console.log("[Pesapal IPN] Payment finalized via RPC with currency:", currency);
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
