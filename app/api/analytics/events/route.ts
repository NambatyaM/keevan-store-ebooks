import { NextRequest } from "next/server";
import { apiError, json, readJson, withErrorHandling } from "@/lib/api";
import { analyticsEventSchema } from "@/lib/schemas";
import { getSupabaseAdminClient } from "@/lib/supabase";

export const POST = withErrorHandling(async (request: NextRequest) => {
  const input = await readJson(request, analyticsEventSchema);
  const supabase = getSupabaseAdminClient();
  const { error } = await supabase.from("analytics_events").insert({
    store_id: input.storeId,
    product_id: input.productId,
    event_type: input.eventType,
    source: input.source,
    metadata: input.metadata
  });
  if (error) return apiError(error.message, 400);
  return json({ ok: true }, { status: 201 });
});
