import { NextRequest } from "next/server";
import { apiError, json, resolveUser, withErrorHandling } from "@/lib/api";
import { getSupabaseAdminClient } from "@/lib/supabase";
import { verifyPesapalPayment } from "@/lib/pesapal";

export const GET = withErrorHandling(async (request: NextRequest, context?: unknown) => {
  const { params } = context as { params: Promise<{ orderId: string }> };
  const { orderId } = await params;
  if (!orderId) return apiError("Missing order ID", 400);

  const { user } = await resolveUser(request);
  const adminSupabase = getSupabaseAdminClient();

  const ref = request.nextUrl.searchParams.get("ref");
  const trackingIdFromUrl = request.nextUrl.searchParams.get("trackingId") ?? "";

  // Try looking up the order by merchant reference first if provided
  let order: Record<string, unknown> | null = null;
  if (ref) {
    const { data: payment } = await adminSupabase
      .from("payments")
      .select("order_id")
      .eq("merchant_reference", ref)
      .maybeSingle();
    if (payment?.order_id) {
      const { data: found } = await adminSupabase
        .from("orders")
        .select(`
          id, status, buyer_email, buyer_id, creator_id,
          product:product_id (title, slug, store:store_id (slug)),
          creator:creator_id (display_name)
        `)
        .eq("id", payment.order_id)
        .maybeSingle();
      order = found;
    }
  }

  // Fall back to looking up by order ID directly
  if (!order) {
    const { data: found, error: err } = await adminSupabase
      .from("orders")
      .select(`
        id, status, buyer_email, buyer_id, creator_id,
        product:product_id (title, slug, store:store_id (slug)),
        creator:creator_id (display_name)
      `)
      .eq("id", orderId)
      .maybeSingle();
    if (err) {
      console.error("[orderStatus] Supabase error:", err.message);
      return apiError("Database error", 500);
    }
    order = found;
  }

  if (!order) return apiError("Order not found", 404);

  const p = order.product as unknown as { title: string; slug: string; store: { slug: string } | null } | undefined;
  const c = order.creator as unknown as { display_name: string } | undefined;
  const storeSlug = p?.store?.slug ?? "";

  // No ownership check — the order_id UUID in the URL is unguessable and acts
  // as the authorization token for this page (buyer was redirected here from
  // Pesapal after payment).  A logged-in user whose email doesn't match
  // order.buyer_email (e.g. guest checkout with a different email) must still
  // be able to see their order status and download link.

  if (order.status === "paid") {
    const { data: download } = await adminSupabase
      .from("downloads")
      .select("token")
      .eq("order_id", orderId)
      .maybeSingle();

    return json({
      ok: true,
      status: "completed",
      orderId: order.id,
      productTitle: p?.title ?? "",
      productSlug: p?.slug ?? "",
      storeSlug,
      creatorName: c?.display_name ?? "",
      buyerId: user ? order.buyer_id : undefined,
      downloadUrl: download?.token ? `/api/downloads/${download.token}` : undefined,
    });
  }

  if (order.status === "failed") {
    return json({
      ok: false,
      status: "failed",
      orderId: order.id,
      productTitle: p?.title ?? "",
      productSlug: p?.slug ?? "",
      storeSlug,
    });
  }

  // --- Pending: try direct verification with Pesapal ---
  if (order.status === "pending") {
    try {
      const { data: payment } = await adminSupabase
        .from("payments")
        .select("merchant_reference, pesapal_tracking_id")
        .eq("order_id", orderId)
        .maybeSingle();

      const resolvedTrackingId = (payment?.pesapal_tracking_id as string | undefined) ?? trackingIdFromUrl || null;

      if (payment?.merchant_reference && resolvedTrackingId) {
        const result = await verifyPesapalPayment(
          adminSupabase,
          payment.merchant_reference,
          resolvedTrackingId
        );

        if (result.ok) {
          const { data: updatedOrder } = await adminSupabase
            .from("orders")
            .select(`
              id, status, buyer_email, buyer_id, creator_id,
              product:product_id (title, slug, store:store_id (slug)),
              creator:creator_id (display_name)
            `)
            .eq("id", orderId)
            .single();

          if (updatedOrder?.status === "paid") {
            const { data: download } = await adminSupabase
              .from("downloads")
              .select("token")
              .eq("order_id", orderId)
              .maybeSingle();

            return json({
              ok: true,
              status: "completed",
              orderId: updatedOrder.id,
              productTitle: p?.title ?? "",
              productSlug: p?.slug ?? "",
              storeSlug,
              creatorName: c?.display_name ?? "",
              buyerId: user ? updatedOrder.buyer_id : undefined,
              downloadUrl: download?.token ? `/api/downloads/${download.token}` : undefined,
            });
          }
        }
      }
    } catch (e) {
      console.error("[orderStatus] Pesapal verification error:", e instanceof Error ? e.message : e);
    }
  }

  return json({
    ok: true,
    status: "pending",
    orderId: order.id,
    productTitle: p?.title ?? "",
    productSlug: p?.slug ?? "",
    storeSlug,
    creatorName: c?.display_name ?? "",
  });
});
