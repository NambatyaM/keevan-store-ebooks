import { NextRequest } from "next/server";
import { json, withOptionalCsrf } from "@/lib/api";
import { getSupabaseAdminClient } from "@/lib/supabase";
import { verifyPesapalPayment, isTransientPaymentError } from "@/lib/pesapal";

export const runtime = "nodejs";
export const maxDuration = 120;

async function authorizeCron(request: NextRequest): Promise<void> {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    throw Object.assign(new Error("CRON_SECRET not configured"), { status: 500 });
  }

  const authHeader = request.headers.get("authorization");
  const headerSecret = request.headers.get("x-vercel-cron-secret");

  if (authHeader === `Bearer ${secret}` || headerSecret === secret) {
    return;
  }

  throw Object.assign(new Error("Unauthorized"), { status: 401 });
}

/**
 * Recovery net for orders that are stuck at "pending" even though the customer
 * paid. Every pending payment that has a Pesapal tracking ID is re-verified
 * against Pesapal and finalized (or failed) when the transaction has a
 * terminal status. Skips payments younger than 10 minutes — those are most
 * likely still in flight with the buyer on the Pesapal page.
 */
async function reconcilePayments(request: NextRequest): Promise<Response> {
  await authorizeCron(request);

  const url = new URL(request.url);
  const limit = Math.min(Number(url.searchParams.get("limit")) || 25, 100);
  const olderThan = new Date(Date.now() - 10 * 60 * 1000).toISOString();

  const supabase = getSupabaseAdminClient();

  const { data: pendingPayments, error } = await supabase
    .from("payments")
    .select("merchant_reference, tracking_id")
    .eq("status", "pending")
    .not("tracking_id", "is", null)
    .lt("created_at", olderThan)
    .limit(limit);

  if (error) {
    console.error("[reconcile-payments] Failed to fetch pending payments:", error.message);
    return json({ ok: false, error: error.message, reconciled: 0 }, { status: 500 });
  }

  const items = pendingPayments ?? [];

  let finalized = 0;
  let stillPending = 0;
  let markedFailed = 0;
  let errored = 0;

  for (const payment of items) {
    const result = await verifyPesapalPayment(
      supabase,
      payment.merchant_reference as string,
      payment.tracking_id as string
    );

    if (result.ok) {
      finalized++;
    } else if (result.error === "Payment is not completed") {
      stillPending++;
    } else if (!isTransientPaymentError(result.error)) {
      // Permanent failure (e.g. amount mismatch) — verifyPesapalPayment already
      // transitioned the payment/order to failed via the fail RPC.
      markedFailed++;
    } else {
      console.warn("[reconcile-payments] Transient error for", payment.merchant_reference, ":", result.error);
      errored++;
    }
  }

  return json({
    ok: true,
    processed: items.length,
    finalized,
    stillPending,
    markedFailed,
    errored,
  });
}

export const GET = withOptionalCsrf(reconcilePayments);
export const POST = withOptionalCsrf(reconcilePayments);