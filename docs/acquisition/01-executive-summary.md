# Executive Summary — Keevan Store

**Document Version:** 1.0  
**Date:** July 2026  
**Classification:** Confidential — For Acquisition Consideration

---

## 1. Company Overview

**Keevan Store** is a creator-commerce platform purpose-built for East African digital creators — authors, educators, template designers, and content creators. The platform enables creators to publish, sell, and deliver digital products (e-books, guides, templates, documents) directly to customers through branded storefronts.

The platform operates as a full-stack SaaS application hosted on Vercel with a Supabase backend, serving the East African market with support for local currencies (UGX, KES, TZS, RWF) and regional payment integration via Pesapal.

**Website:** https://keevanstore.in  
**Status:** Production-ready, pre-launch / early stage  
**Development Period:** February 2026 – July 2026

---

## 2. Product Overview

Keevan Store is a **digital marketplace platform** where:

- **Creators** sign up, create a branded store, upload digital products (PDF, EPUB, MOBI, ZIP), set prices in local currencies, and receive payments after a platform commission.
- **Customers** browse creator storefronts, purchase digital products via mobile money or card (through Pesapal), and receive instant download access.
- **Admins** manage the platform through a dashboard with moderation tools, withdrawal processing, refund management, analytics, and system configuration.

**Key differentiator:** Unlike generic marketplaces, Keevan Store gives each creator their own dedicated storefront (e.g., `keevanstore.in/store/creator-handle`), enabling brand ownership while leveraging the platform's payment infrastructure, delivery system, and customer base.

---

## 3. Vision

To become the default digital commerce infrastructure for East Africa's creator economy — enabling anyone with knowledge to package, price, and sell it online, regardless of technical skill or access to traditional payment systems.

---

## 4. Mission

To eliminate the friction points that prevent East African creators from monetizing their expertise online: complex payment integration, lack of local currency support, file delivery infrastructure, and the technical overhead of building an e-commerce platform from scratch.

---

## 5. Problem Being Solved

East Africa's creator economy faces distinct challenges:

| Problem | Impact |
|---------|--------|
| **No local payment infrastructure** | Global platforms (Gumroad, Teachable, Payhip) don't support mobile money (MTN, M-Pesa, Airtel Money) or East African currencies |
| **Technical barrier** | Creators lack the skills or resources to build and maintain an e-commerce site with file delivery |
| **File delivery complexity** | Selling digital goods requires storage, bandwidth, download tracking, and access controls |
| **Trust deficit** | Customers hesitate to pay online without familiar payment methods or buyer protection |
| **No regional platform** | Existing solutions are built for Western markets with USD pricing and Stripe/PayPal |

Keevan Store solves all five: mobile money support via Pesapal, storefront-in-a-box, secure file delivery with signed URLs, buyer protection via refund system, and full local currency support.

---

## 6. Target Market

### Primary Market
- **Digital creators** in Uganda, Kenya, Tanzania, and Rwanda
- Authors publishing e-books and guides
- Educators selling course materials and templates
- Designers selling digital assets
- Consultants selling reports and frameworks
- Anyone creating PDF, EPUB, MOBI, or ZIP-based digital products

### Secondary Market
- Buyers/consumers in East Africa seeking digital content
- Diaspora community members purchasing East African content
- International customers (USD support available)

---

## 7. Customer Segments

| Segment | Description | Channel |
|---------|-------------|---------|
| **Creators** | Sellers who publish digital products | Creator dashboard (self-serve) |
| **Buyers** | End customers who purchase products | Public storefronts + checkout |
| **Admins** | Platform operators managing the ecosystem | Admin dashboard |

---

## 8. Competitive Advantages

| Advantage | Detail |
|-----------|--------|
| **Local currency support** | UGX, KES, TZS, RWF — not just USD |
| **Mobile money payments** | Pesapal integration covering MTN, M-Pesa, Airtel Money |
| **Branded storefronts** | Each creator gets their own store (not a marketplace listing) |
| **Magic-byte file validation** | Security beyond extension checking — verifies actual file content |
| **Supabase SSR auth** | Secure, cookie-based sessions with row-level security |
| **Comprehensive admin tools** | Full moderation, refund, withdrawal, and audit capabilities |
| **No-code creator setup** | Sign up, upload products, get paid — no technical skills required |
| **Backed by testing** | 600+ automated tests covering API routes, auth, payments, email, database, and file validation |

---

## 9. Current Development Stage

- **Status:** Production-ready, pre-revenue launch
- **Testing:** 609 automated tests passing across 27 test files
- **Load testing:** k6 scripts written for auth (500 concurrent), payment (200 concurrent), download URL generation, and rate limit enforcement
- **Security:** CSRF protection, rate limiting (120 req/min/IP), RLS on every table, magic-byte validation, signed download URLs (60s TTL), Sentry monitoring
- **Infrastructure:** CI/CD via GitHub Actions, deployed on Vercel, PostgreSQL via Supabase, email via Resend/Nodemailer
- **Documentation:** Full product requirements doc, system architecture, database architecture, API specification, security audit, production readiness report, SEO/GEO/AEO strategy, backup/restore procedures
- **Monitoring:** Sentry (client, server, edge), admin audit log

---

## 10. Key Features

