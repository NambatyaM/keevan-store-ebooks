import { NextRequest } from "next/server";
import { apiError, json, requireAdmin, withErrorHandling } from "@/lib/api";
import { markUserMessagesRead } from "@/lib/support";

export const runtime = "nodejs";

export const GET = withErrorHandling(async (request: NextRequest, context?: unknown) => {
  const { params } = context as { params: Promise<{ id: string }> };
  const { id } = await params;
  const { supabase } = await requireAdmin(request);

  const { data: conversation, error } = await supabase
    .from("support_conversations")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error || !conversation) return apiError("Conversation not found", 404);

  const { data: messages } = await supabase
    .from("support_messages")
    .select("id, sender_role, sender_user_id, kind, body, metadata, created_at, read_at")
    .eq("conversation_id", id)
    .order("created_at", { ascending: true });

  // Extra context if the conversation references an order
  let orderContext = null;
  if (conversation.order_id) {
    const { data: order } = await supabase
      .from("orders")
      .select("id, status, amount, currency, buyer_email, buyer_name, created_at, paid_at, product_id, products(title, slug)")
      .eq("id", conversation.order_id)
      .maybeSingle();

    if (order) {
      const { data: payment } = await supabase
        .from("payments")
        .select("id, status, merchant_reference, tracking_id, created_at, verified_at")
        .eq("order_id", order.id)
        .maybeSingle();

      const { data: download } = await supabase
        .from("downloads")
        .select("token, expires_at, downloaded_at")
        .eq("order_id", order.id)
        .order("created_at", { ascending: false })
        .maybeSingle();

      const { data: emails } = await supabase
        .from("email_deliveries")
        .select("id, to_email, type, product_title, download_token, resend_id, delivery_status, created_at, delivered_at")
        .eq("order_id", order.id)
        .order("created_at", { ascending: true });

      orderContext = { order, payment, download, emails: emails ?? [] };
    }
  }

  // Mark this conversation's user messages as seen when admins view it
  await markUserMessagesRead(supabase, id);

  return json({ conversation, messages: messages ?? [], orderContext });
});