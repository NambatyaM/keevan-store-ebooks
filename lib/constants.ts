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
  url: requireEnv("NEXT_PUBLIC_SITE_URL"),
  supportPhone: requireEnv("NEXT_PUBLIC_SUPPORT_PHONE"),
  supportWhatsApp: requireEnv("NEXT_PUBLIC_SUPPORT_WHATSAPP"),
  commissionRate: requireNum("NEXT_PUBLIC_COMMISSION_RATE"),
  minimumWithdrawal: requireNum("NEXT_PUBLIC_MIN_WITHDRAWAL"),
  currency: "UGX"
};

export const ebookUpload = {
  maxBytes: 4 * 1024 * 1024,
  types: ["application/pdf", "application/epub+zip", "application/x-mobipocket-ebook", "application/zip"]
};

export const imageUpload = {
  maxBytes: 2 * 1024 * 1024,
  types: ["image/jpeg", "image/png", "image/webp"]
};

export const formatUgx = (amount: number) =>
  new Intl.NumberFormat("en-UG", {
    style: "currency",
    currency: "UGX",
    maximumFractionDigits: 0
  }).format(amount);

export const calculateSaleSplit = (grossAmount: number) => {
  const platformFee = Math.round(grossAmount * site.commissionRate);
  return {
    grossAmount,
    platformFee,
    creatorEarnings: grossAmount - platformFee
  };
};
