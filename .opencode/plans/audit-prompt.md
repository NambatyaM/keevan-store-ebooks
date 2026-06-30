# Keevan Store — Full Production Audit & Fix Prompt

## IMPORTANT CONTEXT

- **.env keys are configured in Vercel Environment Variables** (not in .env.local for production secrets like SUPABASE_SERVICE_ROLE_KEY, PESAPAL_CONSUMER_KEY, PESAPAL_CONSUMER_SECRET, PESAPAL_IPN_ID, WEBHOOK_SECRET, CRON_SECRET, SMTP_HOST/PASS, SENTRY_AUTH_TOKEN). Treat the local `.env.local` as having placeholder/development values only.
- **Database**: Supabase PostgreSQL with 18 migration files (supabase/migrations/001 through 018)
- **Deployment**: Vercel with a cron job at `/api/cron/process-emails` running daily at 6 AM
- **Payment Gateway**: Pesapal (East African payment gateway)
- **File Storage**: Supabase Storage (buckets created in migration 013)
- **Auth**: Supabase Auth with magic link and email/password
- **Email**: Nodemailer via SMTP (Resend) transactional emails
- **Error Monitoring**: Sentry (client + server + edge configs)
- **Analytics**: Vercel Analytics + Custom analytics events tracking

---

## SCOPE: Audit EVERY feature systematically

Below is the COMPLETE feature inventory. For EACH feature, you MUST:
1. **Load the page/component** and verify it renders without errors
2. **Test every interactive element** (buttons, forms, links, toggles, modals)
3. **Test every API endpoint** it depends on (check status codes, response shapes, error handling)
4. **Test every workflow end-to-end** (create user → create product → checkout → payment → download)
5. **Test error states** (network failure, invalid input, expired sessions, missing data)
6. **Test edge cases** (empty states, long text, special characters, rapid clicks)
7. **Fix ALL issues found** — no matter how minor — with production-ready code
8. **Verify the fix** by re-testing the feature

---

## COMPLETE FEATURE INVENTORY

### A. PUBLIC / MARKETING PAGES

| # | Route | File(s) | Key Features to Test |
|---|-------|---------|---------------------|
| 1 | `/` (Homepage) | `app/page.tsx` | Hero section, CTA buttons (2), feature cards (8), stats (3), how-it-works steps (4), FAQ accordion (8 items), footer links, responsive layout, JSON-LD structured data rendering |
| 2 | `/features` | `app/features/page.tsx` | 12 feature cards with icons, CTA buttons, responsive grid |
| 3 | `/pricing` | `app/pricing/page.tsx` | Commission display, comparison table vs competitors, minimum withdrawal per currency, FAQ, JSON-LD schemas |
| 4 | `/faq` | `app/faq/page.tsx`, `app/faq/faq-content.tsx` | 20 FAQ items across 4 sections, search input (filters by question/answer text), WhatsApp/signup CTAs |
| 5 | `/about` | `app/about/page.tsx` | Mission text, CTA buttons, JSON-LD schema |
| 6 | `/contact` | `app/contact/page.tsx` | WhatsApp card, Email card, response time table, support topics list, JSON-LD schema |
| 7 | `/privacy` | `app/privacy/page.tsx` | Privacy policy rendering |
| 8 | `/terms` | `app/terms/page.tsx` | Terms of service rendering |
| 9 | `/refund-policy` | `app/refund-policy/page.tsx` | Refund policy rendering |
| 10 | `/request-refund` | `app/request-refund/page.tsx` | Multi-step refund wizard: Step 1 (email lookup via `/api/orders/lookup`), Step 2 (select order + reason 10-2000 chars), Step 3 (confirmation), posts to `/api/refunds/request` |
| 11 | `/not-found` (404) | `app/not-found.tsx` | Custom 404 with links |
| 12 | `/error` (500) | `app/error.tsx` | Error boundary with retry/home/support buttons, Sentry integration |
| 13 | `/loading` | `app/loading.tsx` | Root loading skeleton |
| 14 | `/global-error` | `app/global-error.tsx` | Global error boundary |

### B. AUTHENTICATION PAGES

