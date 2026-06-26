# Keevan Store

Creator-commerce platform for East African authors and digital creators. Creators own individual stores and share product links directly with their audiences. Built with Next.js, Supabase, and Pesapal.

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

After seeding, sign in at `/auth/login`:

| Field    | Value                     |
| -------- | ------------------------- |
| Email    | nkevinmegan@gmail.com     |
| Password | Kevin#2004Keeva#44        |

The admin can access `/admin/*` routes for refund management, withdrawal approvals, stats, and audit logs.

## Architecture

| Layer    | Technology                         |
| -------- | ---------------------------------- |
| Frontend | Next.js 15 (App Router), React 19, Tailwind CSS |
| Backend  | Supabase (PostgreSQL, Auth, Storage, RLS) |
| Payments | Pesapal (server-side verification) |
| Email    | SMTP + Supabase Auth SMTP          |
| Hosting  | Vercel (app) + Supabase (data)     |
| Monitoring | Sentry (error tracking)          |

See `docs/system-architecture.md` for details.

## Project Structure

```
app/              Next.js App Router pages and API routes
  admin/          Admin dashboard (refunds, withdrawals, stats, audit log)
  api/            API route handlers (orders, payments, refunds, emails)
  auth/           Login page
  creator/        Creator dashboard (store, products, analytics)
  store/          Public storefront
components/       Shared React components
lib/              Business logic, API utilities, schemas, validation
  __tests__/      Test suites (388 tests across 13 files)
scripts/          Standalone Node.js scripts
  migrate.mjs     Run SQL migrations
  seed-admin.mjs  Create the first admin user
supabase/
  migrations/     SQL migration files (001-011)
docs/             Architecture, PRD, user flows, API spec, audit
```

## Scripts

| Command              | Description                        |
| -------------------- | ---------------------------------- |
| `npm run dev`        | Start dev server                   |
| `npm run build`      | Production build                   |
| `npm run lint`       | ESLint                             |
| `npm run typecheck`  | TypeScript check                   |
| `npm test`           | Run all tests (vitest)             |
| `npm run test:watch` | Watch mode                        |
| `npm run migrate`    | Apply pending SQL migrations       |
| `npm run seed:admin` | Create/update admin user from .env |

## Environment Variables

See `.env.example` for all required variables. Key ones:

| Variable                     | Purpose                        |
| ---------------------------- | ------------------------------ |
| `NEXT_PUBLIC_SUPABASE_URL`   | Supabase project URL           |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public anon key             |
| `SUPABASE_SERVICE_ROLE_KEY`  | Server-side admin key          |
| `DATABASE_URL`               | Direct DB connection (migrations) |
| `PESAPAL_CONSUMER_KEY`       | Pesapal API key                |
| `PESAPAL_CONSUMER_SECRET`    | Pesapal API secret             |
| `ADMIN_EMAIL`                | Initial admin email (seed)     |
| `ADMIN_PASSWORD`             | Initial admin password (seed)  |
| `SENTRY_DSN`                 | Sentry error tracking DSN      |

## Key Flows

1. **Creator sign-up** — Auth → users table record with role=creator
2. **Product upload** — File validated for type/size/signature, stored in Supabase Storage
3. **Checkout** — Pesapal iframe → IPN callback → verify server-side → unlock download
4. **Download** — Token-based expiring links
5. **Withdrawal** — Creator requests → admin approves → manual payout
6. **Refund** — Buyer requests via email → admin approves with Pesapal reversal
7. **Email** — Events enqueued via DB triggers → processed by cron or manual API call
8. **Analytics** — Events stored via RLS-permissive insert policy

See `docs/user-flows.md` for detailed flow diagrams.

## Tests

```bash
npm test                     # Run all 388 tests
npx vitest run --reporter=verbose  # Verbose output
npm run test:coverage        # Coverage report
```

Test suites cover: API integration (27), migrations (40), RPC calls (6), schemas (62), validation (51), refund logic (36), email (16), Pesapal (19), database security (87), storefront (6), constants (22), utils (7), and app API routes (16).

## Deployment

1. Create Supabase project, copy URL and keys to `.env`
2. Run `npm run migrate` to apply schema
3. Run `npm run seed:admin` to create the admin user
4. Deploy to Vercel with `vercel --prod`
5. Configure Sentry DSN in production env vars
6. Set up Vercel Cron for `/api/emails/process` (see `vercel.json`)

Refer to `docs/production-readiness-report.md` for the full production checklist.
