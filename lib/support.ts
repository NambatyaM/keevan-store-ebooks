import { randomBytes, randomUUID } from "crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import { sendOrderConfirmationEmail } from "./pesapal";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

export function generateAccessToken(): string {
  return randomBytes(18).toString("hex");
}

/**
 * Issue a fresh download link for an order. If a valid (non-expired) token
 * already exists, reuse it; otherwise insert/update so there is exactly one
 * active row per order.
 */
export async function issueFreshDownloadLink(
  supabase: SupabaseClient,
  orderId: string,
  productId: string,
): Promise<string | null> {
  const { data: existing } = await supabase
    .from("downloads")
    .select("token, expires_at")
    .eq("order_id", orderId)
    .order("created_at", { ascending: false })
    .maybeSingle();

  if (existing && new Date(existing.expires_at).getTime() > Date.now()) {
    return existing.token;
  }

  const token = randomUUID();
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

  if (existing) {
    await supabase
      .from("downloads")
      .update({ token, expires_at: expiresAt, downloaded_at: null })
      .eq("order_id", orderId);
  } else {
    await supabase
      .from("downloads")
      .insert({ order_id: orderId, product_id: productId, token, expires_at: expiresAt });
  }

  return token;
}

/**
 * Re-send the order confirmation email and record the delivery.
 */
export async function resendOrderEmail(
  supabase: SupabaseClient,
  orderId: string,
): Promise<boolean> {
  const ok = await sendOrderConfirmationEmail(supabase, orderId);
  return ok;
}

// ---------------------------------------------------------------------------
// Conversation context loaders
// ---------------------------------------------------------------------------

type OrderRow = {
  id: string;
  product_id: string;
  buyer_email: string;
  amount: number;
  currency: string;
  status: string;
  created_at: string;
  paid_at: string | null;
  products?: { title: string } | null;
  payments?: { tracking_id: string | null; status: string; merchant_reference: string | null }[] | null;
};

export async function getOrderContext(supabase: SupabaseClient, opts: {
  orderId?: string | null;
  email?: string;
}): Promise<OrderRow | OrderRow[]> {
  if (opts.orderId) {
    const { data } = await supabase
      .from("orders")
      .select("*, products!inner(title, slug), payments(id, tracking_id, status, merchant_reference)")
      .eq("id", opts.orderId)
      .maybeSingle();
    return (data as OrderRow) ?? null;
  }

  if (opts.email) {
    const { data } = await supabase
      .from("orders")
      .select("*, products!inner(title, slug)")
      .eq("buyer_email", opts.email.toLowerCase())
      .order("created_at", { ascending: false })
      .limit(5);
    return (data as OrderRow[]) ?? [];
  }

  return [];
}

export type SupportConversation = {
  id: string;
  user_id: string | null;
  role: string;
  email: string;
  name: string;
  subject: string;
  category: string;
  order_id: string | null;
  product_id: string | null;
  status: string;
  access_token: string | null;
  created_at: string;
};

export async function getConversation(
  supabase: SupabaseClient,
  conversationId: string,
): Promise<SupportConversation | null> {
  const { data } = await supabase
    .from("support_conversations")
    .select("*")
    .eq("id", conversationId)
    .maybeSingle();
  return data as SupportConversation | null;
}

export async function touchConversation(
  supabase: SupabaseClient,
  conversationId: string,
): Promise<void> {
  await supabase
    .from("support_conversations")
    .update({ last_message_at: new Date().toISOString() })
    .eq("id", conversationId);
}

export async function insertMessage(
  supabase: SupabaseClient,
  opts: {
    conversationId: string;
    senderRole: "user" | "admin" | "bot";
    senderUserId?: string | null;
    kind?: string;
    body: string;
    metadata?: Record<string, unknown>;
  },
): Promise<string | null> {
  const { data, error } = await supabase
    .from("support_messages")
    .insert({
      conversation_id: opts.conversationId,
      sender_role: opts.senderRole,
      sender_user_id: opts.senderUserId ?? null,
      kind: opts.kind ?? "text",
      body: opts.body,
      metadata: opts.metadata ?? {},
    })
    .select("id")
    .single();

  return data?.id ?? null;
}

export async function markUserMessagesRead(
  supabase: SupabaseClient,
  conversationId: string,
): Promise<void> {
  await supabase
    .from("support_messages")
    .update({ read_at: new Date().toISOString() })
    .eq("conversation_id", conversationId)
    .eq("sender_role", "user")
    .is("read_at", null);
}

export async function getUnreadConversationCount(
  supabase: SupabaseClient,
): Promise<number> {
  const { count } = await supabase
    .from("support_conversations")
    .select("*", { count: "exact", head: true })
    .in("status", ["open", "awaiting_admin"]);
  return count ?? 0;
}

export async function adminNotifyNewIssue(
  supabase: SupabaseClient,
  conversation: SupportConversation,
  userMessage: string,
): Promise<void> {
  const { data: admins } = await supabase
    .from("users")
    .select("id")
    .eq("role", "admin");

  if (!admins?.length) return;

  const body = `${conversation.name} <${conversation.email}> — ${userMessage.slice(0, 300)}`;

  for (const admin of admins) {
    try {
      await supabase.from("notifications").insert({
        user_id: admin.id,
        type: "support.issue",
        title: `New support issue: ${conversation.subject}`,
        body,
        metadata: { conversation_id: conversation.id },
      });
    } catch {
      // Notifications table may not exist yet in dev — non-blocking
    }
  }
}

export async function adminNotifyResolved(
  supabase: SupabaseClient,
  conversationId: string,
  summary: string,
): Promise<void> {
  const { data: admins } = await supabase
    .from("users")
    .select("id")
    .eq("role", "admin");

  if (!admins?.length) return;

  for (const admin of admins) {
    try {
      await supabase.from("notifications").insert({
        user_id: admin.id,
        type: "support.resolved",
        title: `Support issue resolved`,
        body: summary.slice(0, 300),
        metadata: { conversation_id: conversationId },
      });
    } catch {
      // Notifications table may not exist yet in dev — non-blocking
    }
  }
}

export type CreatorNotification = {
  type: string;
  title: string;
  body?: string;
  metadata?: Record<string, unknown>;
};

export async function notifyOrderCreator(
  supabase: SupabaseClient,
  orderId: string,
  notification: CreatorNotification,
): Promise<void> {
  try {
    const { data: order } = await supabase
      .from("orders")
      .select("product_id")
      .eq("id", orderId)
      .maybeSingle();
    if (!order?.product_id) return;

    const { data: product } = await supabase
      .from("products")
      .select("creator_id, title, creators(user_id)")
      .eq("id", order.product_id)
      .maybeSingle();

    const creatorUserId = (product as { creators?: { user_id?: string }[] } | null)?.creators?.[0]?.user_id;
    if (!creatorUserId) return;

    await supabase.from("notifications").insert({
      user_id: creatorUserId,
      type: notification.type,
      title: notification.title,
      body: notification.body ?? null,
      metadata: notification.metadata ?? { order_id: orderId },
    });
  } catch {
    // Non-blocking
  }
}