| # | Route | File(s) | Key Features to Test |
|---|-------|---------|---------------------|
| 15 | `/signup` | `app/signup/page.tsx`, `app/signup/signup-form.tsx` | Full name, email, password strength meter (8+ chars, upper, lower, number), confirm password, store handle with preview, currency selection with warning, auto-login on success, posts to `/api/auth/register` |
| 16 | `/signup-buyer` | `app/signup-buyer/page.tsx` | Full name, email, password, phone (optional), auto-login, redirect to `/buyer/dashboard`, posts to `/api/auth/register-buyer` |
| 17 | `/login` | `app/login/page.tsx`, `app/login/login-form.tsx` | Email/password, redirect query param support, links to forgot-password and signup, uses `login()` from `@/lib/auth` |
| 18 | `/forgot-password` | `app/forgot-password/page.tsx`, `app/forgot-password/forgot-password-form.tsx` | Email input, sends reset via Supabase `resetPasswordForEmail`, success state "Check your email" |
| 19 | `/update-password` | `app/update-password/page.tsx`, `app/update-password/update-password-form.tsx` | Session check, password match validation, length check (8+), calls `supabase.auth.updateUser`, redirect to login after 3 seconds |

### C. STOREFRONT / CHECKOUT / DOWNLOAD

| # | Route | File(s) | Key Features to Test |
|---|-------|---------|---------------------|
| 20 | `/store/[handle]` | `app/store/[handle]/page.tsx` | Fetches via `getPublishedStoreByHandle`, displays store info + all published products, 404 for inactive/suspended stores, SEO metadata |
| 21 | `/product/[slug]` | `app/product/[slug]/page.tsx`, `app/product/[slug]/loading.tsx`, `app/product/[slug]/error.tsx` | Dynamic OG/Twitter metadata, JSON-LD schemas (Product, BreadcrumbList, FAQPage), cover image, pricing, BuyNowModal, product reviews, 4 trust badges, product-specific FAQ, `TrackView` analytics, draft preview for logged-in creators |
| 22 | `/checkout/[slug]` | `app/checkout/[slug]/page.tsx`, `app/checkout/[slug]/loading.tsx` | Product display, checkout form, buy-now-modal |
| 23 | `/order/success` | `app/order/success/page.tsx` | Order confirmation message, order details display |
| 24 | `/order/lookup` | `app/order/lookup/page.tsx` | Order lookup by email |
| 25 | `/download/[slug]` | `app/download/[slug]/page.tsx`, `app/download/[slug]/loading.tsx` | Payment verification via `/api/payments/verify`, download button with signed token, expired link handling |

### D. BUYER DASHBOARD

| # | Route | File(s) | Key Features to Test |
|---|-------|---------|---------------------|
| 26 | `/buyer/dashboard` | `app/buyer/dashboard/page.tsx` | Fetches purchases via `/api/buyer/purchases`, 401 redirect to login, purchase cards with product/creator/store links, download button per purchase via `/api/buyer/download`, loading skeleton, empty state |

### E. CREATOR DASHBOARD

