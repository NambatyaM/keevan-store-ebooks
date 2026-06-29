# Keevan Store — SEO / GEO / AEO Strategy

## 1. SEO (Search Engine Optimization)

### On-Page SEO — Completed
- ✅ Unique `<title>` with template (`%s | Keevan Store`) on every page
- ✅ Meta descriptions on all server-rendered public pages
- ✅ Canonical URLs on all pages
- ✅ Open Graph tags (title, description, image, type, locale)
- ✅ Twitter Card tags (summary_large_image)
- ✅ Semantic HTML structure (h1–h3 hierarchy)
- ✅ Image `alt` text on hero and feature images
- ✅ `robots.ts` with per-bot rules (Google, GPTBot, etc.)
- ✅ `sitemap.ts` covering all static + dynamic pages
- ✅ Structured data: Organization, WebSite, Product, FAQPage, BreadcrumbList, ContactPage

### Technical SEO — Completed
- ✅ `next-sitemap` equivalent via `app/sitemap.ts`
- ✅ `next/robots` equivalent via `app/robots.ts`
- ✅ Security headers (HSTS, CSP, X-Frame-Options, etc.)
- ✅ Mobile-first responsive design (375px breakpoint)
- ✅ Fast page loads via Next.js static generation
- ✅ `hreflang` tags (en-UG, en-KE, en-TZ, en-RW, x-default)
- ✅ `manifest.json` for PWA
- ✅ `theme-color` meta tag
- ✅ Preconnect/dns-prefetch to Supabase and Pesapal

### To Do (Manual Steps)
- **Google Search Console**: https://search.google.com/search-console
  - Add property `keevanstore.in`
  - Verify ownership via DNS TXT record or HTML file
  - Submit `sitemap.xml` URL
  - Monitor crawl stats, index coverage, and errors
- **Google Analytics 4**: https://analytics.google.com
  - Create GA4 property for `keevanstore.in`
  - Install via Vercel Analytics (already present) or GA4 snippet
  - Set up conversion events (purchase, signup)
- **Bing Webmaster Tools**: https://www.bing.com/webmaster
  - Add site and verify ownership
  - Submit sitemap
- **Google Business Profile** (if applicable): https://business.google.com
- **Lighthouse Audits**: Run regularly to maintain 90+ scores

## 2. GEO (Generative Engine Optimization)

GEO optimizes content for visibility in AI-generated responses (Google AI Overviews, ChatGPT, Perplexity, Claude, Gemini).

### Completed
- ✅ `llms.txt` and `llms-full.txt` for direct LLM access
- ✅ `ai.json` with structured site metadata
- ✅ `.well-known/ai.json` per industry standards
- ✅ Clear, direct Q&A format on FAQ and homepage
- ✅ FAQPage structured data (5 + 3 + 20 + 3 = 31 Q&A pairs across the site)
- ✅ Named data points and specific numbers (10% fee, 50,000 UGX, 4 MB limit, etc.)
- ✅ Descriptive headers that identify content topics logically
- ✅ Per-bot robots rules for GPTBot, ChatGPT-User, Google-Extended, anthropic-ai, PerplexityBot
- ✅ Canonical URLs prevent duplicate content confusion

### GEO Best Practices Applied
- **Lead with clear answers**: FAQ format on homepage + dedicated FAQ page
- **Use specific data**: Named amounts, percentages, currencies, file sizes
- **Structure with headers**: h1 > h2 > h3 hierarchy on all pages
- **Keep content current**: Last-updated dates on legal pages, dynamic sitemap
- **Cite authority**: Organization schema with founding date, area served, contact info
- **Multi-format presence**: Structured data + plain text + Q&A + descriptive copy

## 3. AEO (Answer Engine Optimization)

AEO targets voice assistants, featured snippets, and instant answer boxes.

### Completed
- ✅ FAQPage schema on 4 pages (31 total Q&A pairs)
- ✅ Direct, concise answers to common questions
- ✅ "What is Keevan Store?" answered in first paragraph of FAQ
- ✅ How-to content with step numbering ("Step 1–4" on homepage)
- ✅ Comparison content (pricing table vs alternatives)
- ✅ Question-based h3 headings in FAQ sections

