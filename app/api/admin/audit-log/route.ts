import { NextRequest } from "next/server";
import { apiError, json, requireAdmin, withErrorHandling } from "@/lib/api";

export const GET = withErrorHandling(async (request: NextRequest) => {
  const { supabase } = await requireAdmin(request);

  const url = new URL(request.url);
  const action = url.searchParams.get("action");
  const targetTable = url.searchParams.get("targetTable");
  const limit = Math.min(Number(url.searchParams.get("limit")) || 100, 500);

  let query = supabase
    .from("admin_logs")
    .select("*,users!admin_logs_admin_user_id_fkey(full_name,email)")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (action) {
    query = query.eq("action", action);
  }

  if (targetTable) {
    query = query.eq("target_table", targetTable);
  }

  const { data, error } = await query;
  if (error) return apiError(error.message, 500);
  return json({ logs: data ?? [] });
});
