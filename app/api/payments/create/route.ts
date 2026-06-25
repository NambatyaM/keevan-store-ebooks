import { NextRequest } from "next/server";
import { randomUUID } from "crypto";
import { apiError, json, readJson, withErrorHandling } from "@/lib/api";
import { checkoutSchema } from "@/lib/schemas";
import { calculateSaleSplit, site } from "@/lib/constants";
import { createPesapalOrder } from "@/lib/pesapal";
import { getSupabaseAdminClient } from "@/lib/supabase";

export const POST = withErrorHandling(async (request: NextRequest) => {
  const input = await readJson(request, checkoutSchema);
  const supabase = getSupabaseAdminClient();
  const { data: product, error: productError } = await supabase
    .from("products")
    .select("id,slug,title,price,creator_id,status")
    .eq("id", input.productId)
    .single();

  if (productError || !product || product.status !== "published") return apiError("Product is not available for purchase", 404);

  const split = calculateSaleSplit(product.price);
  const { data: order, error: orderError } = await supabase
    .from("orders")
    .insert({
      product_id: product.id,
      creator_id: product.creator_id,
      buyer_email: input.buyerEmail,
      buyer_name: input.buyerName,
      amount: split.grossAmount,
      platform_fee: split.platformFee,
      creator_earnings: split.creatorEarnings
    })
    .select("*")
    .single();

  if (orderError || !order) return apiError(orderError?.message ?? "Unable to create order", 400);

  const merchantReference = randomUUID();
  const { error: paymentError } = await supabase
    .from("payments")
    .insert({ order_id: order.id, merchant_reference: merchantReference });

  if (paymentError) {
    await supabase.from("orders").delete().eq("id", order.id);
    return apiError(paymentError.message, 400);
  }

  const pesapal = await createPesapalOrder({
    id: merchantReference,
    amount: split.grossAmount,
    email: input.buyerEmail,
    phone: input.phone,
    firstName: input.buyerName.split(" ")[0] ?? input.buyerName,
    lastName: input.buyerName.split(" ").slice(1).join(" ") || "Customer",
    description: product.title,
    callbackUrl: `${site.url}/download/${product.slug}?merchantReference=${encodeURIComponent(merchantReference)}`
  });

  return json({ orderId: order.id, merchantReference, redirectUrl: pesapal.redirect_url, pesapal });
});
