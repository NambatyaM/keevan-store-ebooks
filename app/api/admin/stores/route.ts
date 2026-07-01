import { NextRequest } from "next/server";
import { apiError, json, requireAdmin, withErrorHandling } from "@/lib/api";

export const GET = withErrorHandling(async (request: NextRequest) => {
  const { supabase } = await requireAdmin(request);

  const url = new URL(request.url);
  const page = Math.max(1, Number(url.searchParams.get("page")) || 1);
  const limit = Math.min(Number(url.searchParams.get("limit")) || 50, 200);
  const offset = (page - 1) * limit;

  const { count: total, error: countError } = await supabase
    .from("stores")
    .select("*", { count: "exact", head: true });

  if (countError) return apiError(countError.message, 500);

  const { data, error } = await supabase
    .from("stores")
    .select("*,creators(id,display_name,user_id,users(full_name,email))")
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) return apiError(error.message, 500);

  const stores = (data ?? []).map((store) => {
    const creatorData = Array.isArray(store.creators) ? store.creators[0] : store.creators;
    const usersData = creatorData?.users;
    const userData = Array.isArray(usersData) ? usersData[0] : usersData;
    return {
      id: store.id,
      creator_id: store.creator_id,
      name: store.name,
      slug: store.slug,
      description: store.description,
      status: store.status,
      currency: store.currency,
      created_at: store.created_at,
      creator_display_name: creatorData?.display_name ?? null,
      creator_full_name: userData?.full_name ?? null,
      creator_email: userData?.email ?? null,
    };
  });

  return json({ stores, total: total ?? 0, page, limit });
});
