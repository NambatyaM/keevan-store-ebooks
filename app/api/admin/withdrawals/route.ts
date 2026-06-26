import { NextRequest } from "next/server";
import { json, requireAdmin, withErrorHandling } from "@/lib/api";

export const GET = withErrorHandling(async (request: NextRequest) => {
  const { supabase } = await requireAdmin(request);

  const url = new URL(request.url);
  const status = url.searchParams.get("status");
  const limit = Math.min(Number(url.searchParams.get("limit")) || 100, 500);

  let query = supabase
    .from("withdrawal_requests")
    .select("*,creators(display_name,users!inner(email))")
    .order("requested_at", { ascending: false })
    .limit(limit);

  if (status && ["pending", "approved", "rejected", "paid"].includes(status)) {
    query = query.eq("status", status);
  }

  const { data } = await query;
  return json({ withdrawals: data ?? [] });
});
