import { NextRequest } from "next/server";
import { apiError, json, readJson, requireAdmin, withErrorHandling } from "@/lib/api";
import { adminSupportReplySchema } from "@/lib/schemas";
import { insertMessage, notifyOrderCreator, touchConversation } from "@/lib/support";

export const runtime = "nodejs";

export const POST = withErrorHandling(async (request: NextRequest, context?: unknown) => {
  const { params } = context as { params: Promise<{ id: string }> };
  const { id } = await params;
  const input = await readJson(request, adminSupportReplySchema);
  const { supabase, authUser } = await requireAdmin(request);

  const { data: conversation, error } = await supabase
    .from("support_conversations")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error || !conversation) return apiError("Conversation not found", 404);

  await insertMessage(supabase, {
    conversationId: id,
    senderRole: "admin",
    senderUserId: authUser.id,
    body: input.text,
  });
  await touchConversation(supabase, id);

  const nextStatus = input.status ?? "awaiting_admin";
  await supabase
    .from("support_conversations")
    .update({ status: nextStatus })
    .eq("id", id);

  if (input.notifyCreator && conversation.order_id) {
    await notifyOrderCreator(supabase, conversation.order_id, {
      type: "support.issue.product",
      title: `Update on support issue: ${conversation.subject}`,
      body: `An admin replied to a customer about order ${conversation.order_id}.`,
      metadata: { conversation_id: id, order_id: conversation.order_id },
    });
  }

  if (nextStatus === "resolved" && conversation.order_id) {
    await notifyOrderCreator(supabase, conversation.order_id, {
      type: "support.resolved",
      title: `Support issue resolved: ${conversation.subject}`,
      body: "This support conversation has been marked resolved.",
      metadata: { conversation_id: id, order_id: conversation.order_id },
    });
  }

  const { data: messages } = await supabase
    .from("support_messages")
    .select("id, sender_role, sender_user_id, kind, body, metadata, created_at, read_at")
    .eq("conversation_id", id)
    .order("created_at", { ascending: true });

  return json({ conversation: { ...conversation, status: nextStatus }, messages: messages ?? [] });
});