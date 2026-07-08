# Acquisition Handover Guide — Keevan Store

**Document Version:** 1.0  
**Date:** July 2026

---

## 1. Assets Transferred

Upon acquisition, the following assets will be transferred to the acquirer:

| Asset Type | Asset | Location | Transfer Method |
|------------|-------|----------|-----------------|
| Source code | Complete application codebase | GitHub repository | Repository transfer or secure archive |
| Database | PostgreSQL database (tables, data, indexes) | Supabase project | Database export/import or project transfer |
| Storage files | Product files, cover images | Supabase Storage | Storage export or bucket transfer |
| Domain | `keevanstore.in` | Domain registrar | Registrar transfer |
| Brand | Logo, favicon, brand assets | `/public/` directory | File transfer |
| Documentation | All documentation files | `/docs/` directory | Repository transfer |
| Test suite | 27 test files (609 tests) | `/lib/__tests__/` | Repository transfer |
| Load tests | k6 scripts | `/k6/` directory | Repository transfer |
| Configuration | Environment variable templates | `.env.example` | Repository transfer |
| CI/CD | GitHub Actions workflows | `.github/workflows/` | Repository transfer |

---

## 2. Source Code Transfer

### 2.1 GitHub Repository Transfer

```bash
# Option A: Transfer repository ownership
# 1. Go to https://github.com/NambatyaM/keevan-store-ebooks
# 2. Settings → Danger Zone → Transfer ownership
# 3. Enter new owner's GitHub username

# Option B: Clone and push to new repository
git clone https://github.com/NambatyaM/keevan-store-ebooks.git keevan-store
cd keevan-store
git remote remove origin
git remote add origin https://github.com/new-owner/new-repository.git
git push -u origin main
```

### 2.2 Code Verification Checklist

- [ ] Verify all files are included (check `.gitignore` for excluded files)
- [ ] Verify Git history is intact
- [ ] Verify all branches are pushed
- [ ] Verify tags are pushed
- [ ] Confirm no secrets in Git history (use `git log --all -S <secret>` to verify)

---

## 3. Infrastructure Transfer

### 3.1 Vercel Transfer

```
Steps:
1. Current owner goes to Vercel Dashboard → Project → Settings → General
2. Transfers project to acquirer's Vercel team
3. Acquirer verifies deployment and configures domain
4. Acquirer adds environment variables
```

**Items to verify after transfer:**
- [ ] All environment variables are re-configured in the new account
- [ ] Domain (keevanstore.in) is pointed to the new Vercel project
- [ ] Cron job is active (vercel.json cron schedule)
- [ ] Vercel Analytics is enabled
- [ ] Vercel Speed Insights is enabled

### 3.2 Supabase Transfer

```
Option A: Project Transfer (Recommended)
1. Current owner goes to Supabase Dashboard → Project → Settings → General
2. Transfers project to acquirer's Supabase organization
3. Acquirer verifies database, auth, and storage

Option B: Database Export/Import
1. Export: supabase db dump -f keevan_store_dump.sql
2. Import: Create new Supabase project → Import SQL dump
3. Re-run migrations for any pending changes: node scripts/migrate.mjs
4. Copy storage files using Supabase CLI or API
```

**Items to verify after transfer:**
- [ ] All RLS policies are intact
- [ ] All triggers and functions are present
- [ ] Auth settings (site URL, redirect URLs) are updated
- [ ] Storage buckets (products, covers) are configured
- [ ] Database connection strings are updated in environment variables

### 3.3 Supabase Storage Transfer

```bash
# Using Supabase CLI
# 1. List bucket contents
supabase storage ls products
supabase storage ls covers

# 2. Download all files (manual per file)
# Or use supabase-js script to list and download

# 3. Upload to new project
# Same script, different endpoint
```

---

## 4. Third-Party Account Transfer

### 4.1 Transfer Checklist

| Service | Account Ownership | Credentials | Transfer Method |
|---------|------------------|-------------|-----------------|
| Supabase | Current owner | `.env.local` | Project transfer |
| Vercel | Current owner | Vercel dashboard | Project transfer |
| Pesapal | Current owner | `.env.local` | API credentials rotation |
| Resend | Current owner | `.env.local` | Account transfer |
| Sentry | Current owner | `.env.local` | Project transfer |
| GitHub | Current owner | Personal account | Repository transfer |
| Domain Registrar | Current owner | Registrar account | Domain push |

### 4.2 Credential Rotation

After transfer, rotate all API keys and secrets:

- [ ] Pesapal consumer key and secret
- [ ] Resend API key
- [ ] Supabase anon key (optional)
- [ ] Supabase service role key
- [ ] SMTP credentials
- [ ] Sentry DSN (if using new Sentry account)
- [ ] CRON_SECRET
- [ ] Admin password

---

## 5. Domain Transfer

