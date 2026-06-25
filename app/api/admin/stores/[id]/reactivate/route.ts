import { NextRequest } from "next/server";
import { apiError, json, logAdminAction, requireAdmin, withErrorHandling } from "@/lib/api";

export const POST = withErrorHandling(async (request: NextRequest, context?: unknown) => {
  const { params } = context as { params: Promise<{ id: string }> };
  const { id } = await params;
  const { supabase, authUser } = await requireAdmin(request);
  const { data, error } = await supabase.from("stores").update({ status: "active" }).eq("id", id).select("*").single();

  if (error) return apiError(error.message, 400);
  await logAdminAction({ adminUserId: authUser.id, action: "store.reactivate", targetTable: "stores", targetId: id });
  return json({ store: data });
});
