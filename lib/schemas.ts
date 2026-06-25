import { z } from "zod";

export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  fullName: z.string().min(2),
  storeHandle: z.string().regex(/^[a-z0-9-]{3,64}$/)
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
  description: z.string().max(500).optional()
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
  amount: z.number().int().min(50000),
  payoutMethod: z.string().min(2),
  payoutDetails: z.record(z.unknown()).default({})
});

export const withdrawalDecisionSchema = z.object({
  notes: z.string().max(1000).optional()
});

export const analyticsEventSchema = z.object({
  storeId: z.string().uuid().optional(),
  productId: z.string().uuid().optional(),
  eventType: z.enum(["store_view", "product_view", "purchase", "download"]),
  source: z.string().max(200).optional(),
  metadata: z.record(z.unknown()).default({})
});
