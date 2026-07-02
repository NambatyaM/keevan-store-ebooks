import { NextRequest } from "next/server";
import { apiError, json, logAdminAction, readJson, requireAdmin, withErrorHandling } from "@/lib/api";
import { withdrawalDecisionSchema } from "@/lib/schemas";

export const POST = withErrorHandling(async (request: NextRequest, context?: unknown) => {
  const { supabase, authUser } = await requireAdmin(request);
  if (!context) return apiError("Not found", 404);
  const { params } = context as { params: Promise<{ id: string }> };
  const { id } = await params;
  if (!id) return apiError("Not found", 404);
  const input = await readJson(request, withdrawalDecisionSchema);
  const { data, error } = await supabase.rpc("transition_withdrawal_request", {
    withdrawal_id: id,
    new_status: "rejected",
    admin_note: input.notes ?? null
  });
  if (error) return apiError(error.message, 400);
  await logAdminAction({ adminUserId: authUser.id, action: "withdrawal.reject", targetTable: "withdrawal_requests", targetId: id });
  return json({ withdrawal: Array.isArray(data) ? data[0] : data });
});
