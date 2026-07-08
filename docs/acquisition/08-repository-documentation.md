# Repository Documentation — Keevan Store

**Document Version:** 1.0  
**Date:** July 2026

---

## 1. Comprehensive README

```markdown
# Keevan Store

**East Africa's digital creator commerce platform.**

Keevan Store enables creators in Uganda, Kenya, Tanzania, and Rwanda to sell digital products (e-books, guides, templates, documents) directly to customers through branded storefronts — with local currency support and mobile money payments.

## Features

- **Creator storefronts** — Each creator gets a branded store at `/store/[handle]`
- **Digital product sales** — Sell PDF, EPUB, MOBI, ZIP files
- **Local payments** — Mobile money (MTN, M-Pesa, Airtel Money) and cards via Pesapal
- **Multi-currency** — UGX, KES, TZS, RWF, USD per-store pricing
- **Secure delivery** — Signed download URLs with 60-second TTL
- **Platform management** — Admin dashboard with moderation, withdrawal, and refund workflows
- **Creator analytics** — Sales charts, earnings tracking, order management

## Tech Stack

- **Frontend/Backend:** Next.js 15 (React 19, TypeScript, App Router)
- **Styling:** Tailwind CSS 3
- **Database:** Supabase (PostgreSQL with Row-Level Security)
- **Auth:** Supabase SSR (cookie-based sessions)
- **Payments:** Pesapal API v3
- **Email:** Resend + Nodemailer (SMTP fallback)
- **Hosting:** Vercel (Pro)
- **Monitoring:** Sentry
- **Testing:** Vitest + React Testing Library
- **CI/CD:** GitHub Actions

## Quick Start

### Prerequisites
- Node.js 20+
- npm
- Supabase account (free tier)
- Pesapal developer account
- Resend account or SMTP credentials

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd keevan-store

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env.local
# Edit .env.local with your credentials

# Run database migrations
node scripts/migrate.mjs

# Start development server
npm run dev
```

### Running Tests

```bash
npm test          # Run all tests
npm run typecheck # Run TypeScript type checking
```

### Building for Production

```bash
npm run build     # Build the Next.js application
npm run start     # Start production server
```

## Project Structure

```
keevan-store/
├── app/                    # Next.js App Router (pages + API routes)
│   ├── api/                # Backend API routes (~52 endpoints)
│   ├── creator/            # Creator dashboard pages
│   ├── admin/              # Admin dashboard pages
│   ├── buyer/              # Buyer dashboard pages
│   ├── store/[handle]/     # Public storefront pages
│   └── product/[slug]/     # Public product detail pages
├── components/             # Shared React components
│   └── ui/                 # UI primitives
├── lib/                    # Business logic, utilities, schemas
│   └── __tests__/          # Test files
├── supabase/migrations/    # Database migrations
├── docs/                   # Documentation
├── scripts/                # Utility scripts
├── public/                 # Static assets
├── k6/                     # Load testing scripts
├── middleware.ts           # Auth + role-based routing
└── next.config.mjs         # Next.js configuration
```

## Environment Variables

See `.env.example` for a complete list of required environment variables.

Key variables:
- `NEXT_PUBLIC_SUPABASE_URL` — Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY` — Supabase service role key
- `PESAPAL_CONSUMER_KEY` — Pesapal API consumer key
- `PESAPAL_CONSUMER_SECRET` — Pesapal API consumer secret
- `PESAPAL_IPN_ID` — Pesapal IPN registration ID

## License

Proprietary — All rights reserved.
```

---

## 2. Installation Guide

### 2.1 Prerequisites

| Software | Version | Purpose |
|----------|---------|---------|
| Node.js | 20.x or later | JavaScript runtime |
| npm | 10.x or later | Package manager |
| Git | Latest | Version control |
| Supabase account | Free tier+ | Database, auth, storage |
| Pesapal account | Developer | Payment gateway |
| Resend account | Free tier+ | Email delivery |
| Vercel account | Free tier+ | Deployment (optional for local dev) |

### 2.2 Step-by-Step Installation

```bash
# Step 1: Clone the repository
git clone <repository-url>
cd keevan-store

# Step 2: Install dependencies
npm install

# Step 3: Set up environment variables
cp .env.example .env.local

# Step 4: Configure .env.local
# Edit the file with your Supabase, Pesapal, Resend, and Sentry credentials

# Step 5: Run database migrations
node scripts/migrate.mjs

# Step 6: (Optional) Seed admin account
node scripts/seed-admin.mjs

# Step 7: (Optional) Register Pesapal IPN
# Visit /api/setup/register-ipn in browser (requires admin login)

# Step 8: Start development
npm run dev
# Application will be available at http://localhost:3000
```

---

## 3. Configuration Guide

### 3.1 Environment Configuration

All configuration is managed through environment variables. See `.env.example` for the complete documented list.

**Naming Convention:**
- `NEXT_PUBLIC_*` — Variables exposed to the browser
- `SUPABASE_*` — Supabase-related configuration
- `PESAPAL_*` — Pesapal payment configuration
- `SENTRY_*` — Sentry error monitoring
- `SMTP_*` — Email server configuration
- `RESEND_*` — Resend email API

