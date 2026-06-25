# System Architecture

## Frontend

- Next.js App Router
- React
- TypeScript
- Tailwind CSS

## Backend

- Supabase Auth for user identity.
- Supabase PostgreSQL for relational data.
- Supabase Storage for product files and cover images.
- Supabase Row Level Security for tenant isolation and admin permissions.

## Payments

- Pesapal receives customer checkout.
- Keevan Store's platform-owned Pesapal account receives funds.
- Payment status is verified server-side before orders, earnings, or downloads are unlocked.

## Hosting

- Vercel hosts the Next.js application.
- Supabase hosts database, auth, and storage.

The application must not depend on mock payment or database services in production paths. Demo content may be used only for public preview pages before a Supabase project is connected.
