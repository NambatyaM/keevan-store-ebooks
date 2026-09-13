import { NextRequest, NextResponse } from "next/server";
import { processPesapalIpn } from "@/lib/pesapal";
import { getSupabaseAdminClient } from "@/lib/supabase";
import { withOptionalCsrf } from "@/lib/api";

export const runtime = "nodejs";
export const maxDuration = 60;
export const dynamic = "force-dynamic";

function extractIpnFields(
  params: URLSearchParams,
  body: Record<string, unknown>
): { trackingId: string | null; merchantReference: string | null } {
  const get = (name: string) => params.get(name)?.trim() ?? "";

  const trackingId =
    get("OrderTrackingId") ||
    get("order_tracking_id") ||
    (typeof body.OrderTrackingId === "string" ? String(body.OrderTrackingId).trim() : "") ||
    (typeof body.order_tracking_id === "string" ? String(body.order_tracking_id).trim() : "") ||
    (typeof body.tracking_id === "string" ? String(body.tracking_id).trim() : "");

  const merchantReference =
    get("OrderMerchantReference") ||
    get("order_merchant_reference") ||
    (typeof body.OrderMerchantReference === "string" ? String(body.OrderMerchantReference).trim() : "") ||
    (typeof body.order_merchant_reference === "string" ? String(body.order_merchant_reference).trim() : "") ||
    (typeof body.merchant_reference === "string" ? String(body.merchant_reference).trim() : "");

  return {
    trackingId: trackingId || null,
    merchantReference: merchantReference || null,
  };
}

async function handleIpn(request: NextRequest) {
  // Soft IPN-ID check (identifier, not a secret — the real security is the
  // server-side re-verification against Pesapal inside processPesapalIpn).
  const queryIpnId = request.nextUrl.searchParams.get("ipn_id")?.trim() ?? "";
  const expectedIpnId = process.env.PESAPAL_IPN_ID?.trim() ?? "";
  if (expectedIpnId && queryIpnId && queryIpnId !== expectedIpnId) {
    console.warn("[PesapalIPN] IPN ID mismatch — received:", queryIpnId, "expected:", expectedIpnId);
  }

  let body: Record<string, unknown> = {};
  if (request.method === "POST") {
    body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
  }

  const { trackingId, merchantReference } = extractIpnFields(request.nextUrl.searchParams, body);

  if (!trackingId || !merchantReference) {
    return NextResponse.json(
      { status: 200, orderTrackingId: trackingId ?? "", orderMerchantReference: merchantReference ?? "" },
      { status: 200 }
    );
  }

  try {
    const supabase = getSupabaseAdminClient();
    const outcome = await processPesapalIpn({ supabase, merchantReference, trackingId });

    if (outcome.action === "need_retry") {
      console.warn("[PesapalIPN] Transient verification failure — returning 503 for retry:", outcome.error, "ref:", merchantReference);
      return NextResponse.json({ status: 503, error: outcome.error }, { status: 503 });
    }

    return NextResponse.json(
      {
        status: 200,
        orderNotificationType: "IPNCHANGE",
        orderTrackingId: trackingId,
        orderMerchantReference: merchantReference,
      },
      { status: 200 }
    );
  } catch (err) {
    console.error("[PesapalIPN] Unexpected error during payment verification:", err, "ref:", merchantReference);
    return NextResponse.json({ status: 500, error: "internal_error" }, { status: 500 });
  }
}

export const GET = withOptionalCsrf(handleIpn);
export const POST = withOptionalCsrf(handleIpn);