### 3.2 Platform Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `NEXT_PUBLIC_COMMISSION_RATE` | `0.1` | Platform commission rate (0–1) |
| `NEXT_PUBLIC_MIN_WITHDRAWAL` | `50000` | Default minimum withdrawal amount |
| `NEXT_PUBLIC_MIN_WITHDRAWAL_UGX` | `50000` | UGX minimum withdrawal |
| `NEXT_PUBLIC_MIN_WITHDRAWAL_KES` | `1500` | KES minimum withdrawal |
| `NEXT_PUBLIC_MIN_WITHDRAWAL_TZS` | `30000` | TZS minimum withdrawal |
| `NEXT_PUBLIC_MIN_WITHDRAWAL_RWF` | `20000` | RWF minimum withdrawal |
| `NEXT_PUBLIC_MIN_WITHDRAWAL_USD` | `20` | USD minimum withdrawal |

### 3.3 Brand Configuration

Brand colors are defined in `tailwind.config.ts`:

```typescript
colors: {
  brand: {
    green: '#00854A',
    gold: '#F5A623',
    mist: '#F0FDF4',
    ink: '#18211d',
  }
}
```

---

## 4. Deployment Guide

### 4.1 Vercel Deployment

```bash
# Prerequisites
# 1. Push code to GitHub
# 2. Connect repository to Vercel
# 3. Configure environment variables in Vercel dashboard

# Deploy (automatic on push to main branch)
git push origin main
```

### 4.2 Vercel Configuration

The project includes `vercel.json` with:
- Cron job: `0 6 * * *` — Processes email queue daily at 06:00 UTC
- Framework: Next.js (auto-detected)

### 4.3 Environment Variables on Vercel

All environment variables from `.env.local` must be added to the Vercel project:
1. Go to Vercel Dashboard → Project → Settings → Environment Variables
2. Add all variables (mark sensitive ones as "secret")
3. Deploy

### 4.4 CI/CD Pipeline

GitHub Actions workflow (`.github/workflows/ci.yml`):
- Triggers: Push to any branch, pull requests
- Runs: Ubuntu latest, Node 20
- Steps: `npm ci` → `npm test` → `npm run build -- --no-lint`

---

## 5. Development Workflow

### 5.1 Branch Strategy

```
main          → Production code (deployed to Vercel)
feature/*     → New features (branched from main, merged via PR)
fix/*         → Bug fixes (branched from main, merged via PR)
```

### 5.2 Coding Standards

- **TypeScript:** Strict mode enabled; avoid `any` types
- **Components:** Default to Server Components; use `"use client"` only when interactivity needed
- **API Routes:** Always wrap with `withErrorHandling`
- **Validation:** Use Zod schemas for all input validation
- **Database:** Never expose service role key to the client; use RLS
- **Styling:** Use Tailwind utility classes; avoid custom CSS when possible
- **Testing:** Write tests for all new features; maintain existing test coverage

### 5.3 Testing Workflow

```bash
# Run tests during development (watch mode)
npm test -- --watch

# Run full test suite
npm test

# Run specific test file
npm test -- lib/__tests__/schemas.test.ts

# Run TypeScript type checking
npm run typecheck
```

---

## 6. Troubleshooting Guide

| Problem | Likely Cause | Solution |
|---------|-------------|----------|
| `Supabase client not initialized` | Missing environment variables | Check `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` |
| `Authentication required` | Missing or expired session | Log out and log back in |
| `Validation failed` (API 422) | Input doesn't match Zod schema | Check request payload against schema in `lib/schemas.ts` |
| `Network error during upload` | File too large or connection issue | Files must be ≤ 4 MB (products) or ≤ 2 MB (covers) |
| `Payment not completed` | Pesapal transaction pending/failed | Wait for IPN callback or verify manually |
| `Download link expired` | More than 60 seconds since generation | Regenerate download by going through order success page again |
| `Rate limit exceeded` | Too many requests | Wait 60 seconds and retry |
| `Cross-site request forbidden` | CSRF check failed | Check that request origin matches site URL |
| Tests fail with `auth.getUser` errors | Missing Supabase mock | See test setup in `vitest.setup.ts` |

---

## 7. Frequently Asked Questions

**Q: Can I add more file types?**
A: Yes — modify `lib/constants.ts` (allowed MIME types) and `lib/file-validation.ts` (magic bytes).

**Q: How do I change the platform commission rate?**
A: Set the `NEXT_PUBLIC_COMMISSION_RATE` environment variable (e.g., `0.15` for 15%).

**Q: How do I add a new currency?**
A: Add to the `currencies` array in `lib/constants.ts`, add phone regex, add withdrawal minimum, add to Zod schema enums, and update the DB constraint.

**Q: How do I test Pesapal payments locally?**
A: Pesapal requires a publicly accessible callback URL. Use ngrok to expose your local server, or deploy a preview on Vercel.

**Q: How do I reset the database?**
A: Run `node scripts/migrate.mjs` to reapply all migrations. Warning: this will delete all data.

**Q: Where are log files stored?**
A: The application logs to stdout/stderr (captured by Vercel). Sentry captures error events.

---

## 8. Contribution Guidelines

1. **Fork the repository** and create a feature branch from `main`
2. **Install dependencies** with `npm install`
3. **Make changes** following the coding standards
4. **Write tests** for any new functionality
5. **Run `npm test`** and ensure all tests pass
6. **Run `npm run typecheck`** and ensure no TypeScript errors
7. **Commit changes** with clear, descriptive commit messages
8. **Push to your fork** and open a pull request

### Commit Message Format

```
type(scope): description

Types: feat, fix, chore, docs, test, refactor, security
Examples:
  feat(api): add product discount endpoint
  fix(auth): handle expired session cookie
  docs(readme): update installation instructions
```

---

*This document is based on the actual Keevan Store codebase as of July 2026.*
