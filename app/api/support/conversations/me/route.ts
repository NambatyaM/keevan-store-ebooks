import { NextRequest } from "next/server";
import { json, requireUser, withErrorHandling } from "@/lib/api";

export const runtime = "nodejs";

export const GET = withErrorHandling(async (request: NextRequest) => {
  const { supabase, authUser } = await requireUser(request);

  const { data: conversations } = await supabase
    .from("support_conversations")
    .select("id, subject, category, status, last_message_at, updated_at")
    .eq("user_id", authUser.id)
    .in("status", ["open", "awaiting_admin", "resolved"])
    .order("last_message_at", { ascending: false })
    .limit(10);

  return json({ conversations: conversations ?? [] });
});