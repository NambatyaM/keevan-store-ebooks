import { NextRequest } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase";
import { json, withErrorHandling } from "@/lib/api";

export const GET = withErrorHandling(async (request: NextRequest) => {
  const url = new URL(request.url);
  const productId = url.searchParams.get("productId");
  if (!productId) return json({ discount: null });

  const supabase = getSupabaseAdminClient();

  const { data } = await supabase
    .from("discounts")
    .select("*")
    .eq("product_id", productId)
    .eq("is_active", true)
    .lte("starts_at", new Date().toISOString())
    .gte("expires_at", new Date().toISOString())
    .maybeSingle();

  return json({ discount: data ?? null });
});
