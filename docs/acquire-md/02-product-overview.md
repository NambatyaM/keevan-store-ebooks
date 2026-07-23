# KEEVAN STORE
## Product Overview
### Complete Platform Description and Feature Set

| Field | Detail |
|---|---|
| Document | 02 of 10: Product Overview |
| Platform | keevanstore.in |
| Category | Creator Commerce Platform |
| Target Market | East African Creators |
| Date | July 9, 2026 |

---

### Platform Architecture

Keevan Store is a full stack digital commerce platform connecting creators and buyers through personalized storefronts, secure payment processing, and automated digital delivery. The platform serves three distinct user roles, each with their own interface and capabilities.

#### User Roles

- **Creator**: Registers on the platform, creates a personalized storefront, uploads digital products (ebooks, guides, templates, courses), sets prices in UGX or KES, manages discounts, views analytics, and requests payouts.
- **Buyer**: Browses creator storefronts, purchases digital products via Pesapal (mobile money, cards, bank transfer), receives instant download links by email, and can view purchase history in their dashboard.
- **Admin**: Manages the entire platform: users, orders, refunds, withdrawals, store moderation (suspend and reactivate), email queue, audit logs, and platform settings.

---

### Public Pages

The platform includes a full set of public information pages:

- **Home** (/) -- Landing page with platform overview, stats, and call to action
- **About** (/about) -- Platform mission, vision, and background
- **Features** (/features) -- Complete feature listing with descriptions
- **Pricing** (/pricing) -- Platform pricing and commission structure
- **FAQ** (/faq) -- Frequently asked questions for creators and buyers
- **Contact** (/contact) -- Contact form and information
- **Privacy Policy** (/privacy) -- Data handling and privacy practices
- **Terms of Service** (/terms) -- Platform terms and conditions
- **Refund Policy** (/refund-policy) -- Refund terms and conditions
- **Request Refund** (/request-refund) -- Refund request form for buyers

---

### Core Features

- **Creator Storefronts**: Personalized public store pages at /store/[handle] with product listings, cover images, pricing, and descriptions. Each creator gets their own branded storefront with a unique URL.

- **Product Upload**: Drag and drop file upload for PDF, EPUB, MOBI, and ZIP files with client and server side validation for file type, size, and security. Automatic file storage in Supabase Storage.

- **Pesapal Payments**: Full integration with Pesapal API v3 for UGX and KES payments via MTN Mobile Money, Airtel Money, credit and debit cards, and bank transfers. IPN webhooks for real time payment confirmation.

- **Digital Delivery**: Instant download links after payment confirmation via token based secure access. Automated emails sent via Resend with download links. Buyers can also access purchases from their dashboard.

- **Discount Engine**: Percentage based discounts from 1% to 100% with configurable start and end dates and optional usage limits. Automatically applied at checkout. Track usage and manage from creator dashboard.

- **Analytics**: Per product view tracking, sales counts, conversion rates, and earnings summaries. Displayed in both creator dashboard and admin panel with chart visualizations using Recharts.

- **Creator Payouts**: Withdrawal system supporting MTN Mobile Money, Airtel Money, and bank transfers. Creators can request payouts from their dashboard. Admin approval workflow for payout processing.

- **Email Automation**: Transactional emails via Resend for order confirmations, download links, admin notifications, and payout confirmations. Cron based email queue processing with status tracking in the admin panel.

- **Admin Panel**: Full platform management: user management (creators and buyers), order oversight with detail views, refund processing with approve and reject workflow, withdrawal management with approval and payment tracking, store moderation with suspend and reactivate, email queue status monitoring, and comprehensive audit log.

- **Browser Dashboard**: Purchase history, download access, and order lookup for buyers who have made purchases on the platform.

---

### User Flows

#### Creator Onboarding Flow
1. Creator signs up with email, password, full name, and desired store handle
2. Creator selects their preferred currency (UGX, KES, TZS, RWF, USD)
3. Creator logs in to dashboard at /creator/dashboard
4. Creator uploads products with title, description, price, and digital files
5. Creator publishes products and shares their storefront link
6. Creator receives orders, manages discounts, and requests payouts

#### Buyer Purchase Flow
1. Buyer browses products on a creator's storefront at /store/[handle]
2. Buyer selects a product and proceeds to checkout at /checkout/[slug]
3. Buyer enters name, email, and phone number
4. System checks for active discounts on the product
5. Buyer is redirected to Pesapal payment page
6. Buyer completes payment via mobile money, card, or bank transfer
7. Payment confirmed via IPN webhook
8. Buyer receives order confirmation and download link by email
9. Buyer can also access downloads from /buyer/dashboard

#### Admin Management Flow
1. Admin logs in and accesses /admin/dashboard
2. Admin views platform wide stats: users, products, orders, revenue
3. Admin manages creators and buyers through dedicated interfaces
4. Admin processes refunds, withdrawals, and store moderation requests
5. Admin monitors email queue and reviews audit logs

---

### Current Platform Statistics

| Metric | Value |
|---|---|
| Total Users | 16 (14 creators, 1 buyer, 1 admin) |
| Total Stores | 14 (13 active, 1 suspended) |
| Total Products | 21 (19 published, 2 draft) |
| Total Orders | 17 (5 paid, 10 pending, 2 failed) |
| Revenue Processed | UGX 5,999 |
| Active Discounts | 1 |
| Store Currencies | UGX (12 stores), KES (2 stores) |
| Supported Currencies | UGX, KES, TZS, RWF, USD |

---

### Contact

| | |
|---|---|
| Platform | Keevan Store |
| Website | https://keevanstore.in |
| Email | nkevinmegan@gmail.com |
| Location | Uganda, East Africa |

---

CONFIDENTIAL | Keevan Store Acquisition Documentation
