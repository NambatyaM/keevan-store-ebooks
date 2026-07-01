# Keevan Store

Creator-commerce platform for East African authors and digital creators. Creators own individual storefronts and share product links directly with their audiences. Built with Next.js 15, Supabase, Resend, and Pesapal. Serves Uganda, Kenya, Tanzania, and Rwanda.

## Quick Start

```bash
cp .env.example .env
# Fill in Supabase URL, keys, Resend API key, and Pesapal credentials

npm install
npm run migrate
npm run seed:admin
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Admin Access

After seeding (uses `ADMIN_EMAIL` / `ADMIN_PASSWORD` from `.env`), sign in at `/login` and access `/admin/*` for platform management.

## Architecture

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS |
| Backend | Supabase (PostgreSQL, Auth, Storage with signed URLs, RLS) |
| Payments | Pesapal (UGX/KES/TZS/RWF/USD; mobile money, cards, bank transfer; three-way server-side verification) |
| Email | Resend with DB-enqueued queue processed by Vercel Cron |
| Hosting | Vercel (app) + Supabase (data/storage) |
| Monitoring | Sentry (client + server + edge), @vercel/analytics |
| Validation | Zod (all POST/PATCH endpoints) |
| Testing | Vitest (388 tests across 23 files) |

See `docs/system-architecture.md` for details.

## Project Structure

```
app/              Next.js App Router pages and API routes
  admin/          Admin dashboard (stats, orders, creators, buyers, withdrawals, refunds, audit log, emails, reports, sales, settings)
  api/            Route handlers (auth, stores, products, payments, downloads, withdrawals, refunds, orders, emails, analytics, admin, discounts, reviews, cart, upload, webhooks)
  buyer/          Buyer dashboard (purchases, downloads)
  creator/        Creator dashboard (products, earnings, analytics, withdrawals, orders, settings)
  store/          Public storefront at /store/[handle]
  checkout/       Pesapal checkout flow
  download/       Payment-verified download delivery
components/       Shared React components
lib/              Business logic, API utilities, Zod schemas, constants, file validation
  __tests__/      23 test suites (388 tests)
scripts/          Standalone scripts (migrate, seed admin, register IPN, migrate covers)
supabase/
  migrations/     SQL migrations (001-019)
docs/             Architecture, PRD, vision, user flows, API spec, audit, production readiness
k6/               Load testing scripts (auth, payments, downloads, order lookup)
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server |
| `npm run build` | Production build |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript check |
| `npm test` | Run all tests (Vitest) |
| `npm run test:watch` | Watch mode |
| `npm run test:coverage` | Coverage report |
| `npm run migrate` | Apply pending SQL migrations (001-019) |
| `npm run seed:admin` | Create/update admin user from .env |
| `npm run register-ipn` | Register Pesapal IPN URL |

## Environment Variables

See `.env.example` for all required variables.

| Variable | Purpose |
|----------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-side admin key |
| `DATABASE_URL` | Direct DB connection (migrations) |
| `NEXT_PUBLIC_SITE_URL` | Canonical production URL |
| `NEXT_PUBLIC_SUPPORT_PHONE` | Support phone |
| `NEXT_PUBLIC_SUPPORT_WHATSAPP` | WhatsApp contact link |
| `NEXT_PUBLIC_COMMISSION_RATE` | Platform commission (default: 0.1 = 10%) |
| `NEXT_PUBLIC_MIN_WITHDRAWAL` | Default min withdrawal (default: 50000 UGX) |
| `NEXT_PUBLIC_MIN_WITHDRAWAL_UGX/KES/TZS/RWF/USD` | Per-currency withdrawal minimums |
| `PESAPAL_CONSUMER_KEY` | Pesapal API key |
| `PESAPAL_CONSUMER_SECRET` | Pesapal API secret |
| `PESAPAL_IPN_ID` | Pesapal IPN ID |
| `PESAPAL_BASE_URL` | Pesapal API base URL |
| `WEBHOOK_SECRET` | Pesapal IPN callback secret |
| `RESEND_API_KEY` | Resend API key for transactional emails |
| `SMTP_FROM` | From address for emails |
| `CRON_SECRET` | Vercel Cron auth secret |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | Admin seed credentials |
| `SENTRY_DSN` | Sentry error monitoring DSN |

## Key Flows

1. **Creator sign-up** — Auth -> users table record with `role=creator`
2. **Store creation** — Creator picks handle and currency; currency locks after first paid order
3. **Product upload** — File validated by magic bytes, MIME, extension (no demo/sample files); stored in Supabase Storage
4. **Checkout** — Pesapal iframe -> IPN callback -> server-side three-way verification -> order created -> download unlocked
5. **Download** — Token-based (256-bit UUID, 7-day expiry) with signed Supabase Storage URL (60s validity)
6. **Withdrawal** — Creator requests (min per-currency threshold) -> admin approves -> manual payout -> marked paid
7. **Refund** — Customer looks up order by email -> submits request -> admin approves with Pesapal reversal -> creator earnings deducted atomically -> download token invalidated
8. **Email** — Events enqueued via DB triggers on order, withdrawal, refund events -> processed by Vercel Cron (daily 6 AM) or manual API call
9. **Analytics** — Views/downloads tracked via RLS-permissive events insert; @vercel/analytics for page views

See `docs/user-flows.md` for detailed flow diagrams.

## Tests

```bash
npm test                     # Run all 388 tests
npx vitest run --reporter=verbose  # Verbose output
npm run test:coverage        # Coverage report
```

Test suites cover: API integration, migrations, RPCs, Zod schemas, file validation, refund logic, email, Pesapal, database security, storefront, constants, utils, auth routes, admin routes, payment routes, cron emails, email processor, and Supabase clients.

## Deployment

1. Create Supabase project, copy URL and keys to `.env`
2. Run `npm run migrate` to apply all 19 migrations
3. Run `npm run seed:admin` to create the admin user
4. Run `npm run register-ipn` to register the Pesapal IPN callback URL
5. Set `RESEND_API_KEY` and `SMTP_FROM` for transactional emails
6. Deploy to Vercel with `vercel --prod`
7. Configure `CRON_SECRET` and set up Vercel Cron for `/api/cron/process-emails` (see `vercel.json`)
8. Configure Sentry DSN in production env vars if error monitoring is desired

Refer to `docs/production-readiness-report.md` for the full production checklist.
