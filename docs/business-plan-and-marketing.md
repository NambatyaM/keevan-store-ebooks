# Keevan Store — Business Plan & Marketing Strategy

---

## SMTP Setup in Supabase

Supabase provides built-in SMTP settings that allow Keevan Store to send transactional emails (order confirmations, download links, withdrawal status, refund updates).

### Step-by-Step

1. **Go to your Supabase Dashboard** → Project Settings → **Auth** → **SMTP Settings**

2. **Toggle "Enable SMTP" ON**

3. **Enter your SMTP provider credentials** — you can use any provider. Recommended options for Uganda:

   | Provider | Host | Port | Notes |
   |---|---|---|---|
   | **SendGrid** | `smtp.sendgrid.net` | 587 | Free tier: 100 emails/day |
   | **Mailgun** | `smtp.mailgun.org` | 587 | Free tier: 5,000 emails/month |
   | **Gmail SMTP** | `smtp.gmail.com` | 587 | Limited to 500/day, needs app password |
   | **Brevo (Sendinblue)** | `smtp-relay.brevo.com` | 587 | Free tier: 300 emails/day |

4. **Fill in the fields:**

   ```
   SMTP Host:     smtp.sendgrid.net (or your provider)
   SMTP Port:     587
   SMTP User:     apikey (or your provider's username)
   SMTP Pass:     your-api-key-or-password
   Sender Email:  noreply@keevanstore.in
   Sender Name:   Keevan Store
   ```

5. **Click "Save"** — Supabase will send a test email to verify the configuration.

6. **Then set the same values in Vercel environment variables:**

   ```
   SMTP_HOST=smtp.sendgrid.net
   SMTP_PORT=587
   SMTP_USER=apikey
   SMTP_PASS=your-api-key
   SMTP_FROM=noreply@keevanstore.in
   ```

### How the app uses SMTP

When a customer buys a product, the `finalize_pesapal_payment` RPC inserts an `email_queue` row. A Vercel Cron job (`/api/emails/process`) runs every 5 minutes to process pending email queue entries and sends them via Nodemailer using these SMTP credentials.

---

## Business Plan

### 1. Executive Summary

Keevan Store is a creator-commerce platform for East African authors, educators, and digital creators. Unlike marketplaces, creators own individual storefronts and share product links directly with their audiences. The platform handles payment collection via Pesapal, secure file delivery, and commission-based revenue.

**Value Proposition:**
- For creators: sell digital products with no upfront costs, instant download delivery, 90% payout
- For buyers: secure Pesapal checkout, instant downloads, no account required
- For Keevan Store: 10% commission per transaction

### 2. Market Opportunity

**East Africa Digital Content Market:**
- Uganda has one of the highest mobile money penetration rates in Africa (~65% of adults)
- Growing e-book and digital education market (Kenya edtech projected at $1B by 2030)
- 60%+ of Uganda's population is under 25 — digital-native content consumers
- Teachers, lecturers, and authors increasingly selling PDFs, course materials, and guides directly to students
- Existing options (Paystack, Stripe) either don't operate in Uganda or are too complex for individual creators

**Key Problem:** East African creators have no simple way to accept mobile money payments for digital products and deliver them instantly with download security.

### 3. Target Audience

**Primary: Creators (supply side)**
- Authors of fiction and non-fiction e-books
- University lecturers selling course notes and past papers
- Educators creating study guides, lesson plans, and revision materials
- Digital creators selling guides, templates, and resources
- Small publishing houses and self-published authors

**Secondary: Buyers (demand side)**
- Students seeking study materials
- Readers looking for e-books from trusted creators
- Professionals buying industry guides and resources

### 4. Revenue Model

| Stream | Detail |
|---|---|
| **Transaction Commission** | 10% of each sale (primary) |
| **Creator Growth** | As creator base grows, transactions scale linearly |
| **Future: Premium Features** | Analytics upgrades, bulk upload, custom domains (post-MVP) |

### 5. Competitive Landscape

| Competitor | Region | Problem |
|---|---|---|
| **Paystack** | Nigeria, Ghana | Not available in Uganda |
| **Flutterwave** | Pan-Africa | Complex onboarding, not creator-focused |
| **Selar** | Pan-Africa | Marketplace model, less control for creators |
| **Gumroad** | Global | No mobile money support, USD pricing only |
| **Direct M-Pesa** | Kenya/Tanzania | No file delivery, no storefront |

**Keevan Advantage:** UGX-native, Pesapal-integrated, no account for buyers, creator-owned storefronts, instant delivery.

### 6. Operational Model

```
Creator uploads product → Shares link with audience
Buyer clicks link → Pays via Pesapal (mobile money/card)
Keevan verifies payment → Creates secure download link
Creator earns 90% → Requests withdrawal (manual payout)
```

