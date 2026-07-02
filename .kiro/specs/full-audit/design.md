# Design — Keevan Store Full Production Audit

## Architecture Overview

```
Browser (Next.js 15 App Router, React 19, Tailwind)
        │
        ├── Public storefront:  /store/[handle]
        ├── Auth flows:         /login  /signup  /forgot-password  /update-password
        ├── Creator dashboard:  /creator/*  (protected by middleware → role=creator)
        ├── Buyer dashboard:    /buyer/*    (protected by middleware → role=buyer)
        ├── Admin dashboard:    /admin/*    (protected by middleware → role=admin)
        └── Order success:      /order/success?order_id=...
                │
                ▼
        Next.js API Routes (/app/api/*)
                │
                ├── lib/api.ts          → withErrorHandling, requireUser, requireAdmin, resolveUser
                ├── lib/pesapal.ts      → Pesapal API client (token, createOrder, verifyPayment)
                ├── lib/supabase.ts     → getSupabaseClient, getSupabaseAdminClient
                ├── lib/supabase-server.ts → SSR cookie-based client
                ├── lib/constants.ts    → calculateSaleSplit, currency/phone regexes
                ├── lib/schemas.ts      → Zod validation schemas
                └── lib/email.ts        → Resend + nodemailer fallback
                │
                ▼
        Supabase (PostgreSQL + RLS + Storage + Auth)
                │
                ├── Tables: users, stores, products, orders, payments, downloads,
                │           withdrawal_requests, refunds, discounts, reviews,
                │           email_queue, rate_limits, analytics_events, audit_log
                ├── RPC:    set_app_api_key, finalize_pesapal_payment,
                │           fail_pesapal_payment, process_refund,
                │           transition_withdrawal_request, increment_creator_balance,
                │           increment_discount_use
                └── Storage: products (private), covers (public)
```

---

## Audit Phases & What Gets Examined

### Phase 1 — Buyer Flow (Store → Buy Now → Pay → Download)

**Files in scope:**
- `app/store/[handle]/page.tsx` — storefront rendering
- `components/buy-now-modal.tsx` — checkout modal trigger
- `components/checkout-form.tsx` — guest checkout form
- `app/api/payments/create/route.ts` — order + payment creation
- `lib/pesapal.ts` → `createPesapalOrder` — Pesapal order submission
- `app/order/page.tsx` (or `/order/success`) — success page polling
- `app/api/orders/[orderId]/status/route.ts` — order status endpoint
- `app/api/downloads/[token]/route.ts` — file download endpoint
- `app/api/webhooks/pesapal/route.ts` — IPN callback
- `lib/pesapal.ts` → `verifyPesapalPayment` — payment finalization

**Known completed fixes (from buy-now-500-error-fix spec):**
1. `set_app_api_key()` call added before `finalize_pesapal_payment` RPC ✓
2. Guest order status endpoint no longer requires auth ✓
3. RWF → RW country code mapping fixed ✓
4. `file_path` validation added to payments/create ✓

**Remaining audit items:**
- Verify buy-now-modal error handling (does it show real errors or generic messages?)
- Verify checkout form validation matches server-side Zod schema
- Verify Pesapal callback URL construction (VERCEL_URL vs request origin vs site.url)
- Verify IPN endpoint handles all Pesapal notification shapes
- Verify download token creation, expiry, and access control
- Check for race condition: two IPN calls arriving simultaneously

---

### Phase 2 — Creator Dashboard

**Files in scope:**
- `app/creator/*/page.tsx` — all creator pages
- `app/api/stores/route.ts`, `app/api/stores/[id]/route.ts` — store CRUD
- `app/api/products/route.ts`, `app/api/products/[id]/route.ts` — product CRUD
- `app/api/upload/route.ts` — file + cover upload
- `app/api/withdrawals/route.ts`, `app/api/withdrawals/[id]/route.ts` — withdrawal requests
- `app/api/creators/route.ts`, related creator endpoints
- `lib/file-validation.ts` — magic-byte MIME check

**Items to audit:**
- Store creation: handle uniqueness validation, error messages
- Product creation: file upload → storage → file_path saved correctly
- Product editing: partial updates don't wipe file_path or cover
- Product deletion: storage file cleaned up, no orphaned files
- Creator data isolation: every query must filter by authenticated creator's store
- Earnings display: matches actual `increment_creator_balance` increments
- Withdrawal: balance check, atomicity, minimum threshold per currency

