import { NextRequest } from "next/server";
import { apiError, json, withErrorHandling } from "@/lib/api";
import { getSupabaseAdminClient } from "@/lib/supabase";

export const GET = withErrorHandling(async (request: NextRequest) => {
  const url = new URL(request.url);
  const orderId = url.pathname.split("/").at(-2);
  if (!orderId) return apiError("Missing order ID", 400);

  const supabase = getSupabaseAdminClient();

  const { data: order } = await supabase
    .from("orders")
    .select(`
      id, status, buyer_id, amount,
      product:product_id (title, slug, file_path),
      creator:creator_id (display_name)
    `)
    .eq("id", orderId)
    .maybeSingle();

  if (!order) return apiError("Order not found", 404);

  const p = order.product as unknown as { title: string; slug: string; file_path: string } | undefined;
  const c = order.creator as unknown as { display_name: string } | undefined;

  if (order.status === "paid") {
    let downloadUrl: string | null = null;

    if (p?.file_path) {
      const { data: signedUrl } = await supabase.storage
        .from("products")
        .createSignedUrl(p.file_path, 86400);

      if (signedUrl) downloadUrl = signedUrl.signedUrl;
    }

    return json({
      ok: true,
      status: "completed",
      productTitle: p?.title ?? "",
      productSlug: p?.slug ?? "",
      creatorName: c?.display_name ?? "",
      downloadUrl,
      buyerId: order.buyer_id,
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
