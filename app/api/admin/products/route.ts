import { NextRequest } from "next/server";
import { apiError, json, requireAdmin, withErrorHandling } from "@/lib/api";

export const GET = withErrorHandling(async (request: NextRequest) => {
  const { supabase } = await requireAdmin(request);
  const { searchParams } = new URL(request.url);
  const limit = Math.min(Number(searchParams.get("limit")) || 100, 1000);

  const { data, error } = await supabase
    .from("products")
    .select("*, creators!inner(display_name, user_id), stores!inner(name, slug)")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) return apiError(error.message, 500);
  return json({ products: data ?? [] });
});
