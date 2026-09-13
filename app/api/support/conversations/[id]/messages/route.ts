import { NextRequest } from "next/server";
import { apiError, json, readJson, resolveUser, withErrorHandling } from "@/lib/api";
import { sendSupportMessageSchema } from "@/lib/schemas";
import { insertMessage, touchConversation, type SupportConversation } from "@/lib/support";
import { runSupportBot } from "@/lib/support-bot";

export const runtime = "nodejs";

export const POST = withErrorHandling(async (request: NextRequest, context?: unknown) => {
  const { params } = context as { params: Promise<{ id: string }> };
  const { id } = await params;
  const input = await readJson(request, sendSupportMessageSchema);

  const supabase = await import("@/lib/supabase").then((m) => m.getSupabaseAdminClient());

  const { data: conversation } = await supabase
    .from("support_conversations")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (!conversation) return apiError("Conversation not found", 404);

  const { user } = await resolveUser(request);

  // Authorization: owner (by auth), anonymous (by access token), or admin
  const isOwner = conversation.user_id && user && conversation.user_id === user.id;
  const isAnon = !conversation.user_id && input.token && input.token === conversation.access_token;

  if (!isOwner && !isAnon) {
    let isAdmin = false;
    if (user) {
      const { data: profile } = await supabase.from("users").select("role").eq("id", user.id).maybeSingle();
      isAdmin = profile?.role === "admin";
    }
    if (!isAdmin) return apiError("Access denied", 403);
  }

  // A resolved conversation re-opens when the user writes again
  if (conversation.status === "resolved") {
    await supabase
      .from("support_conversations")
      .update({ status: "awaiting_admin" })
      .eq("id", id);
  }

  await insertMessage(supabase, {
    conversationId: id,
    senderRole: "user",
    body: input.text,
  });
  await touchConversation(supabase, id);

  // Bot processes the new message
  await runSupportBot(supabase, conversation as SupportConversation, input.text);

  const { data: messages } = await supabase
    .from("support_messages")
    .select("id, sender_role, kind, body, metadata, created_at, read_at")
    .eq("conversation_id", id)
    .order("created_at", { ascending: true });

  return json({ messages: messages ?? [] });
});