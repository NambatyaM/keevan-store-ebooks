# KEEVAN STORE
## Repository Documentation
### Codebase Structure, Architecture, and Development Setup

| Field | Detail |
|---|---|
| Document | 08 of 10: Repository Documentation |
| Platform | keevanstore.in |
| Repository | GitHub (private) |
| Date | July 9, 2026 |

---

### Codebase Structure

The Keevan Store codebase follows Next.js 15 App Router conventions with clear separation of concerns:

```
keevan-store/
  app/                    Application routes (33 route groups)
    about/                About page
    admin/                Admin panel (14 sub routes)
    api/                  API routes (22 endpoint groups, ~60 route files)
    buyer/                Buyer dashboard
    checkout/             Checkout flow
    contact/              Contact page
    creator/              Creator dashboard (11 sub routes)
    download/             File download pages
    faq/                  FAQ page
    features/             Features page
    forgot-password/      Password reset
    login/                Login page
    logout/               Logout action
    order/                Order success and lookup
    pricing/              Pricing page
    privacy/              Privacy policy
    product/              Product detail pages
    refund-policy/        Refund policy page
    request-refund/       Refund request page
    signup/               Creator signup
    signup-buyer/         Buyer signup
    store/                Creator storefront pages
    terms/                Terms of service
    update-password/      Password update
    layout.tsx            Root layout
    page.tsx              Homepage
    globals.css           Global styles
    error.tsx             Error boundary
    not-found.tsx         404 page
    loading.tsx           Loading state
    robots.ts             Robots.txt generation
    sitemap.ts            Sitemap generation

  components/             Reusable React components
    ui/                   UI primitives (buttons, inputs, cards, modals, etc.)
    layout/               Layout components (navigation, footer, headers)
    forms/                Form components and validation
    dashboard/            Dashboard specific components
    payments/             Payment related components
    products/             Product related components
    stores/               Store related components

  lib/                    Shared utility code
    api.ts                API helpers (withErrorHandling, requireUser, json, etc.)
    storefront.ts         Storefront data fetching
    supabase.ts           Supabase client initialization
    schemas.ts            Zod validation schemas
    constants.ts          Platform constants
    types.ts              TypeScript type definitions
    security.ts           Security utilities
    email.ts              Email helpers
    rate-limit.ts         Rate limiting implementation
    migrations.ts         Migration helpers
    __tests__/            Test files (26 test files)

  supabase/
    migrations/           30 SQL migration files
    seed.sql              Seed data for development

  scripts/                Utility scripts
    migrate.mjs           Database migration runner
    migrate-covers.mjs    Cover image migration
    seed-admin.mjs        Admin user seeder
    register-ipn.ts       Pesapal IPN registration

  docs/                   Documentation
    README.md             Project overview and quick start
    vision.md             Product vision
    prd.md                Product requirements
    system-architecture.md
    database-architecture.md
    api-specification.md
    user-flows.md
    production-readiness-report.md
    business-plan-and-marketing.md
    launch-and-growth.md
    seo-geo-aeo-strategy.md
    backup-restore.md
    audit.md
    acquire-md/           This acquisition document set (10 files)
    acquire/              Previous generation acquisition PDFs (10 files)

  k6/                     Load testing scripts
  public/                 Static assets (favicon, logo, og-image, hero, manifest)

  .github/workflows/      CI pipeline configuration
```

---

### Key Architecture Decisions

- **Serverless first architecture**: All API routes deploy as Vercel Serverless Functions for automatic scaling. No dedicated servers required. No infrastructure management needed.

- **TypeScript strict mode throughout**: Enforces type safety across the entire 60,000+ line codebase, reducing production errors and improving developer experience.

- **Row Level Security at the database level**: Security is enforced closest to the data, preventing unauthorized access even at the database layer. Every table has specific RLS policies for each operation.

- **Modular component architecture**: Reusable UI components with consistent patterns for maintainability. Components are organized by feature and function.

- **Database backed rate limiting**: Prevents abuse without additional infrastructure dependencies. Rate limits are persisted in the database and configurable per endpoint.

- **Consistent error handling pattern**: All API routes use a withErrorHandling wrapper for predictable error responses and consistent logging.

- **Zod schema validation**: All API inputs are validated using Zod schemas before processing, ensuring data integrity and type safety at the API boundary.

- **Middleware based route protection**: Next.js middleware handles authentication and role based access control for protected routes before page components render.

---

### Key Dependencies

| Package | Version | Purpose |
|---|---|---|
| next | ^15.0.0 | React framework with App Router |
| react | ^19.0.0 | UI library |
| @supabase/supabase-js | ^2.45.4 | Supabase database and auth client |
| @supabase/ssr | ^0.12.0 | Supabase server side rendering |
| @sentry/nextjs | ^10.61.0 | Error tracking and monitoring |
| resend | ^6.16.0 | Transactional email service |
| lucide-react | ^0.468.0 | UI icons |
| recharts | ^2.13.3 | Charts and analytics visualizations |
| zod | ^3.23.8 | Schema validation |
| nodemailer | ^9.0.1 | Email fallback (SMTP) |
| pg | ^8.22.0 | PostgreSQL direct connection |
| typescript | ^5.7.2 | Type checking |
| tailwindcss | ^3.4.16 | Utility CSS framework |
| vitest | ^4.1.9 | Testing framework |

---

### Environment Variables

| Variable | Description |
|---|---|
| NEXT_PUBLIC_SUPABASE_URL | Supabase project URL |
| NEXT_PUBLIC_SUPABASE_ANON_KEY | Supabase anonymous key (public) |
| SUPABASE_SERVICE_ROLE_KEY | Supabase service role key (admin) |
| PESAPAL_CONSUMER_KEY | Pesapal API consumer key |
| PESAPAL_CONSUMER_SECRET | Pesapal API consumer secret |
| RESEND_API_KEY | Resend API key for transactional emails |
| SENTRY_DSN | Sentry DSN for error tracking |
| SMTP_HOST / SMTP_PORT / SMTP_USER / SMTP_PASS | SMTP email fallback |

---

### Development Commands

| Command | Description |
|---|---|
| npm run dev | Start development server |
| npm run build | Build for production |
| npm run start | Start production server |
| npm test | Run test suite (609 tests) |
| npm run test:watch | Run tests in watch mode |
| npm run test:coverage | Run tests with coverage report |
| npm run lint | Run ESLint |
| npm run typecheck | Run TypeScript type checking |
| npx supabase db push | Apply database migrations |
| npx supabase db diff | Show pending migration changes |

---

### Contact

| | |
|---|---|
| Platform | Keevan Store |
| Website | https://keevanstore.in |
| Email | nkevinmegan@gmail.com |
| Location | Uganda, East Africa |

---

CONFIDENTIAL | Keevan Store Acquisition Documentation