### AEO Best Practices Applied
- **Position zero targets**: Questions likely to appear in featured snippets:
  - "How much does Keevan Store cost?" → Free + 10% commission
  - "How do creators get paid?" → Dashboard balance + withdrawals
  - "What file formats are supported?" → PDF, EPUB, MOBI, ZIP
- **Concise definitions**: "Keevan Store is a creator commerce platform for East African authors..."
- **List formatting**: Bullet points and numbered steps for easy snippet extraction
- **Table formatting**: Pricing comparison table for rich snippet opportunities

## 4. AI/Bot Discoverability

### Files Created for AI Crawlers
| File | Purpose | Location |
|------|---------|----------|
| `llms.txt` | Quick site summary (LLM standard) | `/public/llms.txt` |
| `llms-full.txt` | Complete site reference | `/public/llms-full.txt` |
| `ai.json` | Structured site metadata | `/public/ai.json` |
| `.well-known/ai.json` | Well-known AI descriptor | `/public/.well-known/ai.json` |
| `robots.txt` | Bot-specific crawl rules | Dynamic at `/robots.ts` |
| `sitemap.xml` | Full site map | Dynamic at `/sitemap.ts` |

### Bot Access Rules
- **GPTBot / ChatGPT-User**: Full access to public content, blocked from admin/API
- **Google-Extended**: Same as above
- **anthropic-ai / Claude-Web**: Full access to content pages
- **PerplexityBot**: Access to core pages and product listings
- **All other bots**: Public content accessible, admin/API blocked

## 5. Performance & Core Web Vitals (Checklist)

- [ ] Run Lighthouse in incognito mode for mobile and desktop
- [ ] Target: 90+ Performance, 90+ Accessibility, 100 SEO
- [ ] Verify LCP < 2.5s, FID < 100ms, CLS < 0.1
- [ ] Test on 3G throttling in Chrome DevTools
- [ ] Verify images properly sized (hero.webp, og-image.png)
- [ ] Ensure fonts (if loaded) are optimized
- [ ] Test with `curl -I https://keevanstore.in` for response headers

## 6. Ongoing SEO Maintenance

- Update sitemap automatically (already done via dynamic generation)
- Monitor Google Search Console weekly for errors
- Add new content pages with unique metadata
- Update FAQ with emerging questions
- Run quarterly content audits to refresh outdated copy
- Track keyword rankings for primary terms:
  - "sell e-books online Uganda"
  - "digital products East Africa"
  - "creator commerce platform Africa"
  - "sell PDFs online Kenya"
  - "Pesapal payments for creators"

## 7. Connectivity to Google Tools

### Google Search Console Setup
1. Go to https://search.google.com/search-console
2. Add property: `https://keevanstore.in`
3. Verify ownership:
   - Option A: Add DNS TXT record (recommended)
   - Option B: Upload HTML verification file to `/public/`
   - Option C: Add `<meta name="google-site-verification">` to `<head>` (already in layout)
4. Submit sitemap: `https://keevanstore.in/sitemap.xml`
5. Set preferred domain: `https://keevanstore.in`
6. Monitor:
   - **Index Coverage**: Pages indexed, excluded, errors
   - **Performance**: Queries, clicks, impressions, CTR
   - **URL Inspection**: Check specific pages are indexed

### Google Analytics 4 Setup
1. Go to https://analytics.google.com
2. Create GA4 property for website
3. Get Measurement ID (G-XXXXXXXXXX)
4. Add to environment: `NEXT_PUBLIC_GA_MEASUREMENT_ID`
5. Install via `<Script>` in layout or use Vercel Analytics (already present)
6. Set up conversions:
   - `purchase` (triggered on /order/success)
   - `signup` (triggered on account creation)
   - `product_view` (triggered on product page)

### Google Tag Manager (Optional)
- Use GTM to manage GA4, Facebook Pixel, and other tags
- Add GTM container to layout's `<head>` and `<body>`

## Appendix: Environment Variables Needed

```
NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION=<your-google-verification-code>
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX
```
