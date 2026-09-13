import { NextRequest } from "next/server";
import { apiError, json, requireAdmin, withErrorHandling } from "@/lib/api";
import type { SupportConversation } from "@/lib/support";
import { runSupportBot } from "@/lib/support-bot";

export const runtime = "nodejs";

export const POST = withErrorHandling(async (request: NextRequest, context?: unknown) => {
  const { params } = context as { params: Promise<{ id: string }> };
  const { id } = await params;
  const { supabase } = await requireAdmin(request);

  const { data: conversation, error } = await supabase
    .from("support_conversations")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error || !conversation) return apiError("Conversation not found", 404);

  const { data: lastUserMessage } = await supabase
    .from("support_messages")
    .select("body")
    .eq("conversation_id", id)
    .eq("sender_role", "user")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const prompt = lastUserMessage?.body ?? conversation.subject ?? "Help me with my order";

  await runSupportBot(supabase, conversation as SupportConversation, prompt);

  const { data: messages } = await supabase
    .from("support_messages")
    .select("id, sender_role, sender_user_id, kind, body, metadata, created_at, read_at")
    .eq("conversation_id", id)
    .order("created_at", { ascending: true });

  const { data: updated } = await supabase
    .from("support_conversations")
    .select("status")
    .eq("id", id)
    .maybeSingle();

  return json({ conversation: updated, messages: messages ?? [] });
});