| # | Route | File(s) | Key Features to Test |
|---|-------|---------|---------------------|
| 27 | `/creator/dashboard` | `app/creator/dashboard/page.tsx` | EAT time greeting, onboarding checklist (5 steps with progress bar), 4 stat cards (earnings, sales, store views, conversion rate), earnings chart (SalesChart component), period selector (7D/30D/90D/All), recent orders table (5), top products (3), quick actions (upload, copy store link, request withdrawal), error state with retry button |
| 28 | `/creator/products` | `app/creator/products/page.tsx` | Grid/list view toggle, search input, status filter (all/published/draft/disabled), sort (newest/oldest/sales/price), active filters display, cover images, format labels, views/sales stats per product, actions: edit, preview, copy link, toggle published/disabled, delete (with confirm requiring typing), pagination |
| 29 | `/creator/products/new` | `app/creator/products/new/page.tsx` | Title (auto-generates slug), slug (editable), description, price, status (draft/published/disabled), file upload (PDF/EPUB/MOBI/ZIP max 4MB via `/api/upload`), cover image upload (JPEG/PNG/WebP max 2MB), form validation, loading states upload, redirect to product list on success |
| 30 | `/creator/products/[id]/edit` | `app/creator/products/[id]/edit/page.tsx` | Pre-populates all fields from `/api/products/[id]`, file/cover replacement upload, title/slug/description/price/status editing, conditional field updates (only sends new file/cover if re-uploaded), redirect on save |
| 31 | `/creator/orders` | `app/creator/orders/page.tsx` | Search (order ID or buyer email), status filter (all/paid/pending/refunded), active filter chips, order table with ID (copyable), product, buyer (email masked), amount, earnings, payment method icon, timeAgo, status badge, detail modal with buyer info + payment details + earnings breakdown, pagination |
| 32 | `/creator/earnings` | `app/creator/earnings/page.tsx` | 4 stat cards (available balance, total earned, total withdrawn, pending withdrawal), "Request Withdrawal" button (disabled if below minimum), earnings breakdown bar chart by month, withdrawal history table, earnings history table with totals, withdrawal request modal (amount, method: MTN/Airtel/Bank, details), form validation (minimum, balance, required), loading/empty states |
| 33 | `/creator/withdrawals` | `app/creator/withdrawals/page.tsx` | (DUPLICATE of withdrawal in earnings?) Request form + history in one page layout |
| 34 | `/creator/analytics` | `app/creator/analytics/page.tsx` | Period selector (7D/30D/90D/All), Export CSV button, 6 metric cards (views, unique visitors, sales, conversion rate, downloads, avg order value), sales & earnings combo chart, sales by product bar chart, payment method pie chart, store views area chart, product performance table (top 10), conversion funnel with dropoff percentages |
| 35 | `/creator/settings` | `app/creator/settings/page.tsx` | 5 tabs (store/account/payout/security/notifications). **Store tab**: name, URL preview with copy, tagline, description, category, social links, live store preview (desktop/mobile). **Account tab**: full name, email (read-only), phone, bio. **Payout tab**: method selector (MTN/Airtel/Bank), conditional fields per method. **Security tab**: current password, new password (strength bar + label), confirm password. **Notifications tab**: 5 toggle switches, save button |

### F. ADMIN DASHBOARD

| # | Route | File(s) | Key Features to Test |
|---|-------|---------|---------------------|
| 36 | `/admin/dashboard` | `app/admin/dashboard/page.tsx` | Date range selector (Today/Yesterday/7D/30D/Custom), revenue by currency cards, 6 metric cards (revenue, gross volume, orders, active creators, buyers, pending withdrawals), operational alerts (pending withdrawals, pending refunds), revenue over time line chart, new creators bar chart, payment method pie chart, recent orders table (6), recent activity feed (8 items), recent registrations table (5) |
| 37 | `/admin/orders` | `app/admin/orders/page.tsx` | 4 summary stat cards (total, paid, pending, failed), search (ID, buyer, product, creator), status filter, sortable table, details link per order, pagination |
| 38 | `/admin/orders/[id]` | `app/admin/orders/[id]/page.tsx` | Order info panel (product, creator, buyer, amounts, dates), payment info panel, "Mark as Paid" button (with confirmation) for pending orders — generates download token, download token display with expiry info |
| 39 | `/admin/products` | `app/admin/products/page.tsx` | 4 stat cards (total, published, disabled, draft), search, status filter, product table with preview links, Disable/Reactivate buttons with confirmation modal |
| 40 | `/admin/creators` | `app/admin/creators/page.tsx` | Search, filter (all/active/suspended/new), sort (newest/oldest/sales/revenue/products), creator table with avatar, store, products, sales, earnings, platform rev, balance, joined date, detail modal with full stats, Suspend/Reactivate buttons with reason input for suspend |
| 41 | `/admin/buyers` | `app/admin/buyers/page.tsx` | Search form (submits to API), buyers table, pagination, mobile card view |
| 42 | `/admin/refunds` | `app/admin/refunds/page.tsx` | 4 stat cards (pending/approved/rejected/total), urgent alert for pending refunds, search, status filter, refunds table, detail modal, Approve modal (optional notes), Reject modal (requires reason), processing states |
| 43 | `/admin/withdrawals` | `app/admin/withdrawals/page.tsx` | 4 stat cards, urgent alert with quick action cards, status filter, withdrawals table, detail modal, Approve/Reject for pending (with notes), Mark Paid for approved (requires payment reference), processing states |
| 44 | `/admin/sales` | `app/admin/sales/page.tsx` | 4 stat cards, search, status filter, date range (all/7d/30d), sales table, pagination |
| 45 | `/admin/reports` | `app/admin/reports/page.tsx` | 4 stat cards (creators, stores, active/suspended, new registrations), revenue trend bar chart, loading/empty states |
| 46 | `/admin/emails` | `app/admin/emails/page.tsx` | SMTP status card, Cron status card, queue stats (pending/sent/failed), manual "Process Pending Emails" button with result display |
| 47 | `/admin/audit-log` | `app/admin/audit-log/page.tsx` | Action filter dropdown, audit log table (timestamp, admin, action, target, target ID), pagination |
| 48 | `/admin/settings` | `app/admin/settings/page.tsx` | Read-only display of commission rate, minimum withdrawal, currency, config source info |