### 5.1 Domain (keevanstore.in)

```
Current Status: Active
Registrar: [INSERT REGISTRAR]
Expiry: [INSERT DATE]
DNS Provider: Vercel (default)

Transfer Steps:
1. Unlock domain at current registrar
2. Obtain EPP code (authorization code)
3. Initiate transfer at acquiring registrar
4. Approve transfer request
5. Update DNS nameservers to acquirer's preference
```

### 5.2 DNS Configuration

| Record | Type | Value | Purpose |
|--------|------|-------|---------|
| `@` | A | `76.76.21.21` | Vercel IP (or acquirer's) |
| `www` | CNAME | `cname.vercel-dns.com` | Vercel proxy |
| `mail.keevanstore.in` | CNAME | `resend.net` (or SMTP) | Email sending |

---

## 6. Database Transfer

### 6.1 Database Export

```bash
# Using Supabase CLI
npx supabase db dump --db-url postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres > keevan_store_backup.sql

# Or use pg_dump directly
pg_dump --dbname=postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres --format=custom > keevan_store_backup.dump
```

### 6.2 Database Import

```bash
# Using psql
psql --dbname=postgresql://postgres:[NEW_PASSWORD]@[NEW_HOST]:5432/postgres < keevan_store_backup.sql
```

---

## 7. Deployment Instructions for Acquirer

### 7.1 Initial Setup

```bash
# 1. Clone the repository
git clone <new-repository-url>
cd keevan-store

# 2. Install dependencies
npm install

# 3. Configure environment
cp .env.example .env.local
# Edit with new credentials

# 4. Verify database connection (if using exported database)
# Ensure Supabase URL and keys match the transferred/exported database

# 5. Run any pending migrations
node scripts/migrate.mjs

# 6. Build and test
npm run build
npm test
```

### 7.2 Production Deployment

```bash
# Deploy to Vercel
vercel --prod

# Or via Git push
git push origin main
```

---

## 8. Administrator Onboarding

### 8.1 Initial Admin Access

1. Access the platform at the configured URL
2. Log in with the admin credentials (seeded via `scripts/seed-admin.mjs`)
3. Verify dashboard access
4. Navigate all admin sections to ensure functionality

### 8.2 Admin Familiarization Checklist

- [ ] Review admin dashboard metrics
- [ ] Navigate creator management
- [ ] Navigate buyer management
- [ ] Review product moderation workflow
- [ ] Review order management
- [ ] Process a test withdrawal (if any pending)
- [ ] Review refund workflow
- [ ] Check email queue health
- [ ] Review audit log
- [ ] Check system settings
- [ ] Verify sales reports

---

## 9. Knowledge Transfer Checklist

### 9.1 Technical Knowledge

- [ ] Codebase architecture overview (folders, patterns)
- [ ] Supabase schema and RLS policies
- [ ] Payment flow (Pesapal integration)
- [ ] Email processing pipeline
- [ ] Storage architecture
- [ ] Authentication flow
- [ ] API route patterns
- [ ] Testing strategy and running tests
- [ ] Deployment process
- [ ] CI/CD pipeline

### 9.2 Business Knowledge

- [ ] Platform commission model
- [ ] Creator onboarding process
- [ ] Buyer experience flow
- [ ] Withdrawal processing
- [ ] Refund handling
- [ ] Customer support workflow
- [ ] Current creator base (if any)
- [ ] Marketing channels
- [ ] Competitor landscape

### 9.3 Operational Knowledge

- [ ] Monitoring (Sentry)
- [ ] Error response procedures
- [ ] Backup procedures
- [ ] Incident response plan
- [ ] Performance monitoring
- [ ] Cost monitoring

---

## 10. Post-Sale Support Recommendations

| Period | Support Level | Activities |
|--------|---------------|------------|
| **Week 1** | Full-time availability | Transition support, setup verification, issue resolution |
| **Week 2–4** | Business hours | Documentation clarification, knowledge transfer sessions |
| **Month 2** | On-call | Bug fix guidance, architecture questions |
| **Month 3+** | As-needed | Consultancy for major changes |

---

## 11. Risk Mitigation During Transition

| Risk | Probability | Impact | Mitigation |
|------|------------|--------|------------|
| Data loss during export | Low | Critical | Test export/import on staging first |
| Service downtime during DNS transfer | Medium | High | Reduce TTL before transfer; schedule during low traffic |
| Credential exposure | Low | Critical | Rotate all credentials immediately after transfer |
| Lost documentation context | Medium | Medium | Record handover sessions; document Q&A |
| Payment processing interruption | Low | High | Maintain old credentials until new ones are verified |
| Third-party account access issues | Medium | Medium | List all accounts with recovery contacts |

---

*This document provides a comprehensive guide for transferring the Keevan Store platform to a new owner. All `[INSERT]` values should be completed by the current owner.*
