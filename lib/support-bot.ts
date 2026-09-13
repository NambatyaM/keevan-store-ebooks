import type { SupabaseClient } from "@supabase/supabase-js";
import { verifyPesapalPayment } from "./pesapal";
import {
  getOrderContext,
  insertMessage,
  issueFreshDownloadLink,
  resendOrderEmail,
  touchConversation,
  adminNotifyNewIssue,
  adminNotifyResolved,
  type SupportConversation,
} from "./support";

export type BotReply =
  | { kind: "text"; body: string; metadata?: Record<string, unknown> }
  | { kind: "download"; body: string; metadata: { url: string; token: string; download_token?: string } }
  | { kind: "system"; body: string; metadata?: Record<string, unknown> };

type OrderRow = {
  id: string;
  product_id: string;
  buyer_email: string;
  buyer_name?: string;
  amount: number;
  currency: string;
  status: string;
  created_at: string;
  payments?: { tracking_id: string | null; status: string; merchant_reference: string | null }[] | null;
  products?: { title?: string; slug?: string } | null;
};

type BotOutcome = { replies: BotReply[] };

// ---------------------------------------------------------------------------
// Category detection
// ---------------------------------------------------------------------------

export function detectCategory(text: string, subject = ""): string {
  const t = `${subject} ${text}`.toLowerCase();

  if (
    /(didn.?t|did not|never).{0,30}(receive|get|got|see).{0,30}(file|download|link|email)|download.{0,20}(not|doesn.?t|fail|died|expired|broken)|file.{0,15}missing|cannot.{0,10}download|can.?t.{0,10}download|lost my (file|download|link|email)/.test(t)
  ) {
    return "file_delivery";
  }
  if (/\b(refund|reimburs|money back)\b/.test(t)) return "refund";
  if (/(paid|no payment|charge|charged|debit|mobile money|mtn|airtel|pesapal|bank|card|invoice|money deducted)/.test(t)) {
    return "payment";
  }
  if (/(order|status|check my|where is|my purchase|receipt)/.test(t)) return "order_status";
  if (/(login|log ?in|sign ?in|account|password|reset|register|sign ?up)/.test(t)) return "account";
  if (/(creator|seller|earnings|withdraw|payout|balance|store|dashboard|products.*edit)/.test(t)) {
    return "creator_support";
  }
  return "other";
}

// ---------------------------------------------------------------------------
// Notification helpers
// ---------------------------------------------------------------------------

async function notifyCreatorAboutIssue(
  supabase: SupabaseClient,
  conversation: SupportConversation,
  order: OrderRow,
): Promise<void> {
  try {
    const productTitle = order.products?.title ?? "your product";
    const { data: products } = await supabase
      .from("products")
      .select("creator_id, creators(user_id)")
      .eq("id", order.product_id)
      .maybeSingle();

    const creatorUserId = (products?.creators as { user_id?: string }[] | undefined)?.[0]?.user_id;
    if (!creatorUserId) return;

    await supabase.from("notifications").insert({
      user_id: creatorUserId,
      type: "support.issue.product",
      title: `Buyer needs help with "${productTitle}"`,
      body: `${conversation.name} raised an issue about your product. We're handling it — details are in the admin support panel.`,
      metadata: { conversation_id: conversation.id, order_id: order.id },
    });
  } catch {
    // Non-blocking
  }
}

async function notifyCreatorResolved(
  supabase: SupabaseClient,
  order: OrderRow,
  summary: string,
): Promise<void> {
  try {
    const productTitle = order.products?.title ?? "your product";
    const { data: products } = await supabase
      .from("products")
      .select("creator_id, creators(user_id)")
      .eq("id", order.product_id)
      .maybeSingle();

    const creatorUserId = (products?.creators as { user_id?: string }[] | undefined)?.[0]?.user_id;
    if (!creatorUserId) return;

    await supabase.from("notifications").insert({
      user_id: creatorUserId,
      type: "support.resolved",
      title: `Issue with "${productTitle}" resolved`,
      body: summary.slice(0, 280),
      metadata: { order_id: order.id },
    });
  } catch {
    // Non-blocking
  }
}

// ---------------------------------------------------------------------------
// Escalation
// ---------------------------------------------------------------------------

async function escalateToAdmin(
  supabase: SupabaseClient,
  conversation: SupportConversation,
  userText: string,
): Promise<void> {
  await insertMessage(supabase, {
    conversationId: conversation.id,
    senderRole: "bot",
    kind: "system",
    body: "I've escalated this to our support team so they can look into it personally. You'll hear back here shortly.",
  });
  await supabase
    .from("support_conversations")
    .update({ status: "awaiting_admin" })
    .eq("id", conversation.id);
  await adminNotifyNewIssue(supabase, conversation, userText);
}

async function setResolved(
  supabase: SupabaseClient,
  conversationId: string,
  summary: string,
): Promise<void> {
  await supabase
    .from("support_conversations")
    .update({ status: "resolved" })
    .eq("id", conversationId);
  await adminNotifyResolved(supabase, conversationId, summary);
}

