import { NextRequest } from "next/server";
import { json, requireUser, withErrorHandling } from "@/lib/api";

export const GET = withErrorHandling(async (request: NextRequest) => {
  const { supabase, authUser, profile } = await requireUser(request);

  if (profile.role !== "buyer") {
    return json({ purchases: [] });
  }

  const { data: buyer } = await supabase
    .from("buyers")
    .select("id")
    .eq("user_id", authUser.id)
    .single();

  if (!buyer) return json({ purchases: [] });

  const url = new URL(request.url);
  const limit = Math.min(Number(url.searchParams.get("limit")) || 50, 100);

  const { data: purchases } = await supabase
    .from("buyer_purchases")
    .select(`
      id, order_id, product_id,
      product:product_id (title, slug),
      creator:creator_id (display_name),
      store:store_id (slug)
    `)
    .eq("buyer_id", buyer.id)
    .order("created_at", { ascending: false })
    .limit(limit);

  const orderIds = (purchases ?? []).map((bp) => bp.order_id).filter(Boolean);

  const { data: orders } = await supabase
    .from("orders")
    .select("id, amount, paid_at, currency")
    .in("id", orderIds);

  const orderMap = new Map((orders ?? []).map((o) => [o.id, o]));

  const result = (purchases ?? []).map((bp) => {
    const order = orderMap.get(bp.order_id);
    const p = bp.product as unknown as { title: string; slug: string } | undefined;
    const c = bp.creator as unknown as { display_name: string } | undefined;
    const s = bp.store as unknown as { slug: string } | undefined;
    return {
      id: bp.id,
      product_id: bp.product_id,
      product_title: p?.title ?? "",
      product_slug: p?.slug ?? "",
      creator_name: c?.display_name ?? "",
      store_slug: s?.slug ?? "",
      amount: order?.amount ?? 0,
      paid_at: order?.paid_at ?? "",
      currency: order?.currency ?? "UGX",
    };
  });

  return json({ purchases: result });
});
