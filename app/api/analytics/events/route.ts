import { NextRequest } from "next/server";
import { apiError, json, readJson, withErrorHandling } from "@/lib/api";
import { analyticsEventSchema } from "@/lib/schemas";
import { getSupabaseAdminClient } from "@/lib/supabase";

const PUBLIC_EVENT_TYPES = new Set(["store_view", "product_view"]);

export const POST = withErrorHandling(async (request: NextRequest) => {
  const input = await readJson(request, analyticsEventSchema);

  if (!PUBLIC_EVENT_TYPES.has(input.eventType)) {
    return apiError("Event type must be submitted server-side.", 403);
  }

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
