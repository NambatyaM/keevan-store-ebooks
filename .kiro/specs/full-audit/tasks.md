# Implementation Tasks — Keevan Store Full Production Audit

---

## Phase 1 — Buyer Flow Audit & Fixes

- [x] 1. Audit and fix `app/store/[handle]/page.tsx` storefront
  - Read `app/store/[handle]/page.tsx` and `lib/storefront.ts`
  - Verify the page handles: non-existent handle → clean 404, suspended store → "store unavailable" message, empty product list → proper empty state, missing cover image → graceful fallback placeholder
  - Verify `generateMetadata` does not throw when store is not found
  - Fix any 500 paths: missing null checks on store/products, unhandled Supabase errors
  - Verify product price displays with correct currency symbol per store currency
  - **Acceptance**: `/store/nonexistent` returns 404; suspended store shows message; empty store shows empty state; no uncaught errors
  - Files: `app/store/[handle]/page.tsx`, `lib/storefront.ts`

- [x] 2. Audit and fix `components/buy-now-modal.tsx` and `components/checkout-form.tsx`
  - Read both components fully
  - Verify the modal correctly passes product ID/slug/store context to the checkout form
  - Verify client-side validation matches the server-side Zod `checkoutSchema` in `lib/schemas.ts` (field names, types, required fields)
  - Verify error states are shown to the user — not just logged to console
  - Verify the modal does not show a generic "Something went wrong" for a specific error like "Product not available" (use the actual error message from the API)
  - Verify loading state disables the submit button to prevent double-submit
  - Fix any mismatches found
  - **Acceptance**: Form validation errors are shown inline; API errors surface the real message; double-submit is blocked
  - Files: `components/buy-now-modal.tsx`, `components/checkout-form.tsx`, `lib/schemas.ts`

