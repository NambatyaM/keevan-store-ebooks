import { NextRequest, NextResponse } from "next/server";
import { apiError, withErrorHandling } from "@/lib/api";
import { getSupabaseAdminClient } from "@/lib/supabase";

export const GET = withErrorHandling(async (_request: NextRequest, context?: unknown) => {
  const { params } = context as { params: Promise<{ token: string }> };
  const { token } = await params;
  const supabase = getSupabaseAdminClient();
  const { data: download, error } = await supabase
    .from("downloads")
    .select("id,expires_at,order_id,product_id,products(file_path)")
    .eq("token", token)
    .single();

  if (error || !download) return apiError("Download not found", 404);
  if (new Date(download.expires_at).getTime() < Date.now()) return apiError("Download link expired", 410);

  const product = Array.isArray(download.products) ? download.products[0] : download.products;
  const { data, error: signedError } = await supabase.storage.from("products").createSignedUrl(product.file_path, 60);
  if (signedError || !data?.signedUrl) return apiError("Unable to create signed download URL", 500);

  await supabase.from("downloads").update({ downloaded_at: new Date().toISOString() }).eq("id", download.id);

  await supabase.from("analytics_events").insert({
    product_id: download.product_id,
    event_type: "download",
    metadata: { order_id: download.order_id }
  });

  return NextResponse.redirect(data.signedUrl);
});
