# Product Requirements Document

## Creator Features

- Register, log in, log out, and reset password through Supabase Auth.
- Create, update, and delete a creator store.
- Upload PDF, EPUB, MOBI, and ZIP products up to 4 MB.
- Upload JPG, PNG, and WEBP cover images up to 2 MB.
- Edit, delete, price, publish, and disable products.
- View sales, views, downloads, conversion rate, earnings, and withdrawal history.
- Request withdrawals when available balance is at least 50,000 UGX.

## Customer Features

- View creator stores and product pages without an account.
- Submit buyer details and start Pesapal checkout.
- Receive download access only after payment verification.
- Download through a signed Supabase Storage URL.
- Request a refund by looking up orders via email and submitting a reason.

## Admin Features

- View platform revenue, orders, creators, withdrawals, registrations, and store status.
- Manage creators, stores, products, withdrawals, reports, and settings.
- Approve, reject, and mark withdrawals paid.
- Disable products and suspend stores.
- Record all admin actions in audit logs.
- Review, approve, and reject customer refund requests with admin notes.

## Business Rules

- Platform commission: 10% of each verified sale.
- Creator earnings: 90% of each verified sale.
- Minimum withdrawal: 50,000 UGX.
- Payment verification is required before sale creation, creator balance changes, or download unlock.
- Buyers are not required to create accounts.
- Refunds are processed against the original payment via Pesapal and reverse the creator's earnings.
