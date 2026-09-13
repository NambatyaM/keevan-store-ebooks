import { NextRequest } from "next/server";
import { json, requireAdmin, withErrorHandling } from "@/lib/api";
import { emailDeliveriesQuerySchema } from "@/lib/schemas";
import { refreshOrderDeliveryStatuses } from "@/lib/email-delivery";

export const runtime = "nodejs";

export const GET = withErrorHandling(async (request: NextRequest) => {
  const { supabase } = await requireAdmin(request);
  const url = new URL(request.url);
  const input = emailDeliveriesQuerySchema.parse({
    orderId: url.searchParams.get("orderId") ?? undefined,
    status: url.searchParams.get("status") ?? undefined,
    refresh: url.searchParams.get("refresh") ?? undefined,
    limit: url.searchParams.get("limit") ?? undefined,
  });

  if (input.refresh) {
    await refreshOrderDeliveryStatuses(supabase, 50);
  }

  let query = supabase
    .from("email_deliveries")
    .select("id, order_id, to_email, type, product_title, download_token, resend_id, delivery_status, created_at, delivered_at, orders(product_id, status, amount, currency, products(title))")
    .order("created_at", { ascending: false })
    .limit(input.limit);

  if (input.orderId) query = query.eq("order_id", input.orderId);
  if (input.status) query = query.eq("delivery_status", input.status);

  const { data: deliveries, error } = await query;

  const { count: total } = await supabase
    .from("email_deliveries")
    .select("*", { count: "exact", head: true });

  if (error) return json({ deliveries: [], total: 0, error: error.message });

  return json({
    deliveries: deliveries ?? [],
    total: total ?? 0,
  });
});