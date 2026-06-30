export const currencies = ["UGX", "KES", "TZS", "RWF", "USD"] as const;
export type Currency = (typeof currencies)[number];

export const currencyLabels: Record<Currency, string> = {
  UGX: "Uganda (UGX)",
  KES: "Kenya (KES)",
  TZS: "Tanzania (TZS)",
  RWF: "Rwanda (RWF)",
  USD: "United States (USD)",
};

export const currencyFlags: Record<Currency, string> = {
  UGX: "\uD83C\uDDFA\uD83C\uDDEC",
  KES: "\uD83C\uDDF0\uD83C\uDDEA",
  TZS: "\uD83C\uDDF9\uD83C\uDFFF",
  RWF: "\uD83C\uDDF7\uD83C\uDDFC",
  USD: "\uD83C\uDDFA\uD83C\uDDF8",
};

export const currencyPhoneRegex: Record<Currency, RegExp> = {
  UGX: /^(\+256|0)[0-9]{9}$/,
  KES: /^(\+254|0)[0-9]{9}$/,
  TZS: /^(\+255|0)[0-9]{9}$/,
  RWF: /^(\+250|0)[0-9]{9}$/,
  USD: /^\+?[0-9]{7,15}$/,
};

function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value) throw new Error(`Missing required environment variable: ${key}`);
  return value;
}

function requireNum(key: string): number {
  const value = Number(process.env[key]);
  if (!value && value !== 0) throw new Error(`Missing required environment variable: ${key}`);
  return value;
}

export const site = {
  name: "Keevan Store",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "",
  supportPhone: process.env.NEXT_PUBLIC_SUPPORT_PHONE ?? "",
  supportWhatsApp: process.env.NEXT_PUBLIC_SUPPORT_WHATSAPP ?? "",
  commissionRate: Number(process.env.NEXT_PUBLIC_COMMISSION_RATE || "0.1"),
  minimumWithdrawal: Number(process.env.NEXT_PUBLIC_MIN_WITHDRAWAL || "50000"),
  currency: "UGX" as Currency,
};

/** Per-currency minimum withdrawal amounts in the currency's smallest unit. */
export const minimumWithdrawalByCurrency: Record<Currency, number> = {
  UGX: Number(process.env.NEXT_PUBLIC_MIN_WITHDRAWAL_UGX || "50000"),
  KES: Number(process.env.NEXT_PUBLIC_MIN_WITHDRAWAL_KES || "1500"),
  TZS: Number(process.env.NEXT_PUBLIC_MIN_WITHDRAWAL_TZS || "30000"),
  RWF: Number(process.env.NEXT_PUBLIC_MIN_WITHDRAWAL_RWF || "20000"),
  USD: Number(process.env.NEXT_PUBLIC_MIN_WITHDRAWAL_USD || "20"),
};

export const ebookUpload = {
  maxBytes: 4 * 1024 * 1024,
  types: ["application/pdf", "application/epub+zip", "application/x-mobipocket-ebook", "application/zip"],
};

export const imageUpload = {
  maxBytes: 2 * 1024 * 1024,
  types: ["image/jpeg", "image/png", "image/webp"],
};

const validCurrencies = new Set(currencies);

/** Format an amount in the given currency. Defaults to UGX. */
export function formatCurrency(amount: number, currency: Currency = "UGX"): string {
  if (!currency || !validCurrencies.has(currency)) {
    console.warn("Invalid currency code:", currency, "— falling back to UGX");
    currency = "UGX";
  }
  const fmt = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    currencyDisplay: currency === "USD" ? "symbol" : "code",
    minimumFractionDigits: currency === "USD" ? 2 : 0,
    maximumFractionDigits: currency === "USD" ? 2 : 0,
  });
  return fmt.format(amount);
}

/** Backward-compatible alias for existing code that hardcodes UGX. */
export const formatUgx = (amount: number) => formatCurrency(amount, "UGX");

export const calculateSaleSplit = (grossAmount: number) => {
  const platformFee = Math.round(grossAmount * site.commissionRate);
  return {
    grossAmount,
    platformFee,
    creatorEarnings: grossAmount - platformFee,
  };
};
