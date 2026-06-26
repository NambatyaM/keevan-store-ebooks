# System Architecture

## Frontend

- Next.js App Router
- React
- TypeScript
- Tailwind CSS

## Backend

- Supabase Auth for user identity.
- Supabase PostgreSQL for relational data.
- Supabase Storage for product files and cover images.
- Supabase Row Level Security for tenant isolation and admin permissions.

## Payments

- Pesapal receives customer checkout.
- Keevan Store's platform-owned Pesapal account receives funds.
- Payment status is verified server-side before orders, earnings, or downloads are unlocked.

## Transactional Emails

- SMTP (configured in Supabase Dashboard → Settings → Auth → SMTP) delivers transactional emails.
- An `email_queue` table in Supabase enqueues emails via database triggers.
- A `/api/emails/process` endpoint processes the queue (triggered by cron or manual) using `nodemailer` with the same SMTP credentials.
- Emails are sent for: order confirmation with download link, withdrawal status changes, refund status updates.

## Hosting

- Vercel hosts the Next.js application.
- Supabase hosts database, auth, and storage.

The application must not depend on mock payment or database services in production paths. Demo content may be used only for public preview pages before a Supabase project is connected.
