# Product Requirements Document — Keevan Store

## 1. Problem Statement

East African authors and digital creators lack a dedicated commerce platform that accepts local payment methods (mobile money, bank transfers), handles multi-currency transactions in UGX/KES/TZS/RWF, and lets them own their storefront rather than compete in a pooled marketplace. Existing solutions are either region-locked, require technical skill to set up, or do not support the payment infrastructure that East African buyers actually use.

## 2. Product Overview

Keevan Store is a creator-commerce platform for East African authors and digital creators. It is not a marketplace. Each creator owns an individual storefront with a unique handle and shares product links directly with their audience. The platform handles payment collection (via Pesapal), commission splitting (10% platform / 90% creator), and delivery of digital goods (PDF, EPUB, MOBI, ZIP) with server-side payment verification.

**Target markets:** Uganda, Kenya, Tanzania, Rwanda.

**Supported currencies:** UGX, KES, TZS, RWF, USD (set per-store at creation; locked after first paid order).

## 3. Personas

| Persona | Description |
|---------|-------------|
| **Creator** | An author or digital creator who wants to sell e-books and digital files directly to their audience. Needs a storefront, product upload, analytics, earnings tracking, and withdrawal capabilities. |
| **Customer** | A buyer who discovers a creator's product via a shared link. Wants to purchase using mobile money or card, download instantly, and request a refund if needed. Does not need to create an account. |
| **Admin** | The platform operator. Manages creators, stores, products, withdrawals, refunds, email queue, and platform settings. Reviews audit logs and generates reports. |

## 4. Functional Requirements

### 4.1 Authentication & User Management

- Email/password registration and login via Supabase Auth
- Password reset flow
- Session management via `@supabase/ssr` with HTTP-only cookies
- Authorization middleware enforcing role-based access (admin, creator, buyer) at the route level
- Creator registration creates a `users` table record with `role=creator`

### 4.2 Creator Storefront

- Each creator gets a storefront at `/store/[handle]` with a unique URL
- Currency selection at store creation (one of UGX, KES, TZS, RWF, USD)
- Currency is locked after the first paid order; cannot be changed
- Store suspension/reactivation by admin
- Public product listing pages per store

### 4.3 Product Management (Creator)

- Upload digital products: PDF, EPUB, MOBI, ZIP (max 4 MB)
- Upload cover images: JPEG, PNG, WebP (max 2 MB)
- File validation by magic byte signature, MIME type, and extension consistency (empty files rejected)
- Set price in the store's currency
- Publish, disable, edit, and delete products
- Products are stored in Supabase Storage with RLS-enforced access

### 4.4 Checkout & Payments

- Pesapal iframe checkout embedded for the buyer
- Payment methods: mobile money, card, bank transfer (per Pesapal's capabilities in the store's currency)
- Three-way server-side payment verification before order creation:
  1. DB `merchantRef` -> Pesapal `trackingId`
  2. Pesapal `trackingId` -> Pesapal order details API
  3. Verify `merchantRef` + `amount` consistency
- Atomic RPCs: `finalize_pesapal_payment` on success, `fail_pesapal_payment` on failure
- CSRF protection on the payment creation endpoint
- Pesapal IPN (Instant Payment Notification) callback with `WEBHOOK_SECRET` verification
- IPN endpoint registration via `/api/setup/register-ipn`

### 4.5 Download Delivery

- Download tokens (256-bit UUID entropy) stored with 7-day expiry
- Signed Supabase Storage URLs with 60-second validity
- Token is invalidated after first download or on refund
- Download page at `/download/[slug]` (accessible only after successful payment verification)

### 4.6 Order Management

- Orders recorded in `orders` table with product, buyer, amount, currency, and status
- Order lookup by email at `/order` for guest buyers
- Buyer dashboard at `/buyer/dashboard` for purchase history and re-downloads

### 4.7 Creator Dashboard

- Sales, views, downloads, and conversion rate metrics
- Earnings overview with platform commission breakdown (10% default)
- Analytics page with charts (Recharts)
- Withdrawal history and available balance
- Product list with status management
- Order history
- Settings page

