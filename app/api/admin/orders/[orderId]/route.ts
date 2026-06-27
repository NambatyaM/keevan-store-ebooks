import { NextRequest } from "next/server";
import { json, requireAdmin, withErrorHandling } from "@/lib/api";

export const GET = withErrorHandling(async (request: NextRequest, context?: unknown) => {
  const { params } = context as { params: Promise<{ orderId: string }> };
  const { orderId } = await params;
  const { supabase } = await requireAdmin(request);

  const { data: order, error } = await supabase
    .from("orders")
    .select("*, products(title,slug,file_path), creators(display_name,email), payments(*)")
    .eq("id", orderId)
    .single();

  if (error || !order) {
    throw Object.assign(new Error("Order not found"), { status: 404 });
  }

  return json({ order });
});
