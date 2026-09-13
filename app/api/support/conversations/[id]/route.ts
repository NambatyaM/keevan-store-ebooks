import { NextRequest } from "next/server";
import { apiError, json, resolveUser, withErrorHandling } from "@/lib/api";

export const runtime = "nodejs";

export const GET = withErrorHandling(async (request: NextRequest, context?: unknown) => {
  const { params } = context as { params: Promise<{ id: string }> };
  const { id } = await params;
  const url = new URL(request.url);
  const accessToken = url.searchParams.get("token");

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
  const isAnon = !conversation.user_id && accessToken && accessToken === conversation.access_token;

  if (!isOwner && !isAnon) {
    if (user) {
      const { data: profile } = await supabase.from("users").select("role").eq("id", user.id).maybeSingle();
      if (profile?.role === "admin") {
        // admins may read any conversation
      } else {
        return apiError("Access denied", 403);
      }
    } else {
      return apiError("Access denied", 403);
    }
  }

  const { data: messages } = await supabase
    .from("support_messages")
    .select("id, sender_role, kind, body, metadata, created_at, read_at")
    .eq("conversation_id", id)
    .order("created_at", { ascending: true });

  return json({ conversation, messages: messages ?? [] });
});