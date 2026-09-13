import { NextRequest } from "next/server";
import { json, requireAdmin, withErrorHandling } from "@/lib/api";

export const runtime = "nodejs";

export const GET = withErrorHandling(async (request: NextRequest) => {
  const { supabase } = await requireAdmin(request);

  const url = new URL(request.url);
  const status = url.searchParams.get("status") ?? "open";
  const search = url.searchParams.get("search") ?? "";
  const limit = Math.min(Math.max(parseInt(url.searchParams.get("limit") ?? "50", 10) || 50, 1), 200);

  let query = supabase
    .from("support_conversations")
    .select("id, subject, category, email, name, role, status, order_id, last_message_at, created_at");

  if (["open", "awaiting_admin", "resolved", "closed"].includes(status)) {
    if (status === "open") query = query.in("status", ["open", "awaiting_admin"]);
    else query = query.eq("status", status);
  }

  if (search) {
    query = query.or(`email.ilike.%${search}%,name.ilike.%${search}%,subject.ilike.%${search}%`);
  }

  query = query.order("last_message_at", { ascending: false }).limit(limit);

  const { data: conversations, error } = await query;

  if (error) return json({ conversations: [], error: error.message });

  const ids = (conversations ?? []).map((c: { id: string }) => c.id);
  let unreadCounts: Record<string, number> = {};

  if (ids.length > 0) {
    const { data: groups } = await supabase
      .from("support_messages")
      .select("conversation_id")
      .in("conversation_id", ids)
      .eq("sender_role", "user")
      .is("read_at", null);

    unreadCounts = (groups ?? []).reduce<Record<string, number>>((acc, m) => {
      const cid = m.conversation_id as string;
      acc[cid] = (acc[cid] ?? 0) + 1;
      return acc;
    }, {});
  }

  const {
    count: activeCount,
  } = await supabase
    .from("support_conversations")
    .select("*", { count: "exact", head: true })
    .in("status", ["open", "awaiting_admin"]);
  const { count: resolvedCount } = await supabase
    .from("support_conversations")
    .select("*", { count: "exact", head: true })
    .eq("status", "resolved");

  return json({
    conversations: (conversations ?? []).map((c) => ({ ...c, unread: unreadCounts[c.id as string] ?? 0 })),
    counts: { open: activeCount ?? 0, resolved: resolvedCount ?? 0 },
  });
});