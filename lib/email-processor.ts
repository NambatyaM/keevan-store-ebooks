import { sendEmail } from "@/lib/email";
import { orderConfirmationHtml, withdrawalStatusHtml, refundStatusHtml } from "@/lib/email-templates";
import { getOptionalSupabaseAdminClient } from "@/lib/supabase";
import type { Currency } from "@/lib/constants";

export type QueueItem = {
  id: string;
  type: string;
  to_email: string;
  to_name: string | null;
  reference_type: string;
  reference_id: string;
  metadata: Record<string, unknown>;
};

export async function renderAndSend(item: QueueItem): Promise<{ ok: true } | { ok: false; error: string }> {
  const supabase = getOptionalSupabaseAdminClient();
  if (!supabase) return { ok: false, error: "Server configuration error: admin client unavailable" };

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

      const productTitle = Array.isArray(order.products) ? order.products[0]?.title : (order.products as { title?: string } | undefined)?.title ?? null;
      const creatorName = Array.isArray(order.creators) ? order.creators[0]?.display_name : (order.creators as { display_name?: string } | undefined)?.display_name ?? null;

      const html = orderConfirmationHtml({
        buyerName: item.to_name ?? "Customer",
        productTitle: String(productTitle ?? "Product"),
        creatorName: String(creatorName ?? "Creator"),
        amount: Number(order.amount),
        currency: (order.currency as Currency) ?? "UGX",
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
        currency: (withdrawal.currency as Currency) ?? "UGX",
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
        .select("*, orders!inner(product_id,products!inner(title),currency)")
        .eq("id", item.reference_id)
        .single();

      if (!refund) return { ok: false, error: "Refund not found" };

      const title = refund.orders?.products?.title ?? "Product";
      const orderCurrency = refund.orders?.currency as Currency ?? "UGX";

      const html = refundStatusHtml({
        buyerName: item.to_name ?? "Customer",
        productTitle: String(title),
        status: refund.status,
        adminNotes: refund.admin_notes,
        reversedAmount: refund.reversed_amount,
        currency: orderCurrency,
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
