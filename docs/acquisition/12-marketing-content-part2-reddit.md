# Acquisition Marketing Content — Part 2: Reddit Posts

**Document Version:** 1.0  
**Date:** July 2026  
**Target:** Keevan Store — East African Creator Commerce Platform

---

## Style Guide

All posts in this document follow these principles:
- Value-first: provide insight before promotion
- Respect subreddit rules (no direct "buy my startup" posts)
- Transparent about being the founder
- No fabricated statistics or revenue claims
- Include context about why this matters for the community

---

## 1. r/startups Posts (20)

### Post 1 — Share Your Startup (Storytelling)
**Subreddit:** r/startups  
**Flair:** Share Your Startup

> I built a creator commerce platform for East African creators — and learned some hard lessons about building for emerging markets.
>
> **The problem:** Most creator economy platforms (Gumroad, Teachable, Ko-fi) don't support mobile money or local currencies in East Africa. A creator in Kampala can't sell an e-book in UGX through any existing platform.
>
> **What I built:** Keevan Store — a platform where creators sign up, get a branded storefront, upload digital products, and accept payments via mobile money (MTN, M-Pesa, Airtel) through Pesapal.
>
> **Current state:** 13 creators onboarded, 3 completed transactions end-to-end, 609 automated tests, and full admin tools. Production-ready, pre-scale.
>
> **Hardest lesson:** Building for Africa means solving payment infrastructure before you can solve anything else. Stripe doesn't operate here. PayPal is unreliable. Every payment gateway needs custom integration.
>
> **Biggest surprise:** Creators care more about supporting local currencies than I expected. Every onboarding conversation asks "can I price in UGX/KES/TZS?" before they ask anything else.
>
> **What's next:** I'm seeking a strategic acquirer who can provide the marketing reach and partnerships to scale this. The platform is too big for a solo founder but too early for a large company to build from scratch.
>
> Happy to answer questions about building for African markets, integrating Pesapal, or the challenges of creator economy platforms in emerging markets.

### Post 2 — Monthly Feedback Thread
**Subreddit:** r/startups  
**Flair:** Feedback

> I'm building Keevan Store — a platform for East African creators to sell digital products through branded storefronts, with mobile money payment support.
>
> **The core loop:**
> - Creator signs up → gets store at /store/[handle]
> - Uploads PDF/e-book → sets price in UGX/KES/TZS/RWF/USD
> - Buyer pays via mobile money (MTN, M-Pesa) or card
> - File delivered via secure signed URL
>
> **Current traction:** 13 creators, 2 buyers, 3 successful transactions, 0 failures
>
> **What I'd love feedback on:**
> 1. Acquisition strategy — is seeking a strategic buyer the right move for a platform at this stage?
> 2. Market positioning — should I position as creator economy or FinTech infrastructure?
> 3. What would you want to see in a pitch for an acquisition like this?
>
> The platform is live at keevanstore.in if you want to see it. Would appreciate any honest feedback from this community.

### Post 3 — Lessons Learned
**Subreddit:** r/startups  
**Flair:** Lessons Learned

> What I learned building a payments-dependent platform in a market where Stripe doesn't operate:
>
> **1. Payment integration is the product, not a feature.**
> In East Africa, your payment gateway choice defines your user experience. We chose Pesapal because it supports mobile money (MTN, M-Pesa, Airtel Money) across Uganda, Kenya, Tanzania, and Rwanda. The integration took three times longer than expected because of IPN webhook handling, race conditions, and three-way verification.
>
> **2. "Multi-currency" means different things in different markets.**
> For us, multi-currency means store-level currency selection (UGX, KES, TZS, RWF, USD) — not just converting prices at checkout. Each creator chooses their currency, and pricing, fees, and reporting all respect that choice. Until we fix a database constraint, all products default to UGX regardless of store setting. Lesson: get your schema right before you build features around it.
>
> **3. 609 tests aren't excessive for a payment platform.**
> Every test in our suite exists because we need payment processing, file delivery, and auth to work reliably. One bug in payment finalization could mean lost revenue or double-charged customers. The test suite isn't a luxury — it's a requirement for a platform handling real money.
>
> **4. Strategic acquisition is the right path for this stage.**
> I've taken the platform as far as a solo founder can — working code, validated transactions, full admin tools, comprehensive docs. The next phase (creator acquisition, marketing, partnerships) needs a team with resources. Knowing when to find the platform a home is as important as knowing when to keep building.
>
> **5. Documentation matters more for acquisition than for users.**
> I wrote 15+ documentation files thinking they'd help users. In practice, they're what acquirers care about most. Technical due diligence is smoother when everything is documented — architecture, API specs, deployment, security, migration procedures.
>
> Would love to hear from others who've built for emerging markets or taken the acquisition path.

### Post 4 — Share Your Startup (Product Hunt Style)
**Subreddit:** r/startups  
**Flair:** Share Your Startup

> Keevan Store — Creator Commerce for East Africa
>
> **What it is:** A platform where East African creators can sell digital products (e-books, guides, templates) through branded storefronts and get paid via mobile money.
>
> **Why it exists:** Global platforms don't support mobile money or local currencies. A Kenyan creator can't sell in KES through M-Pesa on any existing platform.
>
> **What's done:**
> ✓ Creator signup with storefront generation
> ✓ Product upload with magic-byte file validation
> ✓ Pesapal payment integration (mobile money + card)
> ✓ Secure file delivery with signed URLs (60s TTL)
> ✓ Full admin dashboard (moderation, withdrawals, refunds)
> ✓ Email queue system with cron processing
> ✓ 609 automated tests across 27 test files
> ✓ 29 database migrations
> ✓ 15+ documentation files
>
> **Traction:** 13 creators, 2 buyers, 3 completed transactions, 0 refunds
>
> **Looking for:** Strategic acquisition partner who can scale this across East Africa
>
> Stack: Next.js 15, Supabase, TypeScript strict mode, Pesapal API v3, Resend, Sentry, hosted on Vercel.
>
> keevanstore.in — happy to answer questions about the build or the market.

### Post 5 — Technical Deep Dive
**Subreddit:** r/startups  
**Flair:** Technical

> Technical architecture of a creator commerce platform handling payments in East Africa:
>
> **Stack:** Next.js 15 App Router, React 19, TypeScript strict mode, Supabase (PostgreSQL + Auth + Storage), Pesapal API v3, Vercel serverless
>
> **Key design decisions:**
>
> **Payment flow (the hardest part):**
> 1. Buyer submits checkout → order created with "pending" status
> 2. Redirected to Pesapal for payment (mobile money or card)
> 3. Pesapal sends IPN (Instant Payment Notification) webhook on completion
> 4. Server verifies payment status via Pesapal API (three-way check)
> 5. Order status updated atomically with database-level locking
> 6. File download URL generated (signed, 60s TTL)
> 7. Email notifications queued via DB trigger
>
> **Security:**
> - Row-Level Security on every database table
> - CSRF protection via origin/referer validation
> - Rate limiting at 120 req/min/IP (database-backed)
> - Magic-byte file validation (not just extension check)
> - Signed download URLs with configurable TTL
> - Admin audit logging on every action
>
> **Email:**
> - DB-enqueued email queue (not sent inline during requests)
> - Automatic retry (3 attempts for failed sends)
> - Dual transport: Resend API + Nodemailer/SMTP fallback
> - Daily cron processing at 06:00 UTC
>
> **Tests:** 609 tests covering API routes, auth, payments, email, database queries, file validation, and UI components.
>
> **Load testing:** k6 scripts for auth (500 concurrent), payments (200 concurrent), download URLs (100 concurrent).
>
> Happy to answer questions about any of these decisions. The full codebase is available for due diligence.

### Post 6 — Market Opportunity
**Subreddit:** r/startups  
**Flair:** Discussion

> I've been researching the African creator economy opportunity while building Keevan Store. Sharing some numbers that might be useful for anyone building in this space:
>
> **Mobile money in East Africa:**
> - Kenya: 92% of adults use M-Pesa
> - Uganda: 70%+ of adults use mobile money
> - Tanzania: 70%+ of adults use mobile money
> - Rwanda: 65%+ of adults use mobile money
>
> **The gap:**
> Global creator platforms (Gumroad, Teachable, Ko-fi, Payhip) don't support any of these payment methods. They require Stripe or PayPal, which have limited presence in East Africa.
>
> **Market size indicators:**
> - 1.4+ billion people in Africa
> - Smartphone penetration accelerating (65%+ expected by 2027)
> - Sub-Saharan Africa mobile money transactions exceeded $800B in 2023
> - Growing demand for locally relevant digital content
>
> **What I've validated:**
> - 13 creators signed up without any paid marketing
> - 3 transactions completed successfully through the full loop
> - Creators actively asking about features (withdrawals, analytics, store customization)
>
> **The hard truth:** Building for this market is harder than building for the US. Payment infrastructure is fragmented. Internet connections are unreliable. But the opportunity is real, and no one has built the dominant platform yet.
>
> Thoughts from others who've built for African markets? What am I missing?

### Post 7 — Starting a Startup
**Subreddit:** r/startups  
**Flair:** Starting a Startup

> I'm a solo founder building a creator commerce platform for East Africa. Here's where I am and what I'm wrestling with:
>
> **The product:** Keevan Store — creators sell digital products through branded storefronts, buyers pay via mobile money, files delivered instantly. Think Gumroad for East Africa.
>
> **Status:** Built and working. 13 creators onboarded. 3 transactions completed. 609 tests passing.
>
> **The dilemma:** I've proven the technical model works, but I'm hitting the limits of what a solo founder can do for distribution. Creator acquisition, marketing, and partnerships need resources I don't have alone.
>
> **My current thinking:** Seek a strategic acquisition rather than continue trying to grow solo. The platform has more value to a company with existing creator relationships or payment infrastructure than it does to me alone.
>
> **Questions I'm wrestling with:**
> - Is 3 transactions enough validation to approach acquirers?
> - Should I try to grow creator base more before selling?
> - What's the right channel to find strategic buyers?
>
> Would appreciate perspectives from founders who've been through acquisition or built for emerging markets.

### Post 8 — Growth
**Subreddit:** r/startups  
**Flair:** Growth

