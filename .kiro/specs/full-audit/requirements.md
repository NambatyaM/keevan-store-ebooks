# Requirements — Keevan Store Full Production Audit

## Overview

Keevan Store is a creator storefront SaaS platform deployed at keevanstore.in (Vercel + Supabase). The goal of this audit is not to add features — it is to find every existing bug, security hole, broken flow, and UX problem in the current codebase and fix them permanently so the platform is production-stable.

This document captures what the platform must correctly do. Each numbered requirement is what the system must satisfy after all fixes are applied.

---

## 1. Buyer Experience

### 1.1 Store Discovery & Product Browsing
- WHEN a buyer visits `/store/<handle>`, the storefront MUST load the creator's published products, store name, and description without error.
- WHEN a store handle does not exist, the page MUST return a clear 404 — not a 500 or blank screen.
- WHEN a store is suspended by admin, buyers MUST see a "store unavailable" message — not a 500.
- Products MUST display title, price (with correct currency symbol), and cover image (or graceful fallback if no cover).
- Product slugs MUST be unique within a store; duplicate slugs MUST NOT exist in the database.

### 1.2 Guest Checkout (No Account Required)
- WHEN a buyer clicks "Buy Now" on any published product, the checkout modal MUST open without a 500 error.
- Guest buyers MUST be able to complete a purchase by providing name, email, and phone — without signing up.
- WHEN the checkout form is submitted, `POST /api/payments/create` MUST return a Pesapal redirect URL within 5 seconds.
- WHEN a product has no `file_path`, the checkout MUST NOT proceed — 404 "Product not available" MUST be returned before any order is created.
- WHEN a pending order already exists for the same buyer email + product within 15 minutes, a 409 conflict MUST be returned.

### 1.3 Payment (Pesapal)
- WHEN a buyer is redirected to Pesapal and completes payment, the IPN webhook at `/api/webhooks/pesapal` MUST be called by Pesapal and MUST finalize the order successfully.
- WHEN `finalize_pesapal_payment` is called, `set_app_api_key()` MUST be called first so the SECURITY DEFINER function's auth check passes.
- WHEN a payment is completed, NO duplicate orders or duplicate download tokens MUST be created (idempotency enforced).
- WHEN a payment amount returned by Pesapal does not match the stored order amount, the payment MUST be rejected.
- WHEN a payment fails or is cancelled by the buyer, the order MUST be marked `failed` and the buyer shown an appropriate message.
- Currency-to-country-code mapping MUST be correct for all supported currencies: UGX→UG, KES→KE, TZS→TZ, RWF→RW, USD→US.

### 1.4 Post-Payment Download
- WHEN payment is confirmed, the buyer MUST be redirected to `/order/success?order_id=<id>` and see a download link immediately.
- WHEN a guest buyer (unauthenticated) polls `GET /api/orders/<orderId>/status`, the endpoint MUST return 200 with `downloadUrl` — NOT 401.
- Download tokens MUST expire after 7 days.
- WHEN an expired token is used, the download endpoint MUST return 410 Gone — not a silent fail.
- WHEN an unpaid order's download link is accessed, the endpoint MUST return 403.
- WHEN a download link for a different buyer's order is accessed, the endpoint MUST return 403.

### 1.5 Buyer Account (Optional)
- Buyers MAY sign up to access `/buyer/dashboard` with purchase history.
- WHEN a buyer creates an account with the same email as a past guest order, their purchase history MUST be linked.
- Buyer dashboard MUST show only that buyer's orders — never another buyer's data.

---

## 2. Creator Experience

### 2.1 Signup & Authentication
- Creator signup at `/signup` MUST create a Supabase auth user AND a row in the `users` table with `role = 'creator'`.
- Login MUST set the session cookie correctly so subsequent protected routes work.
- Password reset flow (`/forgot-password` → email → `/update-password`) MUST complete without error.
- WHEN a creator logs in and no store exists yet, they MUST be redirected to store setup.

### 2.2 Store Management
- Creators MUST be able to create a store with a unique handle (slug).
- WHEN a handle is already taken, the form MUST return a clear conflict error — not a 500.
- Creators MUST be able to update store name, description, and logo.
- Store links (`/store/<handle>`) MUST work immediately after creation.
- Creators MUST see their public store link on the dashboard.

### 2.3 Product Management
- Creators MUST be able to create a product with: title, description, price, currency, cover image (optional), and digital file.
- Digital file upload MUST be validated by MIME type (magic bytes), not just file extension.
- File MUST be stored in the private `products` Supabase Storage bucket.
- `file_path` MUST be stored on the product row after upload.
- Creators MUST be able to edit any field of their own products.
- Creators MUST be able to delete their own products; deletion MUST remove the storage file too.
- Creators MUST NOT be able to edit or delete another creator's products.
- Products MUST be published/unpublished — only published products appear to buyers.

### 2.4 Sales & Earnings
- The creator dashboard MUST show total sales, revenue (creator earnings after commission), and recent orders — for their store only.
- WHEN a sale finalizes, the creator's balance MUST be incremented by `creator_earnings` (gross minus platform fee).
- Creator balance MUST be accurate — never double-counted, never lost.
- Commission rate is `NEXT_PUBLIC_COMMISSION_RATE` (default 10%).