// ---------------------------------------------------------------------------
// Handlers
// ---------------------------------------------------------------------------

async function handleFileDelivery(
  supabase: SupabaseClient,
  conversation: SupportConversation,
  userText: string,
): Promise<BotOutcome> {
  const orderContext = (await getOrderContext(supabase, {
    orderId: conversation.order_id,
    email: conversation.email,
  })) as OrderRow | OrderRow[] | null;

  const orders = Array.isArray(orderContext) ? orderContext : orderContext ? [orderContext] : [];

  if (orders.length === 0) {
    await escalateToAdmin(supabase, conversation, userText);
    return {
      replies: [
        {
          kind: "text",
          body: "I couldn't find any orders for that email — could you double-check the email you purchased with? I've also flagged this to the team so they can search by order reference or name if needed.",
        },
      ],
    };
  }

  const order =
    orders.find((o) => o.id === conversation.order_id) ??
    orders.find((o) => o.status === "paid") ??
    orders.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];

  // ----- Paid: deliver straight away -----
  if (order.status === "paid") {
    const token = await issueFreshDownloadLink(supabase, order.id, order.product_id);
    if (!token) {
      await escalateToAdmin(supabase, conversation, userText);
      return { replies: [{ kind: "text", body: "Your order is confirmed but I hit a snag generating the link — I've asked the team to fix it right away." }] };
    }

    const emailSent = await resendOrderEmail(supabase, order.id);
    await touchConversation(supabase, conversation.id);

    const replies: BotReply[] = [
      {
        kind: "download",
        body: "I confirmed your payment went through. Here's your instant download link:",
        metadata: { url: `/api/downloads/${token}`, token, download_token: token },
      },
    ];
    if (emailSent) {
      replies.push({ kind: "system", body: "I've also emailed the same link to you — check your inbox (and spam folder) just in case." });
    }

    if (order.product_id) await notifyCreatorResolved(supabase, order, "Download link re-sent to the buyer and email delivered.");
    await setResolved(supabase, conversation.id, "Order paid — download link re-issued and emailed.");
    return { replies };
  }

  // ----- Pending: verify with Pesapal and finalize if actually completed -----
  if (order.status === "pending") {
    const payment = order.payments?.find((p) => p.tracking_id) ?? order.payments?.[0];

    if (!payment?.tracking_id) {
      // No Pesapal tracking means the checkout never reached the payment page → not charged.
      await setResolved(supabase, conversation.id, "Pending order without tracking — no charge occurred.");
      return {
        replies: [
          {
            kind: "text",
            body: "Good news — I checked, and that checkout never actually reached the payment step, so your money was never taken. You can safely try again on the product page. If you saw a charge on your statement anyway, tell me and I'll get the team on it.",
          },
        ],
      };
    }

    const verify = await verifyPesapalPayment(supabase, payment.merchant_reference ?? "", payment.tracking_id);

    if (verify.ok) {
      const token = await issueFreshDownloadLink(supabase, order.id, order.product_id);
      if (token) {
        const emailSent = await resendOrderEmail(supabase, order.id);
        const replies: BotReply[] = [
          { kind: "text", body: "I double-checked with the payment provider — your payment did go through. Here is your download:" },
          { kind: "download", body: "Your instant download link:", metadata: { url: `/api/downloads/${token}`, token, download_token: token } },
        ];
        if (emailSent) replies.push({ kind: "system", body: "A fresh confirmation email with the same link is on its way too." });
        if (order.product_id) await notifyCreatorResolved(supabase, order, "Payment verified — download link delivered.");
        await setResolved(supabase, conversation.id, "Payment verified as completed — download delivered.");
        return { replies };
      }
    }

    if (!verify.ok && verify.error === "Payment is not completed") {
      return {
        replies: [
          {
            kind: "text",
            body: "Your payment is still being confirmed by the bank (this can take a few minutes). The moment it clears, your download link will be delivered here and emailed to you automatically — no need to do anything.",
          },
        ],
      };
    }

    await escalateToAdmin(supabase, conversation, userText);
    return {
      replies: [
        {
          kind: "text",
          body: "I couldn't fully confirm the payment status, so I've flagged this to the team to verify manually. You'll get the download link here as soon as it's sorted.",
        },
      ],
    };
  }

  // ----- Failed / other -----
  await setResolved(supabase, conversation.id, "Order failed — buyer informed they were not charged.");
  return {
    replies: [
      {
        kind: "text",
        body: "I checked the order — the payment did not complete and you were not charged. You can try purchasing again on the product page. If you were charged but the order shows failed, tell me and I'll get support onto it immediately.",
      },
    ],
  };
}

