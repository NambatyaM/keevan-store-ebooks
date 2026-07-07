import { NextRequest } from "next/server";
import { apiError, json, requireAdmin, withErrorHandling } from "@/lib/api";

export const GET = withErrorHandling(async (request: NextRequest) => {
  const { supabase } = await requireAdmin(request);

  const url = new URL(request.url);
  const status = url.searchParams.get("status");
  const limit = Math.min(Number(url.searchParams.get("limit")) || 100, 500);
  const since = url.searchParams.get("since");
  const until = url.searchParams.get("until");

  let query = supabase
    .from("orders")
    .select("*,products(title,slug),creators(display_name)")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (since) query = query.gte("created_at", since);
  if (until) query = query.lte("created_at", until);
  if (status && ["pending", "paid", "failed", "refunded"].includes(status)) {
    query = query.eq("status", status);
  }

  const { data, error } = await query;
  if (error) return apiError(error.message, 500);
  return json({ orders: data ?? [] });
});
