import { NextRequest } from "next/server";
import { apiError, json, readJson, requireUser, withErrorHandling } from "@/lib/api";
import { z } from "zod";

const createReviewSchema = z.object({
  productId: z.string().uuid(),
  rating: z.number().int().min(1).max(5),
  comment: z.string().min(5).max(1000)
});

export const GET = withErrorHandling(async (request: NextRequest) => {
  const url = new URL(request.url);
  const productId = url.searchParams.get("productId");

  if (!productId) return apiError("Missing productId", 400);

  const { getSupabaseAdminClient } = await import("@/lib/supabase");
  const admin = getSupabaseAdminClient();

  const { data } = await admin
    .from("reviews")
    .select("id, display_name, rating, comment, created_at")
    .eq("product_id", productId)
    .eq("status", "approved")
    .order("created_at", { ascending: false });

  return json({ reviews: data ?? [] });
});

export const POST = withErrorHandling(async (request: NextRequest) => {
  const { supabase, authUser, profile } = await requireUser(request);
  if (profile.role !== "buyer") return apiError("Only buyers can review", 403);

  const input = await readJson(request, createReviewSchema);

  const { data: buyer } = await supabase
    .from("buyers")
    .select("id, display_name")
    .eq("user_id", authUser.id)
    .single();

  if (!buyer) return apiError("Buyer not found", 404);

  const { data: purchase } = await supabase
    .from("buyer_purchases")
    .select("id, order_id")
    .eq("buyer_id", buyer.id)
    .eq("product_id", input.productId)
    .maybeSingle();

  if (!purchase) return apiError("You must purchase this product before reviewing", 403);

  const { data: existing } = await supabase
    .from("reviews")
    .select("id")
    .eq("product_id", input.productId)
    .eq("buyer_id", buyer.id)
    .maybeSingle();

  if (existing) return apiError("You already reviewed this product", 409);

  const { error } = await supabase.from("reviews").insert({
    product_id: input.productId,
    buyer_id: buyer.id,
    order_id: purchase.order_id,
    display_name: buyer.display_name,
    rating: input.rating,
    comment: input.comment,
    status: "pending"
  });

  if (error) return apiError(error.message, 400);

  return json({ ok: true }, { status: 201 });
});