### G. COMPONENTS (Shared)

| # | Component | File | Key Features to Test |
|---|-----------|------|---------------------|
| 49 | `SiteHeader` | `components/site-header.tsx` | Responsive nav, auth-aware links, mobile menu, sticky positioning |
| 50 | `SiteHeaderAuth` | `components/site-header-auth.tsx` | Auth state detection, dashboard link, login/signup/sell buttons, loading skeleton |
| 51 | `SiteFooter` | `components/site-footer.tsx` | 3-column layout, WhatsApp link, all legal links |
| 52 | `MobileNav` | `components/mobile-nav.tsx` | Toggle open/close, fetches user role via `/api/auth/me`, role-based links, smooth transition |
| 53 | `AuthProvider` | `components/auth-provider.tsx` | React Context for auth, user/profile/session state, `refresh()` function, Supabase auth state subscription |
| 54 | `ToastProvider` / `useToast` | `components/ui/toast.tsx` | 4 types (success/error/warning/info), auto-dismiss (4s), context-based API |
| 55 | `CheckoutForm` | `components/checkout-form.tsx` | Ugandan phone validation (+256 or 0 + 9 digits), posts to `/api/payments/create`, redirects to Pesapal on success |
| 56 | `BuyNowModal` | `components/buy-now-modal.tsx` | Fetches profile + active discounts, phone validation, handles 409 (duplicate order), discount percentage display, price breakdown, posts to `/api/payments/create` |
| 57 | `PaymentStatusCard` | `components/payment-status-card.tsx` | Payment verification via `/api/payments/verify`, download button with token, expired link handling |
| 58 | `ProductReviews` | `components/product-reviews.tsx` | Fetches reviews from `/api/reviews`, star rating (1-5), textarea, buyer-only submission, average rating display |
| 59 | `DashboardShell` | `components/dashboard-shell.tsx` | Sidebar with nav (creatorNav/adminNav), active route highlighting, responsive sidebar, header with breadcrumbs |
| 60 | `SalesChart` | `components/sales-chart.tsx` | Recharts AreaChart, earnings data, green gradient fill, empty state |
| 61 | `TrackView` | `components/track-view.tsx` | Invisible analytics tracker, 30-min dedup via localStorage, posts to `/api/analytics/events` |
| 62 | `WhatsAppButton` | `components/whatsapp-button.tsx` | Fixed bottom-right, hover animation, aria-label, target="_blank" |
| 63 | `BackToTop` | `components/back-to-top.tsx` | Appears after 400px scroll, smooth scroll to top |
| 64 | `CookieConsent` | `components/cookie-consent.tsx` | localStorage check, fixed bottom bar, privacy policy link, "Got it" button |
| 65 | `Modal` / `ConfirmModal` | `components/ui/modal.tsx` | ESC close, backdrop click close, sizes (sm/md/lg/xl), `requireTyping` confirmation |
| 66 | `Pagination` | `components/ui/pagination.tsx` | Page numbers, ellipsis, page size selector, prev/next |
| 67 | `EmptyState` | `components/ui/empty-state.tsx` | Icon, title, description, action button/link |
| 68 | `Badge` | `components/ui/badge.tsx` | Status dot, color mapping for all statuses |
| 69 | `StatCard` (ui) | `components/ui/stat-card.tsx` | Animated count-up, trend indicator, green variant, amount formatting, icon support |
| 70 | `Skeleton` | `components/ui/skeleton.tsx` | Skeleton, StatCardSkeleton, ChartSkeleton, TableSkeleton |
| 71 | `ButtonLink` | `components/button.tsx` | 4 variants (primary/secondary/ghost/dark), optional arrow icon |
| 72 | `PasswordInput` | `components/password-input.tsx` | Show/hide toggle, Eye/EyeOff icons |
| 73 | `LogoIcon` | `components/logo.tsx` | Image component with fallback |

