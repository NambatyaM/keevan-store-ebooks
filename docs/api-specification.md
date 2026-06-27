# API Specification

All mutating APIs validate input with Zod, return structured JSON errors, and enforce authentication/authorization where required. Rate limiting (Supabase-based, default 120 req/min/IP) applies to all endpoints. Cross-cutting: authentication, authorization, validation, rate limiting, error handling, admin audit logging.

## Authentication

- `POST /api/auth/register` — Register with email, password, name, role
- `POST /api/auth/login` — Login, returns session
- `POST /api/auth/logout` — Logout, clears session
- `POST /api/auth/reset-password` — Request password reset email
- `GET /api/auth/me` — Get current user profile (requireUser)

## Stores

- `POST /api/stores` — Create store
- `PATCH /api/stores/[id]` — Update store
- `DELETE /api/stores/[id]` — Delete store

## Products

- `GET /api/products` — List creator's products
- `POST /api/products` — Create product (forces status="draft")
- `GET /api/products/[id]` — Get product
- `PATCH /api/products/[id]` — Update product
- `DELETE /api/products/[id]` — Delete product (cleans up storage files)

## Payments

- `POST /api/payments/create` — Create Pesapal order (CSRF protected, checks store is active)
- `POST /api/payments/verify` — Verify payment server-side, returns download token
- `POST /api/webhooks/pesapal` — IPN callback from Pesapal (v2/v3 payload normalization)

## Downloads

- `GET /api/downloads/[token]` — Serve signed Supabase Storage URL (validates token + expiry)

## Withdrawals

- `POST /api/withdrawals` — Create withdrawal request (requireUser, min 50,000 UGX)
- `POST /api/admin/withdrawals/[id]/approve` — Approve withdrawal (requireAdmin)
- `POST /api/admin/withdrawals/[id]/reject` — Reject withdrawal (requireAdmin)
- `POST /api/admin/withdrawals/[id]/mark-paid` — Mark withdrawal as paid (requireAdmin)

## Refunds

- `POST /api/refunds/request` — Submit refund request (email-verified, public)
- `GET /api/orders/lookup?email=` — Look up paid orders by email (public, rate-limited: 5 req/min)
- `GET /api/admin/refunds` — List refund requests (admin)
- `POST /api/admin/refunds/[id]/approve` — Approve and process refund (admin), triggers Pesapal reversal
- `POST /api/admin/refunds/[id]/reject` — Reject refund (admin)

## Email Queue

- `POST /api/emails/process` — Process pending email queue (admin or cron via CRON_SECRET)
- `POST /api/cron/process-emails` — Cron-triggered endpoint (Vercel Cron daily at 6:00 AM)

## Admin

- `GET /api/admin/stats` — Platform dashboard stats (requireAdmin)
- `GET /api/admin/creators` — List creators (requireAdmin)
- `GET /api/admin/orders` — List orders (requireAdmin)
- `GET /api/admin/withdrawals` — List withdrawals (requireAdmin)
- `GET /api/admin/audit-log` — Audit log with action/target filters (requireAdmin)
- `GET /api/admin/emails` — View email queue (requireAdmin)
- `GET /api/admin/reports` — Platform reports (requireAdmin)
- `GET /api/admin/sales` — Sales data (requireAdmin)
- `GET /api/admin/buyers` — List buyers (requireAdmin)
- `GET /api/admin/products/[id]/disable` — Disable product (requireAdmin)
- `GET /api/admin/products/[id]/reactivate` — Reactivate product (requireAdmin)
- `GET /api/admin/stores/[id]/suspend` — Suspend store (requireAdmin)
- `GET /api/admin/stores/[id]/reactivate` — Reactivate store (requireAdmin)

## Upload

- `POST /api/upload` — Upload ebook file or cover image (requireUser, magic-byte validated)

## Analytics

- `POST /api/analytics/events` — Record analytics event (public, only store_view/product_view accepted)
- `GET /api/analytics/summary` — Get analytics summary (requireUser, limit 10000)

Required cross-cutting behavior:

- Authentication (cookie-based via @supabase/ssr, Bearer token fallback)
- Authorization (requireUser, requireAdmin)
- Validation (Zod schemas)
- Rate limiting (Supabase-based, atomic RPC)
- Error handling (withErrorHandling wrapper, structured JSON)
- Admin audit logging (9 state-changing actions)
