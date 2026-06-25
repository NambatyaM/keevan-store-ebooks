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
  return { token: data.token, expiryDate: data.expiryDate };
}

export async function createPesapalOrder(input: {
  id: string;
  amount: number;
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
      currency: "UGX",
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
