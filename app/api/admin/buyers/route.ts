import { NextRequest } from "next/server";
import { json, requireAdmin, withErrorHandling } from "@/lib/api";

export const GET = withErrorHandling(async (request: NextRequest) => {
  const { supabase } = await requireAdmin(request);

  const url = new URL(request.url);
  const search = url.searchParams.get("search")?.trim().toLowerCase() || "";

  const { data } = await supabase
    .from("buyers")
    .select("*,users(full_name,email)")
    .order("created_at", { ascending: false });

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
