# Bugfix Requirements Document

## Introduction

When a customer clicks "Buy Now" on a product in a creator's store, the application
intermittently responds with a 500 error and shows:
> "Something went wrong. We encountered an error loading this product. This might be a temporary issue."

Investigation across the full purchase journey — `app/api/payments/create/route.ts`,
`lib/pesapal.ts` (`verifyPesapalPayment`), `app/api/pesapal/ipn/route.ts`, and the
Supabase migration chain (001 → 019) — identified four distinct root causes responsible
for the 500 errors and related post-payment failures:

1. **Missing `set_app_api_key()` call before `finalize_pesapal_payment` RPC** — The
   `verifyPesapalPayment` helper in `lib/pesapal.ts` calls the `finalize_pesapal_payment`
   database function directly via the Supabase admin client without first calling
   `set_app_api_key()`. The database function checks
   `current_setting('app.api_key', true) <> 'verified'` (and `is_admin()`). Because the
   service-role client bypasses RLS but does not set the `app.api_key` config parameter,
   the auth guard throws `"Only admins or internal processes can finalize payments"`.
   Postgres propagates this as a 500 to the caller, producing the visible error. This
   affects both the IPN callback path and any direct payment verification path.

2. **Order status endpoint requires authentication, breaking guest checkout success page**
   — `app/api/orders/[orderId]/status/route.ts` wraps its handler with `requireUser()`,
   which returns 401 for unauthenticated requests. Guest buyers (no account) land on
   `/order/success?order_id=…` after Pesapal redirects them back; the success page polls
   that status endpoint, receives a 401, and shows "Order not found" or an error state
   instead of a download link.

3. **Missing country-code mapping for Rwanda (RWF → RW)** — In `lib/pesapal.ts`,
   `createPesapalOrder` derives the billing country code with:
   `currency === "KES" ? "KE" : currency === "TZS" ? "TZ" : "UG"`. Rwanda (RWF) falls
   through to "UG", causing Pesapal to receive an incorrect billing country. Depending on
   Pesapal's validation, this can produce a 400/500 from Pesapal during payment
   submission, which the caller converts to a 502 "Unable to initiate payment" — which in
   the frontend becomes a generic 500 error message.

4. **Pre-payment validation does not check that the product has an uploadable file** —
   `app/api/payments/create/route.ts` queries products with
   `select("id,slug,title,price,currency,creator_id,status,store_id")` but does not
   fetch `file_path`. If `file_path` is somehow empty (schema allows this to be an empty
   string via `check (file_path <> ''`) not enforced at the app layer during create), the
   order can be created, payment initiated, and money collected with no file to deliver.
   The route should validate `file_path` is non-empty before proceeding.

---

## Bug Analysis

### Current Behavior (Defect)

1.1 WHEN `verifyPesapalPayment` calls `supabase.rpc("finalize_pesapal_payment", …)` without
first calling `supabase.rpc("set_app_api_key")`, THEN the database function throws
`"Only admins or internal processes can finalize payments"` and the RPC returns an error,
causing the IPN handler or verification path to surface a 500 to the caller.

1.2 WHEN a guest buyer (not logged in) is redirected to `/order/success?order_id=…` after
Pesapal payment and the success page calls `GET /api/orders/:orderId/status`, THEN the
endpoint returns 401 (authentication required) because `requireUser()` rejects the request,
and the buyer sees an error instead of their download link.

1.3 WHEN a creator's store operates in Rwandan Francs (currency = "RWF") and a customer
clicks "Buy Now", THEN `createPesapalOrder` sends `country_code: "UG"` (Uganda) in the
billing address instead of "RW" (Rwanda), potentially causing Pesapal to reject or
mis-route the payment request.

1.4 WHEN `app/api/payments/create/route.ts` looks up the product, THEN it does not fetch or
validate `file_path`, so an order and payment can be created for a product that has no
downloadable file, leading to a paid order with no delivery path.

---

### Expected Behavior (Correct)

2.1 WHEN `verifyPesapalPayment` is about to call `supabase.rpc("finalize_pesapal_payment", …)`,
THEN the implementation SHALL first call `supabase.rpc("set_app_api_key")` to set
`app.api_key = 'verified'` in the current transaction context, so the database auth guard
passes and the function completes successfully.

2.2 WHEN a guest buyer (not logged in) calls `GET /api/orders/:orderId/status`, THEN the
endpoint SHALL return order status and download URL if the request's query parameters or
session include the matching `order_id`, without requiring the buyer to be authenticated,
so guest buyers see their download link immediately on the success page.

