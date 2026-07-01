import { NextRequest } from "next/server";
import { apiError, json, requireAdmin, withErrorHandling } from "@/lib/api";

export const GET = withErrorHandling(async (request: NextRequest) => {
  const { supabase } = await requireAdmin(request);

  const url = new URL(request.url);
  const search = url.searchParams.get("search")?.trim().toLowerCase() || "";
  const page = Math.max(1, Number(url.searchParams.get("page")) || 1);
  const pageSize = Math.min(Number(url.searchParams.get("pageSize")) || 50, 200);
  const offset = (page - 1) * pageSize;

  const { data, error } = await supabase
    .from("buyers")
    .select("*,users(full_name,email)")
    .order("created_at", { ascending: false })
    .range(offset, offset + pageSize - 1);

  if (error) return apiError(error.message, 500);

  let buyers = (data ?? []).map((buyer) => {
    const userData = Array.isArray(buyer.users) ? buyer.users[0] : buyer.users;
    return {
      id: buyer.id,
      user_id: buyer.user_id,
      display_name: buyer.display_name,
      full_name: userData?.full_name ?? null,
      email: userData?.email ?? null,
      phone: buyer.phone,
      created_at: buyer.created_at
    };
  });

  if (search) {
    buyers = buyers.filter(
      (b) =>
        (b.full_name && b.full_name.toLowerCase().includes(search)) ||
        (b.email && b.email.toLowerCase().includes(search))
    );
  }

  return json({ buyers });
});
