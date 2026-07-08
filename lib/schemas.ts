import { z } from "zod";

export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).regex(/[a-z]/, "Password must contain a lowercase letter").regex(/[A-Z]/, "Password must contain an uppercase letter").regex(/[0-9]/, "Password must contain a number"),
  fullName: z.string().min(2),
  storeHandle: z.string().regex(/^[a-z0-9-]{3,64}$/),
  currency: z.enum(["UGX", "KES", "TZS", "RWF", "USD"]).default("UGX")
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});

export const resetPasswordSchema = z.object({
  email: z.string().email()
});

export const storeSchema = z.object({
  name: z.string().min(2),
  slug: z.string().regex(/^[a-z0-9-]{3,64}$/),
  description: z.string().max(500).optional(),
  tagline: z.string().max(120).optional(),
  category: z.string().optional(),
  social_links: z.record(z.string()).optional(),
  currency: z.enum(["UGX", "KES", "TZS", "RWF", "USD"]).default("UGX")
});

export const creatorSchema = z.object({
  display_name: z.string().min(2).optional(),
  bio: z.string().max(500).optional(),
  phone: z.string().optional()
});

export const productSchema = z.object({
  storeId: z.string().uuid(),
  slug: z.string().regex(/^[a-z0-9-]{3,96}$/),
  title: z.string().min(2),
  description: z.string().min(10),
  price: z.number().int().positive(),
  status: z.enum(["draft", "published", "disabled"]).default("draft"),
  filePath: z.string().min(1),
  fileSize: z.number().int().max(4 * 1024 * 1024),
  fileMime: z.enum(["application/pdf", "application/epub+zip", "application/x-mobipocket-ebook", "application/zip"]),
  coverPath: z.string().optional(),
  coverSize: z.number().int().max(2 * 1024 * 1024).optional(),
  coverMime: z.enum(["image/jpeg", "image/png", "image/webp"]).optional()
});

export const productUpdateSchema = z.object({
  slug: z.string().regex(/^[a-z0-9-]{3,96}$/).optional(),
  title: z.string().min(2).optional(),
  description: z.string().min(10).optional(),
  price: z.number().int().positive().optional(),
  status: z.enum(["draft", "published", "disabled"]).optional(),
  filePath: z.string().min(1).optional(),
  fileSize: z.number().int().max(4 * 1024 * 1024).optional(),
  fileMime: z.enum(["application/pdf", "application/epub+zip", "application/x-mobipocket-ebook", "application/zip"]).optional(),
  coverPath: z.string().optional(),
  coverSize: z.number().int().max(2 * 1024 * 1024).optional(),
  coverMime: z.enum(["image/jpeg", "image/png", "image/webp"]).optional()
});

export const checkoutSchema = z.object({
  productId: z.string().uuid(),
  buyerEmail: z.string().email(),
  buyerName: z.string().min(2),
  phone: z.string().optional()
});

export const paymentVerifySchema = z.object({
  merchantReference: z.string().min(1),
  trackingId: z.string().min(1)
});

export const withdrawalSchema = z.object({
  amount: z.number().int().min(1),
  payoutMethod: z.string().min(2),
  payoutDetails: z.record(z.unknown()).default({})
});

export const withdrawalDecisionSchema = z.object({
  notes: z.string().max(1000).optional(),
  paymentReference: z.string().max(500).optional()
});

export const refundRequestSchema = z.object({
  orderId: z.string().uuid(),
  buyerEmail: z.string().email(),
  reason: z.string().min(10).max(2000)
});

export const customerRefundLookupSchema = z.object({
  email: z.string().email()
});

export const refundDecisionSchema = z.object({
  notes: z.string().max(1000).optional()
});

export const markNotificationsReadSchema = z.object({
  ids: z.array(z.string().uuid()).optional()
});

export const analyticsEventSchema = z.object({
  storeId: z.string().uuid().optional(),
  productId: z.string().uuid().optional(),
  eventType: z.enum(["store_view", "product_view", "purchase", "download"]),
  source: z.string().max(200).optional(),
  metadata: z.record(z.unknown()).default({})
});