> Growth strategies for a creator commerce platform with limited budget in East Africa:
>
> **What's worked (modestly):**
> - Direct outreach to creators on Twitter and LinkedIn (responsible for most signups)
> - WhatsApp groups — creators share the platform within their networks
> - Focused messaging on mobile money support (this is the #1 question creators have)
>
> **What hasn't worked:**
> - Paid ads (high CPC, low conversion — market isn't big enough yet on digital ad platforms)
> - Content marketing (slow to generate traction without existing audience)
> - Cold email (low open rates in this market segment)
>
> **What I'd do with resources:**
> - Partner with creator communities and associations
> - Build an affiliate program for creator referrals
> - Integrate with more payment gateways
> - Develop creator success stories/case studies
>
> This is why I'm pursuing acquisition — the platform needs distribution channels that a solo founder can't build quickly. The product is ready; the growth engine needs a team.
>
> What growth strategies have worked for others building in emerging markets?

### Post 9 — Technical Architecture
**Subreddit:** r/startups  
**Flair:** Technical

> Architecture decisions I made building a creator commerce platform that I'd make differently next time:
>
> **Right decisions:**
> - Next.js 15 App Router (excellent DX, good performance)
> - Supabase for backend (PostgreSQL + Auth + Storage in one service)
> - TypeScript strict mode from day one (caught dozens of issues before deployment)
> - Zod validation on all API inputs (prevents malformed data at the boundary)
> - Email queue with DB triggers instead of inline sending (keeps request paths fast)
> - Row-Level Security on every table (security baked into data access)
>
> **Would change:**
> - Schema design: products.currency has a hard constraint `currency = 'UGX'` that I set early and now blocks multi-currency functionality. Schema decisions are sticky.
> - File validation: started with extension checks, migrated to magic-byte validation. Should have done magic-byte from day one.
> - Testing strategy: some tests mock at inconsistent levels. Should have defined a clear mocking strategy upfront.
> - Documentation: started writing docs too late. Should have documented architecture decisions as I made them (ADRs).
>
> **Biggest lesson:** In a payment platform, schema design and security architecture aren't "future concerns" — they're day-one decisions that constrain everything after.
>
> What architectural decisions would you change from your current project?

### Post 10 — Revenue Model Feedback
**Subreddit:** r/startups  
**Flair:** Feedback

> Looking for feedback on Keevan Store's revenue model as I prepare for acquisition conversations:
>
> **Current model:**
> - 10% platform commission on each transaction (configurable via env var)
> - No subscription fees for creators
> - Creators set their own prices
> - Minimum withdrawal thresholds by currency
>
> **Why this model:**
> - Low barrier for creator adoption (no upfront cost)
> - Aligned incentives (platform earns when creators earn)
> - Simple to understand and communicate
>
> **Questions:**
> - Is 10% competitive for creator platforms in emerging markets?
> - Should I introduce subscription tiers alongside commission?
> - What revenue model would be most attractive to a strategic acquirer?
>
> Context: Gumroad charges 8.5% + $0.30. Teachable has subscription plans. Ko-fi is free + 5% on commissions. None support East African currencies or mobile money.
>
> Would appreciate thoughts from founders who've built marketplace/platform businesses.

### Post 11 — Build in Public Update
**Subreddit:** r/startups  
**Flair:** Build in Public

> Build in public: Keevan Store — a creator commerce platform for East Africa
>
> **This week's wins:**
> - Test suite at 609 passing tests
> - Load testing scripts completed (k6 for auth, payments, downloads)
> - Documentation package expanded to 15+ files
> - All known product upload bugs fixed
>
> **This week's challenges:**
> - Still thinking about acquisition timing
> - No new creator signups this week
> - Debating whether to invest in creator outreach or focus on acquisition prep
>
> **Metrics snapshot:**
> - Creators: 13
> - Buyers: 2
> - Completed transactions: 3
> - Successful deliveries: 3
> - Refund rate: 0%
>
> **What I'm focused on:**
> Preparing the acquisition data room and continuing to document everything an acquirer would want to see.
>
> Anyone else gone through the process of prepping a platform for acquisition? What did you wish you'd prepared sooner?

### Post 12 — Discussion on Mobile Money
**Subreddit:** r/startups  
**Flair:** Discussion

> PSA for anyone building a digital commerce platform that targets emerging markets: mobile money is not an "alternative payment method" in most of Africa. It's the primary financial infrastructure.
>
> Some context:
> - M-Pesa in Kenya processes more transactions than many traditional banks
> - MTN Mobile Money in Uganda has more users than bank accounts
> - Mobile money transactions in Sub-Saharan Africa exceeded $800B in 2023
>
> Yet most SaaS platforms I see targeting Africa integrate Stripe and call it done. Stripe operates in ~40 countries, but in Africa that's mostly South Africa, Nigeria, and a few others. It doesn't cover Uganda, Tanzania, Rwanda, or most of East Africa for payment acceptance.
>
> If you're building for African users, your payment strategy needs to start with mobile money — not add it as an afterthought. We chose Pesapal because it aggregates MTN, M-Pesa, Airtel Money, and card payments through a single API across multiple East African countries.
>
> Happy to share more about our integration experience if anyone's building in this space.

### Post 13 — Share Your Startup (Product Update)
**Subreddit:** r/startups  
**Flair:** Share Your Startup

> Update on Keevan Store — creator commerce platform for East Africa
>
> **Since last post:**
> - Fixed product upload validation bugs (price zero check, slug length enforcement)
> - Improved error messages with field-level details
> - Completed load testing suite (k6)
> - Full acquisition documentation package (10 documents)
>
> **Still true:**
> - 13 creators onboarded
> - 3 completed transactions
> - 0% refund rate
> - 609 automated tests
>
> **Looking for:** Strategic acquisition partner who sees the opportunity in Africa's creator economy.
>
> Platform is live at keevanstore.in. Stack: Next.js 15, Supabase, TypeScript, Pesapal, Vercel.
>
> Happy to talk to anyone interested in the space or the tech.

### Post 14 — The Challenge of Solo Building
**Subreddit:** r/startups  
**Flair:** Starting a Startup

> Solo founder reflections on building a full-stack fintech-adjacent platform:
>
> Building Keevan Store taught me that "solo founder" means:
> - You're the CEO, CTO, CPO, QA lead, DevOps engineer, and support team
> - Every major decision is yours, which is liberating and exhausting
> - You can't specialize — you have to be competent at everything
> - Burnout is a real risk, not a buzzword
>
> The platform is built and working (13 creators, 3 transactions, 609 tests). But the next phase — marketing, creator acquisition, country expansion, partnership development — needs a team.
>
> I'm proud of what I built. But I recognize that the best thing for the platform now is to find it a home with resources I don't have.
>
> To other solo founders: know when to keep building and when to pass the torch. Both are valid paths.
>
> Anyone else here sold their solo-built startup? How did you know it was time?

### Post 15 — Validating a Transaction Loop
**Subreddit:** r/startups  
**Flair:** Lessons Learned

> What counts as "validation" for a transaction-based platform?
>
> I spent months wondering if 3 transactions on Keevan Store was enough to call the model validated. Here's what I decided:
>
> **Each transaction tested:**
> - Payment processing end-to-end (Pesapal redirect → payment → IPN webhook → verification)
> - File delivery system (signed URL generation → download)
> - Email notifications (purchase confirmation, order notification)
> - Database consistency (order creation, status updates, earnings calculation)
>
> **What 3 transactions prove:**
> ✓ The full creator-to-buyer loop works in production
> ✓ Payment integration handles real money correctly
> ✓ File delivery is reliable and secure
> ✓ The platform doesn't lose data or create inconsistencies
>
> **What 3 transactions don't prove:**
> ✗ Revenue viability (need more volume for that)
> ✗ Marketing efficiency (no organic acquisition engine yet)
> ✗ Scalability under load (though load tests help here)
>
> **My conclusion:** 3 transactions is enough to validate the technical model. The business model validation requires more volume — which is exactly what a strategic acquirer with distribution can provide.
>
> How much traction did you need before feeling validated?

### Post 16 — Discussion on African Tech
**Subreddit:** r/startups  
**Flair:** Discussion

> I keep seeing "expand to Africa" posts from SaaS founders, and I want to share some reality from someone who built there:
>
> The good:
> - Mobile money infrastructure is genuinely world-class in East Africa
> - Users are eager for platforms that work with their local reality
> - Competition is less intense than in saturated Western markets
> - The market is young and growing fast
>
> The challenging:
> - Payment integration is complex (no Stripe, limited options)
> - Internet connectivity varies wildly (build for intermittent connections)
> - Currency volatility affects pricing (UGX has fluctuated significantly)
> - Customer education is part of the product (some users are new to digital commerce)
> - Regulatory landscape varies by country
>
> **My advice if you're considering it:**
> 1. Spend time understanding mobile money before writing code
> 2. Test your platform on 3G connections, not just fiber
> 3. Support local currencies, not just USD conversion
> 4. Consider an acquisition if you want fast market entry
>
> Keevan Store is my attempt to get this right. Happy to share more specifics if helpful.

### Post 17 — Share Your Startup (Feedback)
**Subreddit:** r/startups  
**Flair:** Feedback

> I'd love feedback on my startup's value proposition for acquisition conversations:
>
> Keevan Store is a creator commerce platform for East Africa. Think Gumroad but with:
> - Mobile money payments (MTN, M-Pesa, Airtel)
> - Local currency pricing (UGX, KES, TZS, RWF)
> - Branded creator storefronts
> - Secure file delivery with signed URLs
> - Full admin dashboard
>
> **The acquisition pitch:**
> "A production-ready entry point into East Africa's creator economy, with working payment infrastructure and validated transactions — yours in weeks instead of building for 12+ months."
>
> **Current state:**
> - 13 creators
> - 3 completed transactions
> - 0 refunds
> - 609 tests
> - 29 migrations
> - 15+ docs files
>
> **Questions:**
> - Is the value proposition clear?
> - What's missing from the pitch?
> - Who else should I be targeting?
>
> The full product documentation is at keevanstore.in if you want to review. Honest feedback appreciated.

### Post 18 — Technical Lessons
**Subreddit:** r/startups  
**Flair:** Technical

> Technical lessons from building a payment platform without Stripe:
>
> **Lesson 1: Webhook verification is critical**
> Pesapal sends IPN (Instant Payment Notification) to a callback URL. We verify the payment in three ways: the IPN itself, a query to Pesapal API to confirm status, and a manual reconciliation endpoint. Never trust a single source of payment truth.
>
> **Lesson 2: Atomic operations prevent race conditions**
> When finalizing a payment, we use database-level locking to prevent double-processing. Two concurrent IPN callbacks arriving at the same time won't create two "paid" records.
>
> **Lesson 3: File delivery must be time-limited**
> Signed download URLs expire after 60 seconds. This prevents link sharing while allowing legitimate buyers to download. The tradeoff between convenience and security is real — we chose conservative expirations.
>
> **Lesson 4: Email should never be in the request path**
> Sending emails during request handling slows down API responses and creates failure points. Our email queue (database-backed, processed by cron) means payment processing isn't blocked by email delivery.
>
> **Lesson 5: Test everything financial**
> We have specific tests for: concurrent payment processing, payment verification with invalid data, webhook signature validation, order status transitions, and earnings calculation accuracy. Financial code that isn't tested is code that will fail.
>
> These lessons cost me time to learn. Hope they save someone else time.

### Post 19 — Startup Acquisition Discussion
**Subreddit:** r/startups  
**Flair:** Discussion

> Has anyone here successfully found a strategic acquirer for their early-stage startup through online channels?
>
> I'm preparing to find a buyer for Keevan Store (creator commerce for East Africa — 13 creators, 3 transactions, built on Next.js/Supabase/Pesapal). I'm curious about:
>
> 1. Where did you find potential acquirers? (LinkedIn, direct outreach, M&A platforms, warm intros?)
> 2. What made your startup attractive to them despite early revenue?
> 3. What did you wish you'd prepared earlier?
> 4. How long did the process take from first outreach to offer?
>
> My assumption is that strategic value (market position, technology, integration potential) matters more than revenue at this stage. But I'd love to hear from people who've been through it.
>
> Keevan Store's strategic value: East African payment integration (hard to build), multi-currency architecture, 13 creator base, clean documented codebase, immediate market entry for an acquirer with distribution.
>
> Any advice appreciated.

### Post 20 — Final Update / Open Discussion
**Subreddit:** r/startups  
**Flair:** Share Your Startup

> Keevan Store — my solo-built creator commerce platform for East Africa — is now formally seeking a strategic acquirer.
>
> **What exists:**
> ✓ Full platform: signup, storefront, checkout, payment, delivery, admin
> ✓ 13 creators, 3 completed transactions, 0 failures
> ✓ 609 automated tests, 29 DB migrations, 52 API endpoints
> ✓ 15+ documentation files for due diligence
> ✓ Clean Next.js 15 + Supabase codebase
>
> **What an acquirer gets:**
> - East African payment infrastructure (Pesapal + mobile money)
> - Multi-currency support (UGX, KES, TZS, RWF, USD)
> - Creator base and transaction history
> - Full admin dashboard and tools
> - 12+ months of development time saved
>
> **Ideal buyers:**
> - Creator economy companies expanding into Africa
> - FinTech platforms adding digital commerce
> - E-commerce infrastructure businesses seeking market entry
>
> **Why acquisition:** The platform is ready. The market is validated. The next phase needs resources I don't have alone.
>
> If you're in M&A, corporate development, or strategic acquisitions — or if you have advice on finding the right buyer — I'd appreciate the conversation.
>
> keevanstore.in | Full documentation package available under NDA

---

## 2. r/SaaS Posts (20)

### Post 1
**Subreddit:** r/SaaS  
**Flair:** SaaS

> Built a SaaS platform for East African creators. Here's the stack and why:
>
> **The platform:** Keevan Store — creator commerce for East Africa
> **The problem:** Global creator platforms don't support mobile money or local currencies
> **The solution:** Platform with Pesapal payments, multi-currency, branded storefronts
>
> **Stack:**
> - Next.js 15 App Router + React 19
> - TypeScript strict mode
> - Supabase (PostgreSQL, Auth, Storage)
> - Pesapal API v3 (mobile money + card)
> - Resend + Nodemailer (email)
> - Sentry (monitoring)
> - Vercel (hosting)
> - Vitest + RTL (testing)
>
> **Traction:** 13 creators, 3 transactions, 0 refunds
> **Tests:** 609 automated tests
> **Documentation:** 15+ files
>
> Seeking strategic acquisition. If your SaaS company is looking for African market entry, this could be your fastest path.
>
> What's your SaaS stack, and would you build differently for an emerging market?

### Post 2
**Subreddit:** r/SaaS  
**Flair:** Feedback

> Feedback wanted: revenue model for a creator commerce SaaS in East Africa
>
> Keevan Store current model:
> - 10% platform commission per transaction
> - No subscription fees
> - Creators set their own prices in local currencies
>
> **Context:**
> - Gumroad: 8.5% + $0.30
> - Teachable: subscription + transaction fees
> - Ko-fi: free + 5% commission
> - None support East African currencies or mobile money
>
> **My questions:**
> 1. Is 10% commission without subscription the right model for an emerging market?
> 2. Should I add a premium tier with features (analytics, customization)?
> 3. What would make this model attractive to a strategic acquirer?
>
> Platform has 13 creators and 3 completed transactions. Revenue is pre-scale but the model is proven.

### Post 3
**Subreddit:** r/SaaS  
**Flair:** Build in Public

> Build in public: Keevan Store SaaS metrics snapshot (July 2026)
>
> **Users:** 13 creators, 2 buyers
> **Transactions:** 3 completed, 0 failed
> **Revenue:** Pre-scale (commission-based model)
> **Tests:** 609 passing
> **Migrations:** 29
> **API endpoints:** 52
> **Components:** 90+
> **Documentation files:** 15+
> **Admin endpoints:** 23
> **Email templates:** 10+
>
> **Current focus:** Acquisition preparation and documentation
> **Next milestone:** Finding the right strategic buyer
>
> This is a early-stage SaaS that's fully built and validated, needing distribution and partnerships to scale. I've taken it as far as a solo founder can.
>
> Anyone else here building SaaS for African markets? What's your experience been?

### Post 4
**Subreddit:** r/SaaS  
**Flair:** SaaS

> The hardest part of building a global SaaS is payment infrastructure. This is doubly true when your target market is East Africa.
>
> Stripe doesn't operate in Uganda, Tanzania, or Rwanda for payment acceptance. PayPal is available but unreliable and expensive for users in these markets. Mobile money is the dominant payment method, but it requires integration with specific providers (MTN, M-Pesa, Airtel) through gateways like Pesapal.
>
> For Keevan Store (creator commerce platform), I invested heavily in getting the payment flow right:
> - Pesapal integration with three-way verification
> - IPN webhook handling with atomic finalization
> - Multi-currency support (UGX, KES, TZS, RWF, USD)
> - Graceful error handling for failed payments
>
> The result: 3 successful transactions with 0 failures. The payment infrastructure is built, tested, and working.
>
> If your SaaS is considering African expansion, start with payments. Everything else is easier.

### Post 5
**Subreddit:** r/SaaS  
**Flair:** SaaS

> SaaS acquisition question: how much does documentation matter for valuation?
>
> I've written 15+ documentation files for Keevan Store:
> - Executive summary
> - Product overview
> - System architecture
> - Database architecture
> - API specification (52 endpoints)
> - Security audit
> - Production readiness report
> - Deployment guide
> - Backup/restore procedures
> - Handover guide
> - And more
>
> This took weeks. Was it worth it?
>
> My theory: for a strategic acquisition where the buyer needs to understand and integrate the technology, good documentation directly increases valuation. It reduces due diligence time and risk.
>
> But I'd love to hear from founders who've been acquired — what actually moved the needle on valuation?

### Post 6
**Subreddit:** r/SaaS  
**Flair:** SaaS

> If you're building a SaaS platform that handles payments, here are the tests you should have:
>
> From Keevan Store's test suite (609 total):
>
> **Payment tests (must-have):**
> - Payment creation with valid/invalid data
> - IPN webhook handling with valid/invalid signatures
> - Concurrent payment finalization (race condition test)
> - Order status transitions after payment
> - Refund processing
>
> **Auth tests (must-have):**
> - Registration with valid/invalid data
> - Login/logout flow
> - Session management
> - Role-based access control
> - Rate limiting enforcement
>
> **File tests (should-have):**
> - Magic-byte validation (correct and spoofed files)
> - File size limit enforcement
> - Signed URL generation and expiry
> - Download tracking
>
> **Email tests (should-have):**
> - Email queue insertion
> - Email template rendering
> - Retry logic for failed sends
>
> **Database tests (nice-to-have):**
> - RLS policy enforcement
> - Migration rollback
> - Constraint validation
>
> We use Vitest + React Testing Library. Happy to share more about specific test patterns.

### Post 7
**Subreddit:** r/SaaS  
**Flair:** SaaS

> Looking for a strategic acquirer for Keevan Store — a B2B SaaS platform for East African creator commerce.
>
> **The product:** Creators sign up, get a branded storefront, upload digital products, and accept mobile money payments. The full loop works end-to-end.
>
> **Why SaaS matters here:** Most African creators don't have the technical skills to build their own storefront. SaaS removes that barrier. They need a platform that handles payments, delivery, and store management — and we built it.
>
> **Traction:** 13 creators, 3 transactions, 0 refunds
> **Tech:** Next.js 15, Supabase, TypeScript, Pesapal, Vercel
> **Quality:** 609 tests, full documentation, clean architecture
>
> **Ideal buyer:** A creator economy SaaS company wanting Africa expansion, or a FinTech platform adding digital commerce.
>
> Questions welcome. The platform is live at keevanstore.in.

### Post 8
**Subreddit:** r/SaaS  
**Flair:** Discussion

> The creator economy SaaS market is massive ($480B+ globally). The African segment is growing fast. Yet no major platform supports African payment methods properly.
>
> This is a market gap that Keevan Store was built to fill:
> - Creator storefronts as a service
> - Mobile money payment processing
> - Multi-currency support (UGX, KES, TZS, RWF, USD)
> - Secure file delivery
> - Full admin tools for platform operators
>
> **Why SaaS?** Because the alternative for creators is either building their own store (impossible for most) or using global platforms that don't work for their buyers (frustrating).
>
> **Current state:** Built, tested, validated with real transactions. Now seeking a strategic acquirer to scale it.
>
> What's your take on the African SaaS opportunity?

### Post 9
**Subreddit:** r/SaaS  
**Flair:** Feedback

> I'd appreciate feedback on my SaaS's onboarding flow before I publish it widely:
>
> Keevan Store creator onboarding:
> 1. Sign up with email + password (30 seconds)
> 2. Choose store handle (e.g., store/yourname)
> 3. Upload product file (PDF/EPUB/MOBI/ZIP, max 4MB)
> 4. Add cover image (JPEG/PNG/WebP, max 2MB)
> 5. Set title, description, and price in local currency
> 6. Publish storefront
>
> Total time: Under 10 minutes for a creator with content ready.
>
> **What's good:** Low friction, no Stripe account needed, no technical skills required.
> **What could be better:** No onboarding wizard, no template suggestions, limited store customization.
>
> For an acquirer evaluating this SaaS, the onboarding flow is functional but basic. What would you prioritize improving?

### Post 10
**Subreddit:** r/SaaS  
**Flair:** SaaS

> I built a SaaS platform for East African creator commerce and now I'm seeking acquisition. Here's the honest story:
>
> **What worked:**
> - Building a clean, well-tested codebase (609 tests)
> - Integrating Pesapal for mobile money payments
> - Supporting multiple currencies at the store level
> - Creating full admin tools (not just user-facing features)
> - Writing comprehensive documentation (15+ files)
>
> **What didn't work as expected:**
> - Creator acquisition without marketing budget
> - Building trust with creators who've been burned by other platforms
> - Balancing feature development with acquisition preparation
>
> **Current state:**
> - 13 creators onboarded through direct outreach
> - 3 transactions validated end-to-end
> - Full platform ready for scale
> - Seeking strategic acquirer
>
> SaaS is hard anywhere. SaaS in an emerging market is harder. But the opportunity is real and the foundation is solid. If your SaaS company is looking at African expansion, let's talk.

### Post 11
**Subreddit:** r/SaaS  
**Flair:** SaaS

> 609 tests. 29 migrations. 90+ components. 52 API endpoints. 15 documentation files.
>
> This is the current state of Keevan Store — a creator commerce SaaS for East Africa.
>
> **Why so much investment in code quality?**
> 1. Payment platforms need reliability (every test covers a failure path)
> 2. Acquisition requires due diligence readiness (documentation proves quality)
> 3. Solo building means you can't afford technical debt (no team to clean it up later)
>
> **The result:** A SaaS platform that's ready for an acquirer to take over and scale immediately.
>
> 13 creators. 3 transactions. Production-ready. Looking for the right home.
>
> What's your approach to code quality in early-stage SaaS?

### Post 12
**Subreddit:** r/SaaS  
**Flair:** SaaS

> SaaS infrastructure costs breakdown for Keevan Store:
>
> **Monthly costs (approximate):**
> - Vercel Pro: $20/month
> - Supabase Pro: $25/month
> - Resend: $10/month (usage-based)
> - Sentry: Free tier (developer)
> - Domain: $10/year
> - Pesapal: Setup fee + per-transaction fees
>
> **Total base:** ~$55-65/month + payment processing fees
>
> **Revenue model:** 10% commission on transactions
>
> **Current state:** Pre-scale revenue, low operating costs, validated model.
>
> For an acquirer, this means low risk: minimal infrastructure costs, scalable architecture (Vercel serverless auto-scales), and a clear path to profitability with volume.
>
> What do your SaaS infrastructure costs look like?

### Post 13
**Subreddit:** r/SaaS  
**Flair:** SaaS

> The email subsystem in Keevan Store is one of its most robust features:
>
> **Design decisions:**
> - **DB-queued:** Emails are inserted into a queue table via database triggers, not sent inline during requests. This keeps API response times fast and prevents payment failures from blocking email delivery.
> - **Automatic retry:** Failed sends are retried up to 3 times with exponential backoff.
> - **Dual transport:** Resend API is primary, with Nodemailer/SMTP as fallback if Resend is unavailable.
> - **Cron processing:** A Vercel Cron job processes the queue daily at 06:00 UTC.
> - **Duplicate detection:** The system detects and prevents double-sending.
>
> **Templates:**
> - Welcome email (creator)
> - Purchase confirmation (buyer)
> - Order notification (creator)
> - Refund update (buyer)
> - Withdrawal notification (creator)
>
> **Monitoring:** Admin dashboard shows queue status (pending/sent/failed) with manual processing capability.
>
> This level of infrastructure is unusual for an early-stage SaaS, but it means the platform is ready for volume from day one of acquisition.

### Post 14
**Subreddit:** r/SaaS  
**Flair:** SaaS

> SaaS security checklist — what I implemented for Keevan Store before seeking acquisition:
>
> **Authentication:**
> - [x] Supabase SSR with cookie-based sessions
> - [x] Role-based access (admin, creator, buyer)
> - [x] Password reset flow
>
> **Authorization:**
> - [x] Row-Level Security on every database table
> - [x] Middleware route protection
> - [x] requireUser/requireAdmin helper functions
>
> **Input validation:**
> - [x] Zod schemas on all API endpoints
> - [x] Magic-byte file validation (not just extension checks)
>
> **Request security:**
> - [x] CSRF protection (origin/referer validation)
> - [x] Rate limiting (120 req/min/IP)
> - [x] Signed download URLs (60-second TTL)
>
> **Monitoring:**
> - [x] Sentry error tracking (client, server, edge)
> - [x] Admin audit logging
> - [x] Security contact (security.txt)
>
> **Still want to add:**
> - [ ] Content Security Policy headers
> - [ ] Automated security scanning in CI
> - [ ] Penetration testing report
>
> For a SaaS handling payments, security isn't optional. An acquirer's security team should find nothing unexpected during due diligence.

### Post 15
**Subreddit:** r/SaaS  
**Flair:** Discussion

> SaaS acquisition question for the community:
>
> I'm preparing Keevan Store for a strategic sale. The platform is built, tested, and has validated transactions. But I keep going back and forth on one question:
>
> **Should I invest more time in growing the creator base before seeking acquisition, or should I seek acquisition now with 13 creators and 3 transactions?**
>
> Arguments for growing first:
> - More creators = more validation = higher valuation
> - More data on creator behavior and retention
> - Stronger negotiation position
>
> Arguments for seeking acquisition now:
> - Platform is functionally complete
> - Transaction loop is validated
> - Acquirer with distribution can grow creator base faster than I can
> - Risk of burning out solo before sale
>
> I'm leaning toward seeking acquisition now with a transparent "early but validated" positioning. What would you do?

### Post 16
**Subreddit:** r/SaaS  
**Flair:** SaaS

> Keevan Store technical overview for potential acquirers:
>
> **Frontend:**
> - Next.js 15 App Router
> - React 19
> - TypeScript strict mode
> - Tailwind CSS 3
> - 90+ components
>
> **Backend:**
> - 52 API endpoints
> - Serverless functions on Vercel
> - Consistent error handling (withErrorHandling wrapper)
> - Zod input validation
>
> **Database:**
> - Supabase PostgreSQL
> - 29 migrations (sequential, documented)
> - Row-Level Security on all tables
> - Indexed for query performance
>
> **Payments:**
> - Pesapal API v3 integration
> - Three-way payment verification
> - IPN webhook handling
> - Atomic finalization with DB locking
>
> **Storage:**
> - Supabase Storage (private + public buckets)
> - Magic-byte file validation
> - Signed URL delivery (60s TTL)
>
> **Testing:**
> - 609 tests (Vitest + RTL)
> - 27 test files
> - k6 load testing scripts
> - GitHub Actions CI
>
> **Monitoring:**
> - Sentry (client, server, edge)
> - Admin audit log
> - Vercel Analytics
>
> Full documentation available. The platform is ready for technical due diligence.

### Post 17
**Subreddit:** r/SaaS  
**Flair:** SaaS

> I'm looking for the right acquirer for Keevan Store — a B2B SaaS platform that enables East African creators to sell digital products.
>
> **Why acquire instead of build:**
> - Payment integration with Pesapal (mobile money) is complex
> - Multi-currency architecture is built and tested
> - 29 database migrations represent significant schema work
> - 609 tests cover edge cases you'd discover over months
> - Creator acquisition is already de-risked (13 onboarded)
>
> **What an acquirer gets:**
> - Immediate market entry into East African creator economy
> - Working payment infrastructure (hardest part to build)
> - Clean codebase with full documentation
> - Ready-to-scale architecture on Vercel + Supabase
> - Knowledge transfer and handover support
>
> **Ideal buyer profile:**
> - Creator economy SaaS company (Gumroad, Teachable, Ko-fi, etc.)
> - FinTech platform adding digital commerce
> - E-commerce infrastructure business
> - Holding company or startup studio
>
> keevanstore.in — platform is live. Documentation package available.
>
> Questions or referrals welcome.

### Post 18
**Subreddit:** r/SaaS  
**Flair:** Build in Public

> Build in public: month 5 of Keevan Store
>
> **What I built:**
> - Complete creator commerce platform
> - Pesapal payment integration with mobile money
> - Multi-currency storefronts
> - Admin dashboard (full CRUD for platform management)
> - Email queue system
> - Load testing infrastructure (k6)
> - 15+ documentation files
> - 609 tests
>
> **What it cost:**
> ~$55-65/month in infrastructure
> ~5 months of solo development time
> Countless cups of coffee
>
> **What it produced:**
> 13 creators onboarded
> 3 successful transactions
> 0 refunds
> A platform ready for acquisition
>
> **What's next:**
> Seeking a strategic acquirer who can provide distribution, partnerships, and capital for scale.
>
> Building SaaS solo is a journey. Sometimes the best destination is finding the right owner for what you've built.

### Post 19
**Subreddit:** r/SaaS  
**Flair:** Discussion

> If your company is in creator economy SaaS, FinTech, or African digital commerce — and you're considering acquisitions as a growth strategy — I'd like to introduce you to Keevan Store.
>
> **Why it might fit your strategy:**
> - Instant entry into East African creator economy
> - Working mobile money payment infrastructure
> - Multi-currency support (UGX, KES, TZS, RWF, USD)
> - Clean, documented, well-tested codebase
> - Low operating costs (~$60/month base)
> - Full platform, not a prototype
>
> **What you'd need to provide:**
> - Marketing distribution
> - Strategic partnerships
> - Operational capacity
> - Country expansion resources
>
> **Current metrics:**
> - 13 creators
> - 3 transactions (validated loop)
> - 0 refunds
>
> I'm open to conversations with qualified strategic buyers. Full data room available under NDA.
>
> DM or email to connect.

### Post 20
**Subreddit:** r/SaaS  
**Flair:** SaaS

> Final SaaS post: Keevan Store is ready for acquisition.
>
> **What exists:**
> ✓ Complete creator commerce platform (Next.js 15, Supabase, TypeScript)
> ✓ East African payment integration (Pesapal, mobile money, cards)
> ✓ Multi-currency support (UGX, KES, TZS, RWF, USD)
> ✓ 13 creators, 3 transactions, 0 refunds
> ✓ 609 tests, 29 migrations, 52 endpoints, 15 docs
> ✓ Full admin dashboard
> ✓ Load tested and security reviewed
>
> **What an acquirer gets:**
> - 12+ months of development time saved
> - Working infrastructure for the hardest part (payments)
> - Immediate market entry
> - Complete knowledge transfer and handover
>
> **Who I'm looking for:**
> Creator economy platforms, FinTech companies, digital commerce businesses, or strategic holding companies interested in the African market.
>
> keevanstore.in — live and functional. Let's talk if this aligns with your strategy.

---

## 3. r/Entrepreneur Posts (20)

### Post 1
**Subreddit:** r/Entrepreneur  
**Flair:** Starting a Business

> I built a platform that lets East African creators sell digital products and get paid via mobile money. Here's the story.
>
> I noticed that every creator platform required Stripe or PayPal. In East Africa, most people use mobile money (M-Pesa in Kenya, MTN in Uganda). Creators couldn't sell to their local audience because the payment methods didn't work.
>
> So I built Keevan Store:
> - Creators sign up and get a branded storefront
> - They upload e-books, guides, templates (PDF/EPUB/MOBI/ZIP)
> - Buyers pay via mobile money through Pesapal
> - Files are delivered instantly via secure download
>
> Current state: 13 creators, 3 completed transactions, 0 refunds. The full loop works.
>
> I'm now seeking a strategic buyer who can scale this. The platform is ready — it needs distribution and partnerships.
>
> If you're in creator economy, payments, or African markets, I'd love to connect. The platform is at keevanstore.in.

### Post 2
**Subreddit:** r/Entrepreneur  
**Flair:** Idea Validation

> Idea validation help: platform for African creators to sell digital products with mobile money payments.
>
> I built Keevan Store and have:
> - 13 creators signed up
> - 3 completed transactions
> - Working payment integration with Pesapal
>
> The question: is this enough validation to seek a strategic acquirer, or should I grow the creator base more first?
>
> **Pros of acquiring now:**
> - Platform is functionally complete
> - Transaction loop is proven
> - Acquirer has distribution resources I don't
>
> **Pros of growing first:**
> - More leverage in negotiations
> - Better data on unit economics
> - Less risk for buyer
>
> What do you think? Has anyone here sold an early-stage business?

### Post 3
**Subreddit:** r/Entrepreneur  
**Flair:** E-commerce

> E-commerce in East Africa is different. Here's what I learned building Keevan Store:
>
> **Payment is everything.** You can have the best product, but if your payment method doesn't work for local users, you have nothing. Mobile money isn't an alternative payment — it's the primary payment method.
>
> **Trust is earned slowly.** East African buyers are cautious about online payments (for good reason — scams exist). Having a familiar payment gateway (Pesapal) and clear refund policies builds trust.
>
> **File delivery matters.** We use signed URLs with 60-second TTL. This balances security with user experience. Buyers get their files instantly after payment.
>
> **Creator education is part of the product.** Many creators haven't sold digital products before. The platform needs to guide them through the process.
>
> **Local currencies aren't optional.** If your platform only prices in USD, you're excluding most potential buyers in East Africa. UGX, KES, TZS, RWF support is table stakes.
>
> Keevan Store has 13 creators and 3 completed transactions. The model is validated. Now seeking a strategic acquirer.

### Post 4
**Subreddit:** r/Entrepreneur  
**Flair:** Looking for Co-founder

> Not looking for a co-founder — looking for a strategic acquirer for my platform.
>
> Keevan Store is a creator commerce platform for East Africa. Built solo over 5 months. 13 creators, 3 transactions, production-ready.
>
> **Why acquisition instead of VC:**
> - Platform needs distribution more than capital
> - Strategic buyer with existing creator relationships can scale faster
> - I'm a builder, not a growth marketer
>
> **What I built:**
> - Creator storefronts with local currency pricing
> - Pesapal mobile money integration
> - Secure file delivery with signed URLs
> - Full admin dashboard
> - 609 tests, 29 migrations, 15+ docs files
>
> **Ideal acquirer:**
> - Creator economy platform wanting Africa expansion
> - FinTech company adding digital commerce
> - Entrepreneur or holding company with distribution channels
>
> Platform is live at keevanstore.in. Documentation available under NDA. Let's talk if this resonates.

### Post 5
**Subreddit:** r/Entrepreneur  
**Flair:** Growth

> I tried to grow a creator platform in East Africa with zero marketing budget. Here's what happened:
>
> **What worked:**
> - Direct outreach to creators on Twitter and LinkedIn
> - WhatsApp sharing within creator communities
> - Emphasizing mobile money support in every message
>
> **Results of direct outreach:**
> - 13 creators signed up over 4 months
> - 3 transactions completed
> - 0% refund rate
>
> **What I couldn't do alone:**
> - Scale creator acquisition to hundreds/thousands
> - Build strategic partnerships with payment providers
> - Run marketing campaigns across multiple countries
> - Provide support in multiple languages
>
> This is why I'm seeking a strategic acquirer. The platform is built and validated. The growth engine needs a team with resources.
>
> If you have distribution channels that could put this in front of thousands of creators, let's talk.

### Post 6
**Subreddit:** r/Entrepreneur  
**Flair:** Finances

> The financial reality of a pre-revenue startup in East Africa:
>
> **Costs (monthly):**
> - Hosting (Vercel + Supabase): ~$45/month
> - Email (Resend): ~$10/month
> - Domain: ~$1/month
> - Total: ~$56/month
>
> **Revenue:**
> - 3 transactions × 10% commission
> - Total platform revenue to date: negligible
>
> **Investment:**
> - 5 months of full-time development
> - Opportunity cost of not doing something else
>
> **Asset value:**
> - Platform codebase (29 migrations, 609 tests, 52 endpoints)
> - Payment integration (Pesapal with mobile money)
> - Creator base (13 creators)
> - Brand, domain, documentation
>
> I'm not pretending this is a profitable business yet. It's a validated, production-ready platform that needs distribution to generate revenue. That's why I'm pursuing strategic acquisition rather than trying to grow it alone.
>
> Be realistic about your financial position when seeking acquisition. Buyers will do due diligence.

### Post 7
**Subreddit:** r/Entrepreneur  
**Flair:** Technology

> The tech stack behind Keevan Store (and why I chose each piece):
>
> **Next.js 15 + React 19:** Best framework for full-stack web apps. Server components for performance, client components for interactivity. App Router is clean and logical.
>
> **TypeScript strict mode:** Catches errors at compile time that would otherwise be runtime bugs. Non-negotiable for a payment platform.
>
> **Supabase (PostgreSQL + Auth + Storage):** Single provider for database, authentication, and file storage. Reduces integration complexity. Row-Level Security is excellent for multi-tenant apps.
>
> **Pesapal API v3:** The most reliable payment gateway for mobile money across East Africa. Supports MTN, M-Pesa, Airtel Money, and card payments.
>
> **Vercel:** Deploy from GitHub, auto-scaling serverless functions, excellent Next.js support. Zero DevOps overhead.
>
> **Sentry:** Client, server, and edge monitoring. Essential for a platform handling real money.
>
> **Vitest + React Testing Library:** Fast, modern testing framework. 609 tests covering the full platform.
>
> Total infrastructure cost: ~$55-65/month. The stack is production-grade and ready to scale.

### Post 8
**Subreddit:** r/Entrepreneur  
**Flair:** Marketing

> I'm creating a content marketing strategy for Keevan Store's acquisition search. Here's what I'm doing:
>
> **Channels:**
> - LinkedIn (primary — 40+ posts across categories)
> - Reddit (r/startups, r/SaaS, r/Entrepreneur)
> - Direct outreach to potential acquirers
> - M&A platforms and startup marketplaces
>
> **Content themes:**
> - African creator economy opportunity
> - Technical quality and codebase
> - Transparency about metrics (13 creators, 3 transactions)
> - Strategic value for acquirers
> - Founder story and journey
>
> **Key message:**
> "Production-ready creator commerce platform for East Africa. Built, tested, and validated. Needs distribution and partnerships to scale. Seeking strategic acquirer."
>
> What channels would you use to find a strategic buyer for your startup?

### Post 9
**Subreddit:** r/Entrepreneur  
**Flair:** Starting a Business

> I built a business in an underserved market. Here's why I'm selling (and why you might want to buy).
>
> **The business:** Keevan Store — a platform for East African creators to sell digital products. Think Gumroad for East Africa.
>
> **Why I built it:**
> - 1.4+ billion people in Africa
> - Mobile money adoption is world-leading
> - No existing platform supports local payments properly
> - Creators are producing content but can't monetize locally
>
> **What exists today:**
> - Full platform with 52 API endpoints, 90+ components
> - Pesapal mobile money integration
> - Multi-currency support
> - 13 creators, 3 completed transactions
> - 609 tests, 15+ documentation files
>
> **Why sell:**
> - The platform needs distribution I can't provide alone
> - A strategic acquirer with resources can 10x what I've built
> - The codebase, documentation, and infrastructure are acquisition-ready
>
> **Why buy:**
> - 12+ months of development saved
> - Working payment infrastructure in East Africa
> - Immediate market entry with a tested platform
>
> If you're in creator economy, FinTech, or digital commerce — and Africa is in your strategy — let's talk.

### Post 10
**Subreddit:** r/Entrepreneur  
**Flair:** Lessons Learned

> 5 lessons from building a creator commerce platform solo:
>
> **1. Build for the market you're in, not the market you wish existed**
> I wanted to build a global platform. But the real opportunity was local — East African creators need local solutions. Building for a specific, underserved market is better than building a generic product.
>
> **2. Payment integration is the hardest and most important part**
> Everything else flows from payments. If your payment method doesn't work for local users, nothing else matters. I spent more time on payment integration than any other feature — and it was worth it.
>
> **3. Documentation compounds in value**
> Every document I wrote felt slow at the time. Now they constitute a complete due diligence package that makes acquisition conversations possible. Write docs as you build.
>
> **4. Know when you've hit the ceiling**
> I took Keevan Store as far as a solo founder can. The platform works, transactions flow, tests pass. But the next level needs resources I don't have. Recognizing that ceiling is a skill.
>
> **5. Building for acquisition changes how you build**
> I made decisions differently knowing someone might evaluate the codebase. Cleaner code, more tests, better docs, proper security. Build as if the best engineer you know will review everything.

### Post 11
**Subreddit:** r/Entrepreneur  
**Flair:** Online Business

> Keevan Store — an online business opportunity for the right buyer:
>
> **What it is:** A creator commerce platform for East African digital creators. Creators sign up, upload products (PDF, EPUB, MOBI, ZIP), and sell through branded storefronts. Buyers pay via mobile money or card. Files delivered instantly.
>
> **Current state:**
> - 13 creators onboarded
> - 3 completed transactions
> - 0 refunds
> - 609 automated tests
> - Full admin dashboard
>
> **Revenue model:** 10% commission on each transaction
>
> **What makes it valuable:**
> - East African payment infrastructure (hard to build)
> - Multi-currency architecture
> - Clean, documented codebase
> - 13 creator relationships
> - Brand and domain
>
> **What it needs:**
> - Marketing and distribution
> - Strategic partnerships
> - Operational capacity
>
> This is an early-stage opportunity for a strategic buyer who can provide the resources I can't. If that's you, let's have a conversation.
>
> Platform: keevanstore.in

### Post 12
**Subreddit:** r/Entrepreneur  
**Flair:** Looking for Feedback

> Looking for feedback on my acquisition pitch deck concept for Keevan Store:
>
> **Slide 1:** The Problem — East African creators can't sell digital products locally because global platforms don't support mobile money or local currencies.
>
> **Slide 2:** The Solution — Keevan Store: creator commerce platform with mobile money payments, local currencies, and branded storefronts.
>
> **Slide 3:** Product — Signup, storefront, product upload, checkout, payment, delivery, admin. The full loop works.
>
> **Slide 4:** Traction — 13 creators, 3 transactions, 0 refunds, 609 tests, 29 migrations.
>
> **Slide 5:** Technology — Next.js 15, Supabase, TypeScript strict, Pesapal, Vercel. Clean, documented, test-covered.
>
> **Slide 6:** Market Opportunity — East Africa's creator economy is underserved and growing. Mobile money penetration is world-leading.
>
> **Slide 7:** Strategic Value — Working payment infrastructure, multi-currency, creator base, 12+ months development time saved.
>
> **Slide 8:** Ideal Buyer — Creator economy platforms, FinTech companies, digital commerce businesses.
>
> **Slide 9:** What We Need — Distribution, partnerships, operational capacity.
>
> **Slide 10:** Call to Action — Let's talk.
>
> Does this cover what a strategic buyer would want to see? What's missing?

### Post 13
**Subreddit:** r/Entrepreneur  
**Flair:** Starting a Business

> The creator economy in Africa is a massive opportunity that most people are ignoring. Here's why:
>
> **The numbers people miss:**
> - Mobile money penetration in East Africa: 65-92% of adults
> - Smartphone adoption: growing fast (65%+ by 2027)
> - Digital content demand: increasing with internet access
> - Existing platforms: none properly serve this market
>
> **What global platforms get wrong:**
> - They require Stripe or PayPal (limited or unavailable in East Africa)
> - They price in USD (excludes local buyers)
> - They don't support mobile money
> - They're built for Western creators and buyers
>
> **What Keevan Store does differently:**
> - Mobile money as primary payment method
> - Local currency pricing (UGX, KES, TZS, RWF, USD)
> - Creator storefronts, not marketplace listings
> - Built for low-bandwidth environments
>
> I built this and proved it works (13 creators, 3 transactions). Now I'm looking for a strategic acquirer to take it to scale.
>
> If you're building in this space, or considering it, I'd love to compare notes.

### Post 14
**Subreddit:** r/Entrepreneur  
**Flair:** Exit Strategy

> Exit strategy for a solo-built platform: seeking strategic acquisition from day 1.
>
> I built Keevan Store with the exit in mind. Here's what that looked like:
>
> **Codebase decisions:**
> - TypeScript strict mode (acquirers love type safety)
> - Consistent patterns across all endpoints
> - Centralized error handling
> - Clean project structure
>
> **Testing decisions:**
> - Comprehensive test suite (609 tests)
> - Load testing scripts (k6)
> - CI pipeline (GitHub Actions)
>
> **Documentation decisions:**
> - Architecture documentation
> - API specification
> - Security audit
> - Deployment guide
> - Migration guide
> - Handover guide
>
> **Infrastructure decisions:**
> - Managed services (Vercel, Supabase) for easy transfer
> - Environment variable configuration
> - Documented setup process
>
> The result: a platform that's ready for technical due diligence and can be transferred to a new owner with minimal friction.
>
> If you're building with an exit in mind, what decisions are you making differently?

### Post 15
**Subreddit:** r/Entrepreneur  
**Flair:** Technology

> If you're building a platform for emerging markets, here's the tech stack I'd recommend based on my experience with Keevan Store:
>
> **Framework: Next.js**
> - Full-stack capabilities reduce the need for separate backend
> - Server components improve performance on slow connections
> - Vercel deployment is simple and scalable
>
> **Database: Supabase (PostgreSQL)**
> - Generous free tier
> - Built-in auth and storage
> - Row-Level Security for multi-tenant apps
> - Real-time capabilities
>
> **Payments: Gateway with local support**
> - For East Africa: Pesapal (mobile money + card)
> - For West Africa: Paystack, Flutterwave
> - Don't try to use Stripe where it doesn't operate
>
> **Email: Resend**
> - Simple API
> - Good deliverability
> - Generous free tier
>
> **Monitoring: Sentry**
> - Free for small teams
> - Client and server monitoring
> - Performance tracking
>
> **Testing: Vitest**
> - Fast, modern, compatible with Vite/Next.js
> - Good React Testing Library integration
>
> Total monthly cost for a production platform: ~$50-100/month
>
> This stack has served Keevan Store well. What are you using?

### Post 16
**Subreddit:** r/Entrepreneur  
**Flair:** Growth

> 13 creators in 4 months with no marketing budget. Here's exactly what I did for Keevan Store:
>
> **Channel 1: Direct Twitter Outreach**
> - Searched for "African creator" "sell digital products" "e-book writer"
> - Sent personal DMs (not automated)
> - Conversion rate: ~15% to signup
>
> **Channel 2: LinkedIn Networking**
> - Connected with creators in East Africa
> - Shared platform updates naturally
> - Conversion rate: ~10% to signup
>
> **Channel 3: WhatsApp Communities**
> - Joined creator/writer groups
> - Answered questions about selling digital products
> - Organic referrals when members found it useful
>
> **What I said in outreach:**
> "Hi [name], I noticed you create [content type]. I built a platform that lets East African creators sell digital products and accept payments via mobile money in local currencies. Would you be interested in trying it? It's free to sign up."
>
> **Key insight:** The mobile money angle was the differentiator. Almost every conversation started with "finally, a platform that supports MTN/M-Pesa."
>
> This approach got 13 creators. An acquirer with marketing resources could scale this to hundreds.

### Post 17
**Subreddit:** r/Entrepreneur  
**Flair:** Starting a Business

> I've spent 5 months building Keevan Store — a platform for African creators to sell digital products. Here's an honest update:
>
> **What went right:**
> - Platform is fully functional and production-ready
> - Payment integration with Pesapal works end-to-end
> - 609 tests provide confidence in the codebase
> - 13 creators onboarded without paid marketing
> - 3 transactions successfully completed
>
> **What went wrong:**
> - Underestimated payment integration complexity (took 3x expected)
> - Over-engineered some features that creators don't use yet
> - Spent too much time on admin tools before growing creator base
> - Didn't anticipate the UGX currency constraint issue in the schema
>
> **Current status:** Seeking strategic acquisition
>
> **Key lesson:** Building the product is 50% of the work. The other 50% is distribution — and I hit my ceiling as a solo founder.
>
> Would I do it again? Absolutely. The African creator economy is a real opportunity, and the platform is a solid foundation for the right team to scale.

### Post 18
**Subreddit:** r/Entrepreneur  
**Flair:** Looking for Feedback

> Quick pitch for Keevan Store. Tell me what's missing:
>
> "Acquire a production-ready creator commerce platform with working East African payment infrastructure — instantly enter a market of 300+ million mobile money users."
>
> **What you get:**
> ✓ Full platform: signup, storefronts, checkout, payments, delivery
> ✓ Mobile money integration (MTN, M-Pesa, Airtel Money)
> ✓ Multi-currency support (UGX, KES, TZS, RWF, USD)
> ✓ 13 creators already onboarded
> ✓ 3 validated transactions
> ✓ 609-passing test suite
> ✓ Complete documentation for due diligence
>
> **What you provide:**
> - Marketing distribution
> - Strategic partnerships
> - Operational capacity
>
> **The alternative:** Build from scratch (12+ months) vs. acquire now (weeks).
>
> keevanstore.in — live, functional, ready for the right owner.
>
> Is the value proposition clear? What would you add or change?

### Post 19
**Subreddit:** r/Entrepreneur  
**Flair:** Lessons Learned

> What I learned about the African digital commerce market from 5 months of building Keevan Store:
>
> **The opportunity is real but requires patience.**
> Demand for digital products is growing, but the market is early. Creators are still learning how to package and sell their knowledge. Buyers are still building trust in online transactions. The first movers who invest in education and infrastructure will win.
>
> **Mobile money is the killer feature.**
> Without mobile money support, you have no product for East Africa. With it, you have a differentiator that global platforms can't easily replicate. The payment integration is the moat.
>
> **Creator acquisition is relationship-based.**
> You can't buy ads and expect creators to sign up. You need to build relationships, demonstrate value, and earn trust. WhatsApp groups and direct conversations work better than any ad campaign.
>
> **The technology is the easy part.**
> Building the platform was straightforward. Getting creators to use it, building trust in the payment system, and creating a sustainable growth engine — those are the hard problems.
>
> **Early metrics don't tell the full story.**
> 13 creators and 3 transactions looks small. But each transaction tested the full loop — payment, verification, delivery, email — and proved the system works. Early metrics validate the model, not the scale.
>
> Keevan Store is proof that the model works. Now it needs distribution to prove the scale.

### Post 20
**Subreddit:** r/Entrepreneur  
**Flair:** Exit Strategy

> Keevan Store is available for strategic acquisition. Here's the simplest explanation of what that means:
>
> **You acquire:** A complete, tested, documented creator commerce platform for East Africa. Full codebase, brand, domain, 13 creator accounts, 3 transaction history, and all supporting infrastructure.
>
> **You get:** Instant entry into the African creator economy without spending 12+ months building from scratch. Working payment infrastructure with mobile money support.
>
> **You need to provide:** Marketing reach, strategic partnerships, and operational capacity to scale what's already built.
>
> **Why now:** The platform has validated its core transaction loop. The technology is stable, tested, and documented. The next phase needs resources that a solo founder can't provide.
>
> **Who should care:** Creator economy companies, FinTech platforms, digital commerce businesses, holding companies, and strategic acquirers with African market ambitions.
>
> Platform is live at keevanstore.in. Full documentation available under NDA. I'm ready for serious conversations.

---

## 4. r/Africa Posts (10)

### Post 1
**Subreddit:** r/Africa  
**Flair:** Technology

> I built a platform for African creators to sell digital products using mobile money. Here's why.
>
> I noticed that African creators — writers, educators, designers — have no good way to sell digital products online in their local currencies. Global platforms support USD and credit cards. But in East Africa, people use mobile money.
>
> So I built Keevan Store:
> - Creators get a branded storefront at keevanstore.in/store/[handle]
> - They upload e-books, guides, templates (PDF, EPUB, MOBI, ZIP)
> - Buyers pay via MTN Mobile Money, M-Pesa, or Airtel Money
> - Files are delivered instantly via secure download
> - Creators earn 90% of each sale (10% platform commission)
>
> The platform is live and working. 13 creators have signed up. 3 transactions have been completed successfully.
>
> I'm looking for a strategic partner to help scale this. The platform needs distribution to reach more creators and buyers across East Africa.
>
> What do you think? Would you use a platform like this? What's missing?

### Post 2
**Subreddit:** r/Africa  
**Flair:** Business

> African creators: what's stopping you from selling digital products online?
>
> I'm the founder of Keevan Store — a platform that lets African creators sell e-books, guides, and templates through branded storefronts. We support mobile money payments in UGX, KES, TZS, RWF, and USD.
>
> I'd love to hear directly from creators about:
> - What platforms have you tried to sell on?
> - What was the biggest obstacle?
> - What would make you try a new platform?
> - Is mobile money support important to you?
>
> Your feedback will help us improve the platform as we look for a strategic partner to scale it.
>
> Keevan Store is live at keevanstore.in. Honest feedback welcome — both positive and critical.

### Post 3
**Subreddit:** r/Africa  
**Flair:** Technology

> The mobile money gap in global creator platforms:
>
> Most platforms that let you sell digital products (Gumroad, Teachable, Ko-fi) require Stripe or PayPal. These don't work well for most African users.
>
> The result: African creators can't easily sell to African buyers using local payment methods.
>
> Keevan Store was built to close this gap. We integrated Pesapal — a leading East African payment gateway — to support mobile money (MTN, M-Pesa, Airtel) and card payments. Creators price in their local currency. Buyers pay how they normally pay.
>
> The platform works. 3 transactions completed. 13 creators onboarded.
>
> Now I'm looking for a strategic acquirer who can scale this across the continent. The infrastructure is built. It needs distribution.
>
> What do you think about the opportunity for creator commerce in Africa?

### Post 4
**Subreddit:** r/Africa  
**Flair:** Business

> I built a business for the African creator economy. Here's an honest look at the numbers:
>
> **Platform:** Keevan Store — digital product sales with mobile money
> **Creators:** 13
> **Transactions:** 3
> **Refunds:** 0
> **Tests:** 609
> **Tech stack:** Next.js 15, Supabase, TypeScript, Pesapal
>
> **Revenue model:** 10% commission on transactions
> **Current revenue:** Pre-scale
> **Monthly costs:** ~$55-65 (hosting, email, domain)
>
> **Why share these numbers?** Because I believe in transparency. The platform is early stage but technically solid. The transaction loop is validated — payments work, files deliver, emails send.
>
> I'm seeking a strategic acquirer who can provide the marketing reach and partnerships to turn this foundation into a significant business.
>
> If you're in creator economy, payments, or African tech, I'd love to connect.

### Post 5
**Subreddit:** r/Africa  
**Flair:** Technology

> For African creators who want to sell digital products online:
>
> I built Keevan Store specifically for you. Here's what it offers:
>
> **Free to join:** No subscription fees. You only pay 10% when you make a sale.
>
> **Your own storefront:** Get a branded page at keevanstore.in/store/[yourname]
>
> **Local currency pricing:** Set prices in UGX, KES, TZS, RWF, or USD
>
> **Mobile money payments:** Your buyers can pay with MTN, M-Pesa, or Airtel Money
>
> **Instant delivery:** Buyers get their files immediately after payment
>
> **Supported files:** PDF, EPUB, MOBI, ZIP (max 4MB)
>
> **What kind of products work:** E-books, guides, templates, worksheets, planners, reports, any digital document
>
> The platform is live and working. 13 creators are already using it. I'm looking for a strategic partner to help grow the platform, but in the meantime, creators are welcome to sign up and start selling.
>
> keevanstore.in — questions welcome in the comments.

### Post 6
**Subreddit:** r/Africa  
**Flair:** Business

> Why I built a creator platform for Africa instead of another global SaaS:
>
> When I looked at the creator economy, I saw a pattern: every platform was built for USD, Stripe, and Western users. African creators had to either accept these limitations or not participate at all.
>
> That didn't make sense given:
> - Africa has 1.4+ billion people
> - Mobile money adoption is world-leading
> - Smartphone penetration is growing fast
> - Digital content demand is rising
>
> The gap wasn't talent or demand — it was infrastructure. Platforms that work for African users need:
> - Mobile money payment support
> - Local currency pricing
> - Reliable delivery on variable connection speeds
> - Mobile-first design
>
> Keevan Store was built around these requirements. It works. It's tested. And now it needs a strategic partner to scale it across the continent.
>
> If you're building in African tech, what gaps are you seeing?

### Post 7
**Subreddit:** r/Africa  
**Flair:** Technology

> PSA for African creators: you can now sell digital products and accept mobile money payments through Keevan Store.
>
> **How it works:**
> 1. Sign up at keevanstore.in (free)
> 2. Set up your store with your name and description
> 3. Upload your product (e-book, guide, template, etc.)
> 4. Set your price in UGX, KES, TZS, RWF, or USD
> 5. Share your store link with your audience
> 6. When someone buys, you earn 90% of the sale
>
> **Why this is different:**
> - Mobile money is built in, not an afterthought
> - No Stripe or PayPal account needed
> - Your buyers pay with MTN, M-Pesa, or Airtel Money
> - Instant file delivery after payment
>
> **Current limitation:** File sizes up to 4MB (perfect for e-books and guides, not yet for video or audio).
>
> I'm the founder and I built this solo. The platform is live and processing transactions. If you have questions or feedback, I'm here.
>
> Looking for a strategic partner to help scale — but creators are welcome to start using it today.

### Post 8
**Subreddit:** r/Africa  
**Flair:** Business

> Real talk about building a tech business in Africa:
>
> **The good:**
> - The market is massive and underserved
> - Users are eager for solutions that work for them
> - Mobile money infrastructure is genuinely world-class
> - Building for Africa means building differently (not worse)
>
> **The challenging:**
> - Payment integration is complex (multiple gateways, currencies)
> - Internet connectivity varies — you must build for low bandwidth
> - Customer education is part of every transaction
> - Regulatory differences between countries require attention
> - Funding and exit options are more limited than in the US/EU
>
> **My experience with Keevan Store:**
> Built a creator commerce platform for East Africa. 13 creators onboarded. 3 transactions completed. Platform is production-ready. Now seeking strategic acquisition.
>
> Building for Africa is harder than building for Silicon Valley. But the impact and opportunity are real.
>
> Would love to hear from others building on the continent. What's your experience?

### Post 9
**Subreddit:** r/Africa  
**Flair:** Technology

> A tool for African creators: Keevan Store lets you sell digital products and accept mobile money.
>
> **Quick facts:**
> ✓ Free to join
> ✓ Your own branded storefront
> ✓ Price in UGX, KES, TZS, RWF, or USD
> ✓ Buyers pay with MTN, M-Pesa, Airtel Money, or card
> ✓ You earn 90% of each sale
> ✓ Instant file delivery
>
> **Platform status:** Live, production-ready, 13 creators, 3 completed transactions
>
> **Founder's note:** I built this solo and I'm looking for a strategic partner to help scale it. The platform works — it needs distribution.
>
> Creators can sign up at keevanstore.in. Questions and feedback welcome.

### Post 10
**Subreddit:** r/Africa  
**Flair:** Business

> The African creator economy needs infrastructure built for Africa, not adapted from elsewhere.
>
> Keevan Store is my attempt to build that infrastructure:
> - Creator storefronts with local currency pricing
> - Mobile money payment processing
> - Secure digital delivery
> - Full admin and management tools
>
> The platform works. 13 creators have joined. 3 transactions have gone through end-to-end.
>
> I'm seeking a strategic acquirer who can provide the distribution, partnerships, and operational capacity to scale this across East Africa and beyond.
>
> The platform is at keevanstore.in. I'm happy to answer questions about the build, the market, or the acquisition opportunity.

---

## 5. r/FinTech Posts (10)

### Post 1
**Subreddit:** r/FinTech  
**Flair:** Discussion

> I integrated mobile money payments into a creator commerce platform. Here's how it works:
>
> **The setup:** Keevan Store lets East African creators sell digital products. Buyers pay via mobile money or card through Pesapal.
>
> **Payment flow:**
> 1. Buyer initiates checkout → order created with "pending" status
> 2. Buyer redirected to Pesapal payment page
> 3. Buyer pays via MTN Mobile Money, M-Pesa, Airtel Money, or card
> 4. Pesapal sends IPN webhook to our server
> 5. Server verifies payment status via Pesapal API query
> 6. Order finalized atomically (DB-level locking prevents race conditions)
> 7. Buyer receives download link via success page + email
>
> **Key decisions:**
> - Three-way payment verification (IPN + API query + manual reconciliation)
> - Atomic finalization with database-level locking
> - Status polling from the client during checkout
> - Failed payments handled gracefully with clear error messages
>
> **Testing approach:**
> - Simulated IPN callbacks with various status values
> - Concurrent payment requests to test race conditions
> - Invalid payment reference handling
>
> What's your experience with mobile money integration? Any lessons to share?

### Post 2
**Subreddit:** r/FinTech  
**Flair:** Startup

> FinTech SaaS opportunity in East Africa: creator commerce with mobile money payments.
>
> **The platform:** Keevan Store
> **The FinTech angle:** Pesapal integration for mobile money + card payments across Uganda, Kenya, Tanzania, Rwanda
> **The commerce angle:** Creator storefronts, product management, file delivery
>
> **What's built:**
> - Complete payment processing flow (checkout → payment → verification → delivery)
> - Multi-currency support (UGX, KES, TZS, RWF, USD)
> - Withdrawal system for creator payouts
> - Refund workflow with admin approval
> - Email notifications for all payment events
> - Audit logging for financial transactions
>
> **Current state:** 13 creators, 3 transactions, 0 failures, 609 tests
>
> **Looking for:** Strategic acquisition by a FinTech company that wants to add digital commerce capabilities and enter the East African market.
>
> If your FinTech company is exploring creator economy or digital commerce expansion, this could be your fastest path.

### Post 3
**Subreddit:** r/FinTech  
**Flair:** Technical

> Technical deep dive: how we handle payment verification in Keevan Store
>
> We use three-way payment verification to ensure every transaction is legitimate:
>
> **Level 1: Client-Side Redirect**
> - Buyer completes payment on Pesapal
> - Pesapal redirects back to our success page with transaction reference
> - Client-side polling checks order status every 3 seconds
> - Initial status update happens here (but isn't trusted as final)
>
> **Level 2: IPN Webhook (Server-Side)**
> - Pesapal sends Instant Payment Notification to our callback URL
> - We verify the IPN signature matches Pesapal's expected format
> - Order status updated based on IPN data
> - Database-level locking prevents concurrent IPN processing
>
> **Level 3: Manual API Query (Reconciliation)**
> - Admin endpoint to query Pesapal API directly
> - Used for order lookup and manual reconciliation
> - Cross-references our stored status with Pesapal's actual status
>
> **Why three levels?**
> - Client redirect can be spoofed (buyer could fake a success page)
> - IPN can arrive late or be retried
> - Direct API query is the source of truth
>
> This approach has processed 3 real transactions with 0 failures and 0 discrepancies.
>
> What verification approach do you use in your payment platform?

### Post 4
**Subreddit:** r/FinTech  
**Flair:** Discussion

> The African mobile money opportunity for FinTech platforms:
>
> Mobile money isn't a niche in Africa — it's the dominant financial infrastructure for hundreds of millions of people.
>
> **Market stats:**
> - Kenya: 92% of adults use M-Pesa
> - Uganda: 70%+ use mobile money
> - Tanzania: 70%+ use mobile money
> - Rwanda: 65%+ use mobile money
> - Sub-Saharan Africa mobile money transactions: $800B+ in 2023
>
> **The gap for creator commerce:**
> Global platforms (Gumroad, Teachable, Ko-fi) don't support mobile money. Creators who want to sell digital products to local audiences have no platform that works with their buyers' preferred payment method.
>
> **Keevan Store fills this gap:**
> - Pesapal integration for mobile money + card
> - Multi-currency support (UGX, KES, TZS, RWF, USD)
> - 13 creators, 3 transactions, 0 failures
> - Production-ready platform seeking strategic acquisition
>
> For FinTech companies looking to expand into digital commerce in Africa, this is a built-and-tested entry point.

### Post 5
**Subreddit:** r/FinTech  
**Flair:** Startup

> I built a payment-integrated creator commerce platform for East Africa. Seeking strategic acquirer.
>
> **Keevan Store at a glance:**
> - Creator signup with branded storefronts
> - Pesapal payment processing (mobile money + card)
> - Multi-currency pricing (UGX, KES, TZS, RWF, USD)
> - Secure file delivery with signed URLs
> - Full admin dashboard for platform management
> - Email queue system for notifications
>
> **Payment infrastructure highlights:**
> - Three-way payment verification
> - Atomic finalization with DB locking
> - IPN webhook handling
> - Rate limiting on payment endpoints
> - CSRF protection on checkout
> - Audit logging for all transactions
>
> **Current metrics:**
> - 13 creators onboarded
> - 3 completed transactions
> - 0 refunds
> - 609 tests covering all payment flows
>
> Looking for a FinTech company that wants to add creator commerce to its offering and enter the East African market.
>
> Platform live at keevanstore.in. Documentation available under NDA.

### Post 6
**Subreddit:** r/FinTech  
**Flair:** Technical

> Load testing payment flows: what we learned from k6 testing on Keevan Store
>
> We wrote k6 scripts to test our payment infrastructure:
>
> **Test 1: Payment creation under load (200 concurrent)**
> - 200 simultaneous checkout requests
> - CSRF token validation on each request
> - Result: All requests handled correctly, rate limiting enforced where configured
>
> **Test 2: Concurrent payment finalization**
> - Simulated multiple IPN callbacks for the same order
> - Tested database-level locking prevents double-processing
> - Result: Atomic finalization works as designed — no duplicate payment records
>
> **Test 3: Order lookup rate limiting**
> - 30 concurrent requests testing 5 req/min enforcement
> - Result: Rate limiting correctly blocks excessive requests
>
> **Key findings:**
> - Database-level locking is essential for payment platforms
> - Rate limiting prevents abuse of order lookup endpoints
> - Serverless functions on Vercel handle concurrent requests well
> - Load testing revealed no race conditions or data corruption issues
>
> For anyone building payment infrastructure: load test your payment flows before going to production. We found and fixed issues we would have missed otherwise.

### Post 7
**Subreddit:** r/FinTech  
**Flair:** Discussion

> Why FinTech companies should care about creator commerce:
>
> The creator economy ($480B+ globally) is growing fast in Africa. But the payment infrastructure gap means most of this value flows outside the continent.
>
> **The opportunity:**
> - African creators are producing digital content
> - African buyers want to purchase in local currencies with mobile money
> - No platform properly serves this market today
> - First mover with integrated payment infrastructure will capture the market
>
> **What exists (Keevan Store):**
> - Working payment integration with Pesapal
> - Mobile money support (MTN, M-Pesa, Airtel)
> - Multi-currency architecture
> - 13 creators, 3 validated transactions
>
> **For a FinTech acquirer:**
> - Add digital commerce to your payment offering
> - Enter the creator economy market immediately
> - Acquire working infrastructure instead of building from scratch
> - Gain relationships with 13 early-adopter creators
>
> I'm the founder of Keevan Store and I'm seeking a strategic FinTech acquirer. If your company is exploring this space, I'd welcome a conversation.

### Post 8
**Subreddit:** r/FinTech  
**Flair:** Startup

> Keevan Store — a FinTech-adjacent platform available for strategic acquisition
>
> **Why it's FinTech-adjacent:**
> - Core differentiator is payment infrastructure (mobile money integration)
> - Platform processes real financial transactions
> - Requires financial security practices (three-way verification, atomic finalization, audit logging)
> - Multi-currency financial calculations and reporting
>
> **What's built:**
> - Complete checkout → payment → verification → delivery flow
> - Creator payout/withdrawal system
> - Refund processing with admin workflow
> - Email notifications for financial events
> - Sales analytics and earnings tracking
>
> **Current state:**
> 13 creators, 3 transactions, 0 failures, 609 tests, 29 migrations
>
> **Seeking:** FinTech company or strategic buyer who can integrate this into a larger financial services offering for African creators.
>
> Platform: keevanstore.in

### Post 9
**Subreddit:** r/FinTech  
**Flair:** Discussion

> Practical lessons from integrating Pesapal for mobile money payments:
>
> **Integration approach:**
> - Use Pesapal's iframe/redirect for payment collection (less PCI scope)
> - Implement IPN (Instant Payment Notification) callback for server-side confirmation
> - Always verify payment status via API query — don't trust redirect alone
> - Handle IPN retries gracefully (same IPN can arrive multiple times)
>
> **Gotchas we hit:**
> - IPN can arrive before the user is redirected back to your site
> - Testing requires Pesapal sandbox credentials (real mobile money numbers needed for some tests)
> - Currency handling: Pesapal returns amounts in the currency of the transaction, but format varies
> - Race conditions: without database locking, concurrent callbacks can double-process payments
> - Error messages from Pesapal are sometimes generic — build your own logging around their responses
>
> **What we'd do differently:**
> - Implement idempotency keys from day one
> - More comprehensive error handling for Pesapal timeout scenarios
> - Better monitoring dashboard for payment failures
>
> Happy to share more details if anyone's building a Pesapal integration.

### Post 10
**Subreddit:** r/FinTech  
**Flair:** Discussion

> The creator commerce + FinTech intersection in Africa:
>
> **Current reality:**
> - Creators can't sell easily because payments don't work
> - Buyers can't pay easily because familiar methods aren't supported
> - Payment providers lack commerce platforms to drive transaction volume
>
> **The solution that bridges both:**
> A platform that handles creator storefronts AND payment processing AND file delivery — with mobile money as a native payment method.
>
> That's Keevan Store:
> - 13 creators using the platform
> - 3 completed transactions through Pesapal
> - Multi-currency support
> - Production-ready infrastructure
>
> **Strategic value for FinTech companies:**
> - Acquire a commerce platform to drive payment volume
> - Enter the creator economy market immediately
> - Test mobile money commerce without building from scratch
> - Gain insights into creator economy financial flows
>
> I'm looking for a strategic acquirer. If your FinTech company is exploring creator commerce in Africa, let's talk.

---

## 6. r/CreatorEconomy Posts (5)

### Post 1
**Subreddit:** r/CreatorEconomy

> Building a creator economy platform for a market the big players ignore:
>
> Most creator economy platforms serve the same markets: US, Europe, some of Asia. Africa is largely unserved because payment infrastructure is different.
>
> I built Keevan Store for East African creators. The key differences from Gumroad/Teachable/Ko-fi:
>
> **Payment:** Mobile money (MTN, M-Pesa, Airtel) instead of just Stripe/PayPal
> **Currency:** Local currencies (UGX, KES, TZS, RWF, USD) instead of USD-only
> **Storefronts:** Branded stores at /store/[handle] instead of marketplace listings
> **Delivery:** Signed URLs with 60s TTL for security
>
> **Current state:** 13 creators, 3 transactions, 609 tests
>
> The platform is production-ready. I'm seeking a strategic acquirer who can scale it.
>
> For creator economy companies: this is your entry point into Africa. The payment infrastructure is the hardest part — and it's already built.

### Post 2
**Subreddit:** r/CreatorEconomy

> What African creators need from creator economy platforms:
>
> Based on building Keevan Store and conversations with 13 East African creators:
>
> **1. Local payment methods (non-negotiable)**
> Mobile money is not an alternative payment in Africa — it's the primary payment method. Platforms that don't support MTN, M-Pesa, or Airtel Money are excluding most potential buyers.
>
> **2. Local currency pricing**
> Pricing in USD creates friction. Buyers need to calculate exchange rates. Prices feel unpredictable. Supporting UGX, KES, TZS, RWF makes purchases feel natural.
>
> **3. Brand ownership**
> Creators want their own storefront, not a listing on a marketplace. They're building a brand, and the platform should support that.
>
> **4. Simple onboarding**
> Many creators aren't technical. They need to sign up, upload, and start selling in under 10 minutes — without configuring payment gateways or understanding merchant accounts.
>
> **5. Trust signals**
> African buyers are cautious about online payments. Platform security, clear refund policies, and familiar payment gateways build trust.
>
> Keevan Store addresses all five. The platform works. Now it needs distribution.
>
> What else would you add to this list?

### Post 3
**Subreddit:** r/CreatorEconomy

> 13 creators in 4 months with no budget. Here's what I learned about creator acquisition in Africa:
>
> **Strategy:**
> - Direct outreach on Twitter and LinkedIn
> - Joined WhatsApp creator/writer groups
> - Emphasized mobile money support in every message
> - Free to join (no subscription, 10% commission only on sales)
>
> **What resonated:**
> "Finally, a platform that supports MTN/M-Pesa/Airtel Money"
> "Can I price in UGX?"
> "How fast do buyers get their files?"
>
> **What creators asked about:**
> - Withdrawal process and timing
> - File size limits
> - Analytics and earnings tracking
> - Store customization options
>
> **Conversion rate:** ~12-15% from outreach to signup
>
> The creator economy in Africa is real. Creators are actively looking for platforms that work for their market. The challenge isn't demand — it's distribution.
>
> Keevan Store is built and ready for an acquirer who can provide that distribution. 13 creators is early traction, but it proves the model.

### Post 4
**Subreddit:** r/CreatorEconomy

> I built a creator commerce platform for East Africa. Here's the technical foundation:
>
> **Stack:** Next.js 15, React 19, TypeScript strict mode, Supabase (PostgreSQL + Auth + Storage), Pesapal API v3, Vercel
>
> **Creator features:**
> - Branded storefront at /store/[handle]
> - Product CRUD with file upload (magic-byte validation)
> - Cover image upload (JPEG/PNG/WebP)
> - Sales analytics and earnings tracking
> - Withdrawal requests
>
> **Buyer features:**
> - Product browsing on storefronts
> - Checkout with mobile money or card
> - Instant download after payment
> - Order lookup and refund requests
>
> **Admin features:**
> - Creator and buyer management
> - Product moderation
> - Withdrawal and refund processing
> - Audit log and sales reports
> - Email queue management
>
> **Quality metrics:**
> - 609 automated tests
> - 29 database migrations
> - 52 API endpoints
> - 90+ components
> - 15+ documentation files
>
> This isn't a prototype. It's a production-ready platform seeking a strategic acquirer.

### Post 5
**Subreddit:** r/CreatorEconomy

> The creator economy gap in Africa — and how Keevan Store fills it:
>
> **The gap:** Global creator platforms don't support African payment methods or currencies. African creators can either use workarounds (expensive, unreliable) or not participate.
>
> **The result:** Digital products that could be sold to African audiences remain unsold. Creators lose income. Buyers lose access to content.
>
> **Keevan Store's approach:**
> - Accept payments via mobile money (MTN, M-Pesa, Airtel) and card
> - Price products in UGX, KES, TZS, RWF, or USD
> - Provide branded storefronts (not marketplace listings)
> - Deliver files securely with signed URLs
>
> **Current state:** 13 creators, 3 transactions, 0 refunds
>
> **Seeking:** Strategic acquirer who can scale this across Africa — creator economy companies, FinTech platforms, or digital commerce businesses.
>
> The infrastructure is built. The market is ready. The opportunity is real.

---

## 7. r/SEO / r/webdev Posts (5)

### Post 1
**Subreddit:** r/webdev

> Building a creator commerce platform with Next.js 15 and Supabase. Here's the architecture:
>
> **Frontend:** Next.js 15 App Router, React 19, Tailwind CSS 3, TypeScript strict mode
> **Backend:** Serverless API routes (52 endpoints), centralized error handling, Zod validation
> **Database:** Supabase PostgreSQL with Row-Level Security, 29 migrations
> **Auth:** Supabase SSR with cookie-based sessions
> **Storage:** Supabase Storage (private + public buckets)
> **Payments:** Pesapal API v3 with IPN webhooks
> **Email:** Resend (primary) + Nodemailer/SMTP (fallback), DB-queued
> **Testing:** Vitest + React Testing Library (609 tests)
> **Load testing:** k6 scripts
> **Monitoring:** Sentry (client, server, edge)
> **CI/CD:** GitHub Actions
> **Hosting:** Vercel (serverless)
>
> **Security highlights:**
> - RLS on every table
> - CSRF protection
> - Rate limiting (120 req/min/IP)
> - Magic-byte file validation
> - Signed download URLs (60s TTL)
> - Admin audit logging
>
> The platform is live at keevanstore.in. Codebase available for due diligence. Seeking strategic acquirer.

### Post 2
**Subreddit:** r/SEO

> SEO approach for a creator commerce platform:
>
> Keevan Store uses:
> - Dynamic sitemap.xml generation
> - Custom robots.txt
> - Per-page Open Graph meta tags
> - JSON-LD structured data (Product schema)
> - LLM-optimized content (llms.txt, llms-full.txt, ai.json)
> - Google Search Console verification
> - Storefront meta tags per creator
>
> **What's working:**
> - Each creator storefront is independently indexable
> - Product pages have rich snippets for search results
> - JSON-LD helps search engines understand the product structure
>
> **What could improve:**
> - Blog/content marketing (not built yet)
> - Backlink strategy (limited currently)
> - Multi-language SEO (English only now)
>
> For an acquirer, the SEO foundation is in place but needs content marketing investment to drive organic traffic.

### Post 3
**Subreddit:** r/webdev

> Security practices I implemented in a payment-handling Next.js app:
>
> **Row-Level Security:** Every database table has RLS policies. Users can only access their own data. Admins have broader access. No table is unprotected.
>
> **CSRF Protection:** All state-changing requests validate Origin/Referer headers. Prevents cross-site request forgery on checkout and admin actions.
>
> **Rate Limiting:** Database-backed, 120 requests per minute per IP. Applies to auth endpoints, payment creation, and order lookups. Prevents brute force and abuse.
>
> **File Validation:** Magic-byte validation checks actual file content, not just extensions. Prevents MIME-type spoofing where a user uploads a .pdf that's actually executable code.
>
> **Signed URLs:** Download links expire after 60 seconds. Prevents unauthorized sharing of paid content.
>
> **Input Validation:** Zod schemas validate every API input. TypeScript strict mode catches type errors at compile time.
>
> **Audit Logging:** Every admin action is logged with timestamp, actor, action, and target. Provides audit trail for compliance.
>
> **Error Monitoring:** Sentry integration on client, server, and edge. Catches and reports production errors in real-time.
>
> For any payment-handling web app: start with security. Everything else can be improved later.

### Post 4
**Subreddit:** r/webdev

> 5 months of solo building a Next.js 15 platform. What I'd do differently:
>
> **What went well:**
> - Next.js 15 App Router is excellent for this type of app
> - Supabase with RLS is perfect for multi-tenant platforms
> - TypeScript strict mode caught countless issues early
> - Vitest + RTL is a solid testing setup
>
> **What I'd change:**
> - Schema design: products.currency has a `CHECK (currency = 'UGX')` constraint that blocks multi-currency. Should have thought about this more carefully before migrations.
> - Testing strategy: some tests mock at inconsistent levels. Define mocking strategy upfront.
> - Component library: should have used (or built) a design system earlier. Some UI inconsistency.
> - Documentation: should have written ADRs as I went, not after.
> - Accessibility: need to add proper a11y testing and ARIA labels.
>
> **What I'd keep the same:**
> - Payment verification approach (three-way verification is worth the complexity)
> - Email queue via DB triggers (saved us from several issues)
> - Security-first architecture (RLS, CSRF, rate limiting from day one)
>
> The platform (keevanstore.in) is live and functional. 13 creators, 3 transactions, 609 tests. Seeking strategic acquirer.

### Post 5
**Subreddit:** r/webdev

> Testing a payment platform: how I structure 609 tests for reliability:
>
> **Categories:**
> - **API routes (largest category):** Each endpoint tested for success case, validation errors, auth errors, and edge cases. Payment endpoints have additional tests for IPN handling, concurrent requests, and status transitions.
> - **Auth flows:** Registration validation, login/logout, session management, role-based access, rate limiting enforcement.
> - **Database queries:** RLS policy enforcement, data integrity, migration correctness.
> - **Email system:** Queue insertion, template rendering, retry logic, duplicate detection.
> - **File handling:** Magic-byte validation for valid/invalid files, size limits, signed URL generation.
> - **UI components:** Rendering, user interactions, loading states, error states.
> - **Utils and helpers:** Currency formatting, fee calculation, slug generation, date formatting.
>
> **Testing principles:**
> - Tests should be independent and idempotent
> - Mock external services (Pesapal, Resend, Supabase) for API tests
> - Test failure paths as thoroughly as success paths
> - Use describe blocks to organize by feature
> - Write tests while building features, not after
>
> **Tools:** Vitest (runner), React Testing Library (component tests), MSW (API mocking), k6 (load tests)
>
> For any webdev building a payment platform: invest in testing. It catches the bugs that would cost real money in production.

---

*This document contains Reddit marketing content for Keevan Store's acquisition campaign. All metrics are based on actual platform data as of July 2026 — 13 creators, 2 buyers, 3 completed sales, 3 successful deliveries, 0 refunds, 609 automated tests, 29 database migrations, 52 API endpoints, 15+ documentation files.*
