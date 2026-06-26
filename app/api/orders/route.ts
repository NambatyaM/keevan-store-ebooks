import { NextRequest } from "next/server";
import { json, requireUser, withErrorHandling } from "@/lib/api";

export const GET = withErrorHandling(async (request: NextRequest) => {
  const { supabase, authUser } = await requireUser(request);

  const { data: creator } = await supabase.from("creators").select("id").eq("user_id", authUser.id).single();
  if (!creator) return json({ orders: [] });

  const url = new URL(request.url);
  const limit = Math.min(Number(url.searchParams.get("limit")) || 50, 200);

  const { data } = await supabase
    .from("orders")
    .select("*,products(title,slug)")
    .eq("creator_id", creator.id)
    .order("created_at", { ascending: false })
    .limit(limit);

  return json({ orders: data ?? [] });
});