- **Payment Collection:** Pesapal API 3.0 (automated)
- **File Delivery:** Supabase Storage with signed URLs (60s expiry)
- **Creator Payouts:** Manual (admin-approved, off-platform)
- **Refunds:** Admin-reviewed via Pesapal RefundRequest API

### 7. Key Metrics & Goals

| Metric | Year 1 Target |
|---|---|
| Registered creators | 50–100 |
| Active creators (sold ≥1 product) | 30–50 |
| Total products published | 100–300 |
| Monthly transactions | 200–500 |
| Monthly GMV (Gross Merchandise Value) | 5M–15M UGX |
| Platform revenue (10% commission) | 500K–1.5M UGX/month |
| Average order value | 25,000–50,000 UGX |

### 8. Risks & Mitigation

| Risk | Mitigation |
|---|---|
| **Fraudulent purchases** | Server-side 3-way payment verification before download |
| **File piracy** | Signed URLs (60s expiry), download token per purchase |
| **Payment disputes** | Structured refund system with admin review |
| **Creator churn** | Low friction onboarding, 90% payout, no subscription fees |
| **Pesapal downtime** | Error handling, retry logic, status polling fallback |

### 9. Growth Roadmap

| Phase | Timeline | Focus |
|---|---|---|
| **Launch** | Month 1 | Onboard 20 creator pilot, test payment flow |
| **Growth** | Months 2–3 | Facebook & LinkedIn campaigns, creator referral program |
| **Scale** | Months 4–6 | Automated payouts, expanded payment methods |
| **Expand** | Months 7–12 | Kenya/Tanzania/Rwanda launch, local pricing |

---

## Marketing Strategy — Facebook & LinkedIn

### Platform Rationale

| Platform | Why for Keevan Store |
|---|---|
| **Facebook** | Largest social platform in East Africa (Uganda: 3M+ users). Facebook Groups are the primary online community space for authors, educators, and local business networks. Excellent for both creator acquisition and buyer reach. |
| **LinkedIn** | The professional network where educators, lecturers, authors, and trainers build their brands. Ideal for positioning Keevan Store as a serious business tool for monetizing expertise. |

---

### Facebook Strategy

#### Objective
Acquire creators and drive sales through community building, targeted ads, and creator advocacy.

#### 1. Facebook Groups (Primary Channel)

**Target Groups to Join & Engage:**

| Group Category | Examples | Strategy |
|---|---|---|
| Author/Writers Groups | "Uganda Writers Association," "East African Authors" | Share tips on selling e-books, offer free guides, position Keevan as the tool |
| Educator Groups | "Uganda Teachers Forum," "University Lecturers Uganda" | Show how to sell course notes and study materials |
| Business Groups | "Young Entrepreneurs Uganda," "SME Uganda" | Position Keevan as a side-income tool for creators |
| Book Clubs | "Kampala Book Club," "African Literature Lovers" | Engage with readers, let them discover creators on Keevan |

**Group Engagement Cadence (per week per group):**
- 2 helpful comments on existing posts (build authority)
- 1 value post (e.g., "How to sell your PDF course notes online in Uganda")
- 1 post sharing a creator success story or platform update

#### 2. Content Pillars

| Pillar | Content Type | Frequency |
|---|---|---|
| **Creator Success** | Mini case studies of creators making sales | 2x/week |
| **Educational** | "How to price your e-book," "How to find buyers" | 2x/week |
| **Product Features** | New features, platform walkthroughs | 1x/week |
| **Community** | Testimonials, creator spotlights, Q&A | 1x/week |

#### 3. Paid Ads (Budget: ~$100–$200/month)

**Campaign 1 — Creator Acquisition:**
- **Audience:** Uganda, Kenya — ages 22–45 — Interests: Writing, Education, E-books, Self-publishing, Teaching
- **Ad Creative:** Short video or carousel showing "Create your store in 5 minutes, start selling PDFs"
- **Call to Action:** "Sign Up Free" → Creator registration page
- **Budget:** $3–$5/day per ad set

**Campaign 2 — Product/Buyer Demand:**
- **Audience:** Uganda — ages 18–40 — Interests: Reading, Books, Online learning, Students
- **Ad Creative:** "Support your favorite creator — buy their e-book directly"
- **Call to Action:** "Browse Stores" → Featured creator product pages
- **Budget:** $2–$3/day

**Campaign 3 — Retargeting:**
- **Audience:** Users who visited keevanstore.in but didn't register or purchase
- **Ad Creative:** Success story + testimonial
- **Budget:** $1–$2/day

#### 4. Creator Advocacy Loop

