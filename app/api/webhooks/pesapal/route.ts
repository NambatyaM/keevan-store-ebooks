import { NextRequest } from "next/server";
import { json, withOptionalCsrf } from "@/lib/api";
import { normalizePesapalStatus, verifyPesapalPayment } from "@/lib/pesapal";
import { getSupabaseAdminClient } from "@/lib/supabase";

export const POST = withOptionalCsrf(async (request: NextRequest) => {
  const expectedIpnId = process.env.PESAPAL_IPN_ID;
  const receivedIpnId = request.nextUrl.searchParams.get("ipn_id") ?? "";
  if (expectedIpnId && receivedIpnId !== expectedIpnId) {
    return json({ error: "Unauthorized" }, { status: 401 });
  }

  let rawPayload: unknown;
  try {
    rawPayload = await request.json();
  } catch {
    return json({ error: "Invalid JSON" }, { status: 400 });
  }

  const normalized = normalizePesapalStatus(rawPayload);

  if (!normalized.merchantReference || !normalized.trackingId) {
    return json({ ok: true });
  }

  const supabase = getSupabaseAdminClient();
  const result = await verifyPesapalPayment(supabase, normalized.merchantReference, normalized.trackingId);

  return json({ ok: true, finalized: result.ok });
});
