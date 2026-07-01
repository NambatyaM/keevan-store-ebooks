# Implementation Tasks

- [x] 1. Fix missing `set_app_api_key()` call before `finalize_pesapal_payment` RPC in `lib/pesapal.ts`
  - Read `lib/pesapal.ts` and locate `verifyPesapalPayment`
  - Before the `supabase.rpc("finalize_pesapal_payment", …)` call, add `await supabase.rpc("set_app_api_key")` to set `app.api_key = 'verified'` in the current transaction context
  - Ensure any error from `set_app_api_key` is caught and logged but does not silently swallow the downstream error
  - Verify the fix applies to both the IPN callback path and any direct verification path
  - **Acceptance**: `verifyPesapalPayment` no longer throws "Only admins or internal processes can finalize payments"
  - Files: `lib/pesapal.ts`

- [x] 2. Fix guest checkout order status endpoint to remove `requireUser()` guard
  - Read `app/api/orders/[orderId]/status/route.ts`
  - Remove or bypass the `requireUser()` wrapper for unauthenticated (guest) requests
  - When the request is unauthenticated, allow the handler to proceed if `order_id` query param matches the route param, and return order status + download URL for `status = 'paid'` orders
  - When the request IS authenticated, preserve all existing auth and ownership checks (regression prevention 3.2)
  - Return 404 (not 401/403) when the order is not found for an unauthenticated request
  - **Acceptance**: Guest buyers polling `/api/orders/:orderId/status` receive 200 with download URL, not 401
  - Files: `app/api/orders/[orderId]/status/route.ts`

- [x] 3. Fix Rwanda country-code mapping (RWF → RW) and harden all currency-to-country mappings in `lib/pesapal.ts`
  - Read `lib/pesapal.ts` and locate the billing country code derivation inside `createPesapalOrder`
  - Replace the ternary chain with an exhaustive lookup map: `{ UGX: "UG", KES: "KE", TZS: "TZ", RWF: "RW", USD: "US" }`
  - Fall back to `"UG"` (or throw a clear error) for unknown currencies so existing UGX stores are not regressed (regression prevention 3.3)
  - **Acceptance**: RWF currency produces `country_code: "RW"`; UGX/KES/TZS produce their existing correct codes
  - Files: `lib/pesapal.ts`

- [x] 4. Add `file_path` validation to pre-payment product check in `app/api/payments/create/route.ts`
  - Read `app/api/payments/create/route.ts`
  - Add `file_path` to the product `select(...)` query
  - After the product is fetched, add a guard: if `!product.file_path || product.file_path.trim() === ""`, return `NextResponse.json({ error: "Product is not available for purchase" }, { status: 404 })`
  - Do NOT leak the reason (missing file) in the client response; log it server-side
  - **Acceptance**: Attempting to purchase a product with no `file_path` returns 404 instead of creating an unpayable order
  - Files: `app/api/payments/create/route.ts`
