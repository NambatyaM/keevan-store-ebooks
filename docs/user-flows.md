# User Flow Validation

## Creator Flow

Register (`/signup`) → Create Store → Upload Product → Publish Product → Share Product → Receive Sales (tracked in dashboard) → Request Withdrawal (min 50,000 UGX)

This flow is supported by Supabase Auth, store APIs, product APIs (with magic-byte file validation), payment verification (server-side Pesapal three-way check), order recording, analytics (product view, store view, purchase events), and withdrawal APIs (with `reserve_withdrawal` RPC). Creator actions must be authenticated and authorized through Supabase Row Level Security.

Creator dashboard pages: `/creator/dashboard`, `/creator/products`, `/creator/earnings`, `/creator/analytics`, `/creator/withdrawals`, `/creator/settings`.

## Customer / Buyer Flow

Visit Product (`/product/[slug]`) → Purchase Product (`/checkout/[slug]`) → Pay via Pesapal (mobile money, card, or bank transfer in UGX) → Payment Verified Server-Side → Download Unlocked (`/download/[slug]`) → (Optional) Request Refund if unsatisfied (`/request-refund`)

Customer checkout starts a Pesapal order. Downloads are created only after payment verification (three-way cross-check) and are delivered through signed Supabase Storage URLs with 60-second validity. Buyers do not need an account to purchase.

Buyer dashboard: `/buyer/dashboard` — view purchase history and access downloads.

## Admin Flow

Review Platform Dashboard (`/admin/dashboard`) → Review Withdrawals (`/admin/withdrawals`) → Approve/Reject/Mark Paid with notes → Manage Creators (`/admin/creators`) → Moderate Products (disable/reactivate) → Manage Stores (suspend/reactivate) → Process Refunds (`/admin/refunds`) → View Audit Log (`/admin/audit-log`) → Send Emails (`/admin/emails`) → View Reports (`/admin/reports`) & Sales (`/admin/sales`)

Admin APIs require an authenticated admin role and write audit records to `admin_logs`. All 9 state-changing admin actions log action type, target table, target ID, and acting admin user.

Admin dashboard pages: `/admin/dashboard`, `/admin/orders`, `/admin/creators`, `/admin/buyers`, `/admin/withdrawals`, `/admin/refunds`, `/admin/audit-log`, `/admin/emails`, `/admin/reports`, `/admin/sales`, `/admin/settings`.

## Refund Flow

Customer visits `/request-refund` → enters email → selects a paid order (fetched via `GET /api/orders/lookup?email=` rate-limited to 5 req/min) → submits reason via `POST /api/refunds/request` → Admin reviews at `/admin/refunds` → Admin approves or rejects with notes via `POST /api/admin/refunds/[id]/approve` or `/reject` → If approved: payment reversed via Pesapal RefundRequest API, order status set to 'refunded', creator balance deducted atomically via `process_refund` RPC, download token invalidated (expires_at set to now), audit logged, notification sent → If rejected: refund marked rejected, audit logged, creator notified.

## What's New v0.1.0

- **Buyer dashboard** at `/buyer/dashboard` — purchases and downloads in one place.
- **@vercel/analytics** — traffic analytics via `<Analytics />` in root layout.
- **New logo** — `https://i.ibb.co/v6h94WVG/keevan-favicon.jpg` used throughout.
- **Hero image** — African woman reading/studying with books and laptop (`/hero.webp`).
- **Admin emails page** — view and manage email queue.
- **Admin reports and sales pages** — platform-wide reporting and sales tracking.
- **Admin buyers page** — view all platform buyers.
- **14 SQL migrations** (up from 11) — including storage buckets and buyer features.
- **23 test files** with 388 tests.