When a creator makes a sale, ask them to share their Keevan Store link on their Facebook timeline. Offer a feature in the "Creator Spotlight" series as incentive. This creates organic word-of-mouth — each creator brings their audience.

---

### LinkedIn Strategy

#### Objective
Position Keevan Store as the professional platform for educators, authors, and trainers to monetize their knowledge. Build authority and trust among serious creators.

#### 1. Personal & Company Page Presence

**Keevan Store LinkedIn Page:**
- Create a LinkedIn Company Page
- Description: "Keevan Store helps East African authors, educators, and creators sell digital products online. Accept mobile money payments and deliver instant downloads."
- Post 3–4x per week

**Founder/Team Personal Profiles:**
- Optimize profiles with "Building Keevan Store — helping East African creators monetize their work"
- Share platform updates, creator stories, and industry insights
- Personal posts outperform company page posts 10:1 in engagement

#### 2. Content Strategy

| Content Type | Examples | Frequency |
|---|---|---|
| **Thought Leadership** | "Why East African creators need their own storefront, not just a marketplace link" | 1x/week |
| **Practical Tips** | "3 steps to start selling your course notes online today" | 1x/week |
| **Creator Stories** | "Meet [Creator Name], earning [amount] selling [product] on Keevan Store" | 1x/week |
| **Industry Insights** | "The state of digital publishing in Uganda 2026" | 1x/month |

#### 3. Key Audiences to Target

| Audience | Search/Lookup Strategy |
|---|---|
| **University Lecturers** | Search for "Lecturer at Makerere University," "Lecturer at Kyambogo," etc. |
| **Teachers** | LinkedIn has strong educator presence in Uganda and Kenya |
| **Authors** | Search "Author," "Writer," "Self-published" with location filters |
| **Trainers & Coaches** | "Trainer," "Coach," "Consultant" who sell PDF guides |
| **EdTech Professionals** | People working in education technology in East Africa |

#### 4. Outreach Strategy

**Connection Request Message Template:**
```
Hi [Name],

I came across your work in [teaching/writing/coaching] and wanted to connect.

I'm building Keevan Store — a platform that helps East African creators (authors, educators, trainers) sell their digital products directly to their audience. You get your own storefront, accept mobile money payments, and deliver instant downloads.

Would love to hear your thoughts — and if you ever consider selling your materials online, happy to help you get started.

Best,
[Your Name]
```

**Follow-up (after connection is accepted):**
```
Hi [Name], thanks for connecting!

If you've ever thought about selling your [course notes/e-books/guides] online, Keevan Store makes it simple. You keep 90% of every sale.

Here's a quick walkthrough: [link]

No pressure at all — happy to answer any questions.

Best,
[Your Name]
```

**Weekly Target:** Send 15–20 personalized connection requests per week. Aim for 5–10 conversations leading to 2–3 signups.

#### 5. LinkedIn Articles (Long-Form, Monthly)

Publish 1–2 LinkedIn articles per month to build organic reach and SEO:
- "The Complete Guide to Selling Digital Products in Uganda"
- "How Teachers Can Earn Extra Income Selling Notes Online"
- "Why 2026 is the Year of the Creator in East Africa"

LinkedIn articles stay indexed by Google and position Keevan Store as an authority.

---

### Cross-Platform Integration

| Activity | Facebook | LinkedIn |
|---|---|---|
| Creator success stories | Share in groups + page | Publish as post + article |
| Platform updates | Community post | Professional announcement |
| Educational content | Infographics, videos | Long-form tips |
| Ad campaigns | Creator acquisition + buyer demand | Brand awareness, trust building |
| Outreach | Group engagement | 1:1 connection requests |
| Performance metrics | Group growth, ad conversions | Connection growth, profile views |

### Monthly Marketing Budget

| Item | Estimated Cost (UGX) |
|---|---|
| Facebook Ads (creator acquisition) | ~$100 (375K UGX) |
| Facebook Ads (buyer demand) | ~$60 (225K UGX) |
| Facebook Boosted Posts | ~$40 (150K UGX) |
| LinkedIn Premium (outreach) | ~$30 (110K UGX) |
| **Total** | **~$230/month (860K UGX)** |

### Success Metrics (Monthly)

| KPI | Facebook Target | LinkedIn Target |
|---|---|---|
| New creator signups | 15–25 | 10–15 |
| New store created | 10–15 | 5–10 |
| Website visits | 1,000–3,000 | 500–1,000 |
| Cost per signup | < $5 | < $5 |
| Group engagement rate | > 5% | N/A |
| Connection acceptance rate | N/A | > 40% |
| Product sales from social | 20–50 | 10–20 |

---

*Document prepared June 2026 — Keevan Store*
