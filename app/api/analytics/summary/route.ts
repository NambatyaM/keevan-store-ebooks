import { NextRequest } from "next/server";
import { apiError, json, resolveUser, withOptionalCsrf } from "@/lib/api";
import { getSupabaseAdminClient } from "@/lib/supabase";

export const GET = withOptionalCsrf(async (request: NextRequest) => {
  const { supabase, authUser, profile } = await resolveUserAndProfile(request);
  const url = new URL(request.url);

  const days = Math.min(Math.max(Number(url.searchParams.get("days")) || 30, 1), 365);
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

  if (!authUser || !profile) {
    return json({ summary: {}, days });
  }

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

    const { data: stores, error: storesError } = await supabase.from("stores").select("id").eq("creator_id", creator.id);
    if (storesError) return apiError(storesError.message, 500);
    const storeIds = (stores ?? []).map((store) => store.id);

    if (!storeIds.length) {
      return json({ summary: {}, days });
    }

    query = query.in("store_id", storeIds);
  }

  const { data, error } = await query.order("created_at", { ascending: false }).limit(10000);
  if (error) return apiError(error.message, 500);

  const summary = (data ?? []).reduce<Record<string, number>>((acc, event) => {
    acc[event.event_type] = (acc[event.event_type] ?? 0) + 1;
    return acc;
  }, {});

  return json({ summary, days });
});

async function resolveUserAndProfile(request: NextRequest) {
  try {
    const { user } = await resolveUser(request);
    if (!user) return { supabase: getSupabaseAdminClient(), authUser: null, profile: null };

    const supabase = getSupabaseAdminClient();
    try { await supabase.rpc("set_app_api_key"); } catch {}

    const { data: profile } = await supabase.from("users").select("*").eq("id", user.id).single();
    return { supabase, authUser: user, profile: profile ?? null };
  } catch {
    return { supabase: getSupabaseAdminClient(), authUser: null, profile: null };
  }
}
