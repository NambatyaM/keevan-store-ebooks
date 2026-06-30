import { site, formatCurrency, type Currency } from "@/lib/constants";

export function orderConfirmationHtml(input: {
  buyerName: string;
  productTitle: string;
  creatorName: string;
  amount: number;
  currency: Currency;
  downloadToken: string;
}): string {
  const downloadUrl = `${site.url}/download/${input.downloadToken}`;

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family:sans-serif;padding:24px;max-width:560px;margin:0 auto;">
  <h1 style="color:#111;font-size:24px;">Order Confirmed</h1>
  <p>Hi ${escapeHtml(input.buyerName)},</p>
  <p>Your purchase of <strong>${escapeHtml(input.productTitle)}</strong> by ${escapeHtml(input.creatorName)} is confirmed.</p>
  <p style="font-size:18px;font-weight:bold;">Amount Paid: ${formatCurrency(input.amount, input.currency)}</p>
  <p>Click the button below to download your file:</p>
  <a href="${downloadUrl}" style="display:inline-block;padding:12px 24px;background:#2563eb;color:#fff;text-decoration:none;border-radius:6px;font-size:16px;">Download Now</a>
  <p style="margin-top:24px;font-size:14px;color:#666;">This link expires in 7 days. If you didn't make this purchase, please contact support.</p>
  <hr style="margin-top:32px;">
  <p style="font-size:12px;color:#999;">${site.name} &mdash; ${site.url}</p>
</body>
</html>`;
}

export function withdrawalStatusHtml(input: {
  displayName: string;
  amount: number;
  currency: Currency;
  status: string;
  adminNotes: string | null;
  payoutMethod: string;
}): string {
  const statusLabels: Record<string, string> = {
    approved: "Approved",
    rejected: "Rejected",
    paid: "Paid Out",
  };

  const statusColor: Record<string, string> = {
    approved: "#16a34a",
    rejected: "#dc2626",
    paid: "#2563eb",
  };

  const label = statusLabels[input.status] ?? input.status;
  const color = statusColor[input.status] ?? "#666";

  const notesHtml = input.adminNotes
    ? `<p style="margin-top:16px;padding:12px;background:#f3f4f6;border-radius:6px;font-size:14px;color:#374151;"><strong>Admin Note:</strong> ${escapeHtml(input.adminNotes)}</p>`
    : "";

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family:sans-serif;padding:24px;max-width:560px;margin:0 auto;">
  <h1 style="color:#111;font-size:24px;">Withdrawal Update</h1>
  <p>Hi ${escapeHtml(input.displayName)},</p>
  <p>Your withdrawal request of <strong>${formatCurrency(input.amount, input.currency)}</strong> via <strong>${escapeHtml(input.payoutMethod)}</strong> has been <span style="color:${color};font-weight:bold;">${label}</span>.</p>
  ${notesHtml}
  <p style="font-size:14px;color:#666;">If you have questions, please contact support.</p>
  <hr style="margin-top:32px;">
  <p style="font-size:12px;color:#999;">${site.name} &mdash; ${site.url}</p>
</body>
</html>`;
}

export function refundStatusHtml(input: {
  buyerName: string;
  productTitle: string;
  status: string;
  adminNotes: string | null;
  reversedAmount: number | null;
  currency: Currency;
}): string {
  const label = input.status === "approved" ? "Approved" : "Declined";
  const color = input.status === "approved" ? "#16a34a" : "#dc2626";
  const intro = input.status === "approved"
    ? "Your refund request has been approved."
    : "Your refund request has been reviewed and was not approved at this time.";

  const amountHtml = input.reversedAmount
    ? `<p style="font-size:18px;font-weight:bold;">Refund Amount: ${formatCurrency(input.reversedAmount, input.currency)}</p>`
    : "";

  const notesHtml = input.adminNotes
    ? `<p style="margin-top:16px;padding:12px;background:#f3f4f6;border-radius:6px;font-size:14px;color:#374151;"><strong>Admin Note:</strong> ${escapeHtml(input.adminNotes)}</p>`
    : "";

  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family:sans-serif;padding:24px;max-width:560px;margin:0 auto;">
  <h1 style="color:#111;font-size:24px;">Refund ${label}</h1>
  <p>Hi ${escapeHtml(input.buyerName)},</p>
  <p>Regarding your purchase of <strong>${escapeHtml(input.productTitle)}</strong>:</p>
  <p style="color:${color};font-weight:bold;">${intro}</p>
  ${amountHtml}
  ${notesHtml}
  <p style="font-size:14px;color:#666;">If you have questions, please contact support at ${site.supportPhone}.</p>
  <hr style="margin-top:32px;">
  <p style="font-size:12px;color:#999;">${site.name} &mdash; ${site.url}</p>
</body>
</html>`;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
