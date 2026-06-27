# Keevan Store Vision

Keevan Store is a creator-commerce platform for East African authors and digital creators. It is not a marketplace. Creators own individual stores and product pages, then share those links directly with their audiences. The platform serves Uganda, Kenya, Tanzania, and Rwanda.

The platform exists to make e-book selling simple, trustworthy, and fast:

- Creators register, create a store, upload digital products, share product links, track analytics, and request withdrawals.
- Customers visit creator stores, purchase products through Pesapal (mobile money, cards, bank transfer in UGX), and receive instant downloads after server-side payment verification.
- Keevan Store collects every payment through the platform-owned Pesapal account, keeps a 10% commission, credits creator earnings, and pays creators manually after withdrawal approval (minimum 50,000 UGX).

The platform handles refund requests through a structured in-app system: customers submit requests via email-based order lookup at `/request-refund`, admins review and approve/reject with notes at `/admin/refunds`. On approval, the payment is reversed via Pesapal's RefundRequest API, the creator's balance is deducted, and the download token is invalidated.

The platform sends transactional email notifications for order confirmations (download links), withdrawal status changes, and refund status updates via Nodemailer with Supabase SMTP credentials.

Implementation must not route buyer funds directly to creators, expose downloads before payment verification, or turn the product into a marketplace where Keevan Store promotes pooled listings over creator-owned storefronts.

## Technical Foundation

- **Stack:** Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS
- **Backend:** Supabase (PostgreSQL, Auth, Storage with signed URLs, RLS)
- **Payments:** Pesapal (server-side three-way verification)
- **Monitoring:** Sentry error tracking + @vercel/analytics
- **Email:** Nodemailer with queue table and Vercel Cron processing
- **Security:** Rate limiting (Supabase-based), CSRF protection, CSP headers, magic byte file validation, Zod input validation

## Visual Identity

- **Logo:** https://i.ibb.co/v6h94WVG/keevan-favicon.jpg
- **Hero image:** African woman reading/studying with books and laptop (`/hero.webp`)
- **Brand color:** Green (`#00854a`), theme color
