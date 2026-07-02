import { NextRequest } from "next/server";
import { randomUUID } from "crypto";
import { apiError, json, readJson, withErrorHandling, requireUser } from "@/lib/api";
import { checkoutSchema } from "@/lib/schemas";
import { calculateSaleSplit, site, currencyPhoneRegex, type Currency } from "@/lib/constants";
import { createPesapalOrder } from "@/lib/pesapal";
import { getSupabaseAdminClient } from "@/lib/supabase";

function validatePesapalConfig(): string | null {
  if (!process.env.PESAPAL_CONSUMER_KEY) return "PESAPAL_CONSUMER_KEY is not configured";
  if (!process.env.PESAPAL_CONSUMER_SECRET) return "PESAPAL_CONSUMER_SECRET is not configured";
  return null;
}

export const POST = withErrorHandling(async (request: NextRequest) => {
  const configErr = validatePesapalConfig();
  if (configErr) {
    console.error("[payments/create] Pesapal config validation failed:", configErr);
    return apiError(configErr, 502);
  }

  const input = await readJson(request, checkoutSchema);
  const supabase = getSupabaseAdminClient();

  const { data: product, error: productError } = await supabase
    .from("products")
    .select("id,slug,title,price,currency,creator_id,status,store_id,file_path")
    .eq("id", input.productId)
    .single();

  if (productError || !product || product.status !== "published") return apiError("Product is not available for purchase", 404);

  if (!product.file_path || product.file_path.trim() === "") {
    console.error(`[payments/create] Product ${product.id} has no file_path — blocking purchase`);
    return apiError("Product is not available for purchase", 404);
  }

  const { data: store, error: storeError } = await supabase.from("stores").select("status,currency").eq("id", product.store_id).single();
  if (storeError || !store || store.status !== "active") return apiError("Product is not available for purchase", 404);

  const fifteenMinAgo = new Date(Date.now() - 15 * 60 * 1000).toISOString();

  const { data: existingPending } = await supabase
    .from("orders")
    .select("id")
    .eq("buyer_email", input.buyerEmail)
    .eq("product_id", input.productId)
    .eq("status", "pending")
    .gte("created_at", fifteenMinAgo)
    .limit(1)
    .maybeSingle();

  if (existingPending) {
    return apiError(
      "You have a payment still in progress. Please complete it on Pesapal, or wait 15 minutes for it to expire. " +
      "Need help? Contact us on WhatsApp. If you already paid, check your order status.",
      409
    );
  }

  const { data: existingPaid } = await supabase
    .from("orders")
    .select("id")
    .eq("buyer_email", input.buyerEmail)
    .eq("product_id", input.productId)
    .eq("status", "paid")
    .limit(1)
    .maybeSingle();

  if (existingPaid) {
    return apiError(
      "You already purchased this product. Visit your purchases at /buyer/dashboard or contact support if you need help.",
      409
    );
  }

  let discountPrice = product.price;
  let discountId: string | null = null;

  const { data: activeDiscount } = await supabase
    .from("discounts")
    .select("id, discount_percent, max_uses, use_count")
    .eq("product_id", input.productId)
    .eq("is_active", true)
    .lte("starts_at", new Date().toISOString())
    .gte("expires_at", new Date().toISOString())
    .maybeSingle();

  if (activeDiscount) {
    if (!activeDiscount.max_uses || activeDiscount.use_count < activeDiscount.max_uses) {
      discountPrice = Math.round(product.price * (1 - activeDiscount.discount_percent / 100));
      discountId = activeDiscount.id;
    }
  }

  let buyerId: string | null = null;
  try {
    const { profile } = await requireUser(request);
    if (profile.role === "buyer") {
      const { data: buyer } = await supabase
        .from("buyers")
        .select("id")
        .eq("user_id", profile.id)
        .single();
      if (buyer) buyerId = buyer.id;
    }
  } catch {
    // buyerId stays null — guest checkout proceeds without buyer linking
  }

  const storeCurrency = (store.currency as Currency) ?? "UGX";

  if (input.phone) {
    const phoneRegex = currencyPhoneRegex[storeCurrency] ?? currencyPhoneRegex.UGX;
    if (!phoneRegex.test(input.phone)) {
      return apiError("Enter a valid phone number for your region.", 422);
    }
  }

  const split = calculateSaleSplit(discountPrice);
  const orderInsert: Record<string, unknown> = {
    product_id: product.id,
    creator_id: product.creator_id,
    buyer_email: input.buyerEmail,
    buyer_name: input.buyerName,
    amount: split.grossAmount,
    platform_fee: split.platformFee,
    creator_earnings: split.creatorEarnings,
    currency: storeCurrency,
  };

  if (buyerId) orderInsert.buyer_id = buyerId;
  if (discountId) orderInsert.discount_id = discountId;

  const { data: order, error: orderError } = await supabase
    .from("orders")
    .insert(orderInsert)
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

  // Build the callback base URL.
  // Priority: NEXT_PUBLIC_SITE_URL (production domain, manually configured) → VERCEL_URL
  // (deployment-specific URL, auto-set by Vercel) → request origin → empty string.
  // NEXT_PUBLIC_SITE_URL must come first: VERCEL_URL is a preview-deploy URL on Vercel
  // (e.g. my-app-abc123.vercel.app) and would route Pesapal callbacks to the wrong host.
  const requestOrigin = request.headers.get("origin");
  const callbackBase =
    (site.url && site.url.trim() !== "")
      ? site.url.replace(/\/$/, "")
      : process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : (requestOrigin && requestOrigin !== "null" && requestOrigin.trim() !== "")
          ? requestOrigin
          : "";

  if (!callbackBase) {
    console.error("[payments/create] Cannot determine callback base URL — NEXT_PUBLIC_SITE_URL is not set and no fallback available");
    return apiError("Payment configuration error. Please contact support.", 500);
  }

  if (!discountPrice || discountPrice <= 0) {
    await Promise.all([
      supabase.from("payments").delete().eq("order_id", order.id),
      supabase.from("orders").delete().eq("id", order.id),
    ]);
    return apiError("Invalid product price", 400);
  }

  try {
    const pesapal = await createPesapalOrder({
      id: merchantReference,
      amount: split.grossAmount,
      currency: storeCurrency,
      email: input.buyerEmail,
      phone: input.phone,
      firstName: input.buyerName.split(" ")[0] || input.buyerName,
      lastName: input.buyerName.split(" ").slice(1).join(" ") || "Customer",
      description: product.title,
      callbackUrl: `${callbackBase}/order/success?order_id=${order.id}`
    });

    // Save the Pesapal tracking ID so the status route can later verify the
    // payment directly without relying on the IPN webhook.
    const trackingId = (pesapal.order_tracking_id as string | undefined) ?? "";
    if (trackingId) {
      try {
        await supabase
          .from("payments")
          .update({ pesapal_tracking_id: trackingId })
          .eq("merchant_reference", merchantReference);
      } catch (e) {
        console.error("[payments/create] Failed to save pesapal_tracking_id:", e);
      }
    }

    if (discountId) {
      try {
        await supabase.rpc("increment_discount_use", { discount_id: discountId });
      } catch (e) {
        console.error("[payments/create] Failed to increment discount use count:", e);
      }
    }

    return json({ orderId: order.id, merchantReference, redirectUrl: pesapal.redirect_url });
  } catch (err) {
    const pesapalError = err instanceof Error ? err.message : String(err ?? "Unknown error");
    console.error("[payments/create] Pesapal order creation failed:", { error: pesapalError, merchantRef: merchantReference });
    try {
      await supabase.from("payments").delete().eq("order_id", order.id);
    } catch { /* cleanup best-effort */ }
    try {
      await supabase.from("orders").delete().eq("id", order.id);
    } catch { /* cleanup best-effort */ }
    return apiError(pesapalError, 502);
  }
});
