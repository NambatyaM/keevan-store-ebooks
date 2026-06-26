# Database Backup & Restore

## Automated Backups (Supabase Pro)

Supabase Pro plan includes daily automated backups with 7-day retention.

### View Available Backups

1. Go to Supabase Dashboard → Database → Backups
2. Select a backup from the list
3. Click **Restore** to restore to a new database instance

### Manual Backup via CLI

```bash
# Requires pg_dump (PostgreSQL client tools)
pg_dump --no-owner --no-acl \
  --dbname "$DATABASE_URL" \
  --file=backup-$(date +%Y%m%d).sql
```

### Manual Backup via Supabase Dashboard

1. Go to Supabase Dashboard → Database → Backups
2. Click **Download backup** to download the latest backup

## Restore Procedures

### Restore to Local Development

```bash
# Create a fresh database
createdb keevan_store_local

# Restore from backup
psql -d keevan_store_local -f backup-20260626.sql

# Run any migrations newer than the backup
npm run migrate
```

### Restore to Supabase (Point-in-Time)

1. Go to Supabase Dashboard → Database → Backups
2. Click **Restore** and follow the prompts
3. After restore, update `NEXT_PUBLIC_SUPABASE_URL` in your project

### Restore via CLI (to existing Supabase project)

```bash
# WARNING: This overwrites the target database
psql "$DATABASE_URL" -f backup-20260626.sql

# Verify restoration
psql "$DATABASE_URL" -c "SELECT count(*) FROM users;"
```

## RPO & RTO

| Metric | Value |
|---|---|
| Recovery Point Objective | 24 hours (daily backup) |
| Recovery Time Objective | ~30 minutes (standard restore) |
| Retention | 7 days (Supabase Pro) |

## Critical Tables

Ensure these tables are verified after every restore:

- `users` — contains admin accounts
- `stores` — store configurations
- `products` — product data
- `orders` + `payments` — financial records
- `creator_earnings` — creator balances
- `withdrawal_requests` — withdrawal lifecycle
- `refunds` — refund lifecycle
- `email_queue` — pending email notifications (may need reprocessing)
- `rate_limits` — rate limit counters (safe to clear)
- `admin_logs` — audit trail

## Post-Restore Checklist

1. [ ] Verify admin users can log in
2. [ ] Check recent orders and payments are intact
3. [ ] Verify creator balances match expectations
4. [ ] Test a refund request flow
5. [ ] Process any pending email queue items via POST /api/emails/process
6. [ ] Clear `rate_limits` table (optional, prevents stale blocks)
7. [ ] Update `NEXT_PUBLIC_SITE_URL` if domain changed
