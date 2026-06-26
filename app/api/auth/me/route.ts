import { NextRequest } from "next/server";
import { json, requireUser, withErrorHandling } from "@/lib/api";

export const GET = withErrorHandling(async (request: NextRequest) => {
  const { supabase, authUser, profile: userProfile } = await requireUser(request);

  let creatorData: Record<string, unknown> | null = null;
  let storeData: Record<string, unknown> | null = null;

  if (userProfile.role === "creator") {
    const { data: creator } = await supabase
      .from("creators")
      .select("id,display_name,bio,phone,available_balance,total_earnings")
      .eq("user_id", authUser.id)
      .single();
    creatorData = creator;

    if (creator) {
      const { data: store } = await supabase
        .from("stores")
        .select("id,slug,name,description,status")
        .eq("creator_id", creator.id)
        .single();
      storeData = store;
    }
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
        total_earnings: creatorData.total_earnings
      }),
      ...(storeData && {
        store_id: storeData.id,
        store_slug: storeData.slug,
        store_name: storeData.name,
        store_description: storeData.description,
        store_status: storeData.status
      })
    }
  });
});
