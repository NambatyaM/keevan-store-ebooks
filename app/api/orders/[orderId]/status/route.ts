import { NextRequest } from "next/server";
import { apiError, json, requireUser, withErrorHandling } from "@/lib/api";

export const GET = withErrorHandling(async (request: NextRequest) => {
  const url = new URL(request.url);
  const orderId = url.pathname.split("/").at(-2);
  if (!orderId) return apiError("Missing order ID", 400);

  const { supabase, authUser } = await requireUser(request);

  const { data: order } = await supabase
    .from("orders")
    .select(`
      id, status, buyer_email, buyer_id, amount,
      product:product_id (title, slug, file_path),
      creator:creator_id (display_name)
    `)
    .eq("id", orderId)
    .maybeSingle();

  if (!order) return apiError("Order not found", 404);

  const p = order.product as unknown as { title: string; slug: string; file_path: string } | undefined;
  const c = order.creator as unknown as { display_name: string } | undefined;

  const isBuyer = order.buyer_email === authUser.email;
  const isCreator =
    typeof order.creator === "object" &&
    order.creator !== null &&
    "display_name" in (order.creator as object);

  if (!isBuyer && !isCreator) {
    return apiError("Access denied", 403);
  }

  if (order.status === "paid") {
    return json({
      ok: true,
      status: "completed",
      productTitle: p?.title ?? "",
      productSlug: p?.slug ?? "",
      creatorName: c?.display_name ?? "",
      buyerId: isBuyer ? order.buyer_id : undefined,
    });
  }

  if (order.status === "failed") {
    return json({
      ok: false,
      status: "failed",
      productTitle: p?.title ?? "",
      productSlug: p?.slug ?? "",
    });
  }

  return json({
    ok: true,
    status: "pending",
    productTitle: p?.title ?? "",
    productSlug: p?.slug ?? "",
    creatorName: c?.display_name ?? "",
  });
});
