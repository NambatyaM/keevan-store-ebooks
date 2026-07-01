import { NextRequest, NextResponse } from "next/server";
import { apiError, withErrorHandling } from "@/lib/api";
import { getSupabaseAdminClient } from "@/lib/supabase";

export const GET = withErrorHandling(async (_request: NextRequest, context?: unknown) => {
  const { params } = context as { params: Promise<{ token: string }> };
  const { token } = await params;
  const supabase = getSupabaseAdminClient();

  // Fetch the download record together with the linked order status and the product file path
  const { data: download, error } = await supabase
    .from("downloads")
    .select("id,expires_at,order_id,product_id,products(file_path),orders(status)")
    .eq("token", token)
    .single();

  // 404 — token does not exist
  if (error || !download) return apiError("Download not found", 404);

  // 410 Gone — token has expired
  if (new Date(download.expires_at).getTime() < Date.now()) {
    return apiError("Download link has expired", 410);
  }

  // 403 Forbidden — order has not been paid
  const order = Array.isArray(download.orders) ? download.orders[0] : download.orders;
  if (!order || order.status !== "paid") {
    return apiError("Purchase not confirmed. Please contact support if you have already paid.", 403);
  }

  // Ensure the product record and file_path are present
  const product = Array.isArray(download.products) ? download.products[0] : download.products;
  if (!product || !product.file_path) {
    return apiError("Product file not found", 404);
  }

  // Generate a signed URL with a short TTL (≤ 60 seconds) so it cannot be shared
  const { data, error: signedError } = await supabase.storage
    .from("products")
    .createSignedUrl(product.file_path, 60);

  if (signedError || !data?.signedUrl) {
    return apiError("Unable to create signed download URL", 500);
  }

  // Record the download timestamp for this token
  await supabase
    .from("downloads")
    .update({ downloaded_at: new Date().toISOString() })
    .eq("id", download.id);

  // Log a download analytics event (download_count does not exist as a column;
  // analytics_events is the canonical way to track download counts)
  await supabase.from("analytics_events").insert({
    product_id: download.product_id,
    event_type: "download",
    metadata: { order_id: download.order_id },
  });

  return NextResponse.redirect(data.signedUrl);
});
