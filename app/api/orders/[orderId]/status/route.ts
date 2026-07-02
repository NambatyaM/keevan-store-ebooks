import { NextRequest } from "next/server";
import { apiError, json, resolveUser, withErrorHandling } from "@/lib/api";
import { getSupabaseAdminClient } from "@/lib/supabase";

export const GET = withErrorHandling(async (request: NextRequest, context?: unknown) => {
  const { params } = context as { params: Promise<{ orderId: string }> };
  const { orderId } = await params;
  if (!orderId) return apiError("Missing order ID", 400);

  const { user } = await resolveUser(request);
  const adminSupabase = getSupabaseAdminClient();

  const ref = request.nextUrl.searchParams.get("ref");

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

  // --- Authenticated path: enforce ownership ---
  if (user) {
    const isBuyer = order.buyer_email === user.email;
    const isCreator = order.creator_id
      ? (await adminSupabase
          .from("creators")
          .select("id")
          .eq("id", order.creator_id)
          .eq("user_id", user.id)
          .maybeSingle()
        ).data !== null
      : false;

    if (!isBuyer && !isCreator) {
      return apiError("Access denied", 403);
    }
  }
  // --- Guest path: no ownership check, order was found by ID — that's sufficient ---

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
