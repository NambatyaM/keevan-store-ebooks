import { NextRequest } from "next/server";
import { apiError, json, logAdminAction, readJson, requireAdmin, withErrorHandling } from "@/lib/api";

export const runtime = "nodejs";
export const maxDuration = 60;
import { refundDecisionSchema } from "@/lib/schemas";
import { refundPesapalOrder, getPesapalTransactionStatus } from "@/lib/pesapal";

export const POST = withErrorHandling(async (request: NextRequest, context?: unknown) => {
  const { supabase, authUser } = await requireAdmin(request);

  if (!context) return apiError("Not found", 404);
  const { params } = context as { params: Promise<{ id: string }> };
  const { id } = await params;
  if (!id) return apiError("Not found", 404);

  const input = await readJson(request, refundDecisionSchema);

  const { data: refund } = await supabase
    .from("refunds")
    .select("*,orders!inner(amount,creator_id,currency),payments!inner(tracking_id,merchant_reference)")
    .eq("id", id)
    .single();

  if (!refund) return apiError("Refund not found", 404);
  if (refund.status !== "pending") return apiError("Refund already processed", 400);

  const payment = Array.isArray(refund.payments) ? refund.payments[0] : refund.payments;
  const order = Array.isArray(refund.orders) ? refund.orders[0] : refund.orders;
  const orderCurrency = (order.currency as string) ?? "UGX";

  // Process internal state FIRST before calling external Pesapal API
  const { data: result, error: rpcError } = await supabase.rpc("process_refund", {
    p_refund_id: id,
    p_admin_user_id: authUser.id,
    p_decision: "approved",
    p_admin_note: input.notes ?? null
  });

  if (rpcError) return apiError(rpcError.message, 400);

  let pesapalRefundResponse: Record<string, unknown> | null = null;

  if (payment?.tracking_id) {
    try {
      const statusData = await getPesapalTransactionStatus(payment.tracking_id);
      const confirmationCode = statusData.confirmation_code;

      if (confirmationCode) {
        const pesapalResult = await refundPesapalOrder({
          confirmationCode,
          amount: order.amount,
          username: authUser.email ?? authUser.id,
          remarks: `Refund approved by admin. Original currency: ${orderCurrency}. ${input.notes ?? ""}`
        });

        if (pesapalResult.ok) {
          pesapalRefundResponse = { ...pesapalResult.raw, pesapal_status: "submitted" };
        } else {
          pesapalRefundResponse = { error: pesapalResult.error, pesapal_status: "failed" };
        }
      } else {
        pesapalRefundResponse = { pesapal_status: "skipped", reason: "No confirmation code available" };
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      pesapalRefundResponse = { pesapal_status: "error", error: message };
    }
  }

  if (pesapalRefundResponse) {
    await supabase.from("refunds").update({ pesapal_refund_response: pesapalRefundResponse }).eq("id", id);
  }

  await logAdminAction({
    adminUserId: authUser.id,
    action: "refund.approve",
    targetTable: "refunds",
    targetId: id,
    metadata: { order_id: refund.order_id, amount: order.amount, pesapal: pesapalRefundResponse?.pesapal_status }
  });

  return json({ refund: result, pesapalRefund: pesapalRefundResponse });
});
