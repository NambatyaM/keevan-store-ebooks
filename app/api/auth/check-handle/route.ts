import { NextRequest } from "next/server";
import { getSupabaseAdminClient } from "@/lib/supabase";
import { apiError, json, withErrorHandling } from "@/lib/api";
import { z } from "zod";

const querySchema = z.object({
  handle: z.string().regex(/^[a-z0-9-]{3,64}$/)
});

export const GET = withErrorHandling(async (request: NextRequest) => {
  const { searchParams } = new URL(request.url);
  const parsed = querySchema.safeParse({ handle: searchParams.get("handle") });
  if (!parsed.success) {
    return apiError("Invalid handle format. Use 3-64 lowercase letters, numbers, and hyphens.", 400);
  }

  const supabase = getSupabaseAdminClient();
  const { data } = await supabase
    .from("stores")
    .select("slug")
    .eq("slug", parsed.data.handle)
    .maybeSingle();

  return json({ available: !data });
});
