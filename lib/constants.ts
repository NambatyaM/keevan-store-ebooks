export const site = {
  name: "Keevan Store",
  url: process.env.NEXT_PUBLIC_SITE_URL || "https://keevanstore.in",
  supportPhone: process.env.NEXT_PUBLIC_SUPPORT_PHONE ?? "+256768345905",
  supportWhatsApp: process.env.NEXT_PUBLIC_SUPPORT_WHATSAPP ?? "https://wa.me/256768345905",
  commissionRate: Number(process.env.NEXT_PUBLIC_COMMISSION_RATE) || 0.1,
  minimumWithdrawal: Number(process.env.NEXT_PUBLIC_MIN_WITHDRAWAL) || 50000,
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
