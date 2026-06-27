# Product Requirements Document

Serves Uganda, Kenya, Tanzania, and Rwanda. All transactions in UGX.

## Creator Features

- Register, log in, log out, and reset password through Supabase Auth.
- Create, update, and delete a creator store.
- Upload PDF, EPUB, MOBI, and ZIP products up to 4 MB (validated by magic bytes, MIME, and extension consistency).
- Upload JPEG, PNG, and WebP cover images up to 2 MB.
- Edit, delete, price, publish, and disable products.
- View dashboard with sales, views, downloads, conversion rate, earnings, and withdrawal history.
- Request withdrawals when available balance is at least 50,000 UGX.
- Creator products, earnings, analytics, withdrawals, and settings pages.

## Customer Features

- View creator stores and product pages without an account.
- Submit buyer details and start Pesapal checkout (mobile money, card, bank transfer).
- Receive download access only after server-side payment verification.
- Download through a signed Supabase Storage URL (60-second validity).
- Request a refund by looking up orders via email at `/request-refund` and submitting a reason.
- Buyer dashboard at `/buyer/dashboard` for purchases and downloads.

## Admin Features

- Dashboard with platform revenue, orders, creators, withdrawals, registrations, and store status.
- Manage creators, stores, products, buyers, withdrawals, refunds, reports, sales, and settings.
- Approve, reject, and mark withdrawals paid with admin notes.
- Disable/reactivate products and suspend/reactivate stores.
- Record all admin actions in audit logs with action-type filtering.
- Review, approve, and reject customer refund requests with admin notes.
- View and manage email queue at `/admin/emails`.
- View sales reports and platform analytics at `/admin/reports` and `/admin/sales`.
- Audit log page at `/admin/audit-log` with action-type filter dropdown.
- Admin settings page at `/admin/settings`.

## Business Rules

- Platform commission: 10% of each verified sale (configurable via `NEXT_PUBLIC_COMMISSION_RATE`).
- Creator earnings: 90% of each verified sale.
- Minimum withdrawal: 50,000 UGX (configurable via `NEXT_PUBLIC_MIN_WITHDRAWAL`).
- Payment verification is required before sale creation, creator balance changes, or download unlock.
- Buyers are not required to create accounts.
- Refunds are processed against the original payment via Pesapal's RefundRequest API and reverse the creator's earnings atomically.
- Rate limiting on all API endpoints (default: 120 req/min/IP, 5 req/min for order lookup).
- CSRF protection on payment creation endpoint.
- Magic byte validation on all file uploads.
