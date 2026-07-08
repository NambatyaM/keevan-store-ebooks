# Financial Documentation Template — Keevan Store

**Document Version:** 1.0  
**Date:** July 2026  
**Note:** Actual financial figures should be supplied by the owner. This document provides the framework for financial analysis.

---

## 1. Revenue Model

### 1.1 Current Revenue Streams

| Stream | Description | % of Transaction | Variable? |
|--------|-------------|-----------------|-----------|
| Platform commission | Fee per completed sale | 10% (configurable via `NEXT_PUBLIC_COMMISSION_RATE`) | Yes — env var |

### 1.2 Revenue Calculation

```
Transaction Value = Product Price (set by creator)
Platform Fee = Transaction Value × Commission Rate
Creator Earnings = Transaction Value - Platform Fee

Example (10% commission, UGX 25,000 product):
  Platform Fee = 25,000 × 0.10 = UGX 2,500
  Creator Earnings = 25,000 - 2,500 = UGX 22,500
```

### 1.3 Potential Revenue Streams (Not Implemented)

| Stream | Description | Priority |
|--------|-------------|----------|
| Subscription plans | Monthly/annual fees for creators (e.g., premium features) | High |
| Featured listings | Promoted products in discovery | Medium |
| Transaction fee increase | Tiered pricing based on volume | Medium |
| Affiliate commissions | Percentage of sales from affiliates | Low |
| White-label licenses | Custom platform instance for large creators | Low |

---

## 2. Cost Structure

### 2.1 Infrastructure Costs (Estimated)

| Service | Plan | Estimated Monthly Cost | Purpose |
|---------|------|----------------------|---------|
| **Vercel** | Pro ($20/month) | $20.00 | Hosting, serverless functions, edge network |
| **Supabase** | Pro ($25/month) | $25.00 | Database (PostgreSQL), Auth, Storage |
| **Resend** | Free/Pro | $0–$25.00 | Email delivery (100/day free, then $0.001/email) |
| **Sentry** | Free/Team | $0–$26.00 | Error monitoring (5k events/month free) |
| **Pesapal** | Per-transaction | Variable | Payment processing fees |

**Estimated Base Infrastructure:** **$45–$96/month** (pre-scale)

### 2.2 Per-Transaction Costs

| Cost Component | Rate | Paid By |
|----------------|------|---------|
| Pesapal transaction fee | ~2–3.5% + fixed fee (varies by country/method) | Platform or Creator (configurable) |
| Platform commission | 10% | Creator |
| Email sending | ~$0.001/email (Resend) | Platform |

### 2.3 Fixed Operational Costs

| Cost Item | Estimated Monthly | Notes |
|-----------|-----------------|-------|
| Domain registration (keevanstore.in) | ~$1–$3/year | Annual renewal |
| SSL certificate | Included with Vercel | Free |
| DNS (Vercel) | Included | Free |
| Developer maintenance | `[INSERT]` | Hours/month for updates, bug fixes |
| Customer support | `[INSERT]` | Hours/month for user support |

---

## 3. Operating Cost Estimation Template

### 3.1 Monthly Operating Expenses

| Category | Item | Cost | Variable? |
|----------|------|------|-----------|
| **Hosting** | Vercel Pro | $20.00 | Fixed |
| **Database** | Supabase Pro | $25.00 | Fixed (scales with usage) |
| **Email** | Resend | `[INSERT]` | Variable (per email) |
| **Monitoring** | Sentry | `[INSERT]` | Variable (per event) |
| **Payment Gateway** | Pesapal fees | `[INSERT]` | Variable (per transaction) |
| **Development** | Maintenance | `[INSERT]` | Variable |
| **Support** | Customer support | `[INSERT]` | Variable |
| **Marketing** | Advertising, content | `[INSERT]` | Variable |
| **Legal & Admin** | Compliance, accounting | `[INSERT]` | Fixed |
| **Total Estimated** | | **$45+** | |

### 3.2 Break-Even Analysis Template

| Metric | Value |
|--------|-------|
| Monthly fixed costs | `[INSERT]` |
| Average transaction value | `[INSERT]` |
| Average platform fee per transaction (10%) | `[INSERT]` |
| Variable cost per transaction | `[INSERT]` |
| Net revenue per transaction | `[INSERT]` |
| Transactions required to break even (monthly) | `[INSERT]` |
| Monthly revenue needed to break even | `[INSERT]` |

