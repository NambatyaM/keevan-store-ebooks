# Product Overview — Keevan Store

**Document Version:** 1.0  
**Date:** July 2026

---

## 1. Platform Introduction

Keevan Store is a specialized e-commerce platform enabling East African digital creators to sell digital products (e-books, guides, templates, documents) directly to customers through branded storefronts. The platform handles the complete transaction lifecycle: product listing, file storage, payment processing (via Pesapal mobile money/card), secure file delivery, and withdrawal management.

The platform serves three distinct user roles, each with a tailored interface and capabilities:

- **Creators** — Publish and manage digital products, track sales and earnings, process withdrawals
- **Buyers** — Browse storefronts, purchase products, download purchases, request refunds
- **Admins** — Moderate the platform, process withdrawals and refunds, manage users, view analytics

---

## 2. Complete Feature Inventory

### 2.1 Authentication & Account Management

| Feature | Description | Status |
|---------|-------------|--------|
| Creator registration | Email + password signup with store handle generation | Complete |
| Buyer registration | Email + password signup for purchase tracking | Complete |
| Login/Logout | Session-based auth with Supabase SSR | Complete |
| Password reset | Email-based reset flow | Complete |
| Password update | Post-login password change | Complete |
| Auth middleware | Role-based route protection (admin/creator/buyer/public) | Complete |
| Session management | Cookie-based SSR sessions | Complete |
| Store handle availability check | Real-time availability via API | Complete |

### 2.2 Creator Features

| Feature | Description | Status |
|---------|-------------|--------|
| Branded storefront | Each creator gets a dedicated store at `/store/[handle]` | Complete |
| Store profile editing | Name, description, tagline, category, social links | Complete |
| Store currency selection | UGX, KES, TZS, RWF, USD (locked after first paid order) | Complete |
| Product creation | Title, slug, description, price, status, file upload | Complete |
| Product editing | Full edit capability including file replacement | Complete |
| Product deletion | Removes product + associated storage files | Complete |
| File upload | PDF, EPUB, MOBI, ZIP with magic-byte validation (max 4 MB) | Complete |
| Cover image upload | JPEG, PNG, WebP with validation (max 2 MB) | Complete |
| Product listing | Grid/list view with search and status filtering | Complete |
| Order management | View orders with buyer details and status | Complete |
| Sales analytics | Revenue charts, trends, product performance | Complete |
| Earnings tracking | Gross revenue, platform fee, net earnings | Complete |
| Withdrawal requests | Request payouts (mobile money) with minimum thresholds | Complete |
| First-sale guide | Onboarding page for new creators with no sales yet | Complete |
| Dashboard | Overview stats: products, orders, earnings, visitors | Complete |

### 2.3 Customer/Buyer Features

| Feature | Description | Status |
|---------|-------------|--------|
| Storefront browsing | Browse creator's products on branded page | Complete |
| Product detail view | Full product info with cover image, description, price | Complete |
| Checkout flow | Name, email, phone form → Pesapal redirect | Complete |
| Payment processing | Pesapal (mobile money: MTN, M-Pesa, Airtel Money; cards) | Complete |
| Order success page | Post-payment confirmation with status polling | Complete |
| Instant download | Download digital product immediately after payment | Complete |
| Order lookup | Check order status by providing details | Complete |
| Refund requests | Submit refund requests for admin review | Complete |
| Payment verification | Three-way payment status verification | Complete |
| Product reviews | Leave ratings (1-5) and comments on purchased products | Complete |

### 2.4 Admin Features

