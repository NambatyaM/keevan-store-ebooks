# System Architecture

## Frontend

- Next.js 15 App Router with React 19
- TypeScript
- Tailwind CSS
- @vercel/analytics integrated in root layout for traffic analytics
- Lucide React for icons
- Recharts for dashboard charts

## Backend

- Supabase Auth for user identity (email/password, password reset, session management via @supabase/ssr).
- Supabase PostgreSQL for relational data (14 tables with RLS, 26 indexes, 14 SQL migrations).
- Supabase Storage for product files and cover images (magic-byte validated, signed download URLs with 60-second validity).
- Supabase Row Level Security for tenant isolation and admin permissions (17 RLS policies).

## Payments

- Pesapal receives customer checkout (UGX, mobile money, cards, bank transfer).
- Keevan Store's platform-owned Pesapal account receives funds.
- Payment status is verified server-side before orders, earnings, or downloads are unlocked (three-way cross-verification: DB merchantRef → Pesapal trackingId → Pesapal merchantRef + amount).
- Atomic RPCs (`finalize_pesapal_payment`, `fail_pesapal_payment`) for transaction safety.
- CSRF protection on payment creation endpoint.

## Transactional Emails

- SMTP (configured in Supabase Dashboard → Settings → Auth → SMTP) delivers transactional emails.
- An `email_queue` table in Supabase enqueues emails via database triggers on: order paid, withdrawal status change, refund approval.
- A `/api/cron/process-emails` endpoint processes the queue (triggered by Vercel Cron at 6:00 AM daily) using Nodemailer with the same SMTP credentials.
- Emails are sent for: order confirmation with download link, withdrawal status changes, refund status updates.

## File Validation

- Magic byte signature validation for PDF (`%PDF`), ZIP (`PK`), JPEG (`FF D8 FF`), PNG (`89 PNG`), WebP (`RIFF` + `WEBP`), MOBI (`BOOKMOBI` marker).
- Extension-MIME consistency check.
- Empty file rejection.
- Size limits: 4 MB for ebooks, 2 MB for images.

## Monitoring & Analytics

- **Sentry** (`@sentry/nextjs`) for error tracking on client, server, and edge — integrated in 3 error boundaries (root, admin, creator).
- **@vercel/analytics** for page-view and traffic analytics in the root layout (`<Analytics />`).
- **Vercel Cron** for scheduled email queue processing.
- `withErrorHandling()` wrapper logs all API errors to console in structured JSON format.

## Security

- **Rate Limiting:** Supabase-based `rate_limits` table with atomic `rate_limit_check_and_increment` RPC (120 req/min default, 5 req/min for order lookup).
- **CSRF Protection:** Origin/Referer header validation against `NEXT_PUBLIC_SITE_URL` on payment creation.
- **CSP Headers:** Configured in `next.config.mjs` with `default-src 'self'`, restricted form-action, frame-src, and connect-src.
- **HSTS:** `max-age=63072000; includeSubDomains; preload`.
- **Input Validation:** All POST/PATCH endpoints use Zod schema validation.
- **Download Tokens:** 256-bit entropy tokens (UUID), stored with 7-day expiry, served via 60-second signed Supabase URLs.

## Hosting

- Vercel hosts the Next.js application with Vercel Cron for scheduled tasks.
- Supabase hosts database, auth, and storage.

The application must not depend on mock payment or database services in production paths. Demo content may be used only for public preview pages before a Supabase project is connected.

## Visual Identity

- Logo: `https://i.ibb.co/v6h94WVG/keevan-favicon.jpg` (also used as favicon and apple-touch-icon)
- Hero image: African woman reading/studying with books and laptop (`/hero.webp`)
- Brand color: Green (`#00854a`), theme-color meta tag
