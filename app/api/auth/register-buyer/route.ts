import { NextRequest } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase";
import { apiError, json, readJson, withOptionalCsrf } from "@/lib/api";
import { z } from "zod";

const registerBuyerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).regex(/[a-z]/, "Password must contain a lowercase letter").regex(/[A-Z]/, "Password must contain an uppercase letter").regex(/[0-9]/, "Password must contain a number"),
  fullName: z.string().min(2),
  phone: z.string().optional()
});

export const POST = withOptionalCsrf(async (request: NextRequest) => {
  const input = await readJson(request, registerBuyerSchema);
  const supabase = getSupabaseAdminClient();

  const { data, error } = await supabase.auth.admin.createUser({
    email: input.email,
    password: input.password,
    email_confirm: true,
    user_metadata: { full_name: input.fullName, role: "buyer" }
  });

  if (error || !data.user) return apiError(error?.message ?? "Unable to register", 400);

  const userId = data.user.id;

  const { error: userError } = await supabase.from("users").insert({
    id: userId,
    email: input.email,
    full_name: input.fullName,
    role: "buyer"
  });

  if (userError) {
    await supabase.auth.admin.deleteUser(userId);
    return apiError(userError.message, 400);
  }

  const { error: buyerError } = await supabase.from("buyers").insert({
    user_id: userId,
    display_name: input.fullName,
    phone: input.phone || null
  });

  if (buyerError) {
    await supabase.from("users").delete().eq("id", userId);
    await supabase.auth.admin.deleteUser(userId);
    return apiError(buyerError.message, 400);
  }

  // After successful buyer creation, link any guest purchases with matching email
  const { data: buyerRecord } = await supabase
    .from("buyers")
    .select("id")
    .eq("user_id", userId)
    .single();

  if (buyerRecord) {
    const { data: existingOrders } = await supabase
      .from("orders")
      .select("id, product_id, creator_id, store_id")
      .eq("buyer_email", input.email)
      .eq("status", "paid")
      .is("buyer_id", null);

    if (existingOrders && existingOrders.length > 0) {
      const purchaseInserts = existingOrders.map((order) => ({
        buyer_id: buyerRecord.id,
        order_id: order.id,
        product_id: order.product_id,
        creator_id: order.creator_id,
        store_id: order.store_id,
      }));

      await supabase.from("buyer_purchases").insert(purchaseInserts);

      await supabase
        .from("orders")
        .update({ buyer_id: buyerRecord.id })
        .in("id", existingOrders.map((o) => o.id));
    }
  }

  return json({ userId, role: "buyer" }, { status: 201 });
});
