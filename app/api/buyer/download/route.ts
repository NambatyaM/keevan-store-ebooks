import { NextRequest } from "next/server";
import { apiError, json, requireUser, withErrorHandling } from "@/lib/api";
import { getSupabaseAdminClient } from "@/lib/supabase";

export const GET = withErrorHandling(async (request: NextRequest) => {
  const { supabase, authUser, profile } = await requireUser(request);

  if (profile.role !== "buyer") return apiError("Access denied", 403);

  const { data: buyer } = await supabase
    .from("buyers")
    .select("id")
    .eq("user_id", authUser.id)
    .single();

  if (!buyer) return apiError("Buyer not found", 404);

  const url = new URL(request.url);
  const slug = url.searchParams.get("slug");
  if (!slug) return apiError("Missing product slug", 400);

  const { data: productMatch } = await supabase
    .from("products")
    .select("id")
    .eq("slug", slug)
    .single();

  if (!productMatch) return apiError("Product not found", 404);

  const { data: purchase } = await supabase
    .from("buyer_purchases")
    .select("product_id")
    .eq("buyer_id", buyer.id)
    .eq("product_id", productMatch.id)
    .maybeSingle();

  if (!purchase) return apiError("Purchase not found", 404);

  const admin = getSupabaseAdminClient();

  const { data: product } = await admin
    .from("products")
    .select("file_path")
    .eq("id", purchase.product_id)
    .single();

  if (!product?.file_path) return apiError("File not found", 404);

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const bucket = "products";

  const { data: signedUrl } = await admin.storage
    .from(bucket)
    .createSignedUrl(product.file_path, 86400);

  if (!signedUrl) return apiError("Unable to generate download URL", 500);

  return json({ url: signedUrl.signedUrl });
});