| Feature | Description | Status |
|---------|-------------|--------|
| Dashboard | Platform overview with key metrics | Complete |
| Creator management | List, view, and manage creator accounts | Complete |
| Buyer management | List and view buyer accounts | Complete |
| Product moderation | View all products, disable/reactivate | Complete |
| Order management | View all orders, order details, mark as paid | Complete |
| Store management | List stores, suspend/reactivate | Complete |
| Withdrawal processing | Approve/reject/mark-paid withdrawal requests | Complete |
| Refund workflow | Approve/reject refund requests with notes | Complete |
| Sales reports | Historical sales data and trends | Complete |
| Email queue management | View pending/sent/failed emails, manually process | Complete |
| Audit log | Track all admin actions | Complete |
| System settings | Configure platform-level settings | Complete |
| Reports | Comprehensive platform analytics | Complete |

### 2.5 Payment & Financial Features

| Feature | Description | Status |
|---------|-------------|--------|
| Pesapal integration | Complete payment gateway integration | Complete |
| Mobile money support | MTN, M-Pesa, Airtel Money via Pesapal | Complete |
| Card payments | Credit/debit card support via Pesapal | Complete |
| Multi-currency pricing | Per-store currency: UGX, KES, TZS, RWF, USD | Complete |
| Platform commission | Configurable percentage per transaction | Complete |
| Earnings calculation | Automatic split: platform fee + creator earnings | Complete |
| Withdrawal system | Creator-initiated with admin approval workflow | Complete |
| Discount system | Percentage-based discounts per product with date ranges | Complete |
| Payment verification | Three-way server-side payment confirmation | Complete |
| IPN webhook | Real-time payment status updates | Complete |
| Payment status polling | Client-side polling for checkout success | Complete |
| Atomic payment finalization | Concurrent-safe payment processing | Complete |

### 2.6 File Management & Delivery

| Feature | Description | Status |
|---------|-------------|--------|
| Secure file storage | Supabase Storage (products: private, covers: public) | Complete |
| Magic-byte validation | File content verification (not just extension) | Complete |
| Multi-format support | PDF, EPUB, MOBI, ZIP for products | Complete |
| Image format support | JPEG, PNG, WebP for covers | Complete |
| File size limits | 4 MB products, 2 MB covers | Complete |
| Signed download URLs | 60-second TTL for secure delivery | Complete |
| Download tracking | Analytics event on each download | Complete |
| File cleanup on delete | Automatic storage file removal with product deletion | Complete |

### 2.7 Security Features

| Feature | Description | Status |
|---------|-------------|--------|
| Row-Level Security | All tables have RLS policies enforced | Complete |
| CSRF protection | Origin/referer validation on state-changing requests | Complete |
| Rate limiting | 120 requests/min/IP (configurable) | Complete |
| Role-based access | Middleware enforces admin/creator/buyer/public routes | Complete |
| Session management | Supabase SSR cookie-based auth | Complete |
| Input validation | Zod schemas on all API endpoints | Complete |
| File validation | Magic-byte content verification | Complete |
| Secure downloads | Signed URLs with 60-second expiry | Complete |
| Error monitoring | Sentry (client, server, edge) | Complete |
| Audit logging | All admin actions logged | Complete |
| Security contact | `security.txt` endpoint | Complete |
| Atomic operations | Database-level locking for payment finalization | Complete |

### 2.8 Notification & Communication

| Feature | Description | Status |
|---------|-------------|--------|
| Transactional emails | Welcome, purchase confirmation, order notification | Complete |
| Email queue system | DB-queued with retry (max 3 attempts) | Complete |
| Email cron processing | Daily cron job to process pending emails | Complete |
| Dual email transport | Resend API (primary) + SMTP/Nodemailer (fallback) | Complete |
| Email templates | HTML templates for all email types | Complete |
| WhatsApp support | Floating WhatsApp button for customer support | Complete |
| Toast notifications | In-app notification system | Complete |
| Cookie consent | GDPR-compliant cookie consent banner | Complete |

### 2.9 Analytics & Tracking

