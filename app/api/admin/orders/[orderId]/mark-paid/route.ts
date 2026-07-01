import { NextRequest } from "next/server";
import { json, requireAdmin, logAdminAction, withErrorHandling } from "@/lib/api";
import { getSupabaseAdminClient } from "@/lib/supabase";

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

  const now = new Date().toISOString();
  const downloadToken = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

  // Create download token FIRST to ensure it exists before marking paid
  const { error: dlError } = await supabase.from("downloads").insert({
    order_id: order.id,
    product_id: order.product_id,
    token: downloadToken,
    expires_at: expiresAt,
  });

  if (dlError) {
    throw Object.assign(new Error("Failed to create download record"), { status: 500 });
  }

  // Now update the order status to paid
  const { error: orderUpdateError } = await supabase
    .from("orders")
    .update({ status: "paid", paid_at: now })
    .eq("id", order.id)
    .eq("status", "pending");

  if (orderUpdateError) {
    console.error("[Admin Mark Paid] Order update failed after download created:", orderUpdateError);
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

  try {
    const { error: balanceError } = await supabase.rpc("increment_creator_balance", {
      creator_row_id: order.creator_id,
      amount: earnings,
    });
    if (balanceError) {
      console.error("[Admin Mark Paid] RPC failed, trying direct update:", balanceError);
      const { data: creator } = await supabase
        .from("creators")
        .select("available_balance, total_earnings")
        .eq("id", order.creator_id)
        .single();
      if (creator) {
        await supabase
          .from("creators")
          .update({
            available_balance: creator.available_balance + earnings,
            total_earnings: creator.total_earnings + earnings,
            updated_at: now,
          })
          .eq("id", order.creator_id);
      }
    }
  } catch (err) {
    console.error("[Admin Mark Paid] Balance update failed:", err);
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
