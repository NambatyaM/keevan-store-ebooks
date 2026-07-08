# Product Roadmap — Keevan Store

**Document Version:** 1.0  
**Date:** July 2026

---

## 1. Feature Completion Inventory

### 1.1 Completed Features

| Feature | Category | Notes |
|---------|----------|-------|
| Creator registration & login | Auth | Full flow with email/password |
| Buyer registration | Auth | Separate signup flow |
| Password reset | Auth | Email-based reset |
| Password update | Auth | Post-login password change |
| Auth middleware | Auth | Role-based route protection |
| Store creation | Creator | Branded storefront per creator |
| Store editing | Creator | Name, description, tagline, category, social links |
| Store currency selection | Creator | UGX, KES, TZS, RWF, USD |
| Product creation | Creator | Title, slug, description, price, file upload |
| Product editing | Creator | Full edit with file replacement |
| Product deletion | Creator | Cascade deletes storage files |
| File upload | Creator | PDF, EPUB, MOBI, ZIP with magic-byte validation |
| Cover image upload | Creator | JPEG, PNG, WebP with magic-byte validation |
| File validation | Security | Magic-byte + extension + MIME triple validation |
| Product listing (creator) | Creator | Grid/list view, search, filter by status |
| Order management (creator) | Creator | View orders with buyer info |
| Sales analytics | Creator | Revenue charts, trends |
| Earnings tracking | Creator | Gross, fees, net |
| Withdrawal requests | Creator | Request payouts with min thresholds |
| Creator dashboard | Creator | Overview stats |
| First-sale guide | Creator | Onboarding for new creators |
| Storefront browsing | Customer | Public store pages |
| Product detail page | Customer | Full product view |
| Checkout form | Customer | Name, email, phone |
| Pesapal payment | Customer | Mobile money + card |
| Order success page | Customer | Post-payment confirmation |
| Download delivery | Customer | Signed URL (60s TTL) |
| Order lookup | Customer | Check order status |
| Refund requests | Customer | Submit for admin review |
| Payment verification | Customer | Three-way verification |
| Product reviews | Customer | Rating + comment |
| Admin dashboard | Admin | Platform overview |
| Creator management | Admin | List and manage creators |
| Buyer management | Admin | List and view buyers |
| Product moderation | Admin | Disable/reactivate |
| Order management | Admin | Full oversight |
| Store management | Admin | Suspend/reactivate |
| Withdrawal processing | Admin | Approve/reject/mark-paid |
| Refund workflow | Admin | Approve/reject with notes |
| Sales reports | Admin | Historical data |
| Email queue management | Admin | Monitor email health |
| Admin audit log | Admin | Track all admin actions |
| System settings | Admin | Platform configuration |
| Analytics reports | Admin | Comprehensive metrics |
| Rate limiting | Infrastructure | 120 req/min/IP |
| CSRF protection | Infrastructure | Origin/referer validation |
| RLS on all tables | Security | Row-level security |
| Supabase SSR auth | Security | Cookie-based sessions |
| Zod validation | Security | Input validation on all endpoints |
| Sentry monitoring | Infrastructure | Client + server + edge |
| Email queue system | Infrastructure | DB-enqueued with retries |
| Email cron processing | Infrastructure | Daily 06:00 UTC |
| Dual email transport | Infrastructure | Resend + SMTP fallback |
| Email templates | Infrastructure | All transactional emails |
| Cookie consent | Compliance | GDPR banner |
| WhatsApp support | Customer | Floating button |
| Google Search Console | SEO | Verification meta tag |
| Dynamic sitemap | SEO | Auto-generated |
| Robots.txt | SEO | Custom configuration |
| Open Graph metadata | SEO | Social sharing |
| JSON-LD structured data | SEO | Product schema |
| LLM optimization | GEO/AEO | llms.txt, llms-full.txt, ai.json |
| Sitemap | SEO | Dynamic generation |
| Multi-currency (store-level) | Localization | UGX, KES, TZS, RWF, USD |
| Phone validation per currency | Localization | Regex patterns per country |
| Analytics events | Analytics | View tracking, deduplication |
| Load testing scripts | Testing | k6 scripts for auth, payment, downloads |
| CI/CD pipeline | Infrastructure | GitHub Actions |
| Vercel deployment | Infrastructure | Production-ready config |
| 27 test files (609 tests) | Testing | Comprehensive coverage |
| Documentation (15+ files) | Documentation | Architecture, API, security, etc. |

### 1.2 Partially Implemented Features

| Feature | Current State | Gap |
|---------|-------------|-----|
| **Multi-currency products** | Stores support multiple currencies, but `products` table has `currency = 'UGX'` constraint | Products always priced in UGX regardless of store currency |
| **Discount system** | Backend fully implemented (CRUD, active query, use counting) | No frontend UI for creating/managing discounts |
| **Cart system** | Backend `cart_items` table and API route exist | No frontend cart component |
| **Buyer dashboard** | Basic page exists at `/buyer` | Minimal content — no purchase history, downloads, or settings |
| **Admin reports** | Report page exists | Content/appearance is basic placeholder |
| **Admin settings** | Settings page exists | Content/appearance is basic placeholder |
| **Notifications** | DB table and API exist; frontend dropdown component exists | Notifications not fully wired into user workflows |
| **Mobile responsiveness** | Tailwind responsive classes used throughout | Not all pages fully optimized for mobile |

