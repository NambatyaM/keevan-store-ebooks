import { NextRequest } from "next/server";
import { json, requireUser, withErrorHandling } from "@/lib/api";

export const GET = withErrorHandling(async (request: NextRequest) => {
  const { supabase, authUser, profile } = await requireUser(request);
  let query = supabase.from("analytics_events").select("event_type,created_at,store_id,product_id");

  if (profile.role !== "admin") {
    const { data: creator, error: creatorError } = await supabase
      .from("creators")
      .select("id")
      .eq("user_id", authUser.id)
      .single();

    if (creatorError || !creator) {
      return json({ summary: {} });
    }

    const { data: stores } = await supabase.from("stores").select("id").eq("creator_id", creator.id);
    const storeIds = (stores ?? []).map((store) => store.id);

    if (!storeIds.length) {
      return json({ summary: {} });
    }

    query = query.in("store_id", storeIds);
  }

  const { data } = await query.limit(5000);

  const summary = (data ?? []).reduce<Record<string, number>>((acc, event) => {
    acc[event.event_type] = (acc[event.event_type] ?? 0) + 1;
    return acc;
  }, {});

  return json({ summary });
});
