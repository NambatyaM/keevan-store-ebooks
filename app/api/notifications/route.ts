import { NextRequest } from "next/server";
import { apiError, json, readJson, requireUser, withErrorHandling } from "@/lib/api";
import { markNotificationsReadSchema } from "@/lib/schemas";

export const runtime = "nodejs";

export const GET = withErrorHandling(async (request: NextRequest) => {
  const { supabase, authUser } = await requireUser(request);

  const [listResult, unreadResult] = await Promise.all([
    supabase
      .from("notifications")
      .select("id, type, title, body, metadata, read, created_at")
      .eq("user_id", authUser.id)
      .order("created_at", { ascending: false })
      .limit(20),
    supabase
      .from("notifications")
      .select("*", { count: "exact", head: true })
      .eq("user_id", authUser.id)
      .eq("read", false),
  ]);

  if (listResult.error) return apiError(listResult.error.message, 500);
  if (unreadResult.error) return apiError(unreadResult.error.message, 500);

  return json({
    notifications: listResult.data ?? [],
    unreadCount: unreadResult.count ?? 0,
  });
});

export const PATCH = withErrorHandling(async (request: NextRequest) => {
  const { supabase, authUser } = await requireUser(request);
  const { ids } = await readJson(request, markNotificationsReadSchema);

  let result;
  if (ids && ids.length > 0) {
    result = await supabase
      .from("notifications")
      .update({ read: true })
      .eq("user_id", authUser.id)
      .in("id", ids);
  } else {
    result = await supabase
      .from("notifications")
      .update({ read: true })
      .eq("user_id", authUser.id)
      .eq("read", false);
  }

  if (result.error) return apiError(result.error.message, 500);
  return json({ success: true });
});