import { NextRequest } from "next/server";
import { apiError, json, readJson, withErrorHandling } from "@/lib/api";
import { paymentVerifySchema } from "@/lib/schemas";
import { verifyPesapalPayment } from "@/lib/pesapal";
import { getSupabaseAdminClient } from "@/lib/supabase";

export const POST = withErrorHandling(async (request: NextRequest) => {
  const input = await readJson(request, paymentVerifySchema);
  const supabase = getSupabaseAdminClient();

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
