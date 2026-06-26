import { NextRequest } from "next/server";
import { json, rateLimit, withErrorHandling } from "@/lib/api";
import { getSupabaseAdminClient } from "@/lib/supabase";

export const GET = withErrorHandling(async (request: NextRequest) => {
  const limited = await rateLimit(request, 5, 60);
  if (limited) return limited;

  const url = new URL(request.url);
  const email = url.searchParams.get("email");

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return json({ orders: [] });
  }

  const supabase = getSupabaseAdminClient();
  const { data } = await supabase
    .from("orders")
    .select("id,amount,created_at,products!inner(title)")
    .eq("buyer_email", email.toLowerCase())
    .eq("status", "paid")
    .order("created_at", { ascending: false })
    .limit(10);

  return json({ orders: data ?? [] });
});