---

### Phase 3 — Admin Dashboard

**Files in scope:**
- `app/admin/*/page.tsx` — all admin pages
- `app/api/admin/*/route.ts` — all admin API routes
- `lib/api.ts` → `requireAdmin` implementation

**Items to audit:**
- Every admin API route calls `requireAdmin()` — no gaps
- Stats endpoint returns live data, not mock
- Store suspend/reactivate works and persists
- Product disable/reactivate works and affects storefront
- Order mark-paid works (manual override with audit log entry)
- Withdrawal approve/reject/mark-paid: correct state transitions, balance restore on reject
- Refund approve/reject: calls `process_refund` with `set_app_api_key()` first
- Audit log: all admin actions recorded
- Email status page: reflects real email queue state

---

### Phase 4 — Authentication & Middleware

**Files in scope:**
- `middleware.ts` — RBAC routing
- `app/api/auth/*/route.ts` — login, register, logout, reset, me
- `lib/api.ts` → `requireUser`, `requireAdmin`, `resolveUser`
- `components/auth-provider.tsx` — client-side auth context

**Items to audit:**
- Signup: creates both Supabase auth user and `users` table row with correct role
- Login: session cookie set; subsequent API requests authenticated
- Logout: session fully cleared (both Supabase auth + cookie)
- Password reset: email sent, token valid, new password accepted
- Middleware: role mismatch redirects work correctly for all three roles
- `resolveUser()` graceful failure for guest requests

---

### Phase 5 — Security

**Items to audit:**
- RLS policies on every sensitive table
- API auth enforcement (no unauthenticated access to private data)
- Input validation coverage (every POST/PATCH has Zod schema)
- File upload: magic-byte validation, size limits enforced
- Storage bucket policies: `products` bucket requires auth, `covers` public OK
- Payment webhook: IPN ID verification
- Download tokens: can't be guessed, expire correctly, honor paid-order-only rule
- Cross-creator data access: creator A cannot read/write creator B's data via API

---

### Phase 6 — Reliability

**Items to audit:**
- `withErrorHandling` wrapping on all routes
- Sentry DSN configured and errors surfaced
- Email queue: cron `/api/cron/process-emails` guarded by `CRON_SECRET`
- Email templates: correct data passed (no undefined in subject/body)
- Empty states: every list page handles zero-item case
- Loading states: every data-fetching page has skeleton
- Vercel Cron configuration in `vercel.json`

---

## Audit Output Format

After each phase's fixes are applied, a summary entry is written to the tasks file describing:
- What was found (bug description)
- Root cause
- Fix applied
- Files changed

Final scoring rubric (used in tasks.md final task):
| Area | Max Points |
|------|-----------|
| Buyer flow (store → download) | 25 |
| Payment system | 20 |
| Creator dashboard | 15 |
| Admin dashboard | 15 |
| Security | 15 |
| Reliability & error handling | 10 |
| **Total** | **100** |

---

## Key Design Decisions (Constraints)

1. **No new features** — fixes only. Every change must map to a bug/defect found in the audit.
2. **Preserve existing patterns** — use `withErrorHandling`, `requireUser`, `requireAdmin`, Zod, `getSupabaseAdminClient` as the existing codebase does. Don't introduce new patterns.
3. **Always call `set_app_api_key()` before SECURITY DEFINER RPCs** — `finalize_pesapal_payment`, `process_refund`, `transition_withdrawal_request` all require `app.api_key = 'verified'`.
4. **Guest checkout is first-class** — any change to the order status endpoint or download endpoint must preserve guest access by order ID.
5. **Admin client for cross-user queries** — use `getSupabaseAdminClient()` only when RLS would block a legitimate cross-user lookup (e.g., order status page). Use SSR client everywhere else.
6. **Currency is set at the store level** — product currency inherits from store currency. Changing store currency after the first paid order must be blocked.

---

## Reference Files

- `#[[file:docs/system-architecture.md]]`
- `#[[file:docs/database-architecture.md]]`
- `#[[file:docs/user-flows.md]]`
- `#[[file:docs/api-specification.md]]`
- `#[[file:supabase/migrations/017_fix_payment_finalization.sql]]`
- `#[[file:supabase/migrations/019_fix_production_bugs.sql]]`