**Break-even formula:**
```
Break-even (transactions) = Monthly Fixed Costs / (Avg Platform Fee - Variable Cost Per Transaction)
```

---

## 4. Subscription Plan Options (Not Implemented)

| Plan | Price | Features |
|------|-------|----------|
| **Free** | Free | 10 products, 4 MB limit, 10% commission |
| **Creator** | $5/month | Unlimited products, 8 MB limit, 5% commission |
| **Pro** | $15/month | Unlimited products, 50 MB limit, 2% commission, analytics export, priority support |

---

## 5. Financial Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| **Payment gateway dependency** | Single point of failure (Pesapal only) | Integrate alternative gateway (Flutterwave, Intasend) |
| **Currency fluctuation** | Revenue devaluation in local currencies | Maintain USD-denominated reserves |
| **Low transaction volume** | Insufficient to cover fixed costs | Aggressive creator acquisition, reduce overhead |
| **Fraud/chargebacks** | Revenue loss + operational overhead | Three-way verification, IPN webhook, atomic finalization |
| **Commission rate sensitivity** | Creators may leave if rate too high | Benchmark against competitors, offer tiered pricing |
| **Regulatory changes** | New digital commerce regulations in East Africa | Legal counsel, compliance monitoring |
| **Infrastructure cost scaling** | Costs grow with user base | Serverless architecture minimizes idle costs |

---

## 6. Growth Assumptions Template

| Assumption | Conservative | Moderate | Aggressive |
|------------|-------------|----------|------------|
| Monthly new creator signups | `[INSERT]` | `[INSERT]` | `[INSERT]` |
| Monthly new buyer signups | `[INSERT]` | `[INSERT]` | `[INSERT]` |
| Avg transaction value | `[INSERT]` | `[INSERT]` | `[INSERT]` |
| Transactions per creator/month | `[INSERT]` | `[INSERT]` | `[INSERT]` |
| Monthly active creators (12mo) | `[INSERT]` | `[INSERT]` | `[INSERT]` |
| Monthly revenue (12mo) | `[INSERT]` | `[INSERT]` | `[INSERT]` |
| Time to profitability | `[INSERT]` | `[INSERT]` | `[INSERT]` |

---

## 7. Financial Projections Template

### Year 1 Projection

| Month | Creators | Transactions | Gross Volume | Platform Fees | Costs | Net Revenue |
|-------|----------|-------------|-------------|--------------|-------|-------------|
| 1 | `[INSERT]` | `[INSERT]` | `[INSERT]` | `[INSERT]` | `[INSERT]` | `[INSERT]` |
| 3 | `[INSERT]` | `[INSERT]` | `[INSERT]` | `[INSERT]` | `[INSERT]` | `[INSERT]` |
| 6 | `[INSERT]` | `[INSERT]` | `[INSERT]` | `[INSERT]` | `[INSERT]` | `[INSERT]` |
| 12 | `[INSERT]` | `[INSERT]` | `[INSERT]` | `[INSERT]` | `[INSERT]` | `[INSERT]` |

---

## 8. Actual Transaction Data

| Metric | Value |
|--------|-------|
| Total successful transactions | **3** |
| Total successful deliveries | **3** |
| Total creators onboarded | **13** |
| Total buyers onboarded | **2** |
| Payment success rate | **100%** (3/3) |
| Download completion rate | **100%** (3/3) |
| Refund rate | **0%** (0/3) |

---

## 9. Valuation Considerations

| Factor | Assessment |
|--------|-----------|
| Revenue multiple | `[INSERT]` (typical SaaS: 5–10x ARR) |
| User base multiple | `[INSERT]` (typical marketplace: $50–$100 per active user) |
| Technology valuation | Modern full-stack, well-tested, documented codebase |
| Strategic value | First-mover in underserved East African creator economy |
| Competitive positioning | No direct regional competitors |
| Growth potential | Large addressable market, early stage |
| Proven transaction flow | 3 successful end-to-end payments and deliveries validated |

---

*This document is a framework. All `[INSERT]` values should be populated by the owner using actual platform data and financial records.*
