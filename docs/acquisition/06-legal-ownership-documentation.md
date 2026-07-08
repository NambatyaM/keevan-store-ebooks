# Legal & Ownership Documentation — Keevan Store

**Document Version:** 1.0  
**Date:** July 2026

---

## 1. Intellectual Property Ownership

### 1.1 Source Code

| Asset | Owner | Details |
|-------|-------|---------|
| Application source code | `[INSERT OWNER]` | Complete Next.js 15 application codebase |
| Database migrations | `[INSERT OWNER]` | 29 SQL migration files |
| API implementations | `[INSERT OWNER]` | ~52 API route handlers |
| Frontend components | `[INSERT OWNER]` | 90+ page and component files |
| Test suite | `[INSERT OWNER]` | 27 test files with 609+ tests |
| Documentation | `[INSERT OWNER]` | 15+ documentation files |

All source code is owned by the project owner unless otherwise specified. No external contributors have made commits to the repository (all commits are from the owner).

### 1.2 Branding & Design

| Asset | Owner | Details |
|-------|-------|---------|
| Brand name "Keevan Store" | `[INSERT OWNER]` | Brand identity |
| Logo (keevan-logo.png, logo.svg) | `[INSERT OWNER]` | SVG/PNG brand marks |
| Favicon (keevan-favicon.png, favicon.svg) | `[INSERT OWNER]` | Browser icon |
| Brand design tokens | `[INSERT OWNER]` | Colors (brand-green #00854A, gold #F5A623, mist #F0FDF4, ink #18211d) |
| Brand fonts | `[INSERT OWNER]` | Georgia/Times New Roman serif, system-ui sans |
| Landing page hero image (hero.webp) | `[INSERT OWNER]` | Marketing asset |
| Open Graph image (og-image.png) | `[INSERT OWNER]` | Social share image |

---

## 2. Domain Ownership

| Domain | Registrar | Expiry | Status |
|--------|-----------|--------|--------|
| `keevanstore.in` | `[INSERT REGISTRAR]` | `[INSERT DATE]` | Active — transferred as part of acquisition |

**Action required:** The owner should confirm domain registrar, renewal date, and transfer process.

---

## 3. Open-Source Software Licenses

The following open-source dependencies are used. The application codebase itself is proprietary.

### 3.1 Core Framework Dependencies

| Package | License | Usage |
|---------|---------|-------|
| Next.js 15 | MIT | Application framework |
| React 19 | MIT | UI library |
| TypeScript | Apache-2.0 | Programming language |
| Tailwind CSS 3 | MIT | CSS framework |
| Vitest | MIT | Test framework |

### 3.2 Third-Party Libraries

| Package | License | Usage |
|---------|---------|-------|
| @supabase/ssr | Apache-2.0 | SSR authentication |
| @supabase/supabase-js | Apache-2.0 | Database client |
| zod | MIT | Schema validation |
| @sentry/nextjs | MIT | Error monitoring |
| recharts | MIT | Chart visualization |
| react-hot-toast | MIT | Toast notifications |
| clsx | MIT | Class name utility |
| tailwind-merge | MIT | Tailwind class merging |
| @testing-library/react | MIT | Component testing |
| @testing-library/jest-dom | MIT | DOM testing utilities |
| @vitejs/plugin-react | MIT | Vite React plugin |
| jsdom | MIT | DOM environment for tests |
| k6 (load testing) | AGPL-3.0 | Load testing scripts |

### 3.3 License Compliance

- **MIT license:** Freely usable, requires attribution
- **Apache-2.0:** Freely usable, requires notice retention
- **AGPL-3.0 (k6):** Used only as a development tool (testing scripts in `/k6`), not linked into the application

---

## 4. Third-Party Service Agreements

| Service | Contract Type | Transferable? | Notes |
|---------|--------------|---------------|-------|
| Vercel | SaaS subscription | Yes | Pro plan; account ownership transfer |
| Supabase | SaaS subscription | Yes | Pro plan; project ownership transfer |
| Pesapal | API integration | Yes | Developer account transfer required |
| Resend | SaaS subscription | Yes | Account ownership transfer |
| Sentry | SaaS subscription | Yes | Account ownership transfer |
| GitHub | Free tier | Yes | Repository transfer |
| Google Search Console | Free | Yes | Property ownership transfer |
| Namecheap/GoDaddy/etc. | Domain registrar | Yes | Domain transfer |

---

## 5. Privacy & Data Protection

### 5.1 Data Collected

| Data Type | Collected? | Purpose | Storage |
|-----------|-----------|---------|---------|
| Email addresses | Yes | Authentication, order confirmation | Supabase DB |
| Full names | Yes | Creator/buyer identification | Supabase DB |
| Phone numbers | Yes | Payment processing (Pesapal), WhatsApp support | Supabase DB |
| Payment data | Yes (via Pesapal) | Transaction processing | Pesapal servers (PCI-compliant) |
| IP addresses | Yes (in logs) | Rate limiting, analytics | Supabase DB |
| Browser/device info | Yes | Analytics, error tracking | Vercel Analytics, Sentry |
| Cookies | Yes | Authentication sessions | Supabase SSR cookies |

### 5.2 Privacy Features

| Feature | Status | Details |
|---------|--------|---------|
| Cookie consent banner | Implemented | GDPR-compliant cookie consent component |
| Privacy policy | Implemented | `/privacy` page |
| Data portability | Not implemented | No bulk data export feature |
| Data deletion | Partial | User can delete through admin; no self-service deletion |
| Cookie management | Basic | Consent banner only |

### 5.3 Compliance Considerations

| Regulation | Applicable? | Status |
|-----------|-------------|--------|
| GDPR (EU) | Partial — if EU users access | Privacy policy exists; consent banner implemented |
| DPA (Uganda) | Yes — primary market | Requires assessment |
| Data Protection Act (Kenya) | Yes — secondary market | Requires assessment |
| POPIA (South Africa) | No — not primary market | Not applicable |
| PCI DSS | Partial — through Pesapal | Pesapal is PCI-compliant gateway; platform does not store card data |

**Recommendation:** Engage legal counsel to assess compliance with East African data protection laws before launch.

---

## 6. Compliance Checklist

### 6.1 Required Before Launch

- [ ] Register as a data controller in Uganda (per DPA 2019)
- [ ] Register as a data controller in Kenya (per Data Protection Act 2019)
- [ ] Publish clear Terms of Service (existing in codebase)
- [ ] Publish clear Privacy Policy (existing in codebase)
- [ ] Publish Refund Policy (existing in codebase)
- [ ] Implement cookie consent (existing)
- [ ] Establish data breach notification procedure
- [ ] Register with Uganda Registration Services Bureau (URSB)
- [ ] Obtain tax registration (URA for Uganda, KRA for Kenya)
- [ ] Implement age verification / parental consent for minors

### 6.2 Recommended for Operations

- [ ] Terms of Service acceptance tracking (signup flow)
- [ ] Data processing agreement with Vercel, Supabase, etc.
- [ ] Records of processing activities (Article 30 GDPR equivalent)
- [ ] Data Protection Impact Assessment (DPIA)
- [ ] Appoint Data Protection Officer (DPO)
- [ ] Establish customer complaint handling procedure
- [ ] Implement data retention and deletion schedules
- [ ] Security incident response plan

---

## 7. Transferable Assets

| Asset | Transferable? | Transfer Method |
|-------|--------------|-----------------|
| Source code (GitHub) | Yes | Repository transfer or clone |
| Domain (keevanstore.in) | Yes | Registrar transfer |
| Vercel account | Yes | Account transfer |
| Supabase project | Yes | Project transfer or migration |
| Pesapal integration | Yes | API credential transfer |
| Resend account | Yes | Account ownership |
| Sentry project | Yes | Project ownership |
| Brand assets | Yes | File transfer |
| Database | Yes | Export/import |
| Storage files | Yes | Supabase Storage transfer |

---

## 8. Items Excluded from Acquisition (Typical)

The following are typically excluded or need separate agreement:

- Personal accounts of the owner (email, social media)
- Personal computers and devices used for development
- Pre-existing intellectual property not related to the platform
- Tax losses and credits (jurisdiction-specific)
- Contracts with creators/buyers (need novation or assignment)

---

## 9. Recommended Legal Due Diligence Checklist

- [ ] Verify code ownership (commits, contribution agreements)
- [ ] Audit all third-party dependencies for license compliance
- [ ] Confirm domain ownership and renewal status
- [ ] Review terms of service for all integrated APIs (Vercel, Supabase, Pesapal, Resend, Sentry)
- [ ] Verify no infringing assets (images, fonts, icons)
- [ ] Review data processing agreements with sub-processors
- [ ] Assess compliance with applicable data protection laws
- [ ] Review any existing creator/buyer contracts or terms
- [ ] Confirm trademark availability for "Keevan Store"
- [ ] Review employment/contractor status of developers
- [ ] Audit security measures (penetration testing report)
- [ ] Review payment gateway agreement and fee structure
- [ ] Check domain trademark availability in target markets
- [ ] Verify no outstanding legal claims or disputes
- [ ] Review insurance coverage (cyber liability, professional indemnity)

---

*This document provides a framework for legal due diligence. Legal counsel should be engaged for formal advice on all matters discussed.*
