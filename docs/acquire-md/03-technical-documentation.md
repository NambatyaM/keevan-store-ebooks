# KEEVAN STORE
## Technical Documentation
### Architecture, Stack, Infrastructure, and Security

| Field | Detail |
|---|---|
| Document | 03 of 10: Technical Documentation |
| Platform | keevanstore.in |
| Stack | Next.js 15 | TypeScript | Supabase | Pesapal | Resend | Vercel |
| Tests | 609 tests across 27 suites |
| Date | July 9, 2026 |

---

### Technology Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 15 with App Router, React 19, TypeScript strict mode, Tailwind CSS, Lucide React icons, Recharts for analytics |
| Backend | Next.js API Routes for serverless endpoints, Server Actions for form handling, Middleware for authentication and route protection |
| Database | Supabase PostgreSQL with Row Level Security, 30 migration files documenting schema evolution, database functions and triggers for automated workflows |
| Authentication | Supabase Auth with email and password, session management with refresh tokens, role based access control with three roles (creator, buyer, admin) |
| Payments | Pesapal API v3 integration, SubmitOrderRequest for order creation, IPN webhook endpoint for payment confirmation, transaction status verification with timeout handling |
| Email | Resend API and SMTP for transactional emails, cron based email queue processing, templates for order confirmation, download links, and admin notifications |
| Storage | Supabase Storage for product files (PDF, EPUB, MOBI, ZIP) and cover images, secure access policies preventing unauthorized downloads |
| Monitoring | Sentry for error tracking and performance monitoring in production, alerts for critical errors and exceptions |
| Hosting | Vercel serverless architecture, automatic deployments from GitHub, environment specific configuration for development and production |
| Testing | Vitest testing framework with jsdom, 609 tests across 27 test suites covering auth, payments, API, security, user workflows, and edge cases |
| CI/CD | GitHub Actions workflow configured for continuous integration |

---

### Application Routes

#### Public Pages (14 routes)
/, /about, /features, /pricing, /faq, /contact, /privacy, /terms, /refund-policy, /request-refund, /store/[handle], /product/[slug], /checkout/[slug], /order/success, /order/lookup, /download/[slug]

#### Authentication (8 routes)
/login, /logout, /signup (creator), /signup-buyer, /forgot-password, /update-password

#### Creator Dashboard (11 routes)
/creator/dashboard, /creator/products, /creator/products/new, /creator/products/[id]/edit, /creator/analytics, /creator/earnings, /creator/withdrawals, /creator/orders, /creator/discounts, /creator/settings, /creator/first-sale

#### Admin Panel (14 routes)
/admin/dashboard, /admin/creators, /admin/buyers, /admin/products, /admin/sales, /admin/orders, /admin/orders/[id], /admin/refunds, /admin/withdrawals, /admin/reports, /admin/emails, /admin/audit-log, /admin/settings, /admin/stores

#### Buyer Dashboard (2 routes)
/buyer/dashboard, /buyer/purchases

#### API Routes (22 endpoint groups)
- Auth: register, login, logout, me, check-handle, reset-password, update-password
- Products: CRUD with listing, detail, create, update, delete
- Orders: create, lookup, status
- Payments: create, confirm, verify
- Pesapal: IPN webhook, IPN registration
- Stores: CRUD with detail
- Discounts: CRUD with active listing
- Withdrawals: request
- Refunds: request, admin approve/reject
- Upload: file upload handler
- Downloads: token based file delivery
- Reviews: submit and list
- Analytics: events tracking, summary
- Cron: email queue processing
- Admin: stats, users, stores, orders, refunds, withdrawals, products, audit, emails
- Webhooks: Pesapal webhook

---

### Database Architecture

The database consists of 30 PostgreSQL migration files that document the complete evolution of the data model from initial schema to production state.

#### Core Tables
- **users** -- User accounts with role (creator, admin), linked to auth.users
- **creators** -- Creator profiles with display name, bio, phone, payout info (MTN, Airtel, bank), notification preferences, available balance and total earnings
- **stores** -- Creator stores with slug, name, description, tagline, category, social links, currency, status (active, suspended)
- **products** -- Digital products with title, description, price, currency, status (draft, published, disabled), file path, file size, file mime, cover image
- **orders** -- Purchase orders with buyer email and name, amount, platform fee, creator earnings, status (pending, paid, failed, refunded)
- **payments** -- Payment records with provider (Pesapal), merchant reference, transaction status
- **discounts** -- Percentage discounts with date ranges, usage limits, and per product association
- **withdrawals** -- Creator payout requests with amount, method, account details, status tracking
- **refunds** -- Refund requests with reason, status, and admin approval workflow
- **reviews** -- Product reviews with rating and comment
- **email_queue** -- Queued transactional emails with type, recipient, subject, status, and error tracking
- **notifications** -- In app notifications for creators and admins
- **audit_logs** -- Comprehensive audit trail for compliance and oversight
- **rate_limits** -- Database backed rate limiting for authentication and payment endpoints