### 1.3 Planned Features (Referenced in Codebase)

| Feature | Evidence | Location |
|---------|----------|----------|
| Discount creation UI | API endpoints exist (`/api/discounts`, `/api/discounts/active`) | `app/api/discounts/` |
| Buyer dashboard enhancement | Page exists, minimal content | `app/buyer/dashboard/` |
| Notification integration | Table, API, component exist | `app/api/admin/notifications/`, `components/notifications-dropdown.tsx` |

### 1.4 Future Opportunities (Not Implemented)

| Opportunity | Description | Evidence in Codebase |
|-------------|-------------|---------------------|
| Video/audio products | Extend file type support | No references |
| Subscription/memberships | Recurring billing | No references |
| Mobile apps (native) | iOS/Android | No references |
| Public API | Third-party integration | No references |
| Affiliate system | Referral tracking | No references |
| Marketplace discovery | Cross-store search | No references |
| Bulk licensing | Institutional sales | No references |
| Tax handling | VAT/sales tax | No references |
| Multi-language | i18n support | No references |
| Social login | Google/Facebook OAuth | No references |
| Wishlist | Save for later | No references |
| Coupon codes | Promotional discounts | Separate from product-level discounts |
| Creator onboarding wizard | Guided setup flow | No references |
| Email marketing | Newsletter/marketing emails | Transactional only currently |

---

## 2. Short-Term Roadmap (Next 3 Months)

| Priority | Feature | Effort | Impact | Notes |
|----------|---------|--------|--------|-------|
| **P1** | Fix product currency constraint | Small | High | Remove `currency = 'UGX'` constraint on products table |
| **P1** | Discount management UI | Medium | High | Enable creators to create/configure discounts from dashboard |
| **P1** | Buyer dashboard enhancement | Medium | High | Full purchase history, download access, settings |
| **P1** | Mobile responsiveness audit | Medium | High | Fix all responsive breakpoints across all pages |
| **P2** | Notification system wiring | Medium | Medium | Connect backend notification events to frontend display |
| **P2** | Error boundary improvements | Small | Medium | Add error boundaries to all dashboard sections |
| **P2** | Cart frontend | Medium | Medium | Build checkout cart UI using existing API |
| **P2** | Input sanitization | Small | Medium | Add XSS protection for review/description fields |

---

## 3. Medium-Term Roadmap (3–9 Months)

| Priority | Feature | Effort | Impact |
|----------|---------|--------|--------|
| **P1** | Additional payment gateway (Flutterwave/Intasend) | Large | Very High — payment redundancy |
| **P1** | File size increase (50 MB+ for video/audio) | Medium | High — unlocks new creator types |
| **P1** | Video/audio product support | Large | High — broadens market |
| **P1** | Marketplace discovery page | Medium | High — improves product discovery |
| **P2** | Creator onboarding wizard | Medium | High — improves activation rate |
| **P2** | Social login (Google) | Medium | Medium — reduces signup friction |
| **P2** | Automated withdrawal processing | Medium | Medium — reduces admin overhead |
| **P2** | Creator analytics export | Small | Medium — CSV/PDF reports |

---

## 4. Long-Term Roadmap (9–24 Months)

| Priority | Feature | Effort | Strategic Rationale |
|----------|---------|--------|---------------------|
| **P1** | Subscription/membership products | Large | Recurring revenue stream |
| **P1** | Mobile app (React Native/Flutter) | Very Large | Increased engagement, push notifications |
| **P1** | Geographic expansion (Ethiopia, DRC, South Sudan) | Medium | Market size growth |
| **P2** | Public developer API | Large | Ecosystem development |
| **P2** | Affiliate marketing system | Medium | Organic growth channel |
| **P2** | AI-powered recommendations | Medium | Increased conversion rates |
| **P2** | Bulk/institutional licensing | Medium | Higher transaction values |
| **P3** | Multi-language support | Large | Include non-English-speaking creators |
| **P3** | White-label platform option | Large | Enterprise/B2B revenue |

---

## 5. High-Impact Growth Opportunities

| Opportunity | Estimated Impact | Effort | Why |
|-------------|-----------------|--------|-----|
| **Additional payment gateway** | Very High | Large | Payment redundancy = trust; multiple gateways = higher conversion |
| **Marketplace discovery** | Very High | Medium | Without discoverability, creator acquisition is harder |
| **File size increase** | High | Medium | Unlocks course creators, video sellers, software vendors |
| **Creator onboarding wizard** | High | Medium | Many signups never publish; guided flow improves activation |
| **Mobile optimization** | High | Medium | East Africa is mobile-first; poor mobile UX loses buyers |
| **Discount management UI** | High | Medium | Existing backend has no frontend; enables promotions |
| **Social login** | Medium | Small | Reduces friction; improves conversion |

---

*This roadmap is derived from the actual codebase state. All estimates are relative and should be refined by the development team.*