- [x] 3. Audit and fix `app/api/payments/create/route.ts`
  - Read the full file
  - Verify `file_path` is in the product select and validated (already fixed in buy-now spec — confirm it is correct)
  - Verify the callback URL construction: `VERCEL_URL` env var is used first, then request origin, then `NEXT_PUBLIC_SITE_URL` — ensure the callback actually points to the correct production domain
  - Verify discount application: `starts_at` and `expires_at` checks, `max_uses` check, `increment_discount_use` called correctly
  - Verify the 409 duplicate order check uses the partial unique index on `orders(buyer_email, product_id) WHERE status = 'pending'`
  - Verify the 409 check also covers already-paid orders (buyer can't buy the same product twice)
  - Verify rollback: when `createPesapalOrder` fails, the order AND payment rows are deleted correctly
  - Verify currency is taken from the product/store, not from client input (prevent currency spoofing)
  - **Acceptance**: Callback URL always uses production domain; duplicate payment blocked; rollback on Pesapal failure works; currency not spoofable
  - Files: `app/api/payments/create/route.ts`

- [x] 4. Audit and fix the Pesapal IPN webhook handler
  - Read `app/api/webhooks/pesapal/route.ts` (or `app/api/pesapal/ipn/route.ts` — whichever exists)
  - Verify the IPN handler calls `set_app_api_key()` before `verifyPesapalPayment` (or confirms verifyPesapalPayment does it internally)
  - Verify the handler returns 200 to Pesapal immediately even for already-processed notifications (idempotency)
  - Verify the handler does not return 500 for a malformed IPN body — it should log and return 200 to Pesapal to prevent retries
  - Verify the handler enqueues the order confirmation email after successful finalization
  - Verify the `PESAPAL_IPN_ID` is checked (if Pesapal sends it) to authenticate the webhook source
  - Fix any issues found
  - **Acceptance**: IPN for completed payment → order finalized + email queued; duplicate IPN → idempotent 200; malformed IPN → logged + 200 (no 500)
  - Files: `app/api/webhooks/pesapal/route.ts` (or equivalent)

- [x] 5. Audit and fix the order success page and order status endpoint
  - Read `app/order/page.tsx` (or `app/order/success/page.tsx`) and `app/api/orders/[orderId]/status/route.ts`
  - Verify the success page reads `order_id` from the URL query param correctly
  - Verify the success page polls the status endpoint on an interval and stops when status is `completed` or `failed`
  - Verify the success page shows the download link prominently when status is `completed`
  - Verify the success page handles `failed` status with a clear message and retry/contact options
  - Confirm guest access works (no auth required) — verify the fix from buy-now spec is correct and complete
  - Verify authenticated buyer access still performs ownership checks
  - **Acceptance**: Guest buyer lands on success page and sees download link without login; failed payments show clear error; polling stops correctly
  - Files: `app/order/page.tsx`, `app/api/orders/[orderId]/status/route.ts`

- [x] 6. Audit and fix the download endpoint
  - Read `app/api/downloads/[token]/route.ts`
  - Verify the endpoint: fetches the download record by token, checks `expires_at > now()`, checks the linked order has `status = 'paid'`, generates a signed Supabase Storage URL for the file
  - Verify the signed URL has a short expiry (≤ 60 seconds) so it cannot be shared
  - Verify expired token returns 410 Gone with a clear message
  - Verify unpaid order returns 403 Forbidden
  - Verify invalid/non-existent token returns 404
  - Verify the download increments a `download_count` field if one exists, or logs an analytics event
  - Fix any issues found
  - **Acceptance**: Valid paid token → signed URL returned; expired token → 410; unpaid → 403; invalid → 404
  - Files: `app/api/downloads/[token]/route.ts`

---

## Phase 2 — Payment System Audit & Fixes

- [x] 7. Audit `lib/pesapal.ts` for robustness and security
  - Read the full `lib/pesapal.ts` file
  - Verify `getPesapalToken()` caches correctly and refreshes before expiry; verify it handles a failed token request without leaving a stale cached value
  - Verify `createPesapalOrder()` uses the CURRENCY_COUNTRY map (already fixed — confirm it's correct and exhaustive)
  - Verify `normalizePesapalStatus()` handles all known Pesapal response shapes (v2/v3, camelCase/snake_case)
  - Verify `verifyPesapalPayment()` amount check handles floating-point comparison correctly (e.g., 1000.00 vs 1000)
  - Verify `verifyPesapalPayment()` handles a null trackingId gracefully
  - Verify `refundPesapalOrder()` signature matches Pesapal API v3 spec
  - Fix any robustness issues
  - **Acceptance**: Token refresh works; amount comparison handles decimals; null trackingId handled; all response shapes normalized
  - Files: `lib/pesapal.ts`

- [x] 8. Audit `lib/constants.ts` — commission, currency, phone validation
  - Read `lib/constants.ts`
  - Verify `calculateSaleSplit()` correctly computes `grossAmount`, `platformFee`, `creatorEarnings` with no floating-point rounding error (use integer math for lowest-denomination currencies)
  - Verify the commission rate is read from `NEXT_PUBLIC_COMMISSION_RATE` and has a safe default
  - Verify `currencyPhoneRegex` covers all five currencies and the regexes are correct for Uganda, Kenya, Tanzania, Rwanda, USA
  - Verify the minimum withdrawal amounts per currency are reasonable defaults
  - Fix any issues
  - **Acceptance**: Split calculation is lossless; phone regex validates correctly for each currency; commission rate has safe default
  - Files: `lib/constants.ts`

---

## Phase 3 — Creator Dashboard Audit & Fixes

- [x] 9. Audit creator product CRUD API routes
  - Read `app/api/products/route.ts` and `app/api/products/[id]/route.ts`
  - Verify: POST creates product with file_path and links to the correct store (authenticated creator's store only)
  - Verify: PUT/PATCH allows partial updates without wiping file_path or cover_url if not provided in the request
  - Verify: DELETE removes the product row AND deletes the file from Supabase Storage (both products bucket and covers bucket)
  - Verify: Creator A cannot read, update, or delete Creator B's product via the API (ownership check on every mutation)
  - Verify: Product slug uniqueness within a store is enforced (unique index check or app-level check)
  - Fix any issues
  - **Acceptance**: Product CRUD all work; partial updates don't wipe file; delete cleans up storage; cross-creator access blocked
  - Files: `app/api/products/route.ts`, `app/api/products/[id]/route.ts`

- [x] 10. Audit file upload endpoint
  - Read `app/api/upload/route.ts` and `lib/file-validation.ts`
  - Verify magic-byte MIME validation is called before upload (not just `content-type` header check)
  - Verify file size limit is enforced (4MB for products bucket, 2MB for covers)
  - Verify upload is to the correct bucket based on upload type (product file → `products`, cover → `covers`)
  - Verify the returned `file_path` / `public_url` is the correct format expected by the product creation endpoint
  - Verify the creator is authenticated before upload is allowed
  - Fix any issues
  - **Acceptance**: Files > size limit rejected; wrong MIME type rejected; unauthenticated upload blocked; correct path returned
  - Files: `app/api/upload/route.ts`, `lib/file-validation.ts`

- [ ] 11. Audit store CRUD and creator earnings/withdrawal flows
  - Read `app/api/stores/route.ts`, `app/api/stores/[id]/route.ts`, `app/api/withdrawals/route.ts`
  - Verify store creation enforces unique handle with a clear 409 error
  - Verify store update (name, description, logo) works without losing existing data
  - Verify store currency cannot be changed after a paid order exists (prevents accounting inconsistency)
  - Verify withdrawal request: checks balance ≥ minimum, decrements balance atomically via `transition_withdrawal_request` RPC with `set_app_api_key()` called first
  - Verify the creator dashboard earnings page shows correct balance (matches DB `creator_balances` or equivalent field)
  - Fix any issues
  - **Acceptance**: Duplicate store handle → 409; currency lock works; withdrawal deducts balance; earnings match DB
  - Files: `app/api/stores/route.ts`, `app/api/stores/[id]/route.ts`, `app/api/withdrawals/route.ts`

- [~] 12. Audit creator dashboard frontend pages
  - Read key creator pages: `app/creator/dashboard/page.tsx`, `app/creator/products/page.tsx`, `app/creator/earnings/page.tsx` (or equivalent)
  - Verify: loading skeletons shown while data fetches
  - Verify: empty states shown when no products, no orders, no earnings
  - Verify: store link is displayed and is correct (e.g., `keevanstore.in/store/<handle>`)
  - Verify: product link is displayed per product (e.g., `/store/<handle>/product/<slug>` or the correct URL format)
  - Verify: error states handled — API errors don't leave the page blank
  - Fix any missing states
  - **Acceptance**: All creator pages have loading, empty, and error states; links are correct and copyable
  - Files: `app/creator/*/page.tsx`

---

## Phase 4 — Admin Dashboard Audit & Fixes

- [~] 13. Audit admin API route authorization
  - Read `lib/api.ts` → `requireAdmin` implementation
  - Read ALL admin API route files: `app/api/admin/*/route.ts`
  - Verify EVERY handler calls `requireAdmin()` (not just `requireUser()`) — no gaps
  - Verify `requireAdmin()` checks the `users` table role, not just Supabase auth metadata
  - List any routes missing the admin guard and add it
  - **Acceptance**: Every `/api/admin/*` route returns 401/403 without a valid admin session; no endpoint is open to non-admins
  - Files: `lib/api.ts`, `app/api/admin/*/route.ts`

- [~] 14. Audit admin withdrawal and refund action endpoints
  - Read `app/api/admin/withdrawals/[id]/approve/route.ts`, `reject/route.ts`, `mark-paid/route.ts`
  - Read `app/api/admin/refunds/[id]/approve/route.ts`, `reject/route.ts`
  - Verify withdrawal approve/reject/mark-paid: each calls `set_app_api_key()` before the `transition_withdrawal_request` RPC
  - Verify withdrawal reject: creator balance is restored (the RPC must handle this)
  - Verify refund approve: calls `set_app_api_key()` before `process_refund` RPC
  - Verify refund approve: attempts Pesapal refund API call (or logs if not possible)
  - Verify all state transitions are atomic — no partial updates possible
  - Fix any issues
  - **Acceptance**: All withdrawal/refund actions work end-to-end; balance restored on rejection; no partial state
  - Files: `app/api/admin/withdrawals/[id]/*/route.ts`, `app/api/admin/refunds/[id]/*/route.ts`

- [~] 15. Audit admin stats and order management endpoints
  - Read `app/api/admin/stats/route.ts`
  - Verify stats query returns live data (not hardcoded), includes: total orders, total revenue, total creators, total buyers, pending withdrawals count
  - Read `app/api/admin/orders/route.ts` and `app/api/admin/orders/[orderId]/mark-paid/route.ts`
  - Verify orders list supports filtering by status and pagination
  - Verify mark-paid creates an audit log entry
  - Fix any issues
  - **Acceptance**: Stats are accurate and live; orders list is paginated; mark-paid is logged
  - Files: `app/api/admin/stats/route.ts`, `app/api/admin/orders/route.ts`, `app/api/admin/orders/[orderId]/mark-paid/route.ts`

---

## Phase 5 — Authentication & Middleware Audit & Fixes

- [~] 16. Audit auth API routes (`/api/auth/*`)
  - Read `app/api/auth/register/route.ts`, `login/route.ts`, `logout/route.ts`, `reset-password/route.ts`, `me/route.ts`
  - Verify register: creates Supabase auth user AND inserts row into `users` table with correct role — if `users` insert fails, the Supabase auth user should be cleaned up (no orphan)
  - Verify login: sets the session cookie correctly using `@supabase/ssr` pattern; response includes `Set-Cookie` header
  - Verify logout: calls `supabase.auth.signOut()` and clears the cookie
  - Verify password reset: sends email, token is valid, update-password flow completes
  - Verify `me` endpoint returns the user's role from `users` table, not just auth metadata
  - Fix any issues
  - **Acceptance**: Register creates DB user row; login sets cookie; logout clears session; reset works; me returns role
  - Files: `app/api/auth/*/route.ts`

- [~] 17. Audit `middleware.ts` for edge cases
  - Read `middleware.ts` in full
  - Verify: unauthenticated request to `/creator/*` → redirect to `/login?redirect=<path>`
  - Verify: authenticated creator visiting `/admin/*` → redirect to `/creator/dashboard`
  - Verify: authenticated admin visiting `/creator/*` → redirect to `/admin/dashboard`
  - Verify: the `www.keevanstore.in` → `keevanstore.in` 308 redirect is correct
  - Verify: API routes (`/api/*`) are explicitly excluded from middleware (no auth overhead on API routes)
  - Verify: `/store/*` (public storefront) is not protected by middleware
  - Verify: graceful handling when `SUPABASE_SERVICE_ROLE_KEY` is missing (currently redirects to login — is this correct behavior?)
  - Fix any incorrect redirect logic
  - **Acceptance**: All role-based redirects work; API routes bypass middleware; public pages are accessible without auth
  - Files: `middleware.ts`

---

## Phase 6 — Security Audit & Fixes

- [~] 18. Audit input validation coverage across all POST/PATCH routes
  - Use grep to find all POST/PATCH API route handlers
  - Verify each handler calls `readJson` with a Zod schema (or equivalent validation)
  - List any routes accepting a POST/PATCH body without Zod validation
  - Add Zod validation to any unvalidated routes using existing schemas from `lib/schemas.ts` or creating new ones
  - **Acceptance**: Zero POST/PATCH routes with unvalidated body input
  - Files: `app/api/*/route.ts`, `lib/schemas.ts`

- [~] 19. Audit storage bucket security and download token generation
  - Read `supabase/migrations/013_storage_buckets.sql` for bucket policy setup
  - Verify `products` bucket policy: only authenticated creators can upload; no public read
  - Verify signed URL generation in the download endpoint uses a short TTL (≤ 60 seconds)
  - Verify download tokens in the `downloads` table: token is a UUID (unguessable), `expires_at` is 7 days from creation, the token check is `expires_at > now()` (not `>=`)
  - Verify that a download token from one order cannot be used to download a different product
  - Fix any issues
  - **Acceptance**: Products bucket not publicly readable; signed URLs short-lived; tokens unguessable, expiring, order-bound
  - Files: `app/api/downloads/[token]/route.ts`, `supabase/migrations/013_storage_buckets.sql`

- [~] 20. Audit RLS policy completeness
  - Read `supabase/migrations/008_production_security_fixes.sql` and `011_production_security_hardening.sql`
  - Verify RLS is ENABLED on: users, stores, products, orders, payments, downloads, withdrawal_requests, refunds, discounts, reviews, email_queue
  - Verify the `orders` table policy: a creator can read orders for their store; a buyer can read their own orders; admin can read all; anonymous can read by order ID (for guest status polling — this must be via service-role client in the API, not raw RLS)
  - Verify no policy allows a creator to read another creator's products, orders, or earnings
  - Document any gaps found and write migration SQL if needed
  - **Acceptance**: RLS enabled on all user-data tables; no cross-user data leakage possible via direct Supabase client
  - Files: `supabase/migrations/008_*.sql`, `011_*.sql`; new migration if needed

---

## Phase 7 — Reliability & Error Handling Audit & Fixes

- [~] 21. Audit `withErrorHandling` coverage and Sentry integration
  - Grep for all exported `GET`, `POST`, `PATCH`, `PUT`, `DELETE` handlers in `app/api/`
  - Verify every handler is wrapped with `withErrorHandling()` from `lib/api.ts`
  - Read `lib/api.ts` → `withErrorHandling` implementation; verify it catches unhandled errors and returns `{ error: string }` JSON (never a raw 500)
  - Verify Sentry `captureException` is called in the error handler (or via `instrumentation.ts`)
  - List and fix any unwrapped handlers
  - **Acceptance**: Zero API routes that can return an unstructured 500; all errors logged to Sentry
  - Files: `lib/api.ts`, `app/api/*/route.ts`, `instrumentation.ts`

- [~] 22. Audit email queue and Vercel Cron
  - Read `app/api/cron/process-emails/route.ts`
  - Verify the route checks `Authorization: Bearer <CRON_SECRET>` — reject if missing or wrong
  - Verify `vercel.json` has a cron entry for this route (e.g., `"0 6 * * *"`)
  - Read `lib/email-processor.ts` and `lib/email.ts`
  - Verify the processor handles failed sends gracefully (retry or dead-letter, no crash)
  - Verify email templates in `lib/email-templates.ts` have no `undefined` in subject/body for any template
  - Verify order confirmation, withdrawal, and refund email templates are all present and correct
  - Fix any issues
  - **Acceptance**: Cron is guarded by secret; processor handles failures; no `undefined` in email content; all three email types present
  - Files: `app/api/cron/process-emails/route.ts`, `lib/email-processor.ts`, `lib/email-templates.ts`, `vercel.json`

- [~] 23. Audit loading and empty states across all dashboard pages
  - Check the following pages for loading skeleton AND empty state components:
    - `app/creator/products/page.tsx`
    - `app/creator/orders/page.tsx` (or equivalent)
    - `app/creator/earnings/page.tsx` (or equivalent)
    - `app/creator/withdrawals/page.tsx` (or equivalent)
    - `app/admin/orders/page.tsx`
    - `app/admin/products/page.tsx`
    - `app/admin/withdrawals/page.tsx`
    - `app/admin/refunds/page.tsx`
    - `app/buyer/dashboard/page.tsx` (or equivalent)
  - Add missing loading skeletons or empty states using existing `components/ui/skeleton.tsx` and `components/ui/empty-state.tsx`
  - **Acceptance**: Every list page shows a skeleton while loading and an empty state when the list is empty
  - Files: `app/creator/*/page.tsx`, `app/admin/*/page.tsx`, `app/buyer/*/page.tsx`

---

## Phase 8 — Buyer Account Dashboard Audit & Fixes

- [~] 24. Audit buyer dashboard and purchase history
  - Read `app/buyer/dashboard/page.tsx` and `app/api/buyer/route.ts` (or relevant buyer API routes)
  - Verify buyer can only see their own purchase history
  - Verify purchase history shows: product title, store name, date, download link (if paid)
  - Verify the buyer account signup flow at `/signup-buyer` or `/signup` with buyer role
  - Verify `populate_buyer_purchase` trigger in migration 019 correctly links past guest orders to a newly created buyer account by email
  - Fix any issues
  - **Acceptance**: Buyer sees only their orders; past guest orders linked by email on account creation; download links work from dashboard
  - Files: `app/buyer/*/page.tsx`, `app/api/buyer/route.ts`

---

## Phase 9 — Final Production Readiness Verification

- [~] 25. Run existing test suite and fix any failing tests
  - Run `npm test` (which runs `vitest run`)
  - Read the test output
  - Fix any failing tests — do not delete tests to make them pass
  - Verify test coverage includes: pesapal normalization, calculateSaleSplit, file-validation, auth helpers, checkout schema validation
  - **Acceptance**: All existing tests pass with `npm test`
  - Files: `lib/__tests__/**/*.test.ts`

- [~] 26. Verify environment variable usage and `.env.example` completeness
  - Grep for all `process.env.*` references across the codebase
  - Compare against `.env.example` — identify any env vars used in code but missing from the example file
  - Add missing vars to `.env.example` with placeholder values and comments
  - Specifically check: `WEBHOOK_SECRET` (referenced in README), `VERCEL_URL` (used in payments/create), `CRON_SECRET`
  - Verify `NEXT_PUBLIC_COMMISSION_RATE` has a sensible default in `lib/constants.ts` when the env var is absent
  - **Acceptance**: Every env var used in code is documented in `.env.example`; no silent failures from missing vars
  - Files: `.env.example`, `lib/constants.ts`

- [~] 27. Write final audit summary report
  - Create `docs/production-audit-2026.md`
  - Include: all bugs found (numbered), root causes, fixes applied, files changed, any new migration SQL written
  - Score the platform across six areas (see design.md rubric): Buyer flow, Payment system, Creator dashboard, Admin dashboard, Security, Reliability
  - Provide final production readiness score out of 100
  - List any remaining known issues (with severity) that were not fixed in this audit
  - **Acceptance**: Report is written; score is justified with evidence; no critical issues left unaddressed
  - Files: `docs/production-audit-2026.md`