#### Key Migration Milestones
| Migration | Description |
|---|---|
| 001 | Initial schema with users, creators, stores, products, orders, payments |
| 002 | Payment and withdrawal guards (constraints, validations) |
| 003 | Rate limiting tables |
| 004 | Schema audit fixes |
| 005 | Payment processing fixes |
| 006 | Withdrawal and earnings fixes |
| 007 | Admin audit fixes |
| 008 | Production security fixes |
| 009 | Refund system |
| 010 | Email queue system |
| 011 | Production security hardening |
| 012 | Pesapal integration finalization |
| 013 | Storage buckets configuration |
| 014 | Buyer features (purchases, downloads) |
| 015 | Production bug fixes |
| 016 | Multi currency support (UGX, KES, TZS, RWF, USD) |
| 017 | Payment finalization fixes |
| 018 | Review system and storage policies |
| 019 | Production bug fixes |
| 020 | Currency constraint and production fixes |
| 021 | Product slug uniqueness |
| 022 | Email queue duplicate trigger fix |
| 023 | Creator store fields (payout methods, notifications, store category) |
| 024 | Buyer purchase population |
| 025 | Orphan RPC cleanup |
| 026 | Pesapal update fix |
| 027 | Rate limit expires at fix |
| 028 | Inline set config in finalize Pesapal |
| 029 | Email trigger fixes and creator order email |
| 030 | Auth uid fix for service role RPC |

---

### Security Architecture

Security is implemented at multiple layers throughout the platform:

- **Row Level Security**: Every database table has RLS policies enforcing data isolation. Creators can only access their own products and orders. Admins have cross user access. Policies are enforced at the database level.

- **CSRF Protection**: Origin and Referer header validation on all sensitive API routes prevents cross site request forgery attacks.

- **Rate Limiting**: Database backed rate limiting on authentication and payment endpoints prevents abuse and brute force attacks. Configurable thresholds per endpoint.

- **File Validation**: Client side and server side validation for file types (PDF, EPUB, MOBI, ZIP), file sizes (max 4 MB for products, 2 MB for covers), and MIME type checking.

- **Role Based Access**: Three distinct roles (creator, buyer, admin) with granular permissions enforced at both API middleware and database levels.

- **Middleware Protection**: Next.js middleware checks authentication and role based access for protected routes before they render.

---

### Payment Integration

The Pesapal payment integration handles the complete payment lifecycle:

- Order creation via SubmitOrderRequest API with product details and pricing
- IPN (Instant Payment Notification) webhook endpoint for real time payment confirmation
- Transaction status verification with retry logic for network issues
- Timeout handling with maxDuration set to 300 seconds on payment routes
- Error recovery for failed payments, network timeouts, and partial payment scenarios
- Zero price edge case prevention to block free order creation attempts
- Support for multiple currencies (UGX, KES)

#### Payment Flow
1. Buyer proceeds to checkout
2. System creates a Pesapal order via SubmitOrderRequest
3. Buyer is redirected to Pesapal payment page
4. Buyer completes payment (mobile money, card, bank transfer)
5. Pesapal sends IPN callback to /api/pesapal/ipn
6. System verifies transaction status
7. Order status updated to paid
8. Download link sent to buyer by email
9. Admin notification created

---

### Testing Infrastructure

The platform includes 609 automated tests across 27 test suites:

| Area | Coverage |
|---|---|
| Authentication | Login, registration, session management, role verification, access control |
| Payment Processing | Order creation, IPN handling, transaction verification, error recovery |
| API Security | CSRF protection, rate limiting, authorization checks, input validation |
| User Workflows | Product upload, store management, discount creation, withdrawal requests |
| Edge Cases | Zero price handling, missing fields, invalid tokens, expired sessions |
| Schema Validation | Zod schema validation for all API inputs |
| Email | Email queue processing, template rendering |
| File Validation | File type, size, and MIME type validation |

---

### Load Testing

The platform includes k6 load testing scripts for:
- Authentication rate limiting
- Download URL performance
- Order lookup rate limiting
- Payment creation performance

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