### 2.5 Withdrawal Requests
- Creators MUST be able to request a withdrawal if their balance ≥ minimum withdrawal threshold (per-currency).
- WHEN a withdrawal request is submitted, balance MUST be decremented atomically.
- WHEN a withdrawal is rejected by admin, balance MUST be restored.
- Creators MUST NOT be able to withdraw more than their available balance.
- Creators MUST see the status of all their withdrawal requests.

---

## 3. Admin Experience

### 3.1 Authentication & Authorization
- Admin routes MUST be protected — non-admin users MUST be redirected to `/login`.
- Admin role MUST be set in the `users` table (not just Supabase auth metadata).
- All `/admin/*` API routes MUST call `requireAdmin()` — no endpoint MUST be accessible without admin role.

### 3.2 Dashboard & Stats
- Admin dashboard MUST show accurate platform-wide stats: total revenue, orders, creators, buyers.
- Stats MUST come from live database queries — never hardcoded or stale mock data.

### 3.3 User Management
- Admin MUST be able to view all creators and all buyers.
- Admin MUST be able to suspend/reactivate a creator store.
- Admin MUST be able to view all orders with filter by status.
- Admin MUST be able to mark an order as paid (manual override).

### 3.4 Product Management
- Admin MUST be able to view all products across all stores.
- Admin MUST be able to disable or reactivate a product.

### 3.5 Withdrawals
- Admin MUST be able to view all pending withdrawal requests.
- Admin MUST be able to approve, reject, or mark-paid each withdrawal.
- WHEN admin approves, the withdrawal status MUST transition to `approved`.
- WHEN admin marks-paid, the withdrawal status MUST transition to `paid`.
- WHEN admin rejects, the withdrawal status MUST transition to `rejected` and the creator balance MUST be restored.

### 3.6 Refunds
- Admin MUST be able to view all refund requests.
- Admin MUST be able to approve or reject a refund.
- WHEN a refund is approved, the `process_refund()` RPC MUST be called with `set_app_api_key()` first.
- WHEN a refund is approved, the Pesapal refund API MUST be called (or queued).

### 3.7 Audit Log
- All significant admin actions MUST be recorded in the audit log.
- Audit log MUST be viewable by admin with timestamp, actor, and description.

---

## 4. Security Requirements

### 4.1 API Authentication
- All authenticated API routes MUST verify session using `requireUser()` or `requireAdmin()`.
- Service-role RPCs MUST call `set_app_api_key()` before any SECURITY DEFINER function that checks `app.api_key`.
- No API route MUST expose another user's data (creator A cannot query creator B's products via the API).

### 4.2 Row Level Security
- Every table that stores user-specific data MUST have RLS enabled with correct policies.
- The `products` storage bucket MUST require signed URLs — no public access to files.
- The `covers` storage bucket MAY be public (cover images are non-sensitive).

### 4.3 Input Validation
- All POST/PATCH/PUT API routes MUST validate input with Zod schemas before processing.
- File uploads MUST be validated by magic bytes (not just extension or content-type header).
- Phone number format MUST be validated against the currency-specific regex in `lib/constants.ts`.

### 4.4 Payment Security
- Merchant reference returned by Pesapal MUST be matched to the stored `merchantReference` — spoofed references MUST be rejected.
- Payment amount returned by Pesapal MUST be matched to stored order amount — under-payment MUST be rejected.
- Webhook endpoint MUST verify the request comes from Pesapal (IPN ID check or signature).

### 4.5 Download Security
- Download tokens MUST be UUID, single-use or multi-use within expiry window (current design: reusable within 7 days).
- Download endpoint MUST verify the token is valid, not expired, and belongs to a paid order before serving the signed URL.
- Signed storage URLs MUST have short expiry (e.g., 60 seconds) so they cannot be shared persistently.

---

## 5. Reliability & Performance Requirements

### 5.1 Error Handling
- Every API route MUST be wrapped in `withErrorHandling()` from `lib/api.ts`.
- No API route MUST return an unstructured 500 — all errors MUST return `{ error: string }` JSON.
- Every unhandled exception MUST be reported to Sentry.

### 5.2 Idempotency
- `finalize_pesapal_payment` MUST handle duplicate IPN callbacks without creating duplicate orders or tokens.
- The discount `increment_discount_use` MUST use `FOR UPDATE` lock to prevent race conditions.
- Pending order duplicate check (buyer_email + product_id + 15-minute window) MUST be enforced.

### 5.3 Email Delivery
- Order confirmation emails MUST be enqueued in `email_queue` after payment finalization.
- Withdrawal status emails MUST be enqueued on approval/rejection/paid events.
- The Vercel Cron at `/api/cron/process-emails` MUST process the queue without errors and MUST require `CRON_SECRET` authorization.

### 5.4 Loading & Empty States
- Every page and dashboard MUST have loading skeletons (no raw spinners or blank flashes).
- Every list view (orders, products, withdrawals, etc.) MUST have a proper empty state when there is no data.

---

## 6. Non-Goals (Out of Scope)
- Adding new features not currently in the codebase
- Changing the product direction or user flows
- Integrating additional payment providers
- Adding a new currency beyond UGX/KES/TZS/RWF/USD
- Building analytics beyond what already exists
