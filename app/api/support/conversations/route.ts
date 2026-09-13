import { NextRequest } from "next/server";
import { apiError, json, readJson, resolveUser, withErrorHandling } from "@/lib/api";
import { createSupportConversationSchema } from "@/lib/schemas";
import {
  generateAccessToken,
  getConversation,
  getOrderContext,
  insertMessage,
  touchConversation,
  type SupportConversation,
} from "@/lib/support";
import { runSupportBot } from "@/lib/support-bot";

export const runtime = "nodejs";

const OPEN_RESUME_WINDOW_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

export const POST = withErrorHandling(async (request: NextRequest) => {
  const input = await readJson(request, createSupportConversationSchema);

  const { user } = await resolveUser(request);
  const supabase = await import("@/lib/supabase").then((m) => m.getSupabaseAdminClient());

  let userId: string | null = null;
  let role = "buyer";
  let email = input.email ?? "";
  let name = input.name ?? "Customer";

  if (user) {
    const { data: profile } = await supabase.from("users").select("id, email, full_name, role").eq("id", user.id).maybeSingle();
    if (profile) {
      userId = profile.id;
      role = profile.role === "creator" ? "creator" : profile.role === "admin" ? "admin" : "buyer";
      email = profile.email;
      name = profile.full_name ?? input.name ?? "Customer";
    }
  }

  if (!email) return apiError("Email is required", 422);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return apiError("Invalid email", 422);

  // Resolve an order for context (by explicit id or product slug)
  let orderId: string | null = input.orderId ?? null;
  let productId: string | null = null;
  if (!orderId && input.productSlug) {
    const { data } = await supabase.from("products").select("id").eq("slug", input.productSlug).maybeSingle();
    if (data) productId = data.id as string;
  }
  if (orderId) {
    const { data } = await supabase.from("orders").select("id, product_id").eq("id", orderId).maybeSingle();
    if (data) {
      orderId = data.id as string;
      productId = data.product_id as string;
    }
  }

  // Resume an existing conversation when possible (same user or same email, still recent)
  const { data: existing } = userId
    ? await supabase
        .from("support_conversations")
        .select("*")
        .eq("user_id", userId)
        .in("status", ["open", "awaiting_admin", "resolved"])
        .order("last_message_at", { ascending: false })
        .limit(1)
        .maybeSingle()
    : await supabase
        .from("support_conversations")
        .select("*")
        .eq("email", email.toLowerCase())
        .is("user_id", null)
        .in("status", ["open", "awaiting_admin", "resolved"])
        .order("last_message_at", { ascending: false })
        .limit(1)
        .maybeSingle();

  let conversation: SupportConversation;
  let accessToken: string | null = null;

  const now = Date.now();

  if (existing && now - new Date(existing.last_message_at).getTime() < OPEN_RESUME_WINDOW_MS) {
    conversation = existing as SupportConversation;
    accessToken = conversation.access_token;
    if (userId && !conversation.user_id) {
      await supabase
        .from("support_conversations")
        .update({ user_id: userId, role })
        .eq("id", conversation.id);
      conversation.user_id = userId;
      conversation.role = role;
    }
  } else {
    if (!userId) accessToken = generateAccessToken();
    const { data: created, error } = await supabase
      .from("support_conversations")
      .insert({
        user_id: userId,
        role,
        email: email.toLowerCase(),
        name,
        subject: input.subject,
        category: input.category ?? "other",
        order_id: orderId,
        product_id: productId,
        access_token: accessToken,
      })
      .select("*")
      .single();

    if (error || !created) return apiError("Could not create conversation", 500);
    conversation = created as SupportConversation;
  }

  // Persist the user's first message
  await insertMessage(supabase, {
    conversationId: conversation.id,
    senderRole: "user",
    senderUserId: userId,
    body: input.message,
  });
  await touchConversation(supabase, conversation.id);

  // Let the bot respond right away
  await runSupportBot(supabase, conversation, input.message);

  const { data: messages } = await supabase
    .from("support_messages")
    .select("id, sender_role, kind, body, metadata, created_at, read_at")
    .eq("conversation_id", conversation.id)
    .order("created_at", { ascending: true });

  return json({ conversation, accessToken, messages: messages ?? [] });
});