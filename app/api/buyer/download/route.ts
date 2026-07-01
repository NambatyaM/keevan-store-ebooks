import { NextRequest } from "next/server";
import { apiError, json, requireUser, withErrorHandling } from "@/lib/api";
import { getSupabaseAdminClient } from "@/lib/supabase";

export const GET = withErrorHandling(async (request: NextRequest) => {
  const { supabase, authUser, profile } = await requireUser(request);

  if (profile.role !== "buyer") return apiError("Access denied", 403);

  const { data: buyer, error: buyerError } = await supabase
    .from("buyers")
    .select("id")
    .eq("user_id", authUser.id)
    .single();

  if (buyerError) return apiError(buyerError.message, 500);
  if (!buyer) return apiError("Buyer not found", 404);

  const url = new URL(request.url);
  const slug = url.searchParams.get("slug");
  if (!slug) return apiError("Missing product slug", 400);

  const { data: productMatch, error: productError } = await supabase
    .from("products")
    .select("id")
    .eq("slug", slug)
    .single();

  if (productError) return apiError(productError.message, 500);
  if (!productMatch) return apiError("Product not found", 404);

  const { data: purchase, error: purchaseError } = await supabase
    .from("buyer_purchases")
    .select("product_id, store_id, order_id")
    .eq("buyer_id", buyer.id)
    .eq("product_id", productMatch.id)
    .maybeSingle();

  if (purchaseError) return apiError(purchaseError.message, 500);
  if (!purchase) return apiError("Purchase not found", 404);

  const admin = getSupabaseAdminClient();

  const { data: product, error: productFileError } = await admin
    .from("products")
    .select("file_path")
    .eq("id", purchase.product_id)
    .single();

  if (productFileError) return apiError(productFileError.message, 500);
  if (!product?.file_path) return apiError("File not found", 404);

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const bucket = "products";

  const { data: signedUrl, error: signedUrlError } = await admin.storage
    .from(bucket)
    .createSignedUrl(product.file_path, 86400);

  if (signedUrlError) return apiError(signedUrlError.message, 500);
  if (!signedUrl) return apiError("Unable to generate download URL", 500);

  await Promise.allSettled([
    admin.from("analytics_events").insert({
      product_id: productMatch.id,
      store_id: purchase.store_id ?? null,
      event_type: "download",
      metadata: { source: "buyer_dashboard", order_id: purchase.order_id }
    }),
    admin.from("downloads")
      .update({ downloaded_at: new Date().toISOString() })
      .eq("order_id", purchase.order_id)
  ]);

  return json({ url: signedUrl.signedUrl });
});
