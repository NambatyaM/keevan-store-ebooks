# User Flow Validation

## Creator Flow

Register -> Create Store -> Upload Product -> Publish Product -> Share Product -> Receive Sales -> Request Withdrawal

This flow is supported by Supabase Auth, store APIs, product APIs, payment verification, order recording, analytics, and withdrawal APIs. Creator actions must be authenticated and authorized through Supabase Row Level Security.

## Customer Flow

Visit Product -> Purchase Product -> Pay via Pesapal -> Payment Verified -> Download Unlocked

Customer checkout starts a Pesapal order. Downloads are created only after payment verification and are delivered through signed Supabase Storage URLs.

## Admin Flow

Review Platform -> Review Withdrawals -> Approve Payments -> Moderate Content -> Manage Creators

Admin APIs require an authenticated admin role and write audit records to `admin_logs`.
