import { NextRequest } from "next/server";
import { apiError, json, readJson, requireUser, withErrorHandling } from "@/lib/api";
import { withdrawalSchema } from "@/lib/schemas";
import { minimumWithdrawalByCurrency, type Currency } from "@/lib/constants";

export const GET = withErrorHandling(async (request: NextRequest) => {
  const { supabase, authUser } = await requireUser(request);

  const { data: creator } = await supabase.from("creators").select("id").eq("user_id", authUser.id).single();
  if (!creator) return json({ withdrawals: [] });

  const { data } = await supabase
    .from("withdrawal_requests")
    .select("*")
    .eq("creator_id", creator.id)
    .order("requested_at", { ascending: false });

  return json({ withdrawals: data ?? [] });
});

export const POST = withErrorHandling(async (request: NextRequest) => {
  const input = await readJson(request, withdrawalSchema);
  const { supabase, authUser } = await requireUser(request);

  const { data: creator } = await supabase
    .from("creators")
    .select("id")
    .eq("user_id", authUser.id)
    .single();

  if (!creator) return apiError("Creator profile not found", 404);

  const { data: store } = await supabase
    .from("stores")
    .select("currency")
    .eq("creator_id", creator.id)
    .maybeSingle();

  const storeCurrency = (store?.currency ?? "UGX") as Currency;
  const minForCurrency = minimumWithdrawalByCurrency[storeCurrency];

  if (input.amount < minForCurrency) {
    return apiError(
      `Minimum withdrawal amount is ${minForCurrency.toLocaleString()} ${storeCurrency}.`,
      400
    );
  }

  const { data, error } = await supabase.rpc("reserve_withdrawal", {
    p_amount: input.amount,
    p_payout_method: input.payoutMethod,
    p_payout_details: input.payoutDetails,
  });

  if (error) return apiError(error.message, 400);
  return json({ withdrawal: Array.isArray(data) ? data[0] : data }, { status: 201 });
});