2.3 WHEN a creator's store uses currency "RWF" and `createPesapalOrder` builds the billing
address, THEN the implementation SHALL map "RWF" → "RW" (and ensure all supported
currencies map to their correct ISO 3166-1 alpha-2 country code: UGX→UG, KES→KE,
TZS→TZ, RWF→RW, USD→US).

2.4 WHEN `app/api/payments/create/route.ts` validates the product before creating an order,
THEN it SHALL include `file_path` in the product query and return a 404 "Product is not
available for purchase" error if `file_path` is empty or absent, preventing payment
collection for undeliverable products.

---

### Unchanged Behavior (Regression Prevention)

3.1 WHEN a Pesapal IPN callback arrives for a completed payment that has already been
finalized (`payment.status = 'completed'`), THEN the system SHALL CONTINUE TO return
idempotent success without creating duplicate orders or download tokens.

3.2 WHEN a logged-in buyer calls `GET /api/orders/:orderId/status` for an order they own,
THEN the system SHALL CONTINUE TO return the order status and download URL with full
authentication and authorization checks applied.

3.3 WHEN a creator's store operates in UGX, KES, or TZS and a customer clicks "Buy Now",
THEN the system SHALL CONTINUE TO create the Pesapal order with the correct existing
country code (UG, KE, or TZ respectively) without regression.

3.4 WHEN a pending order already exists for the same buyer email + product within the last
15 minutes, THEN the system SHALL CONTINUE TO return a 409 "payment still in progress"
error to prevent duplicate order creation.

3.5 WHEN a product is not published or a store is not active, THEN the system SHALL
CONTINUE TO return a 404 "Product is not available for purchase" without leaking internal
details.

3.6 WHEN `finalize_pesapal_payment` is called for a valid completed payment by an
authenticated admin user, THEN the system SHALL CONTINUE TO finalize the payment, credit
creator earnings, and generate a download token successfully.

3.7 WHEN the Pesapal amount returned in the transaction status does not match the stored
order amount, THEN the system SHALL CONTINUE TO reject the payment verification and
return an error, preventing under-payment or fraudulent completion.

---

## Bug Condition Pseudocode

```pascal
// Bug Condition 1: Missing set_app_api_key before finalize
FUNCTION isBugCondition_1(context)
  INPUT: context — the execution context of verifyPesapalPayment
  OUTPUT: boolean
  RETURN set_app_api_key_was_not_called_before_finalize_rpc(context)
END FUNCTION

// Fix Check 1
FOR ALL payment_verification_calls WHERE isBugCondition_1(context) DO
  result ← verifyPesapalPayment'(supabase, merchantReference, trackingId)
  ASSERT result.ok = true AND no_rpc_exception(result)
END FOR

// Preservation Check 1
FOR ALL payment_verification_calls WHERE NOT isBugCondition_1(context) DO
  ASSERT F(call) = F'(call)  // already-processed idempotency preserved
END FOR


// Bug Condition 2: Guest buyer order status check
FUNCTION isBugCondition_2(request)
  INPUT: request — HTTP GET /api/orders/:orderId/status
  OUTPUT: boolean
  RETURN request.auth = null AND request.query.order_id IS NOT NULL
END FUNCTION

// Fix Check 2
FOR ALL status_requests WHERE isBugCondition_2(request) DO
  response ← GET_order_status'(request)
  ASSERT response.status IN (200, 404)  // not 401 or 403
  ASSERT response.body.downloadUrl IS NOT NULL WHEN order.status = 'paid'
END FOR

// Preservation Check 2
FOR ALL status_requests WHERE NOT isBugCondition_2(request) DO
  ASSERT F(request) = F'(request)  // authenticated path unchanged
END FOR


// Bug Condition 3: Rwanda country code mapping
FUNCTION isBugCondition_3(order_input)
  INPUT: order_input — createPesapalOrder input
  OUTPUT: boolean
  RETURN order_input.currency = 'RWF'
END FUNCTION

// Fix Check 3
FOR ALL pesapal_order_calls WHERE isBugCondition_3(input) DO
  billing ← build_billing_address'(input)
  ASSERT billing.country_code = 'RW'
END FOR

// Preservation Check 3
FOR ALL pesapal_order_calls WHERE NOT isBugCondition_3(input) DO
  ASSERT build_billing_address(input) = build_billing_address'(input)
END FOR
```
