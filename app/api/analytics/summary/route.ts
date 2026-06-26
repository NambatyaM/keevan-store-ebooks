import { NextRequest } from "next/server";
import { json, requireUser, withErrorHandling } from "@/lib/api";

export const GET = withErrorHandling(async (request: NextRequest) => {
  const { supabase, authUser, profile } = await requireUser(request);
  const url = new URL(request.url);

  const days = Math.min(Math.max(Number(url.searchParams.get("days")) || 30, 1), 365);
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

  let query = supabase
    .from("analytics_events")
    .select("event_type,created_at,store_id,product_id")
    .gte("created_at", since);

  if (profile.role !== "admin") {
    const { data: creator, error: creatorError } = await supabase
      .from("creators")
      .select("id")
      .eq("user_id", authUser.id)
      .single();

    if (creatorError || !creator) {
      return json({ summary: {}, days });
    }

    const { data: stores } = await supabase.from("stores").select("id").eq("creator_id", creator.id);
    const storeIds = (stores ?? []).map((store) => store.id);

    if (!storeIds.length) {
      return json({ summary: {}, days });
    }

    query = query.in("store_id", storeIds);
  }

  const { data } = await query.order("created_at", { ascending: false }).limit(10000);

  const summary = (data ?? []).reduce<Record<string, number>>((acc, event) => {
    acc[event.event_type] = (acc[event.event_type] ?? 0) + 1;
    return acc;
  }, {});

  return json({ summary, days });
});
