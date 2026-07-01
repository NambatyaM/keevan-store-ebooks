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

const CURRENCY_COUNTRY: Record<string, string> = {
  UGX: "UG",
  KES: "KE",
  TZS: "TZ",
  RWF: "RW",
  USD: "US",
};

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

/**
 * Pesapal can return payment status as a string description OR as an integer code.
 * Integer codes: 0 = Invalid, 1 = Completed, 2 = Failed, 3 = Reversed, 4 = Pending, 5 = Voided
 * This helper coerces an integer status code to its string description so the
 * rest of the code can rely on a single normalised string value.
 */
function resolvePaymentStatusFromCode(record: Record<string, unknown>): string | null {
  const STATUS_CODE_MAP: Record<number, string> = {
    0: "INVALID",
    1: "COMPLETED",
    2: "FAILED",
    3: "REVERSED",
    4: "PENDING",
    5: "VOIDED",
  };

  for (const key of ["payment_status", "PaymentStatus", "paymentStatus"]) {
    const val = record[key];
    if (typeof val === "number" && val in STATUS_CODE_MAP) {
      return STATUS_CODE_MAP[val];
    }
    if (typeof val === "string") {
      const parsed = parseInt(val, 10);
      if (!isNaN(parsed) && parsed in STATUS_CODE_MAP) {
        return STATUS_CODE_MAP[parsed];
      }
    }
  }
  return null;
}

export function normalizePesapalStatus(payload: unknown): NormalizedPesapalStatus {
  const raw = typeof payload === "object" && payload !== null ? (payload as Record<string, unknown>) : {};

  // Prefer the string description; fall back to resolving the integer status code.
  const paymentStatusStr =
    pickString(raw, ["payment_status_description", "paymentStatusDescription", "status", "Status"]) ??
    resolvePaymentStatusFromCode(raw);

  return {
    merchantReference: pickString(raw, ["merchant_reference", "merchantReference", "order_merchant_reference", "OrderMerchantReference"]),
    trackingId: pickString(raw, ["order_tracking_id", "orderTrackingId", "tracking_id", "trackingId", "OrderTrackingId"]),
    amount: pickNumber(raw, ["amount", "Amount"]),
    paymentStatus: paymentStatusStr,
    raw
  };
}

export function extractCurrency(payload: Record<string, unknown>): string {
  return (
    (payload.currency as string) ??
    (payload.Currency as string) ??
    (payload.payment_currency as string) ??
    "UGX"
  );
}

export function isPesapalPaymentCompleted(payload: unknown) {
  const normalized = normalizePesapalStatus(payload);
  return normalized.paymentStatus?.toLowerCase() === "completed";
}

