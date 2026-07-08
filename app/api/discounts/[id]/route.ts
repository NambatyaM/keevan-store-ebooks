import { NextRequest } from "next/server";
import { apiError, json, requireUser, withErrorHandling } from "@/lib/api";
import { z } from "zod";

export const PATCH = withErrorHandling(async (request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const { supabase, authUser, profile } = await requireUser(request);
  if (profile.role !== "creator") return apiError("Only creators can manage discounts", 403);

  const { id } = await params;

  const { data: creator } = await supabase.from("creators").select("id").eq("user_id", authUser.id).single();
  if (!creator) return apiError("Creator not found", 404);

  const { data: discount } = await supabase.from("discounts").select("*").eq("id", id).single();
  if (!discount || discount.creator_id !== creator.id) return apiError("Discount not found", 404);

  const body = await request.json();
  const schema = z.object({ isActive: z.boolean() });
  const parsed = schema.safeParse(body);
  if (!parsed.success) return apiError("Invalid request", 400);

  const { error } = await supabase.from("discounts").update({ is_active: parsed.data.isActive }).eq("id", id);
  if (error) return apiError(error.message, 400);

  return json({ ok: true });
});

export const DELETE = withErrorHandling(async (request: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  const { supabase, authUser, profile } = await requireUser(request);
  if (profile.role !== "creator") return apiError("Only creators can manage discounts", 403);

  const { id } = await params;

  const { data: creator } = await supabase.from("creators").select("id").eq("user_id", authUser.id).single();
  if (!creator) return apiError("Creator not found", 404);

  const { data: discount } = await supabase.from("discounts").select("*").eq("id", id).single();
  if (!discount || discount.creator_id !== creator.id) return apiError("Discount not found", 404);

  const { error } = await supabase.from("discounts").delete().eq("id", id);
  if (error) return apiError(error.message, 400);

  return json({ ok: true });
});