### H. API ENDPOINTS (Server-side)

| # | Endpoint | Method | Key Features to Test |
|---|----------|--------|---------------------|
| 74 | `/api/auth/register` | POST | Zod validation (`registerSchema`), Supabase admin create user, users table insert, creators table insert, stores table insert, rollback on failure at any step |
| 75 | `/api/auth/register-buyer` | POST | Buyer registration with phone |
| 76 | `/api/auth/login` | POST | Supabase sign in with password |
| 77 | `/api/auth/logout` | POST | Supabase sign out |
| 78 | `/api/auth/me` | GET | Returns user + profile with all fields (creator, store, balance, etc.) |
| 79 | `/api/auth/me` | PATCH | Updates user profile fields (payout methods, notification prefs) |
| 80 | `/api/auth/reset-password` | POST | Supabase `resetPasswordForEmail` |
| 81 | `/api/products` | GET | Returns products for authenticated creator (with limits) |
| 82 | `/api/products` | POST | Zod validation (`productSchema`), creates product with store ownership check |
| 83 | `/api/products/[id]` | GET | Returns single product with full details |
| 84 | `/api/products/[id]` | PATCH | Zod validation (`productUpdateSchema`), partial update |
| 85 | `/api/products/[id]` | DELETE | Soft/hard delete |
| 86 | `/api/orders` | GET | Returns orders for authenticated creator |
| 87 | `/api/orders/lookup` | POST | Order lookup by email for refund flow |
| 88 | `/api/orders/[orderId]/status` | GET | Order status check |
| 89 | `/api/payments/create` | POST | Zod validation (`checkoutSchema`), duplicate detection (pending 15min + paid), discount check, buyer ID lookup, order creation, payment record, Pesapal order creation, discount use increment, rollback on failure |
| 90 | `/api/payments/verify` | POST | Payment verification, `verifyPesapalPayment` |
| 91 | `/api/webhooks/pesapal` | POST | Raw body parsing, `normalizePesapalStatus`, `verifyPesapalPayment`, CSRF bypass |
| 92 | `/api/pesapal/ipn` | POST | IPN callback from Pesapal |
| 93 | `/api/stores` | GET/POST | Store CRUD |
| 94 | `/api/stores/[id]` | PATCH | Store update (used by auto-save in settings) |
| 95 | `/api/upload` | POST | File upload to Supabase Storage, MIME validation via `validateUpload`, magic bytes checking |
| 96 | `/api/withdrawals` | GET | Returns withdrawal requests for authenticated creator |
| 97 | `/api/withdrawals` | POST | Creates withdrawal request with balance check |
| 98 | `/api/reviews` | GET/POST | Product reviews CRUD |
| 99 | `/api/discounts` | GET/POST | Discount CRUD |
| 100 | `/api/discounts/active` | GET | Returns active discounts |
| 101 | `/api/analytics/events` | POST | Records analytics events (store/product views, downloads) |
| 102 | `/api/analytics/summary` | GET | Aggregated analytics summary |
| 103 | `/api/refunds/request` | POST | Creates refund request |
| 104 | `/api/downloads/[token]` | GET | Validates download token, serves file |
| 105 | `/api/buyer/purchases` | GET | Returns purchases for authenticated buyer |
| 106 | `/api/buyer/download` | GET | Generates download link for buyer's purchase |
| 107 | `/api/creators/[id]` | PATCH | Updates creator profile (display_name, bio, phone) |
| 108 | `/api/emails/process` | POST | Manual email processing trigger |
| 109 | `/api/cron/process-emails` | GET/POST | Cron job: auth via CRON_SECRET/Bearer/x-vercel-cron-secret, processes up to 500 pending emails, retry logic (max 3), updates statuses |
| 110 | `/api/setup/register-ipn` | POST | Registers IPN URL with Pesapal |
| 111 | `/api/admin/stats` | GET | Platform-wide statistics |
| 112 | `/api/admin/orders` | GET | All orders with optional limits |
| 113 | `/api/admin/orders/[orderId]` | GET | Single order detail with payments |
| 114 | `/api/admin/orders/[orderId]/mark-paid` | POST | Manual mark-as-paid, generates download token |
| 115 | `/api/admin/creators` | GET | All creators with sales data |
| 116 | `/api/admin/buyers` | GET | All buyers with optional search |
| 117 | `/api/admin/products` | GET | All products for moderation |
| 118 | `/api/admin/products/[id]/disable` | POST | Disables a product, logs action |
| 119 | `/api/admin/products/[id]/reactivate` | POST | Reactivates a product, logs action |
| 120 | `/api/admin/stores/[id]/suspend` | POST | Suspends a store with reason, logs action |
| 121 | `/api/admin/stores/[id]/reactivate` | POST | Reactivates a store, logs action |
| 122 | `/api/admin/withdrawals` | GET | All withdrawal requests |
| 123 | `/api/admin/withdrawals/[id]/approve` | POST | Approves withdrawal, logs action |
| 124 | `/api/admin/withdrawals/[id]/reject` | POST | Rejects withdrawal with reason, logs action |
| 125 | `/api/admin/withdrawals/[id]/mark-paid` | POST | Marks withdrawal as paid with payment ref, logs action |
| 126 | `/api/admin/refunds` | GET | All refund requests |
| 127 | `/api/admin/refunds/[id]/approve` | POST | Approves refund, sends email notification |
| 128 | `/api/admin/refunds/[id]/reject` | POST | Rejects refund with reason, sends email notification |
| 129 | `/api/admin/email-status` | GET | SMTP/cron config status, email queue counts |
| 130 | `/api/admin/audit-log` | GET | Admin action audit log with optional action filter |