async function handlePayment(
  supabase: SupabaseClient,
  conversation: SupportConversation,
  userText: string,
): Promise<BotOutcome> {
  const context = (await getOrderContext(supabase, {
    orderId: conversation.order_id,
    email: conversation.email,
  })) as OrderRow | OrderRow[] | null;

  const orders = Array.isArray(context) ? context : context ? [context] : [];

  if (orders.length === 0) {
    await escalateToAdmin(supabase, conversation, userText);
    return { replies: [{ kind: "text", body: "I couldn't find any payment records for that email — I've asked the team to check manually." }] };
  }

  const order = orders[0];
  const engaged = order.status === "paid" ? "your payment was received and your order is confirmed" : order.status === "pending" ? "the payment is still being processed right now" : "the payment did not complete and no money was taken";

  return {
    replies: [
      {
        kind: "text",
        body: `Here's what I see: ${engaged}.${order.status === "paid" ? " Your download link was emailed to you and can also be generated right here if you need a fresh one — just say the word." : order.status === "pending" ? " It should finish confirming shortly — your download link will appear here automatically when it does." : " You can try the purchase again whenever you'd like."}`,
      },
    ],
  };
}

async function handleRefund(): Promise<BotOutcome> {
  return {
    replies: [
      {
        kind: "text",
        body: "Refunds are handled through our request form: /request-refund. Once you submit it, the team reviews it and you'll get a status update. Is there a specific issue I can help with in the meantime (for example, if you can't download what you paid for)?",
      },
    ],
  };
}

async function handleOrderStatus(
  supabase: SupabaseClient,
  conversation: SupportConversation,
): Promise<BotOutcome> {
  const context = (await getOrderContext(supabase, {
    orderId: conversation.order_id,
    email: conversation.email,
  })) as OrderRow | OrderRow[] | null;

  const orders = Array.isArray(context) ? context : context ? [context] : [];

  if (orders.length === 0) {
    return { replies: [{ kind: "text", body: "I couldn't find any orders for that email. If you purchased from a different email, let me know." }] };
  }

  const lines = orders.map((o) => {
    const status = o.status === "paid" ? "Paid ✓" : o.status === "pending" ? "Pending" : o.status === "failed" ? "Failed" : o.status;
    const amount = `${o.currency ?? "UGX"} ${o.amount ?? 0}`;
    const date = new Date(o.created_at).toLocaleDateString("en-UG");
    return `• ${o.products?.title ?? "Product"} — ${status} — ${amount} (${date})`;
  });

  return {
    replies: [
      {
        kind: "text",
        body: `Here are the orders I found for ${conversation.email}:\n\n${lines.join("\n")}\n\nNeed a download link for any of them? Just say so.`,
      },
    ],
  };
}

async function handleAccount(): Promise<BotOutcome> {
  return {
    replies: [
      {
        kind: "text",
        body: "For login or account help, you can use the login and sign-up links in the top bar. If you forgot your password, use the 'Forgot password' option on the login page and we'll email you a reset link. Is that what you needed?",
      },
    ],
  };
}

async function handleCreatorSupport(
  supabase: SupabaseClient,
  conversation: SupportConversation,
  userText: string,
): Promise<BotOutcome> {
  await escalateToAdmin(supabase, conversation, userText);
  return {
    replies: [
      {
        kind: "text",
        body: "I've forwarded this to the admin team — they'll get back to you here about your creator account, earnings, or store.",
      },
    ],
  };
}

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------

export async function runSupportBot(
  supabase: SupabaseClient,
  conversation: SupportConversation,
  userText: string,
): Promise<BotOutcome> {
  try {
    const category = conversation.category && conversation.category !== "other"
      ? conversation.category
      : detectCategory(userText, conversation.subject);

    let outcome: BotOutcome;

    switch (category) {
      case "file_delivery":
        if (conversation.order_id) {
          await notifyCreatorAboutIssue(supabase, conversation, (await getOrderContext(supabase, { orderId: conversation.order_id })) as OrderRow);
        }
        outcome = await handleFileDelivery(supabase, conversation, userText);
        break;
      case "payment":
        outcome = await handlePayment(supabase, conversation, userText);
        break;
      case "refund":
        outcome = await handleRefund();
        break;
      case "order_status":
        outcome = await handleOrderStatus(supabase, conversation);
        break;
      case "account":
        outcome = await handleAccount();
        break;
      case "creator_support":
        outcome = await handleCreatorSupport(supabase, conversation, userText);
        break;
      default:
        await escalateToAdmin(supabase, conversation, userText);
        outcome = {
          replies: [
            {
              kind: "text",
              body: "Thanks for reaching out — our support team has been notified and will reply here. In the meantime, is the issue about a download, a payment, or a refund? I can typically sort those out instantly.",
            },
          ],
        };
    }

    for (const reply of outcome.replies) {
      await insertMessage(supabase, {
        conversationId: conversation.id,
        senderRole: "bot",
        kind: reply.kind === "download" ? "download" : reply.kind,
        body: reply.body,
        metadata: reply.metadata ?? {},
      });
    }

    return outcome;
  } catch (e) {
    console.error("[runSupportBot] Error:", e instanceof Error ? e.message : e);
    await escalateToAdmin(supabase, conversation, userText);
    return {
      replies: [
        {
          kind: "system",
          body: "Something went wrong on my end — I've flagged this for the team and they'll reply here shortly.",
        },
      ],
    };
  }
}