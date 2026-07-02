import { NextRequest } from "next/server";
import { apiError, json, requireAdmin, logAdminAction, withErrorHandling } from "@/lib/api";

export const POST = withErrorHandling(async (request: NextRequest, context?: unknown) => {
  const { params } = context as { params: Promise<{ orderId: string }> };
  const { orderId } = await params;
  const { supabase, authUser } = await requireAdmin(request);

  const { data: order, error: orderError } = await supabase
    .from("orders")
    .select("id, creator_id, amount, creator_earnings, product_id, status")
    .eq("id", orderId)
    .single();

  if (orderError || !order) {
    throw Object.assign(new Error("Order not found"), { status: 404 });
  }

  if (order.status !== "pending") {
    throw Object.assign(new Error("Only pending orders can be marked as paid"), { status: 400 });
  }

  // Check for existing download token (idempotency)
  const { data: existingDownload } = await supabase
    .from("downloads")
    .select("token")
    .eq("order_id", order.id)
    .maybeSingle();

  if (existingDownload) {
    return json({ ok: true, download_token: existingDownload.token, alreadyProcessed: true });
  }

  const now = new Date().toISOString();
  const downloadToken = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

  const { error: dlError } = await supabase.from("downloads").insert({
    order_id: order.id,
    product_id: order.product_id,
    token: downloadToken,
    expires_at: expiresAt,
  });

  if (dlError) {
    throw Object.assign(new Error("Failed to create download record"), { status: 500 });
  }

  const { error: orderUpdateError } = await supabase
    .from("orders")
    .update({ status: "paid", paid_at: now })
    .eq("id", order.id)
    .eq("status", "pending");

  if (orderUpdateError) {
    throw Object.assign(new Error("Failed to mark order as paid"), { status: 500 });
  }

  const { data: payment } = await supabase
    .from("payments")
    .select("id, status")
    .eq("order_id", order.id)
    .maybeSingle();

  if (payment && payment.status === "pending") {
    await supabase
      .from("payments")
      .update({ status: "completed", verified_at: now })
      .eq("id", payment.id)
      .eq("status", "pending");
  }

  const earnings = order.creator_earnings ?? order.amount;

  const { error: balanceError } = await supabase.rpc("increment_creator_balance", {
    creator_row_id: order.creator_id,
    amount: earnings,
  });

  if (balanceError) {
    throw Object.assign(new Error("Failed to update creator balance"), { status: 500 });
  }

  await logAdminAction({
    adminUserId: authUser.id,
    action: "mark_order_paid",
    targetTable: "orders",
    targetId: order.id,
    metadata: { download_token: downloadToken },
  });

  return json({ ok: true, download_token: downloadToken });
});