### I. DATABASE MIGRATIONS (Supabase)

| # | File | Key Features |
|---|------|-------------|
| 131 | `001_initial_schema.sql` | Core tables: users, creators, stores, products, orders, payments |
| 132 | `002_payment_and_withdrawal_guards.sql` | Payment verification guard RPCs, withdrawal constraints |
| 133 | `003_rate_limiting.sql` | Rate limiting tables and RPCs |
| 134 | `004_schema_audit_fixes.sql` | Schema corrections, audit fixes |
| 135-136 | `005-006` | Payment fixes, withdrawal earnings fixes |
| 137 | `007_admin_audit_fixes.sql` | Admin audit logging fixes |
| 138 | `008_production_security_fixes.sql` | Security hardening |
| 139 | `009_refund_system.sql` | Refund tables and logic |
| 140 | `010_email_system.sql` | Email queue and templates |
| 141 | `011_production_security_hardening.sql` | Additional security |
| 142 | `012_hotfix_finalize_pesapal.sql` | Hotfix for payment finalization |
| 143 | `013_storage_buckets.sql` | Storage bucket creation and policies |
| 144 | `014_buyer_features.sql` | Buyer-specific features |
| 145 | `015_production_fixes.sql` | General production fixes |
| 146 | `016_multi_currency.sql` | Multi-currency support |
| 147 | `017_fix_payment_finalization.sql` | Payment finalization fix |
| 148 | `018_add_review_unique_and_storage_policies.sql` | Review uniqueness, storage policies |

### J. SCRIPTS

| # | Script | Key Features |
|---|--------|-------------|
| 149 | `scripts/migrate.mjs` | Runs database migrations |
| 150 | `scripts/seed-admin.mjs` | Seeds first admin user |
| 151 | `scripts/register-ipn.ts` | Registers IPN URL with Pesapal |

### K. INFRASTRUCTURE / CONFIG

