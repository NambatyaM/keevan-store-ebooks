# User Flow Validation

## Creator Flow

Register -> Create Store -> Upload Product -> Publish Product -> Share Product -> Receive Sales -> Request Withdrawal

This flow is supported by Supabase Auth, store APIs, product APIs, payment verification, order recording, analytics, and withdrawal APIs. Creator actions must be authenticated and authorized through Supabase Row Level Security.

## Customer Flow

Visit Product -> Purchase Product -> Pay via Pesapal -> Payment Verified -> Download Unlocked -> (Optional) Request Refund if unsatisfied

Customer checkout starts a Pesapal order. Downloads are created only after payment verification and are delivered through signed Supabase Storage URLs.

## Admin Flow

Review Platform -> Review Withdrawals -> Approve Payments -> Moderate Content -> Manage Creators

Admin APIs require an authenticated admin role and write audit records to `admin_logs`.

## Refund Flow

Customer visits /request-refund → enters email → selects a paid order → submits reason → Admin reviews at /admin/refunds → Admin approves or rejects with notes → If approved: payment reversed via Pesapal, order status set to 'refunded', creator balance deducted, download token invalidated, audit logged, notification sent → If rejected: refund marked rejected, audit logged