### 4.8 Withdrawals

- Creator requests a withdrawal from available balance (90% of verified sales)
- Minimum withdrawal enforced per currency:
  - UGX: 50,000 | KES: 1,500 | TZS: 30,000 | RWF: 20,000 | USD: 20
- Admin reviews, approves/rejects with notes, then marks as paid after manual transfer
- Status changes trigger email notifications via email queue
- Withdrawal state machine: `pending` -> `approved` -> `paid` | `rejected`

### 4.9 Refunds

- Customer submits refund request via email-based order lookup at `/request-refund`
- Admin reviews at `/admin/refunds`, approves or rejects with notes
- On approval: Pesapal RefundRequest API reverses the original payment
- Creator's earnings are deducted atomically in the original order currency
- Download token is invalidated
- Status change emails sent to the customer

### 4.10 Transactional Emails

- **Provider:** Resend API
- **Events:** Order confirmation (with download link), withdrawal status change, refund status update
- **Pattern:** Events enqueued to `email_queue` table via DB triggers, processed by `/api/cron/process-emails` (Vercel Cron, daily at 6 AM) or manually via `/api/emails/process`

### 4.11 Admin Dashboard

- Platform-wide stats: revenue grouped by currency, orders, creators, withdrawals, registrations, store status
- Management pages: creators, stores, products, buyers, withdrawals, refunds, orders, sales
- Email queue viewer at `/admin/emails`
- Audit log with action-type filter (9 state-changing actions recorded)
- Settings page
- Reports and sales analytics

### 4.12 Discounts, Reviews & Cart

- Discount codes can be applied at checkout (API: `/api/discounts`)
- Product reviews with ratings (API: `/api/reviews`)
- Shopping cart functionality (API: `/api/cart`)

### 4.13 Analytics & Monitoring

- `@vercel/analytics` for page-view and traffic analytics (root layout)
- Sentry (`@sentry/nextjs`) for error tracking on client, server, and edge
- `withErrorHandling()` wrapper for structured API error logging
- Rate limiting via `rate_limits` table with atomic `rate_limit_check_and_increment` RPC
- Dashboard charts using Recharts

## 5. Business Rules

| Rule | Value |
|------|-------|
| Platform commission | 10% of each verified sale (configurable via `NEXT_PUBLIC_COMMISSION_RATE`) |
| Creator earnings | 90% of each verified sale |
| Minimum withdrawals | Per-currency (UGX 50k / KES 1.5k / TZS 30k / RWF 20k / USD 20) |
| Buyer account required | No — purchases are email-based |
| File size limits | 4 MB (products), 2 MB (covers) |
| Signed URL validity | 60 seconds |
| Download token expiry | 7 days |
| Rate limiting | 120 req/min/IP (default), 5 req/min (order lookup) |
| Currency change | Locked after first paid order |
| Revenue display | In original transaction currency (no auto-conversion) |

## 6. Non-Functional Requirements

- **Security:** CSP headers, HSTS (max-age=63072000), CSRF protection on payment creation, Zod input validation on all POST/PATCH endpoints, magic byte file validation, rate limiting
- **Performance:** Signed download URLs (no direct storage exposure), atomic RPCs for critical payment paths, server-side rendering with Supabase SSR
- **Reliability:** Three-way payment verification prevents false order creation, email queue with retry via Vercel Cron
- **Scalability:** Supabase RLS for tenant isolation, serverless architecture on Vercel, rate limiting prevents abuse
- **Monitoring:** Sentry error tracking (client + server + edge), structured API logging, Vercel analytics

## 7. Constraints

- Payments flow through the platform-owned Pesapal account; funds never route directly to creators
- Downloads are never exposed before payment verification
- The platform does not aggregate listings or promote pooled storefronts — each creator owns their distribution channel
- No auto-conversion of revenue; all financial data is stored and displayed in the original transaction currency
- Resend API key must be configured for transactional email delivery
