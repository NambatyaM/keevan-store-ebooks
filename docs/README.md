# Keevan Store

Creator-commerce platform for East African authors and digital creators. Creators own individual stores and share product links directly with their audiences. Built with Next.js 15, Supabase, and Pesapal. Serves Uganda, Kenya, Tanzania, and Rwanda.

## Quick Start

```bash
cp .env.example .env
# Fill in Supabase URL and keys (see .env.example comments)

npm install
npm run migrate
npm run seed:admin
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Admin Access

After seeding, sign in at `/login`:

| Field    | Value                     |
| -------- | ------------------------- |
| Email    | nkevinmegan@gmail.com     |
| Password | Kevin#2004Keeva#44        |

The admin can access `/admin/*` routes for stats, orders, creators, buyers, withdrawals, refunds, audit log, emails, reports, sales, and settings management.

## Architecture

| Layer    | Technology                         |
| -------- | ---------------------------------- |
| Frontend | Next.js 15 (App Router), React 19, Tailwind CSS |
| Backend  | Supabase (PostgreSQL, Auth, Storage, RLS) |
| Payments | Pesapal (UGX, mobile money, cards, bank transfer; server-side verification) |
| Email    | Nodemailer + Supabase Auth SMTP    |
| Hosting  | Vercel (app) + Supabase (data)     |
| Monitoring | Sentry (error tracking), @vercel/analytics (analytics) |
| Validation | Zod                            |
| Testing  | Vitest                             |

See `docs/system-architecture.md` for details.

## Project Structure

```
app/              Next.js App Router pages and API routes
  admin/          Admin dashboard (stats, orders, creators, buyers, withdrawals, refunds, audit log, emails, reports, sales, settings)
  api/            API route handlers (auth, orders, payments, refunds, emails, analytics)
  buyer/          Buyer dashboard (purchases, downloads)
  creator/        Creator dashboard (products, earnings, analytics, withdrawals, settings)
  store/          Public storefront
  checkout/       Checkout flow
  download/       Payment-verified download delivery
components/       Shared React components
lib/              Business logic, API utilities, schemas, validation
  __tests__/      Test suites (388 tests across 23 files)
scripts/          Standalone Node.js scripts
  migrate.mjs     Run SQL migrations
  seed-admin.mjs  Create the first admin user
supabase/
  migrations/     SQL migration files (001-014)
docs/             Architecture, PRD, user flows, API spec, audit
```

## Scripts

| Command              | Description                        |
| -------------------- | ---------------------------------- |
| `npm run dev`        | Start dev server                   |
| `npm run build`      | Production build                   |
| `npm run lint`       | ESLint                             |
| `npm run typecheck`  | TypeScript check                   |
| `npm test`           | Run all tests (Vitest)             |
| `npm run test:watch` | Watch mode                        |
| `npm run test:coverage` | Coverage report                |
| `npm run migrate`    | Apply pending SQL migrations       |
| `npm run seed:admin` | Create/update admin user from .env |
| `npm run register-ipn` | Register IPN URL with Pesapal   |

## Environment Variables

See `.env.example` for all required variables. Key ones:

| Variable                     | Purpose                        |
| ---------------------------- | ------------------------------ |
| `NEXT_PUBLIC_SUPABASE_URL`   | Supabase project URL           |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public anon key             |
| `SUPABASE_SERVICE_ROLE_KEY`  | Server-side admin key          |
| `DATABASE_URL`               | Direct DB connection (migrations) |
| `NEXT_PUBLIC_SITE_URL`       | Canonical production URL       |
| `NEXT_PUBLIC_SUPPORT_PHONE`  | Support phone (+256768345905)  |
| `NEXT_PUBLIC_SUPPORT_WHATSAPP` | WhatsApp contact link        |
| `NEXT_PUBLIC_COMMISSION_RATE` | Platform commission (0.1 = 10%) |
| `NEXT_PUBLIC_MIN_WITHDRAWAL` | Min withdrawal amount (50000 UGX) |
| `PESAPAL_CONSUMER_KEY`       | Pesapal API key                |
| `PESAPAL_CONSUMER_SECRET`    | Pesapal API secret             |
| `PESAPAL_IPN_ID`             | Pesapal IPN ID                 |
| `PESAPAL_BASE_URL`           | Pesapal API base URL           |
| `WEBHOOK_SECRET`             | Pesapal IPN callback secret    |
| `SMTP_HOST` / `SMTP_PORT` / `SMTP_USER` / `SMTP_PASS` / `SMTP_FROM` | Transactional email |
| `CRON_SECRET`                | Vercel Cron auth secret        |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | Admin seed credentials     |
| `SENTRY_DSN` / `SENTRY_ORG` / `SENTRY_PROJECT` | Sentry error monitoring |

## Key Flows

1. **Creator sign-up** — Auth → users table record with role=creator
2. **Product upload** — File validated by magic bytes for type/size/signature, stored in Supabase Storage
3. **Checkout** — Pesapal iframe → IPN callback → verify server-side → unlock download
4. **Download** — Token-based expiring links (signed Supabase Storage URLs, 60s validity)
5. **Withdrawal** — Creator requests → admin approves → manual payout (min 50,000 UGX)
6. **Refund** — Buyer requests via in-app form or email → admin approves with Pesapal reversal
7. **Email** — Events enqueued via DB triggers → processed by Vercel Cron or manual API call
8. **Analytics** — Events stored via RLS-permissive insert policy; @vercel/analytics for traffic

See `docs/user-flows.md` for detailed flow diagrams.

## Tests

```bash
npm test                     # Run all 388 tests
npx vitest run --reporter=verbose  # Verbose output
npm run test:coverage        # Coverage report
```

Test suites cover 23 files: API integration, migrations, RPC calls, schemas, validation, refund logic, email, Pesapal, database security, storefront, constants, utils, auth routes, admin routes, payment routes, cron emails, email processor, supabase client, pesapal extended, api extended, and app API routes.

## Deployment

1. Create Supabase project, copy URL and keys to `.env`
2. Run `npm run migrate` to apply all 14 migrations
3. Run `npm run seed:admin` to create the admin user
4. Deploy to Vercel with `vercel --prod`
5. Configure Sentry DSN in production env vars
6. Set up Vercel Cron for `/api/cron/process-emails` (see `vercel.json`)
7. Configure `@vercel/analytics` in root layout (already integrated)

Refer to `docs/production-readiness-report.md` for the full production checklist.