| Feature | Description | Status |
|---------|-------------|--------|
| Product view tracking | Anonymous, deduplicated view counting | Complete |
| Sales analytics | Revenue charts with daily/weekly trends | Complete |
| Earnings breakdown | Gross revenue, platform fees, net earnings | Complete |
| Analytics events | Store views, product views, purchases, downloads | Complete |
| Analytics summary | Aggregated metrics API | Complete |
| Vercel Analytics | Built-in Vercel Speed Insights | Complete |
| Vercel Speed Insights | Performance monitoring | Complete |

### 2.10 SEO & Discovery

| Feature | Description | Status |
|---------|-------------|--------|
| Dynamic sitemap | Auto-generated sitemap.xml | Complete |
| Robots.txt | Custom robots.txt generation | Complete |
| SEO metadata | Per-page meta tags with Open Graph | Complete |
| JSON-LD structured data | Product schema for search engines | Complete |
| LLM optimization | `llms.txt`, `llms-full.txt`, `ai.json` for AI/GEO | Complete |
| Google Search Console | Verification meta tag configured | Complete |
| Open Graph images | Custom OG image for social sharing | Complete |

---

## 3. Creator Workflow

```
1. Sign Up → Create account (email + password, choose store handle)
2. Create Store → Set up store name, description, tagline, currency
3. Upload Product → Upload file (PDF/EPUB/MOBI/ZIP), add cover image, set title/description/slug/price
4. Publish → Set status to "published" (admin moderation: all new products start as "draft")
5. Promote → Share storefront URL (`/store/[handle]`) with audience
6. Receive Orders → View orders in dashboard, see earnings accumulate
7. Withdraw → Request withdrawal when balance exceeds minimum threshold
8. Admin approves → Funds disbursed via mobile money
```

## 4. Customer Workflow

```
1. Visit Store → Browse creator's storefront at `/store/[handle]`
2. View Product → See product details, description, cover, price
3. Purchase → Enter name, email, phone → Redirected to Pesapal
4. Pay → Mobile money (MTN/M-Pesa/Airtel) or card via Pesapal gateway
5. Success → Returned to platform → Download instantly available
6. Download → Click download link (signed URL, 60s TTL)
7. Optional: → Leave a review or request a refund if needed
```

## 5. Admin Workflow

```
1. Dashboard → View platform metrics at a glance
2. Creators → Verify/manage creator accounts
3. Products → Moderate published products (disable if policy violated)
4. Orders → Monitor all transactions, handle edge cases
5. Withdrawals → Approve/reject/pay creator withdrawal requests
6. Refunds → Review and approve/reject customer refunds
7. Stores → Suspend/reactivate creator stores
8. Settings → Configure platform parameters
9. Audit Log → Review all admin actions
10. Emails → Monitor email queue health
```

## 6. Current Limitations

| Limitation | Detail | Impact |
|------------|--------|--------|
| **Digital products only** | No physical goods, services, or event tickets | Limits creator types |
| **File size limit** | 4 MB for products, 2 MB for covers | Excludes video, audio, large software |
| **Limited file formats** | PDF, EPUB, MOBI, ZIP only | Excludes video (MP4), audio (MP3), software (.exe, .dmg) |
| **Single payment gateway** | Pesapal only | No redundancy; single point of failure |
| **No subscription billing** | One-time purchases only | No recurring revenue model |
| **No centralized marketplace** | No cross-store search or discovery | Relies on creator self-promotion |
| **No mobile app** | Web-only experience | Limited mobile engagement |
| **No API for third parties** | No public API | No ecosystem/extension development |
| **UGX-only currency constraint** | Products table `currency` column defaults to 'UGX' with constraint `currency = 'UGX'` | All products priced in UGX, regardless of store currency setting |
| **No multi-language support** | English-only UI | Excludes non-English-speaking creators/buyers |
| **No tax handling** | No VAT/sales tax calculation or invoicing | Creators responsible for tax compliance |
| **Manual withdrawal processing** | Admin must manually approve and mark withdrawals as paid | Operational overhead |

---

*This document is based entirely on the actual Keevan Store codebase as of July 2026.*
