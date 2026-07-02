import { NextRequest } from "next/server";
import { apiError, json, logAdminAction, readJson, requireAdmin, withErrorHandling } from "@/lib/api";
import { refundDecisionSchema } from "@/lib/schemas";

export const POST = withErrorHandling(async (request: NextRequest, context?: unknown) => {
  const { supabase, authUser } = await requireAdmin(request);
  if (!context) return apiError("Not found", 404);
  const { params } = context as { params: Promise<{ id: string }> };
  const { id } = await params;
  if (!id) return apiError("Not found", 404);
  const input = await readJson(request, refundDecisionSchema);

  const { data: result, error: rpcError } = await supabase.rpc("process_refund", {
    p_refund_id: id,
    p_admin_user_id: authUser.id,
    p_decision: "rejected",
    p_admin_note: input.notes ?? null
  });

  if (rpcError) return apiError(rpcError.message, 400);

  await logAdminAction({
    adminUserId: authUser.id,
    action: "refund.reject",
    targetTable: "refunds",
    targetId: id,
    metadata: { notes: input.notes }
  });

  return json({ refund: result });
});
