import { NextRequest } from "next/server";
import { apiError, json, readJson, requireUser, withErrorHandling } from "@/lib/api";
import { z } from "zod";

const createDiscountSchema = z.object({
  productId: z.string().uuid(),
  discountPercent: z.number().int().min(1).max(100),
  startsAt: z.string(),
  expiresAt: z.string(),
  maxUses: z.number().int().positive().optional()
});

export const POST = withErrorHandling(async (request: NextRequest) => {
  const { supabase, authUser, profile } = await requireUser(request);
  if (profile.role !== "creator") return apiError("Only creators can create discounts", 403);

  const input = await readJson(request, createDiscountSchema);

  const { data: creator } = await supabase
    .from("creators")
    .select("id")
    .eq("user_id", authUser.id)
    .single();

  if (!creator) return apiError("Creator not found", 404);

  const { data: product } = await supabase
    .from("products")
    .select("id, creator_id")
    .eq("id", input.productId)
    .single();

  if (!product || product.creator_id !== creator.id) {
    return apiError("Product not found or not yours", 404);
  }

  const { data, error } = await supabase.from("discounts").insert({
    product_id: input.productId,
    creator_id: creator.id,
    discount_percent: input.discountPercent,
    starts_at: input.startsAt,
    expires_at: input.expiresAt,
    max_uses: input.maxUses || null
  }).select("*").single();

  if (error) return apiError(error.message, 400);

  return json({ discount: data }, { status: 201 });
});

export const GET = withErrorHandling(async (request: NextRequest) => {
  const { supabase, authUser, profile } = await requireUser(request);
  if (profile.role !== "creator") return json({ discounts: [] });

  const { data: creator } = await supabase
    .from("creators")
    .select("id")
    .eq("user_id", authUser.id)
    .single();

  if (!creator) return json({ discounts: [] });

  const { data } = await supabase
    .from("discounts")
    .select("*, products!inner(title, slug)")
    .eq("creator_id", creator.id)
    .order("created_at", { ascending: false });

  return json({ discounts: data ?? [] });
});
