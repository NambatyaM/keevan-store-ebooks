import { NextRequest } from "next/server";
import { json, requireAdmin, withErrorHandling } from "@/lib/api";

export const GET = withErrorHandling(async (request: NextRequest) => {
  const { supabase } = await requireAdmin(request);

  const url = new URL(request.url);
  const page = Math.max(1, Number(url.searchParams.get("page")) || 1);
  const limit = Math.min(Number(url.searchParams.get("limit")) || 50, 200);
  const offset = (page - 1) * limit;
  const since = url.searchParams.get("since");
  const until = url.searchParams.get("until");

  let countQuery = supabase.from("creators").select("*", { count: "exact", head: true });
  if (since) countQuery = countQuery.gte("created_at", since);
  if (until) countQuery = countQuery.lte("created_at", until);
  const { count: total } = await countQuery;

  let dataQuery = supabase
    .from("creators")
    .select("*,users(full_name,email),stores(id,slug,name,status)")
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);
  if (since) dataQuery = dataQuery.gte("created_at", since);
  if (until) dataQuery = dataQuery.lte("created_at", until);
  const { data } = await dataQuery;

  const creators = (data ?? []).map((creator) => {
    const userData = Array.isArray(creator.users) ? creator.users[0] : creator.users;
    const storeData = Array.isArray(creator.stores) ? creator.stores : [creator.stores].filter(Boolean);
    const store = storeData?.[0] ?? null;

    return {
      id: creator.id,
      user_id: creator.user_id,
      full_name: userData?.full_name ?? null,
      email: userData?.email ?? null,
      display_name: creator.display_name,
      bio: creator.bio,
      phone: creator.phone,
      available_balance: creator.available_balance,
      total_earnings: creator.total_earnings,
      store_id: store?.id ?? null,
      store_slug: store?.slug ?? null,
      store_name: store?.name ?? null,
      store_status: store?.status ?? null,
      created_at: creator.created_at
    };
  });

  return json({ creators, total: total ?? 0, page, limit });
});
