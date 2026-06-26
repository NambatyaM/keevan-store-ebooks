# Database Architecture

The canonical schema lives in `supabase/migrations/001_initial_schema.sql`.

Core tables:

- `users`
- `creators`
- `stores`
- `products`
- `orders`
- `payments`
- `downloads`
- `withdrawal_requests`
- `analytics_events`
- `admin_logs`
- `refunds`
- `email_queue`

Requirements:

- UUID primary keys on every core entity.
- Foreign keys for user, creator, store, product, order, payment, download, withdrawal, analytics, refund, and admin-log relationships.
- Indexes for public slugs, creator/store lookups, order/payment references, withdrawal status, and analytics reporting.
- Data constraints for commission, upload metadata, statuses, non-negative monetary values, and withdrawal minimums.
- Row Level Security enabled on every table.
