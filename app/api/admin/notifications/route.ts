import { NextRequest } from "next/server";
import { apiError, json, requireAdmin, withErrorHandling } from "@/lib/api";

export const GET = withErrorHandling(async (request: NextRequest) => {
  const { supabase, authUser, profile } = await requireAdmin(request);
  const isAdmin = profile.role === "admin";

  const [
    { data: unread, error: unreadError },
    { count: unreadCount, error: countError },
  ] = await Promise.all([
    supabase
      .from("notifications")
      .select("id, type, title, body, metadata, read, created_at, user_id")
      .eq("read", false)
      .order("created_at", { ascending: false })
      .limit(20),
    supabase
      .from("notifications")
      .select("*", { count: "exact", head: true })
      .eq("read", false),
  ]);

  if (unreadError) return apiError(unreadError.message, 500);
  if (countError) return apiError(countError.message, 500);

  return json({ notifications: unread ?? [], unreadCount: unreadCount ?? 0 });
});

export const PATCH = withErrorHandling(async (request: NextRequest) => {
  const { supabase } = await requireAdmin(request);

  const body = await request.json().catch(() => ({}));
  const ids: string[] = body.ids ?? [];

  if (ids.length === 0) {
    const { error } = await supabase
      .from("notifications")
      .update({ read: true })
      .eq("read", false);
    if (error) return apiError(error.message, 500);
  } else {
    const { error } = await supabase
      .from("notifications")
      .update({ read: true })
      .in("id", ids);
    if (error) return apiError(error.message, 500);
  }

  return json({ success: true });
});
