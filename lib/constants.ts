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
  TZS: "\uD83C\uDDF9\uD83C\uDDFF", // 🇹🇿 — was \uDFFF (wrong codepoint), fixed to \uDDFF (Regional Indicator Z)
  RWF: "\uD83C\uDDF7\uD83C\uDDFC",
  USD: "\uD83C\uDDFA\uD83C\uDDF8",
};

export const currencyPhoneRegex: Record<Currency, RegExp> = {
  // Uganda: +256XXXXXXXXX (13 chars) or 0XXXXXXXXX (10 chars), 9 digits after prefix
  UGX: /^(\+256|0)[0-9]{9}$/,
  // Kenya: +254XXXXXXXXX (13 chars) or 0XXXXXXXXX (10 chars), 9 digits after prefix
  KES: /^(\+254|0)[0-9]{9}$/,
  // Tanzania: +255XXXXXXXXX (13 chars) or 0XXXXXXXXX (10 chars), 9 digits after prefix
  TZS: /^(\+255|0)[0-9]{9}$/,
  // Rwanda: +250XXXXXXXXX (13 chars) or 0XXXXXXXXX (10 chars), 9 digits after prefix
  RWF: /^(\+250|0)[0-9]{9}$/,
  // USA/NANP: +1XXXXXXXXXX, 1XXXXXXXXXX, or XXXXXXXXXX — always exactly 10 significant digits
  USD: /^(\+1|1)?[0-9]{10}$/,
};

/** Parse a numeric env var safely, returning `fallback` if the var is absent or non-numeric. */
function parseNumericEnv(key: string, fallback: number): number {
  const raw = process.env[key];
  if (raw === undefined || raw === "") return fallback;
  const parsed = Number(raw);
  if (!Number.isFinite(parsed)) {
    console.warn(`Invalid numeric env var ${key}="${raw}" — falling back to ${fallback}`);
    return fallback;
  }
  return parsed;
}

export const site = {
  name: "Keevan Store",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "",
  supportPhone: process.env.NEXT_PUBLIC_SUPPORT_PHONE ?? "",
  supportWhatsApp: process.env.NEXT_PUBLIC_SUPPORT_WHATSAPP ?? "",
  /** Platform commission rate, 0–1. Reads NEXT_PUBLIC_COMMISSION_RATE; defaults to 0.1 (10%). */
  commissionRate: parseNumericEnv("NEXT_PUBLIC_COMMISSION_RATE", 0.1),
  minimumWithdrawal: parseNumericEnv("NEXT_PUBLIC_MIN_WITHDRAWAL", 50000),
  currency: "UGX" as Currency,
};

/** Per-currency minimum withdrawal amounts in the currency's lowest denomination (integer). */
export const minimumWithdrawalByCurrency: Record<Currency, number> = {
  UGX: parseNumericEnv("NEXT_PUBLIC_MIN_WITHDRAWAL_UGX", 50000),  // 50,000 UGX ≈ $14
  KES: parseNumericEnv("NEXT_PUBLIC_MIN_WITHDRAWAL_KES", 1500),   // 1,500 KES ≈ $12
  TZS: parseNumericEnv("NEXT_PUBLIC_MIN_WITHDRAWAL_TZS", 30000),  // 30,000 TZS ≈ $12
  RWF: parseNumericEnv("NEXT_PUBLIC_MIN_WITHDRAWAL_RWF", 20000),  // 20,000 RWF ≈ $14
  USD: parseNumericEnv("NEXT_PUBLIC_MIN_WITHDRAWAL_USD", 20),     // $20.00 USD
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

/**
 * Split a sale amount into platform fee and creator earnings.
 *
 * grossAmount MUST be a non-negative integer representing the amount in the
 * currency's lowest denomination (e.g. UGX shillings, KES cents, USD cents).
 * Integer arithmetic is used throughout so there is no floating-point loss.
 */
export const calculateSaleSplit = (grossAmount: number) => {
  // Clamp commission rate to [0, 1] in case of misconfiguration.
  const rate = Math.min(1, Math.max(0, site.commissionRate || 0));
  // Math.round ensures the fee is always an integer even if rate × amount is fractional.
  const platformFee = Math.round(grossAmount * rate);
  return {
    grossAmount,
    platformFee,
    creatorEarnings: grossAmount - platformFee,
  };
};
