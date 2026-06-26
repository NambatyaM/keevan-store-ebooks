import { NextRequest } from "next/server";
import { json, logAdminAction, requireAdmin, withErrorHandling } from "@/lib/api";
import { sendEmail } from "@/lib/email";
import { orderConfirmationHtml, withdrawalStatusHtml, refundStatusHtml } from "@/lib/email-templates";

export const POST = withErrorHandling(async (request: NextRequest) => {
  const { supabase, authUser } = await requireAdmin(request);

  const url = new URL(request.url);
  const limit = Math.min(Number(url.searchParams.get("limit")) || 50, 100);

  const { data: queueItems, error: fetchError } = await supabase
    .from("email_queue")
    .select("*")
    .eq("status", "pending")
    .lt("retry_count", 3)
    .order("created_at", { ascending: true })
    .limit(limit);

  if (fetchError) {
    return json({ ok: false, error: fetchError.message, processed: 0, failed: 0 }, { status: 500 });
  }

  if (!queueItems || queueItems.length === 0) {
    return json({ ok: true, processed: 0, failed: 0, message: "No pending emails" });
  }

  let processed = 0;
  let failed = 0;

  for (const item of queueItems) {
    try {
      const result = await renderAndSend(item);

      if (result.ok) {
        await supabase
          .from("email_queue")
          .update({ status: "sent", sent_at: new Date().toISOString(), error_message: null })
          .eq("id", item.id);

        processed++;
      } else {
        const newRetryCount = (item.retry_count ?? 0) + 1;
        await supabase
          .from("email_queue")
          .update({
            status: newRetryCount >= 3 ? "failed" : "pending",
            error_message: result.error,
            retry_count: newRetryCount,
          })
          .eq("id", item.id);

        failed++;
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      const newRetryCount = (item.retry_count ?? 0) + 1;
      await supabase
        .from("email_queue")
        .update({
          status: newRetryCount >= 3 ? "failed" : "pending",
          error_message: message,
          retry_count: newRetryCount,
        })
        .eq("id", item.id);

      failed++;
    }
  }

  await logAdminAction({
    adminUserId: authUser.id,
    action: "email.process",
    targetTable: "email_queue",
    metadata: { processed, failed, total: queueItems.length },
  });

  return json({ ok: true, processed, failed, total: queueItems.length });
});

type QueueItem = {
  id: string;
  type: string;
  to_email: string;
  to_name: string | null;
  reference_type: string;
  reference_id: string;
  metadata: Record<string, unknown>;
};

async function renderAndSend(item: QueueItem): Promise<{ ok: true } | { ok: false; error: string }> {
  const { supabase } = await import("@/lib/supabase").then((m) => ({ supabase: m.getSupabaseAdminClient() }));

  switch (item.type) {
    case "order_confirmation": {
      const { data: order } = await supabase
        .from("orders")
        .select("*, products!inner(title), creators!inner(display_name)")
        .eq("id", item.reference_id)
        .single();

      if (!order) return { ok: false, error: "Order not found" };

      const { data: download } = await supabase
        .from("downloads")
        .select("token")
        .eq("order_id", item.reference_id)
        .maybeSingle();

      if (!download) return { ok: false, error: "Download token not found" };

      const productTitle = Array.isArray(order.products) ? order.products[0]?.title : (order as Record<string, unknown>).products;
      const creatorName = Array.isArray(order.creators) ? order.creators[0]?.display_name : (order as Record<string, unknown>).creators;

      const html = orderConfirmationHtml({
        buyerName: item.to_name ?? "Customer",
        productTitle: String(productTitle ?? "Product"),
        creatorName: String(creatorName ?? "Creator"),
        amount: Number(order.amount),
        downloadToken: download.token,
      });

      return sendEmail({
        to: item.to_email,
        subject: `Order Confirmed — ${String(productTitle ?? "Product")}`,
        html,
      });
    }

    case "withdrawal_status": {
      const { data: withdrawal } = await supabase
        .from("withdrawal_requests")
        .select("*")
        .eq("id", item.reference_id)
        .single();

      if (!withdrawal) return { ok: false, error: "Withdrawal request not found" };

      const html = withdrawalStatusHtml({
        displayName: item.to_name ?? "Creator",
        amount: withdrawal.amount,
        status: withdrawal.status,
        adminNotes: withdrawal.admin_notes,
        payoutMethod: withdrawal.payout_method,
      });

      const statusLabels: Record<string, string> = {
        approved: "Approved",
        rejected: "Rejected",
        paid: "Paid Out",
      };

      return sendEmail({
        to: item.to_email,
        subject: `Withdrawal ${statusLabels[withdrawal.status] ?? withdrawal.status}`,
        html,
      });
    }

    case "refund_status": {
      const { data: refund } = await supabase
        .from("refunds")
        .select("*, orders!inner(product_id,products!inner(title))")
        .eq("id", item.reference_id)
        .single();

      if (!refund) return { ok: false, error: "Refund not found" };

      const title = refund.orders?.products?.title ?? "Product";

      const html = refundStatusHtml({
        buyerName: item.to_name ?? "Customer",
        productTitle: String(title),
        status: refund.status,
        adminNotes: refund.admin_notes,
        reversedAmount: refund.reversed_amount,
      });

      const label = refund.status === "approved" ? "Approved" : "Declined";

      return sendEmail({
        to: item.to_email,
        subject: `Refund ${label} — ${String(title)}`,
        html,
      });
    }

    default:
      return { ok: false, error: `Unknown email type: ${item.type}` };
  }
}
