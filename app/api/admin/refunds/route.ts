import { NextRequest } from "next/server";
import { apiError, json, requireAdmin, withErrorHandling } from "@/lib/api";

export const GET = withErrorHandling(async (request: NextRequest) => {
  const { supabase } = await requireAdmin(request);

  const url = new URL(request.url);
  const status = url.searchParams.get("status");
  const limit = Math.min(Number(url.searchParams.get("limit")) || 100, 500);

  let query = supabase
    .from("refunds")
    .select("*,orders!inner(amount,product_id,products!inner(title)),admin_users:users!left(email)")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (status && ["pending", "approved", "rejected"].includes(status)) {
    query = query.eq("status", status);
  }

  const { data, error } = await query;
  if (error) return apiError(error.message, 500);
  return json({ refunds: data ?? [] });
});