| # | File | Key Features |
|---|------|-------------|
| 152 | `middleware.ts` | www→non-www redirect (308), guest route bypass, auth cookie check for /creator /admin /buyer, login redirect with return path |
| 153 | `next.config.mjs` | Image remote patterns, security headers (CSP, HSTS, XFO, etc.), Sentry config |
| 154 | `vercel.json` | Cron job definition (daily 6AM) |
| 155 | `sentry.client.config.ts` | Sentry client init |
| 156 | `sentry.server.config.ts` | Sentry server init |
| 157 | `sentry.edge.config.ts` | Sentry edge init |
| 158 | `instrumentation.ts` | OpenTelemetry/Sentry instrumentation |
| 159 | `lib/file-validation.ts` | MIME validation, magic bytes detection, file upload pipeline |
| 160 | `lib/pesapal.ts` | Pesapal token caching, order creation, transaction status, refund, payment verification |
| 161 | `lib/email.ts` | Nodemailer SMTP transporter |
| 162 | `lib/email-templates.ts` | HTML email templates (order confirmation, withdrawal status, refund status) |
| 163 | `lib/email-processor.ts` | Email queue rendering and sending by type |
| 164 | `lib/schemas.ts` | All Zod validation schemas |
| 165 | `lib/auth.ts` | Supabase browser client, login/logout/session helpers |
| 166 | `lib/api.ts` | JSON helpers, CSRF check, rate limiting (IP-based via RPC), user resolution, error handling wrapper, admin logging |
| 167 | `lib/constants.ts` | Currencies, site config, formatting helpers, commission calculation |
| 168 | `lib/storefront.ts` | Product/store queries, download token validation |

---

## KNOWN POTENTIAL ISSUES TO WATCH FOR

1. **Duplicate withdrawal pages**: `app/creator/withdrawals/page.tsx` and withdrawal form in `app/creator/earnings/page.tsx` — verify they work correctly and don't conflict
2. **Empty env vars in `.env.local`**: SUPABASE_URL, SUPABASE_ANON_KEY, SERVICE_ROLE_KEY, PESAPAL keys are empty — need to ensure Vercel env vars are used
3. **CRON_SECRET is empty** in `.env.local` — cron auth would fail locally
4. **All amounts hardcoded to UGX** via `formatUgx()` — verify multi-currency display works everywhere
5. **Magic byte validation** in `lib/file-validation.ts` — verify it works for all supported formats
6. **CSRF bypass** on webhook endpoint (`/api/webhooks/pesapal`) — verify it's intentional and secure
7. **Rate limiting** uses IP-based Supabase RPC — verify it works
8. **Payment flow**: verify the full create → redirect → IPN → verify → download flow
9. **Email queue**: verify the cron job processes and sends emails correctly
10. **Admin action logging**: verify all admin actions are logged to `admin_logs` table
11. **Access control**: verify middleware correctly protects admin/creator/buyer routes
12. **File upload size limits**: verify 4MB ebook / 2MB image limits are enforced on both client and server
13. **Structured data (JSON-LD)**: verify all schemas are valid
14. **Mobile responsiveness**: test all pages at mobile viewport widths
15. **404/500 pages**: verify custom error pages render correctly
16. **Loading skeletons**: verify all loading states display properly
17. **Empty states**: verify all pages with data tables handle empty results
18. **Form validation**: verify all forms have proper client + server validation
19. **Search functionality**: verify search works across all list pages
20. **Pagination**: verify pagination works correctly across all list pages

---

## REQUIRED VERIFICATION STEPS

After fixing ANY issue, you MUST:
1. **Run type check**: `npx tsc --noEmit`
2. **Run linter**: `npm run lint`
3. **Run tests**: `npm test` (Vitest)
4. **Build**: `npm run build` (Next.js production build)
5. **Manually verify the fixed feature** by loading the page and testing the interaction

## APPROACH

Work through the inventory **top to bottom**. For each feature:
1. Read all relevant source files
2. Note any bugs, inconsistencies, missing error handling, or UI issues
3. Fix with production-quality code following existing patterns
4. Verify the fix

Do NOT skip anything as "too minor." Every button, every link, every form field, every loading state, every error message must be tested and verified.
