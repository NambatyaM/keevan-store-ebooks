import { NextRequest } from "next/server";
import { json, requireUser, withErrorHandling } from "@/lib/api";

export const GET = withErrorHandling(async (request: NextRequest) => {
  const { supabase, authUser, profile: userProfile } = await requireUser(request);

  let creatorData: Record<string, unknown> | null = null;
  let storeData: Record<string, unknown> | null = null;

  if (userProfile.role === "creator") {
    const { data: creator } = await supabase
      .from("creators")
      .select("id,display_name,bio,phone,available_balance,total_earnings,payout_method,mtn_number,airtel_number,bank_name,bank_account,account_name,notif_sale,notif_withdrawal,notif_refund,notif_weekly,notif_updates")
      .eq("user_id", authUser.id)
      .single();
    creatorData = creator;

    if (creator) {
      const { data: store } = await supabase
        .from("stores")
        .select("id,slug,name,description,status,tagline,category,social_links")
        .eq("creator_id", creator.id)
        .single();
      storeData = store;
    }
  }

  let buyerData: Record<string, unknown> | null = null;

  if (userProfile.role === "buyer") {
    const { data: buyer } = await supabase
      .from("buyers")
      .select("id,display_name,phone")
      .eq("user_id", authUser.id)
      .single();
    buyerData = buyer;
  }

  return json({
    profile: {
      id: authUser.id,
      email: authUser.email,
      full_name: userProfile.full_name,
      role: userProfile.role,
      ...(creatorData && {
        creator_id: creatorData.id,
        display_name: creatorData.display_name,
        bio: creatorData.bio,
        phone: creatorData.phone,
        available_balance: creatorData.available_balance,
        total_earnings: creatorData.total_earnings,
        payout_method: creatorData.payout_method,
        mtn_number: creatorData.mtn_number,
        airtel_number: creatorData.airtel_number,
        bank_name: creatorData.bank_name,
        bank_account: creatorData.bank_account,
        account_name: creatorData.account_name,
        notif_sale: creatorData.notif_sale,
        notif_withdrawal: creatorData.notif_withdrawal,
        notif_refund: creatorData.notif_refund,
        notif_weekly: creatorData.notif_weekly,
        notif_updates: creatorData.notif_updates
      }),
      ...(storeData && {
        store_id: storeData.id,
        store_slug: storeData.slug,
        store_name: storeData.name,
        store_description: storeData.description,
        store_status: storeData.status,
        store_tagline: storeData.tagline,
        store_category: storeData.category,
        social_links: storeData.social_links
      }),
      ...(buyerData && {
        buyer_id: buyerData.id,
        display_name: buyerData.display_name,
        phone: buyerData.phone
      })
    }
  });
});

export const PATCH = withErrorHandling(async (request: NextRequest) => {
  const { supabase, authUser, profile: userProfile } = await requireUser(request);
  const body = await request.json();

  // Determine which table to update based on the fields provided
  const creatorFields: Record<string, unknown> = {};
  const storeFields: Record<string, unknown> = {};

  // Creator-specific fields
  const creatorKeys = ["payout_method", "mtn_number", "airtel_number", "bank_name", "bank_account", "account_name", "notif_sale", "notif_withdrawal", "notif_refund", "notif_weekly", "notif_updates"];
  for (const key of creatorKeys) {
    if (body[key] !== undefined) {
      creatorFields[key] = body[key];
    }
  }

  // Store-specific fields
  const storeKeys = ["tagline", "category", "social_links"];
  for (const key of storeKeys) {
    if (body[key] !== undefined) {
      storeFields[key] = body[key];
    }
  }

  if (Object.keys(creatorFields).length > 0 && userProfile.role === "creator") {
    const { data: creator } = await supabase
      .from("creators")
      .select("id")
      .eq("user_id", authUser.id)
      .single();

    if (creator) {
      const { error } = await supabase
        .from("creators")
        .update(creatorFields)
        .eq("id", creator.id);

      if (error) {
        return json({ error: { message: error.message } }, { status: 400 });
      }
    }
  }

  if (Object.keys(storeFields).length > 0 && userProfile.role === "creator") {
    const { data: creator } = await supabase
      .from("creators")
      .select("id")
      .eq("user_id", authUser.id)
      .single();

    if (creator) {
      const { error } = await supabase
        .from("stores")
        .update(storeFields)
        .eq("creator_id", creator.id);

      if (error) {
        return json({ error: { message: error.message } }, { status: 400 });
      }
    }
  }

  return json({ ok: true });
});
