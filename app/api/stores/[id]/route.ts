import { NextRequest } from "next/server";
import { apiError, json, readJson, requireUser, withErrorHandling } from "@/lib/api";
import { storeSchema } from "@/lib/schemas";

export const PATCH = withErrorHandling(async (request: NextRequest, context?: unknown) => {
  const { params } = context as { params: Promise<{ id: string }> };
  const { id } = await params;
  const input = await readJson(request, storeSchema.partial());
  const { supabase, authUser, profile } = await requireUser(request);

  const { data: store } = await supabase.from("stores").select("creator_id,currency").eq("id", id).maybeSingle();
  if (!store) return apiError("Store not found", 404);

  if (profile.role !== "admin") {
    const { data: creator } = await supabase.from("creators").select("id").eq("user_id", authUser.id).maybeSingle();
    if (!creator || store.creator_id !== creator.id) {
      return apiError("Store not found", 404);
    }
  }

  // Prevent currency change after first paid order
  if (input.currency && input.currency !== store.currency) {
    const { count } = await supabase
      .from("orders")
      .select("*", { count: "exact", head: true })
      .eq("status", "paid")
      .eq("store_id", id);

    if (count && count > 0) {
      return apiError("Cannot change store currency after paid orders exist. Contact support.", 409);
    }
  }

  const { data, error } = await supabase.from("stores").update(input).eq("id", id).select("*").single();
  if (error) return apiError(error.message, 400);
  return json({ store: data });
});

export const DELETE = withErrorHandling(async (request: NextRequest, context?: unknown) => {
  const { params } = context as { params: Promise<{ id: string }> };
  const { id } = await params;
  const { supabase, authUser, profile } = await requireUser(request);

  const { data: store } = await supabase.from("stores").select("creator_id").eq("id", id).maybeSingle();
  if (!store) return apiError("Store not found", 404);

  if (profile.role !== "admin") {
    const { data: creator } = await supabase.from("creators").select("id").eq("user_id", authUser.id).maybeSingle();
    if (!creator || store.creator_id !== creator.id) {
      return apiError("Store not found", 404);
    }
  }

  const { count: productCount } = await supabase
    .from("products")
    .select("*", { count: "exact", head: true })
    .eq("store_id", id);

  if (productCount && productCount > 0) {
    return apiError("Cannot delete store with existing products. Disable the store instead.", 409);
  }

  const { error } = await supabase.from("stores").delete().eq("id", id);
  if (error) return apiError(error.message, 400);
  return json({ ok: true });
});