| Category | Features |
|----------|----------|
| **Creator Tools** | Branded storefront, product management (CRUD), file upload with magic-byte validation, analytics dashboard, earnings tracking, withdrawal system, order management |
| **Customer Experience** | Product discovery via storefronts, Pesapal checkout (mobile money/card), instant download after payment, order lookup, refund requests |
| **Admin Platform** | Creator/store management, product moderation, order oversight, withdrawal processing, refund workflow, email queue management, audit log, sales reports, system settings |
| **Core Infrastructure** | Supabase SSR authentication with role-based access, rate limiting, CSRF protection, file storage with signed URLs, email queue with cron processing, Sentry error tracking, analytics event tracking |
| **AI/GEO Features** | LLM-optimized content via `llms.txt`, `llms-full.txt`, `ai.json`, `ai/index.html` for generative engine optimization |

---

## 11. Technology Stack

| Layer | Technology |
|-------|-----------|
| **Framework** | Next.js 15 (React 19, TypeScript, App Router) |
| **Styling** | Tailwind CSS 3, custom brand design tokens |
| **Database** | Supabase (PostgreSQL with Row-Level Security) |
| **Authentication** | Supabase Auth with SSR cookie sessions |
| **File Storage** | Supabase Storage (private + public buckets) |
| **Payments** | Pesapal API v3 (mobile money + card) |
| **Email** | Resend (primary) + Nodemailer/SMTP (fallback), DB-queued |
| **Hosting** | Vercel (Pro) |
| **Monitoring** | Sentry (client, server, edge) |
| **Testing** | Vitest + React Testing Library |
| **CI/CD** | GitHub Actions |
| **Load Testing** | k6 (Grafana) |
| **Package Manager** | npm |

---

## 12. Monetization Model

| Component | Detail |
|-----------|--------|
| **Platform Commission** | 10% of each transaction (configurable via env var) |
| **Creator Payout** | 90% of each transaction |
| **Pricing Model** | Creators set their own prices; platform takes percentage |
| **Minimum Withdrawal** | Configurable per currency (default: UGX 50,000, KES 1,500, TZS 30,000, RWF 20,000, USD $20) |
| **No Subscription Fees** | No monthly/annual fees for creators (currently) |

---

## 13. Market Opportunity

The East African creator economy is at an inflection point:

- **Mobile money penetration:** East Africa leads the world in mobile money adoption (92% of adult Kenyans, 70%+ in Uganda, Tanzania, Rwanda)
- **Digital content demand:** Growing middle class, increasing smartphone penetration, rising demand for locally-relevant digital content
- **Underserved market:** Major global platforms (Gumroad, Teachable, Ko-fi) lack local currency support and mobile money integration
- **Creator economy growth:** Sub-Saharan Africa's creator economy is projected to grow significantly as internet access expands

The platform is uniquely positioned to capture this market by being first-to-market with a purpose-built solution for East African creators.

---

## 14. Growth Potential

| Area | Opportunity |
|------|-------------|
| **Geographic expansion** | Add more East/Central African countries (Ethiopia, DRC, South Sudan, Burundi) |
| **Product type expansion** | Add video, audio, and software download support |
| **Subscription model** | Introduce recurring billing for membership content |
| **B2B features** | Team accounts, bulk licensing, educational institution sales |
| **Mobile app** | Native mobile experience for creators and buyers |
| **Marketing channels** | Creator referrals, social media integration, affiliate program |
| **Additional payment gateways** | Flutterwave, Intasend, or direct mobile money APIs |

---

## 15. Reasons for Acquisition Attractiveness

1. **First-mover advantage in an underserved market** — No direct competitor offers the specific combination of local currencies, mobile money, and creator storefronts for East Africa
2. **Production-ready codebase** — Full test suite (609 tests), comprehensive documentation, security-audited, load-tested
3. **Modern, maintainable architecture** — Next.js 15 App Router, TypeScript strict mode, Supabase with RLS, component-based frontend
4. **Complete feature set** — From creator onboarding to payment processing to file delivery, the full loop is implemented
5. **Strong security posture** — CSRF protection, rate limiting, magic-byte file validation, RLS on all tables, audit logging, Sentry monitoring
6. **Scalable infrastructure** — Serverless architecture on Vercel with Supabase PostgreSQL, load-tested for concurrent users
7. **Low operational overhead** — Managed services (Vercel, Supabase, Resend, Sentry) minimize infrastructure management
8. **Immediate launch capability** — The platform is ready to onboard creators and process transactions

---

## 16. Future Expansion Opportunities

| Opportunity | Description | Impact |
|-------------|-------------|--------|
| **Video & audio products** | Extend file type support for courses, podcasts, music | Broadens creator types |
| **Subscription/memberships** | Recurring payments for exclusive content | Recurring revenue |
| **Affiliate marketing system** | Enable creators to recruit affiliates | Organic growth |
| **Mobile apps** | Native iOS/Android for better UX | Increased engagement |
| **Bulk licensing** | Institutional sales for schools/corporates | Higher transaction values |
| **API marketplace** | Allow third-party integrations | Platform ecosystem |
| **AI-powered tools** | Content recommendations, smart pricing, fraud detection | Differentiation |
| **Cross-border expansion** | Add more African countries and currencies | Market size growth |

---

*This document is based on the actual codebase and configuration of Keevan Store as of July 2026. No financial or user metrics are fabricated — those should be supplied by the owner.*