export async function getPesapalToken(): Promise<PesapalToken> {
  if (cachedToken && !isTokenExpired(cachedToken)) {
    return cachedToken;
  }

  // Clear stale cache before attempting a refresh so a failed fetch
  // never leaves a bad/expired token that passes the isTokenExpired guard.
  cachedToken = null;

  const consumerKey = process.env.PESAPAL_CONSUMER_KEY;
  const consumerSecret = process.env.PESAPAL_CONSUMER_SECRET;

  if (!consumerKey || !consumerSecret) {
    throw new Error("Pesapal credentials are missing.");
  }

  const response = await fetch(`${baseUrl}/api/Auth/RequestToken`, {
    method: "POST",
    headers: { "Accept": "application/json", "Content-Type": "application/json" },
    body: JSON.stringify({ consumer_key: consumerKey, consumer_secret: consumerSecret }),
    cache: "no-store"
  });

  if (!response.ok) {
    throw new Error("Unable to authenticate with Pesapal.");
  }

  const data = await response.json();

  // Validate that the response actually contains a usable token before caching.
  if (!data.token || !data.expiryDate) {
    throw new Error("Pesapal returned an invalid token response.");
  }

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

  const currency = input.currency ?? "UGX";
  const countryCode = CURRENCY_COUNTRY[currency] ?? "UG";

  const response = await fetch(`${baseUrl}/api/Transactions/SubmitOrderRequest`, {
    method: "POST",
    headers: {
      "Accept": "application/json",
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({
      id: input.id,
      currency,
      amount: input.amount,
      description: input.description,
      callback_url: input.callbackUrl,
      notification_id: ipnId,
      branch: input.description,
      billing_address: {
        email_address: input.email,
        phone_number: input.phone ?? "",
        country_code: countryCode,
        first_name: input.firstName,
        middle_name: "",
        last_name: input.lastName,
        line_1: "Keevan Store",
        line_2: "",
        city: "",
        state: "",
        postal_code: "",
        zip_code: ""
      }
    }),
    cache: "no-store"
  });

  if (!response.ok) {
    let detail = "Unable to create Pesapal order.";
    try { const err = await response.json(); detail = err?.error?.message || err?.message || detail; } catch {}
    throw new Error(detail);
  }

  const result = await response.json();
  return result;
}

export async function getPesapalTransactionStatus(orderTrackingId: string) {
  const { token } = await getPesapalToken();
  const response = await fetch(`${baseUrl}/api/Transactions/GetTransactionStatus?orderTrackingId=${encodeURIComponent(orderTrackingId)}`, {
    headers: { "Accept": "application/json", Authorization: `Bearer ${token}` },
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
      "Accept": "application/json",
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
  trackingId: string | null | undefined
): Promise<VerificationResult> {
  // Guard: a null/empty trackingId cannot be queried against the Pesapal API.
  if (!trackingId) {
    return { ok: false, error: "Missing Pesapal tracking ID", raw: {} };
  }

  let payment: Record<string, unknown> | null;
  try {
    const result = await supabase
      .from("payments")
      .select("id,merchant_reference,order_id,orders!inner(amount)")
      .eq("merchant_reference", merchantReference)
      .single();
    payment = result.data;
    if (result.error) return { ok: false, error: "Payment not found", raw: {} };
  } catch {
    return { ok: false, error: "Database error while looking up payment", raw: {} };
  }

  if (!payment) return { ok: false, error: "Payment not found", raw: {} };

  const paymentOrder = Array.isArray(payment.orders) ? payment.orders[0] : payment.orders;
  if (!paymentOrder || typeof paymentOrder.amount !== "number") return { ok: false, error: "Payment not found", raw: {} };

  let pesapalStatusPayload: unknown;
  try {
    pesapalStatusPayload = await getPesapalTransactionStatus(trackingId);
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Failed to verify payment with Pesapal";
    return { ok: false, error: msg, raw: {} };
  }

  const transactionStatus = normalizePesapalStatus(pesapalStatusPayload);

  if (!transactionStatus.merchantReference || transactionStatus.merchantReference !== merchantReference) {
    return { ok: false, error: "Pesapal merchant reference mismatch", raw: transactionStatus.raw };
  }

  if (!transactionStatus.trackingId) {
    return { ok: false, error: "Pesapal tracking ID missing in response", raw: transactionStatus.raw };
  }

  // Use rounded comparison to 2 decimal places to avoid floating-point drift
  // (e.g. stored 1000.00 vs Pesapal returning 1000, or 0.3 vs 0.30000000000000004).
  const roundedStored = Math.round(paymentOrder.amount * 100);
  const roundedReturned = transactionStatus.amount !== null
    ? Math.round(transactionStatus.amount * 100)
    : null;

  if (roundedReturned === null || roundedReturned !== roundedStored) {
    return { ok: false, error: "Pesapal amount mismatch", raw: transactionStatus.raw };
  }

  if (!isPesapalPaymentCompleted(transactionStatus.raw)) {
    try {
      await supabase.rpc("fail_pesapal_payment", {
        payment_merchant_reference: merchantReference,
        failure_payload: transactionStatus.raw
      });
    } catch {
      // Log but continue — the payment is already failed
    }
    return { ok: false, error: "Payment is not completed", raw: transactionStatus.raw };
  }

  const currency = extractCurrency(transactionStatus.raw);

  // Set the app API key required by the SECURITY DEFINER RPC.
  // A single attempt is made; failure returns an error immediately rather than
  // proceeding with a finalization call that would fail anyway.
  try {
    const { error: apiKeyError } = await supabase.rpc("set_app_api_key");
    if (apiKeyError) {
      console.error("[verifyPesapalPayment] set_app_api_key failed:", apiKeyError.message);
      return { ok: false, error: "Auth context setup failed for payment finalization", raw: {} };
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Auth context setup threw an unexpected error";
    console.error("[verifyPesapalPayment] set_app_api_key threw:", msg);
    return { ok: false, error: "Auth context setup failed for payment finalization", raw: {} };
  }

  let finalized: unknown;
  try {
    const { data, error: finalizeError } = await supabase.rpc("finalize_pesapal_payment", {
      payment_reference: merchantReference,
      pesapal_tracking_id: transactionStatus.trackingId,
      status_payload: transactionStatus.raw,
      payment_currency: currency,
    });
    if (finalizeError) return { ok: false, error: finalizeError.message, raw: {} };
    finalized = data;
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Payment finalization failed";
    return { ok: false, error: msg, raw: {} };
  }

  const result = finalized as {
    ok: boolean;
    already_processed: boolean;
    order_id?: string;
    download_token?: string;
    error?: string;
  } | null;

  if (!result?.ok) return { ok: false, error: result?.error ?? "Unable to issue download token", raw: {} };

  if (!result.already_processed && result.order_id) {
    try {
      await supabase.from("analytics_events").insert({
        event_type: "purchase",
        metadata: { order_id: result.order_id }
      });
    } catch {
      // Analytics insert failure must not block the download
    }
  }

  return { ok: true, downloadToken: result.download_token ?? "", alreadyVerified: result.already_processed };
}
