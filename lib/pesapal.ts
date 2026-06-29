type PesapalToken = {
  token: string;
  expiryDate: string;
};

export type NormalizedPesapalStatus = {
  merchantReference: string | null;
  trackingId: string | null;
  amount: number | null;
  paymentStatus: string | null;
  raw: Record<string, unknown>;
};

const baseUrl = process.env.PESAPAL_BASE_URL ?? "https://pay.pesapal.com/v3";

let cachedToken: PesapalToken | null = null;

function isTokenExpired(token: PesapalToken): boolean {
  if (!token.expiryDate) return true;
  const expiry = new Date(token.expiryDate).getTime();
  return Date.now() >= expiry - 60000;
}

function pickString(record: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "string" && value.trim()) {
      return value.trim();
    }
  }

  return null;
}

function pickNumber(record: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "number" && Number.isFinite(value)) {
      return value;
    }
    if (typeof value === "string" && value.trim()) {
      const parsed = Number(value);
      if (Number.isFinite(parsed)) {
        return parsed;
      }
    }
  }

  return null;
}

export function normalizePesapalStatus(payload: unknown): NormalizedPesapalStatus {
  const raw = typeof payload === "object" && payload !== null ? (payload as Record<string, unknown>) : {};

  return {
    merchantReference: pickString(raw, ["merchant_reference", "merchantReference", "order_merchant_reference", "OrderMerchantReference"]),
    trackingId: pickString(raw, ["order_tracking_id", "orderTrackingId", "tracking_id", "trackingId", "OrderTrackingId"]),
    amount: pickNumber(raw, ["amount", "Amount"]),
    paymentStatus: pickString(raw, ["payment_status_description", "paymentStatusDescription", "status", "Status"]),
    raw
  };
}

export function isPesapalPaymentCompleted(payload: unknown) {
  const normalized = normalizePesapalStatus(payload);
  return normalized.paymentStatus?.toLowerCase() === "completed";
}

export async function getPesapalToken(): Promise<PesapalToken> {
  if (cachedToken && !isTokenExpired(cachedToken)) {
    return cachedToken;
  }

  const consumerKey = process.env.PESAPAL_CONSUMER_KEY;
  const consumerSecret = process.env.PESAPAL_CONSUMER_SECRET;

  if (!consumerKey || !consumerSecret) {
    throw new Error("Pesapal credentials are missing.");
  }

  const response = await fetch(`${baseUrl}/api/Auth/RequestToken`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ consumer_key: consumerKey, consumer_secret: consumerSecret }),
    cache: "no-store"
  });

  if (!response.ok) {
    throw new Error("Unable to authenticate with Pesapal.");
  }

  const data = await response.json();
  cachedToken = { token: data.token, expiryDate: data.expiryDate };
  return cachedToken;
}

export async function createPesapalOrder(input: {
  id: string;
  amount: number;
  currency?: string;
  email: string;
  phone?: string;
  firstName: string;
  lastName: string;
  description: string;
  callbackUrl: string;
}) {
  const { token } = await getPesapalToken();
  const ipnId = process.env.PESAPAL_IPN_ID;

  if (!ipnId) {
    throw new Error("Pesapal IPN id is missing.");
  }

  const response = await fetch(`${baseUrl}/api/Transactions/SubmitOrderRequest`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({
      id: input.id,
      currency: input.currency ?? "UGX",
      amount: input.amount,
      description: input.description,
      callback_url: input.callbackUrl,
      notification_id: ipnId,
      billing_address: {
        email_address: input.email,
        phone_number: input.phone,
        first_name: input.firstName,
        last_name: input.lastName
      }
    }),
    cache: "no-store"
  });

  if (!response.ok) {
    throw new Error("Unable to create Pesapal order.");
  }

  return response.json();
}

export async function getPesapalTransactionStatus(orderTrackingId: string) {
  const { token } = await getPesapalToken();
  const response = await fetch(`${baseUrl}/api/Transactions/GetTransactionStatus?orderTrackingId=${encodeURIComponent(orderTrackingId)}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store"
  });

  if (!response.ok) {
    throw new Error("Unable to verify Pesapal transaction.");
  }

  return response.json();
}

export async function refundPesapalOrder(input: {
  confirmationCode: string;
  amount: number;
  username: string;
  remarks: string;
}) {
  const { token } = await getPesapalToken();

  const response = await fetch(`${baseUrl}/api/Transactions/RefundRequest`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({
      confirmation_code: input.confirmationCode,
      amount: input.amount,
      username: input.username,
      remarks: input.remarks
    }),
    cache: "no-store"
  });

  const data = await response.json();

  if (!response.ok || data.error === 500) {
    return { ok: false as const, error: data.message ?? "Pesapal refund request failed", raw: data };
  }

  return { ok: true as const, message: data.message ?? "Refund request submitted to Pesapal", raw: data };
}

export type VerificationResult =
  | { ok: true; downloadToken: string; alreadyVerified: boolean }
  | { ok: false; error: string; raw: Record<string, unknown> };

type SupabaseClient = import("@supabase/supabase-js").SupabaseClient;

export async function verifyPesapalPayment(
  supabase: SupabaseClient,
  merchantReference: string,
  trackingId: string
): Promise<VerificationResult> {
  const { data: payment } = await supabase
    .from("payments")
    .select("id,merchant_reference,order_id,orders!inner(amount)")
    .eq("merchant_reference", merchantReference)
    .single();

  if (!payment) return { ok: false, error: "Payment not found", raw: {} };

  const paymentOrder = Array.isArray(payment.orders) ? payment.orders[0] : payment.orders;
  if (!paymentOrder || typeof paymentOrder.amount !== "number") return { ok: false, error: "Payment not found", raw: {} };

  const transactionStatus = normalizePesapalStatus(await getPesapalTransactionStatus(trackingId));

  if (!transactionStatus.merchantReference || transactionStatus.merchantReference !== merchantReference) {
    return { ok: false, error: "Pesapal merchant reference mismatch", raw: transactionStatus.raw };
  }

  if (!transactionStatus.trackingId) {
    return { ok: false, error: "Pesapal tracking id mismatch", raw: transactionStatus.raw };
  }

  if (typeof paymentOrder.amount !== "number" || transactionStatus.amount !== paymentOrder.amount) {
    return { ok: false, error: "Pesapal amount mismatch", raw: transactionStatus.raw };
  }

  if (!isPesapalPaymentCompleted(transactionStatus.raw)) {
    await supabase.rpc("fail_pesapal_payment", {
      payment_merchant_reference: merchantReference,
      failure_payload: transactionStatus.raw
    });

    return { ok: false, error: "Payment is not completed", raw: transactionStatus.raw };
  }

  const { data: finalized, error: finalizeError } = await supabase.rpc("finalize_pesapal_payment", {
    payment_reference: merchantReference,
    pesapal_tracking_id: transactionStatus.trackingId,
    status_payload: transactionStatus.raw
  });

  if (finalizeError) return { ok: false, error: finalizeError.message, raw: {} };

  const result = finalized as {
    ok: boolean;
    already_processed: boolean;
    order_id?: string;
    download_token?: string;
    error?: string;
  } | null;

  if (!result?.ok) return { ok: false, error: result?.error ?? "Unable to issue download token", raw: {} };

  if (!result.already_processed && result.order_id) {
    await supabase.from("analytics_events").insert({
      event_type: "purchase",
      metadata: { order_id: result.order_id }
    });
  }

  return { ok: true, downloadToken: result.download_token ?? "", alreadyVerified: result.already_processed };
}
