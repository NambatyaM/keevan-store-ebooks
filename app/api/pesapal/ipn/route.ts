import { NextRequest, NextResponse } from "next/server";
import { getPesapalToken, getPesapalTransactionStatus, extractCurrency } from "@/lib/pesapal";
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

function errorResponse(status: number, error: string): NextResponse {
  return NextResponse.json({ status, error }, { status });
}

async function handleIpn(
  trackingId: string,
  merchantReference: string,
  notificationType: string
): Promise<NextResponse> {
  if (!trackingId) {
    return ipnResponse("", merchantReference, notificationType);
  }

  try {
    const supabase = getSupabaseAdminClient();

    const { data: existingByTracking } = await supabase
      .from("payments")
      .select("id, status, order_id")
      .eq("tracking_id", trackingId)
      .maybeSingle();

    if (existingByTracking && existingByTracking.status === "completed") {
      return ipnResponse(trackingId, merchantReference, notificationType);
    }

    let transactionStatus: Record<string, unknown>;
    try {
      await getPesapalToken();
      transactionStatus = await getPesapalTransactionStatus(trackingId);
    } catch (err) {
      return errorResponse(502, "Failed to verify with Pesapal");
    }

    const paymentStatusRaw = extractPaymentStatus(transactionStatus);
    const paymentStatus = paymentStatusRaw.toLowerCase();

    let resolvedRef = merchantReference;
    if (!resolvedRef) {
      resolvedRef = extractMerchantReference(transactionStatus) ?? "";
      if (!resolvedRef) {
        return ipnResponse(trackingId, "", notificationType);
      }
    }

    const { data: payment, error: lookupError } = await supabase
      .from("payments")
      .select("id, order_id, status")
      .eq("merchant_reference", resolvedRef)
      .maybeSingle();

    if (lookupError || !payment) {
      return ipnResponse(trackingId, resolvedRef, notificationType);
    }

    if (paymentStatus === "completed") {
      await handleCompleted(supabase, payment, trackingId, resolvedRef, transactionStatus);
    } else if (paymentStatus === "failed") {
      await handleFailed(supabase, payment, resolvedRef, transactionStatus);
    }

    return ipnResponse(trackingId, resolvedRef, notificationType);
  } catch {
    return ipnResponse(trackingId, merchantReference, notificationType);
  }
}

function verifyIpnId(request: NextRequest): boolean {
  const expectedIpnId = process.env.PESAPAL_IPN_ID;
  if (!expectedIpnId) return true;
  const receivedIpnId = request.nextUrl.searchParams.get("ipn_id") ?? "";
  return receivedIpnId === expectedIpnId;
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  const limited = await rateLimit(request, 30, 60);
  if (limited) return limited;

  if (!verifyIpnId(request)) {
    return NextResponse.json({ status: 401, error: "Unauthorized" }, { status: 401 });
  }

  const searchParams = request.nextUrl.searchParams;
  const orderTrackingId = searchParams.get("OrderTrackingId") ?? "";
  const orderMerchantReference = searchParams.get("OrderMerchantReference") ?? "";
  const orderNotificationType = searchParams.get("OrderNotificationType") ?? "IPNCHANGE";

  return handleIpn(orderTrackingId, orderMerchantReference, orderNotificationType);
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const limited = await rateLimit(request, 30, 60);
  if (limited) return limited;

  if (!verifyIpnId(request)) {
    return NextResponse.json({ status: 401, error: "Unauthorized" }, { status: 401 });
  }

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

async function handleCompleted(
  supabase: ReturnType<typeof getSupabaseAdminClient>,
  payment: { id: string; order_id: string; status: string },
  trackingId: string,
  merchantReference: string,
  transactionStatus: Record<string, unknown>
) {
  if (payment.status === "completed") {
    return;
  }

  const currency = extractCurrency(transactionStatus);

  const { error: finalizeError } = await supabase.rpc("finalize_pesapal_payment", {
    payment_reference: merchantReference,
    pesapal_tracking_id: trackingId,
    status_payload: transactionStatus,
    payment_currency: currency,
  });

  if (finalizeError) {
    throw finalizeError;
  }
}

async function handleFailed(
  supabase: ReturnType<typeof getSupabaseAdminClient>,
  payment: { id: string; order_id: string; status: string },
  merchantReference: string,
  transactionStatus: Record<string, unknown>
) {
  if (payment.status === "failed") {
    return;
  }

  const { error: payUpdateError } = await supabase
    .from("payments")
    .update({ status: "failed", raw_payload: transactionStatus })
    .eq("id", payment.id)
    .eq("status", "pending");

  if (payUpdateError) {
    return;
  }

  await supabase
    .from("orders")
    .update({ status: "failed" })
    .eq("id", payment.order_id)
    .eq("status", "pending");
}
