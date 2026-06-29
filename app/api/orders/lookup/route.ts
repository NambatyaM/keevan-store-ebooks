import { NextRequest } from "next/server";
import { json, apiError, requireUser, withErrorHandling } from "@/lib/api";

export const GET = withErrorHandling(async (request: NextRequest) => {
  const { supabase, authUser } = await requireUser(request);

  const url = new URL(request.url);
  const email = url.searchParams.get("email");

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return json({ orders: [] });
  }

  const normalizedEmail = email.toLowerCase();

  if (authUser.email?.toLowerCase() !== normalizedEmail) {
    return apiError("Access denied", 403);
  }

  const { data } = await supabase
    .from("orders")
    .select("id,amount,created_at,status,products!inner(title,slug)")
    .eq("buyer_email", normalizedEmail)
    .order("created_at", { ascending: false })
    .limit(10);

  return json({ orders: data ?? [] });
});
