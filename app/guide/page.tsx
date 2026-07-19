import type { Metadata } from "next";
import { ButtonLink } from "@/components/button";
import { SimplePage } from "@/components/simple-page";
import { site } from "@/lib/constants";

export const metadata: Metadata = {
  title: "The Complete Guide to Selling Digital Products Online — From Zero to First Sale",
  description:
    "A step-by-step guide for East African creators: what digital products are, how to create them with free AI tools, where to market them, and how to get your first paying customers. No experience needed.",
  openGraph: {
    title: "The Complete Guide to Selling Digital Products Online",
    description:
      "Learn how to create, price, and market digital products using free AI tools. Built for creators in Uganda, Kenya, Tanzania, and Rwanda.",
    images: [{ url: `${site.url}/og-image.png`, width: 1200, height: 630, alt: "Keevan Store — Digital Products Guide" }],
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Article",
  headline: "The Complete Guide to Selling Digital Products Online",
  description:
    "A step-by-step guide for East African creators on creating, pricing, and marketing digital products.",
  author: { "@type": "Organization", name: "Keevan Store" },
  publisher: { "@type": "Organization", name: "Keevan Store" },
};

export default function GuidePage() {
  return (
    <SimplePage title="The Complete Guide to Selling Digital Products" eyebrow="Free resource for creators">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* ───────────────────────── INTRO ───────────────────────── */}

      <p className="text-lg font-semibold text-brand-black">
        Most creators fail not because their product is bad, but because they never learn how to market it. This guide gives you every step — from understanding what digital products are, to creating one with free AI tools, to finding paying customers on the platforms where they already spend time.
      </p>
      <p className="mt-4">
        This is not theory. Every recommendation uses free or low-cost tools. Every platform suggestion works in East Africa. Every step is written for someone starting from zero.
      </p>

      {/* ───────────────────────── SECTION 1 ───────────────────────── */}

      <section className="mt-12">
        <h2 className="text-2xl font-bold text-brand-black">Part 1 — What Are Digital Products?</h2>

        <p className="mt-4">
          A digital product is anything you create once and sell repeatedly as a downloadable file. There is no inventory, no shipping, no manufacturing cost per sale. You create the file, list it on your store, and every time someone pays, they download it instantly.
        </p>

        <h3 className="mt-6 text-xl font-bold text-brand-black">Examples of digital products</h3>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {[
            { title: "E-books & guides", desc: "PDFs or EPUBs teaching a skill, sharing knowledge, or telling a story. The most common digital product for first-time creators." },
            { title: "Templates & toolkits", desc: "Canva templates, spreadsheet templates, Notion dashboards, resume templates, business plan templates. People pay to save time." },
            { title: "Worksheets & workbooks", desc: "Printable or fillable PDFs for journaling, budgeting, fitness tracking, meal planning, or homework." },
            { title: "Checklists & cheat sheets", desc: "One-page reference guides for a specific process. Simple to create, high perceived value." },
            { title: "Course materials", desc: "Slide decks, exercises, quizzes, and study guides sold alongside free or paid video courses." },
            { title: "Design assets", desc: "Icons, illustrations, fonts, social media post templates, and presentation themes." },
            { title: "Code & scripts", desc: "Website templates, WordPress themes, browser extensions, automation scripts." },
            { title: "Audio & music", desc: "Loops, sound effects, meditation tracks, background music for content creators." },
          ].map((item) => (
            <div key={item.title} className="rounded-xl border border-neutral-200 bg-white p-4">
              <p className="font-bold text-brand-black">{item.title}</p>
              <p className="mt-1 text-sm text-neutral-600">{item.desc}</p>
            </div>
          ))}
        </div>

        <h3 className="mt-8 text-xl font-bold text-brand-black">Why digital products work in East Africa</h3>

        <ul className="mt-3 list-disc space-y-2 pl-5">
          <li><strong>No startup capital needed.</strong> You need a phone or laptop and an internet connection. That is it.</li>
          <li><strong>Mobile money makes payments easy.</strong> Pesapal processes MTN Mobile Money, Airtel Money, card, and bank transfers — all currencies supported.</li>
          <li><strong>Instant delivery.</strong> The customer pays and downloads immediately. No delivery delays, no logistics costs.</li>
          <li><strong>Zero inventory risk.</strong> You never lose money on unsold stock. Every sale is pure revenue minus the platform fee.</li>
          <li><strong>Scalable.</strong> Sell 1 copy or 10,000 copies. The product cost is the same: your time to create it once.</li>
        </ul>
      </section>

      {/* ───────────────────────── SECTION 2 ───────────────────────── */}

      <section className="mt-12">
        <h2 className="text-2xl font-bold text-brand-black">Part 2 — Creating Your First Digital Product (Using Free AI Tools)</h2>

        <p className="mt-4">
          You do not need design skills, writing experience, or any paid software. Here is exactly how to create a professional digital product from scratch using free tools.
        </p>

        <h3 className="mt-6 text-xl font-bold text-brand-black">Step 1: Choose what to create</h3>

        <p className="mt-3">
          Start with the easiest product type: a <strong>PDF guide or e-book</strong>. These are the fastest to create, the easiest to sell, and the most familiar format for buyers.
        </p>

        <p className="mt-3 font-semibold text-brand-black">How to pick a topic:</p>

        <ul className="mt-2 list-disc space-y-2 pl-5">
          <li>What do people already ask you for help with?</li>
          <li>What skill do you have that others in your community need?</li>
          <li>What problem have you solved for yourself that others face too?</li>
          <li>Search TikTok, Twitter, and Facebook groups for questions people are asking in your niche.</li>
        </ul>

        <div className="mt-4 rounded-lg border border-brand-green/30 bg-brand-mist p-4">
          <p className="text-sm font-bold text-brand-black">Proven product ideas that sell well in East Africa:</p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-neutral-700">
            <li>Personal finance guides (budgeting, saving, mobile money tips)</li>
            <li>Business startup guides for specific industries</li>
            <li>Academic study guides and exam prep materials</li>
            <li>Health and fitness plans</li>
            <li>Social media marketing guides for small businesses</li>
            <li>Recipe books and meal plans</li>
            <li>CV/resume templates with writing tips</li>
            <li>Parenting guides and children&apos;s activity books</li>
          </ul>
        </div>

        <h3 className="mt-8 text-xl font-bold text-brand-black">Step 2: Create the content with free AI tools</h3>

        <p className="mt-3">
          Here is the exact workflow using only free tools:
        </p>

        <div className="mt-4 space-y-4">
          {[
            {
              tool: "ChatGPT (free tier)",
              use: "Generate your outline, write first drafts, rewrite sections, create chapter titles, write your product description and marketing copy.",
              tip: "Be specific in your prompts. Instead of 'write about fitness', say 'write a 2000-word guide on home workouts for busy professionals in Kampala, using only bodyweight exercises, in a friendly conversational tone'.",
            },
            {
              tool: "Google Docs (free)",
              use: "Write and edit your content. Use it as your main workspace. Collaborate with someone else to review your draft.",
              tip: "Use headings (H1, H2, H3) to structure your content. This makes formatting in Canva much easier later.",
            },
            {
              tool: "Canva (free tier)",
              use: "Design your PDF. Use a free e-book template, add your text, change fonts and colours, add images from Canva's free library, and export as PDF.",
              tip: "Search 'e-book template' or 'guide template' in Canva. Pick one, paste your content from Google Docs, and customise the colours to match your brand.",
            },
            {
              tool: "Grammarly (free tier)",
              use: "Fix grammar and spelling mistakes before you publish. This is non-negotiable — typos destroy trust.",
              tip: "Paste your final draft into Grammarly before exporting. Even the free version catches the errors that make you look unprofessional.",
            },
            {
              tool: "Leonardo AI / Bing Image Creator (free)",
              use: "Generate custom images, illustrations, and covers for your product if you don't want to use stock photos.",
              tip: "Generate a cover image first. A strong cover image is the single most important visual element. It determines whether someone clicks or scrolls past.",
            },
          ].map((item, i) => (
            <div key={i} className="rounded-xl border border-neutral-200 bg-white p-5">
              <p className="font-bold text-brand-black">{item.tool}</p>
              <p className="mt-1 text-sm text-neutral-600">{item.use}</p>
              <p className="mt-2 text-sm font-semibold text-brand-green">{item.tip}</p>
            </div>
          ))}
        </div>

        <h3 className="mt-8 text-xl font-bold text-brand-black">Step 3: Package your product professionally</h3>

        <ol className="mt-3 list-decimal space-y-3 pl-5">
          <li>
            <strong>Write a clear title.</strong> Not &quot;My Finance Book&quot; — instead: &quot;The Kampala Budget Guide: How to Save 30% of Your Salary on Mobile Money&quot;
          </li>
          <li>
            <strong>Create a cover page.</strong> Title, your name or brand, a clean design. First impressions matter.
          </li>
          <li>
            <strong>Add a table of contents.</strong> Even a simple list of chapters makes the product feel professional.
          </li>
          <li>
            <strong>Use consistent formatting.</strong> Same font, same heading sizes, same spacing throughout. Canva templates handle this for you.
          </li>
          <li>
            <strong>Add your store link on the last page.</strong> &quot;More resources at keevanstore.in/store/yourname&quot; — this turns every customer into a potential repeat buyer.
          </li>
          <li>
            <strong>Export as PDF.</strong> This is the universal format. Works on every device, every operating system.
          </li>
        </ol>

        <h3 className="mt-8 text-xl font-bold text-brand-black">Step 4: Create a cover image that sells</h3>

        <p className="mt-3">
          Your cover image is your salesperson. It is the first thing people see when they find your product. A bad cover image kills sales no matter how good the content is.
        </p>

        <ul className="mt-3 list-disc space-y-2 pl-5">
          <li>Use Canva or Leonardo AI to create a clean, bold cover.</li>
          <li>Use 2–3 colours maximum. One background colour, one text colour, one accent.</li>
          <li>Make the title large and readable on a phone screen.</li>
          <li>Do not put too much text on the cover. Title + subtitle + your name is enough.</li>
          <li>Look at bestsellers on Amazon and Gumroad for inspiration. Notice how clean and simple professional covers are.</li>
        </ul>
      </section>

      {/* ───────────────────────── SECTION 3 ───────────────────────── */}

      <section className="mt-12">
        <h2 className="text-2xl font-bold text-brand-black">Part 3 — Creating Products People Actually Want to Buy</h2>

        <p className="mt-4">
          Most failed products are not bad products — they solve problems nobody is trying to solve. Here is how to build something people will pay for.
        </p>

        <h3 className="mt-6 text-xl font-bold text-brand-black">The value equation</h3>

        <p className="mt-3">
          People pay for digital products when the product saves them <strong>time</strong>, makes them <strong>money</strong>, teaches them something <strong>valuable</strong>, or solves a <strong>painful problem</strong>. If your product does not clearly do one of these four things, it will not sell.
        </p>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {[
            { q: "Does it save time?", example: "A social media content calendar template saves a business owner 5+ hours per week." },
            { q: "Does it make or save money?", example: "A guide on reducing business costs by 20% directly impacts income." },
            { q: "Does it teach something valuable?", example: "A step-by-step guide to getting a scholarship covers a high-stakes goal." },
            { q: "Does it solve a painful problem?", example: "A budgeting spreadsheet for people living paycheck to paycheck solves daily stress." },
          ].map((item) => (
            <div key={item.q} className="rounded-xl border border-brand-green/30 bg-brand-mist p-4">
              <p className="font-bold text-brand-black">{item.q}</p>
              <p className="mt-1 text-sm text-neutral-700">{item.example}</p>
            </div>
          ))}
        </div>

        <h3 className="mt-8 text-xl font-bold text-brand-black">Validate before you build</h3>

        <p className="mt-3">
          Before spending days creating a product, spend 30 minutes validating the idea:
        </p>

        <ol className="mt-3 list-decimal space-y-2 pl-5">
          <li>Search TikTok, Twitter, and Facebook for people asking about your topic. If strangers are asking questions about it, there is demand.</li>
          <li>Check if similar products exist on Gumroad, Payhip, or Amazon. Competition is good — it proves people pay for this. Your job is to do it better or for a specific audience.</li>
          <li>Ask 5 people in your target audience: &quot;Would you pay for a guide that does X?&quot; If 3+ say yes, build it.</li>
          <li>Create a simple landing page or social media post describing the product before building it. If people engage (likes, comments, shares), you have signal.</li>
        </ol>

        <h3 className="mt-8 text-xl font-bold text-brand-black">Pricing your product</h3>

        <p className="mt-3">
          Pricing is the hardest decision for new creators. Here is a simple framework:
        </p>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-200">
                <th className="py-2 text-left font-bold text-brand-black">Product type</th>
                <th className="py-2 text-left font-bold text-brand-black">Suggested price (UGX)</th>
                <th className="py-2 text-left font-bold text-brand-black">Suggested price (KES)</th>
              </tr>
            </thead>
            <tbody className="text-neutral-700">
              <tr className="border-b border-neutral-100"><td className="py-2">Short checklist / cheat sheet (1–5 pages)</td><td className="py-2">5,000 – 15,000</td><td className="py-2">200 – 500</td></tr>
              <tr className="border-b border-neutral-100"><td className="py-2">Template / toolkit</td><td className="py-2">10,000 – 30,000</td><td className="py-2">400 – 1,000</td></tr>
              <tr className="border-b border-neutral-100"><td className="py-2">E-book / guide (10–50 pages)</td><td className="py-2">15,000 – 50,000</td><td className="py-2">500 – 2,000</td></tr>
              <tr className="border-b border-neutral-100"><td className="py-2">Comprehensive course material (50+ pages)</td><td className="py-2">30,000 – 100,000</td><td className="py-2">1,000 – 4,000</td></tr>
              <tr><td className="py-2">Complete business toolkit / bundle</td><td className="py-2">50,000 – 200,000</td><td className="py-2">2,000 – 8,000</td></tr>
            </tbody>
          </table>
        </div>

        <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-4">
          <p className="text-sm font-bold text-amber-800">Pricing mistakes to avoid:</p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-amber-700">
            <li>Pricing too low (under 5,000 UGX) signals low quality. Even 10,000 UGX feels more premium than 2,000 UGX.</li>
            <li>Pricing too high without proof. If you have no reviews or social proof, start lower and raise prices as you get testimonials.</li>
            <li>Copying Western prices. 20 USD is not the same as 20,000 UGX in purchasing power. Price for your local market.</li>
          </ul>
        </div>
      </section>

      {/* ───────────────────────── SECTION 4 ───────────────────────── */}

      <section className="mt-12">
        <h2 className="text-2xl font-bold text-brand-black">Part 4 — Setting Up Your Store on Keevan Store</h2>

        <p className="mt-4">
          Once your product is ready, getting it live takes less than 10 minutes:
        </p>

        <ol className="mt-4 list-decimal space-y-3 pl-5">
          <li>
            <strong>Create your free account</strong> at <a href="/signup" className="font-semibold text-brand-green hover:underline">keevanstore.in/signup</a>. Choose your store handle — this becomes your permanent store URL: <code>keevanstore.in/store/yourname</code>.
          </li>
          <li>
            <strong>Complete your store profile.</strong> Add a store name, tagline, description, and profile photo. A complete profile builds trust. Buyers are more likely to purchase from a store that looks real and professional.
          </li>
          <li>
            <strong>Upload your product.</strong> Upload your PDF or EPUB file, add a cover image, write a clear title and description, and set your price. The product description is your sales page — explain what the buyer gets, who it is for, and why it is worth the price.
          </li>
          <li>
            <strong>Publish your product.</strong> Once published, your product page goes live immediately. Share the link anywhere.
          </li>
          <li>
            <strong>Share your store link.</strong> Put it in your social media bio, WhatsApp status, and anywhere your audience hangs out.
          </li>
        </ol>

        <div className="mt-6 rounded-lg border border-brand-green/30 bg-brand-mist p-4">
          <p className="text-sm font-bold text-brand-black">What happens when someone buys:</p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-neutral-700">
            <li>Buyer visits your product page and clicks &quot;Buy Now&quot;</li>
            <li>Pesapal checkout opens — they pay with MTN Mobile Money, Airtel Money, card, or bank transfer</li>
            <li>Payment is verified server-side (not just a callback — actual verification)</li>
            <li>Buyer receives a secure download link instantly</li>
            <li>You get notified of the sale and your earnings are updated in your dashboard</li>
            <li>Withdraw your earnings via mobile money or bank transfer once you reach the minimum threshold</li>
          </ul>
        </div>
      </section>

      {/* ───────────────────────── SECTION 5 ───────────────────────── */}

      <section className="mt-12">
        <h2 className="text-2xl font-bold text-brand-black">Part 5 — How to Market Your Digital Products (The Part Most Creators Skip)</h2>

        <p className="mt-4">
          Uploading a product is not marketing. Posting once on social media is not marketing. Marketing is a consistent, repeatable system that puts your product in front of the right people, over and over, until they buy.
        </p>

        <p className="mt-3 font-semibold text-brand-black">
          Here is the hard truth: the creators who make money are not the ones with the best products. They are the ones who market relentlessly.
        </p>

        <h3 className="mt-8 text-xl font-bold text-brand-black">The 5 marketing channels that work for East African creators</h3>

        {/* --- CHANNEL 1: TikTok --- */}
        <div className="mt-6 rounded-xl border border-neutral-200 bg-white p-6">
          <p className="text-lg font-bold text-brand-black">1. TikTok (Highest potential, zero cost)</p>

          <p className="mt-3">
            TikTok is the single most powerful marketing tool for digital products in East Africa right now. The algorithm shows your content to people who have never followed you — you do not need followers to go viral.
          </p>

          <p className="mt-3 font-semibold text-brand-black">What to post:</p>
          <ul className="mt-2 list-disc space-y-2 pl-5">
            <li><strong>Value-first short videos (15–60 seconds).</strong> Teach one tip from your product. For example: &quot;3 things I learned from writing my first e-book&quot; or &quot;One budgeting trick that changed my life.&quot;</li>
            <li><strong>Behind-the-scenes of your product creation.</strong> Show yourself writing the e-book, designing in Canva, or recording your process. People buy from people they feel connected to.</li>
            <li><strong>Problem-agitate-solve format.</strong> &quot;You&apos;re struggling with X. Most people do. Here&apos;s how I solved it (and if you want the full guide, link in bio).&quot;</li>
            <li><strong>Customer testimonials and results.</strong> When someone buys and tells you it helped, screen-record their message (with permission) and post it.</li>
            <li><strong>Relatable content about your niche.</strong> If you sell a fitness guide, post quick workout tips. If you sell a finance guide, post money mistakes people make.</li>
          </ul>

          <p className="mt-3 font-semibold text-brand-black">How to use the link in bio:</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>Put your Keevan Store link in your TikTok bio</li>
            <li>Use a free link tool like Linktree or Beacons if you have multiple links</li>
            <li>Every video should end with &quot;Link in bio for the full guide&quot;</li>
          </ul>

          <p className="mt-3 font-semibold text-brand-black">Posting schedule: 1–3 videos per day. Consistency matters more than quality.</p>
        </div>

        {/* --- CHANNEL 2: Instagram --- */}
        <div className="mt-6 rounded-xl border border-neutral-200 bg-white p-6">
          <p className="text-lg font-bold text-brand-black">2. Instagram (Best for visual products and building trust)</p>

          <p className="mt-3">
            Instagram works best if your product has a visual component — templates, design assets, recipe books, fitness content, or lifestyle products. But it works for any niche if you post the right content.
          </p>

          <p className="mt-3 font-semibold text-brand-black">What to post:</p>
          <ul className="mt-2 list-disc space-y-2 pl-5">
            <li><strong>Carousel posts (swipeable slides).</strong> These get the most reach. Create 5–10 slides that teach something, with the last slide being a CTA to buy your product.</li>
            <li><strong>Reels.</strong> Repurpose your TikTok content. Same videos, same format. Instagram rewards Reels heavily right now.</li>
            <li><strong>Stories.</strong> Use polls, questions, and countdown stickers to engage your audience. Share behind-the-scenes, sneak peeks of your product, and customer reactions.</li>
            <li><strong>Posts with strong captions.</strong> Write a story or lesson in the caption, then end with: &quot;I put everything into a guide — link in bio.&quot;</li>
          </ul>

          <p className="mt-3 font-semibold text-brand-black">Key strategy:</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>Post 3–5 Reels per week (repurpose TikTok content)</li>
            <li>Post 2–3 carousels per week</li>
            <li>Use Stories daily</li>
            <li>Engage with accounts in your niche — comment on their posts, reply to their Stories, build relationships</li>
          </ul>
        </div>

        {/* --- CHANNEL 3: Twitter/X --- */}
        <div className="mt-6 rounded-xl border border-neutral-200 bg-white p-6">
          <p className="text-lg font-bold text-brand-black">3. Twitter / X (Best for thought leadership and professional products)</p>

          <p className="mt-3">
            Twitter works best for business guides, tech products, career resources, and educational content. The audience here is more willing to pay for knowledge products.
          </p>

          <p className="mt-3 font-semibold text-brand-black">What to post:</p>
          <ul className="mt-2 list-disc space-y-2 pl-5">
            <li><strong>Thread format.</strong> Write a 7–10 tweet thread that teaches something valuable. The last tweet links to your product. Threads get massive reach when they provide real value.</li>
            <li><strong>Single tweets with a hook.</strong> &quot;I made UGX 500,000 last month selling a PDF. Here&apos;s exactly how I did it 🧵&quot;</li>
            <li><strong>Quote tweets and commentary.</strong> Find trending topics in your niche and add your perspective.</li>
            <li><strong>Engagement tweets.</strong> &quot;What&apos;s the biggest challenge you face with [your niche]?&quot; — then respond to every answer and mention your guide when relevant.</li>
          </ul>

          <p className="mt-3 font-semibold text-brand-black">Posting schedule: 3–5 tweets per day, 1–2 threads per week.</p>
        </div>

        {/* --- CHANNEL 4: Facebook --- */}
        <div className="mt-6 rounded-xl border border-neutral-200 bg-white p-6">
          <p className="text-lg font-bold text-brand-black">4. Facebook Groups (Best for community-based selling)</p>

          <p className="mt-3">
            Facebook Groups are still the most active online communities in East Africa. People join groups to learn, ask questions, and discover resources. This is where you find buyers who are already looking for what you sell.
          </p>

          <p className="mt-3 font-semibold text-brand-black">How to use Facebook Groups:</p>
          <ul className="mt-2 list-disc space-y-2 pl-5">
            <li><strong>Join 10–20 groups in your niche.</strong> If you sell fitness guides, join fitness, health, and weight loss groups. If you sell business guides, join entrepreneurship, small business, and side hustle groups.</li>
            <li><strong>Be helpful first.</strong> Answer questions, share tips, and provide value for 2–3 weeks before mentioning your product. People buy from members they trust, not from drive-by promoters.</li>
            <li><strong>Post value-first content.</strong> Share a tip from your product, then say: &quot;I go much deeper in my guide — DM me if you&apos;re interested&quot; or &quot;Link in comments.&quot;</li>
            <li><strong>Create your own group.</strong> Build a community around your niche. Post free value regularly. Your group members become your most loyal customers.</li>
            <li><strong>Never spam.</strong> Groups have rules. Read them. Follow them. One valuable post per group per week is better than five promotional posts that get you banned.</li>
          </ul>

          <p className="mt-3 font-semibold text-brand-black">Groups to look for (examples):</p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-neutral-600">
            <li>Uganda/Kenya entrepreneurship groups</li>
            <li>Women in business groups</li>
            <li>Student and university groups</li>
            <li>Parenting and family groups</li>
            <li>Health and fitness groups</li>
            <li>Real estate and investing groups</li>
          </ul>
        </div>

        {/* --- CHANNEL 5: WhatsApp --- */}
        <div className="mt-6 rounded-xl border border-neutral-200 bg-white p-6">
          <p className="text-lg font-bold text-brand-black">5. WhatsApp (Best for direct sales and repeat customers)</p>

          <p className="mt-3">
            WhatsApp is the most used app in East Africa. It is also the most personal marketing channel. When someone saves your number and messages you about a product, the conversion rate is far higher than any other platform.
          </p>

          <p className="mt-3 font-semibold text-brand-black">WhatsApp marketing strategies:</p>
          <ul className="mt-2 list-disc space-y-2 pl-5">
            <li><strong>WhatsApp Status.</strong> Post about your product daily. Show the cover image, share a testimonial, or post a preview page. Your Status is seen by everyone who has your number.</li>
            <li><strong>Broadcast lists.</strong> Create a broadcast list of interested people. Send them new product announcements, tips, and exclusive offers. They receive it like a personal message.</li>
            <li><strong>WhatsApp Business profile.</strong> Set up a WhatsApp Business account with your product catalog, business hours, and auto-reply. This looks professional and builds trust.</li>
            <li><strong>Direct conversations.</strong> When someone expresses interest, have a real conversation. Answer their questions, understand what they need, and recommend the right product. This personal touch is something big platforms cannot replicate.</li>
            <li><strong>Group coaching / community.</strong> Create a WhatsApp group for buyers of a specific product. Share bonus content, answer questions, and build a community. These people become repeat customers and refer others.</li>
          </ul>
        </div>
      </section>

      {/* ───────────────────────── SECTION 6 ───────────────────────── */}

      <section className="mt-12">
        <h2 className="text-2xl font-bold text-brand-black">Part 6 — Finding the Right Audience for Your Product</h2>

        <p className="mt-4">
          The biggest mistake creators make is trying to sell to everyone. &quot;My guide is for anyone who wants to be healthier&quot; is too broad. &quot;My guide is for Kampala-based office workers who want to lose weight without a gym membership&quot; is specific — and specific sells.
        </p>

        <h3 className="mt-6 text-xl font-bold text-brand-black">How to identify your target audience</h3>

        <div className="mt-4 space-y-4">
          {[
            {
              step: "1. Define the problem you solve",
              desc: "Be specific. Not 'financial literacy' — instead: 'helping young professionals in Kampala stop living paycheck to paycheck using mobile money budgeting.'",
            },
            {
              step: "2. Describe who has this problem",
              desc: "Age range, location, occupation, income level, daily habits. The more specific, the easier it is to find them online.",
            },
            {
              step: "3. Find where they spend time online",
              desc: "University students are on TikTok and Instagram. Working professionals are on LinkedIn and Twitter. Parents are on Facebook groups. Traders are on WhatsApp.",
            },
            {
              step: "4. Go where they already are",
              desc: "Do not try to bring people to your platform. Go to the platforms where your audience already spends time and meet them there.",
            },
          ].map((item) => (
            <div key={item.step} className="rounded-xl border border-neutral-200 bg-white p-5">
              <p className="font-bold text-brand-black">{item.step}</p>
              <p className="mt-1 text-sm text-neutral-600">{item.desc}</p>
            </div>
          ))}
        </div>

        <h3 className="mt-8 text-xl font-bold text-brand-black">Audience-to-platform matching guide</h3>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-200">
                <th className="py-2 text-left font-bold text-brand-black">Your audience</th>
                <th className="py-2 text-left font-bold text-brand-black">Primary platform</th>
                <th className="py-2 text-left font-bold text-brand-black">Secondary platforms</th>
              </tr>
            </thead>
            <tbody className="text-neutral-700">
              <tr className="border-b border-neutral-100"><td className="py-2">Students &amp; young adults</td><td className="py-2">TikTok</td><td className="py-2">Instagram, Twitter</td></tr>
              <tr className="border-b border-neutral-100"><td className="py-2">Working professionals</td><td className="py-2">Twitter / LinkedIn</td><td className="py-2">WhatsApp, Facebook</td></tr>
              <tr className="border-b border-neutral-100"><td className="py-2">Small business owners</td><td className="py-2">Facebook Groups</td><td className="py-2">WhatsApp, Instagram</td></tr>
              <tr className="border-b border-neutral-100"><td className="py-2">Parents &amp; families</td><td className="py-2">Facebook</td><td className="py-2">WhatsApp, Instagram</td></tr>
              <tr className="border-b border-neutral-100"><td className="py-2">Fitness &amp; health audience</td><td className="py-2">TikTok / Instagram</td><td className="py-2">YouTube Shorts</td></tr>
              <tr className="border-b border-neutral-100"><td className="py-2">Creators &amp; freelancers</td><td className="py-2">Twitter / TikTok</td><td className="py-2">Instagram, YouTube</td></tr>
              <tr className="border-b border-neutral-100"><td className="py-2">Traders &amp; vendors</td><td className="py-2">WhatsApp / TikTok</td><td className="py-2">Facebook Groups</td></tr>
              <tr><td className="py-2">International audience (diaspora)</td><td className="py-2">Instagram / Twitter</td><td className="py-2">TikTok, YouTube</td></tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* ───────────────────────── SECTION 7 ───────────────────────── */}

      <section className="mt-12">
        <h2 className="text-2xl font-bold text-brand-black">Part 7 — Your First 30 Days: A Step-by-Step Marketing Plan</h2>

        <p className="mt-4">
          Here is exactly what to do in your first 30 days after publishing your product. Follow this plan and you will have a foundation for consistent sales.
        </p>

        <div className="mt-6 space-y-6">
          {[
            {
              phase: "Days 1–7: Launch and seed",
              tasks: [
                "Publish your product on Keevan Store",
                "Post your first TikTok video introducing the product and what it solves",
                "Share your store link on your WhatsApp Status with a clear description",
                "Send a personal message to 20 people who would benefit from the product",
                "Join 10 Facebook groups in your niche and start engaging (do not promote yet)",
                "Post your first Instagram Reel and first carousel post",
              ],
            },
            {
              phase: "Days 8–14: Build momentum",
              tasks: [
                "Post 5–7 TikTok videos this week — mix of value content and product teasers",
                "Start posting helpful comments and tips in Facebook groups (still building trust)",
                "Create a Twitter thread about your topic — make it genuinely valuable, link to product at the end",
                "Ask your first buyers for testimonials (even a simple 'this was helpful' quote matters)",
                "Post a customer testimonial on all platforms",
                "Set up your WhatsApp Business profile with your product catalog",
              ],
            },
            {
              phase: "Days 15–21: Scale what works",
              tasks: [
                "Look at your analytics. Which platform is driving the most traffic? Double down on that one.",
                "Post your best-performing content again with a different angle or hook",
                "Start gently promoting in Facebook groups (1 valuable post per group per week)",
                "Create a lead magnet — a free mini-version of your product (e.g., chapter 1) that people get in exchange for sharing their contact details",
                "Run a limited-time discount (e.g., 20% off for 48 hours) and promote it everywhere",
              ],
            },
            {
              phase: "Days 22–30: Systematise",
              tasks: [
                "Create a content calendar for the next month — plan what to post on which platform each day",
                "Batch-create your content — film 5 TikTok videos in one sitting, write 3 carousels in one session",
                "Set up a weekly posting schedule you can sustain long-term",
                "Review your sales data — which products are selling? Create variations or bundles of your best sellers",
                "Start planning your second product based on customer feedback and questions",
              ],
            },
          ].map((item) => (
            <div key={item.phase} className="rounded-xl border border-neutral-200 bg-white p-6">
              <p className="text-lg font-bold text-brand-black">{item.phase}</p>
              <ul className="mt-3 space-y-2">
                {item.tasks.map((task, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm text-neutral-700">
                    <span className="mt-0.5 text-brand-green">&#10003;</span>
                    {task}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* ───────────────────────── SECTION 8 ───────────────────────── */}

      <section className="mt-12">
        <h2 className="text-2xl font-bold text-brand-black">Part 8 — Common Mistakes That Kill Sales</h2>

        <div className="mt-6 space-y-4">
          {[
            {
              mistake: "Posting once and waiting",
              fix: "Marketing is not a single event. It is a daily habit. Post content every day. The algorithm rewards consistency, not perfection.",
            },
            {
              mistake: "Selling without providing value first",
              fix: "Give away 80% of your knowledge for free. The 20% that is in your product should be the deep, structured, actionable version that people are willing to pay for.",
            },
            {
              mistake: "Ignoring your audience's actual language",
              fix: "If your audience speaks Luganda, make content in Luganda. If they speak Sheng, use Sheng. Language is not a barrier — it is a trust builder.",
            },
            {
              mistake: "No clear call to action",
              fix: "Every post should end with a clear next step. 'Link in bio' or 'DM me for the guide' or 'Get it at keevanstore.in/store/yourname'. People do what you tell them to do.",
            },
            {
              mistake: "Giving up after 2 weeks",
              fix: "Most creators give up before the algorithm has a chance to work. Commit to 90 days of consistent posting before you judge whether it is working.",
            },
            {
              mistake: "Not asking for testimonials",
              fix: "Social proof is the most powerful sales tool. After every sale, send a message: 'Thanks for your purchase! If you found it helpful, I would love a short testimonial I can share.'",
            },
            {
              mistake: "Trying to be on every platform at once",
              fix: "Master one platform first. Post consistently for 30 days on one platform. Once it is working, add a second. Spreading yourself thin across 5 platforms means doing all of them poorly.",
            },
          ].map((item) => (
            <div key={item.mistake} className="rounded-xl border border-neutral-200 bg-white p-5">
              <p className="font-bold text-red-600">Mistake: {item.mistake}</p>
              <p className="mt-1 text-sm text-neutral-700"><span className="font-semibold text-brand-green">Fix:</span> {item.fix}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ───────────────────────── SECTION 9 ───────────────────────── */}

      <section className="mt-12">
        <h2 className="text-2xl font-bold text-brand-black">Part 9 — Free AI Tools Cheat Sheet</h2>

        <p className="mt-4">
          Every tool listed below has a free tier. You can create, market, and sell a digital product without spending a single shilling on software.
        </p>

        <div className="mt-6 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-neutral-200">
                <th className="py-2 text-left font-bold text-brand-black">Task</th>
                <th className="py-2 text-left font-bold text-brand-black">Free tool</th>
                <th className="py-2 text-left font-bold text-brand-black">What it does</th>
              </tr>
            </thead>
            <tbody className="text-neutral-700">
              <tr className="border-b border-neutral-100"><td className="py-2">Writing &amp; editing</td><td className="py-2">ChatGPT, Google Docs</td><td className="py-2">Generate content, write drafts, brainstorm ideas, edit and proofread</td></tr>
              <tr className="border-b border-neutral-100"><td className="py-2">Grammar checking</td><td className="py-2">Grammarly Free</td><td className="py-2">Catch grammar, spelling, and clarity issues before publishing</td></tr>
              <tr className="border-b border-neutral-100"><td className="py-2">PDF design</td><td className="py-2">Canva Free</td><td className="py-2">Design e-books, covers, social media posts, and marketing materials</td></tr>
              <tr className="border-b border-neutral-100"><td className="py-2">Image generation</td><td className="py-2">Leonardo AI, Bing Image Creator</td><td className="py-2">Generate custom images, illustrations, and cover art</td></tr>
              <tr className="border-b border-neutral-100"><td className="py-2">Video editing</td><td className="py-2">CapCut</td><td className="py-2">Edit TikToks and Reels with auto-captions, transitions, and effects</td></tr>
              <tr className="border-b border-neutral-100"><td className="py-2">Link in bio</td><td className="py-2">Linktree, Beacons</td><td className="py-2">Create a single page with multiple links for your social media bio</td></tr>
              <tr className="border-b border-neutral-100"><td className="py-2">Scheduling posts</td><td className="py-2">Meta Business Suite</td><td className="py-2">Schedule Instagram and Facebook posts in advance</td></tr>
              <tr className="border-b border-neutral-100"><td className="py-2">Email collection</td><td className="py-2">Google Forms + Sheets</td><td className="py-2">Collect email addresses for a mailing list (free alternative to Mailchimp)</td></tr>
              <tr><td className="py-2">Analytics</td><td className="py-2">Keevan Store Dashboard</td><td className="py-2">Track views, sales, and earnings for your products</td></tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* ───────────────────────── SECTION 10 ───────────────────────── */}

      <section className="mt-12">
        <h2 className="text-2xl font-bold text-brand-black">Part 10 — Key Principles to Remember</h2>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {[
            { principle: "Consistency beats perfection", desc: "A mediocre post every day beats a perfect post once a month. The algorithm rewards activity. Your audience rewards reliability." },
            { principle: "Value before sales", desc: "Give away 80% of your knowledge for free. The 20% in your product should be the deep, structured, actionable version that saves people time." },
            { principle: "Specificity sells", desc: "\"A guide to saving money\" is weak. \"A budgeting guide for Kampala office workers earning 1–3M UGX per month\" is strong. The more specific, the more it resonates." },
            { principle: "Your audience already exists", desc: "Do not try to create a market. Find the people who are already searching for what you sell and put your product in front of them." },
            { principle: "Social proof is everything", desc: "One testimonial from a real customer is worth more than 100 posts about how great your product is. Ask for testimonials early and often." },
            { principle: "Invest in learning marketing", desc: "Creating the product is 30% of the work. Marketing is the other 70%. The creators who succeed are the ones who treat marketing as a skill to learn, not an annoyance to avoid." },
          ].map((item) => (
            <div key={item.principle} className="rounded-xl border border-brand-green/30 bg-brand-mist p-5">
              <p className="font-bold text-brand-black">{item.principle}</p>
              <p className="mt-1 text-sm text-neutral-600">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ───────────────────────── CTA ───────────────────────── */}

      <section className="mt-16 rounded-lg bg-brand-green p-8 text-white text-center">
        <h2 className="text-2xl font-bold sm:text-3xl">Ready to put this into action?</h2>
        <p className="mt-3 text-neutral-100">
          Create your free store on Keevan Store, upload your first digital product, and start marketing today. No monthly fees. Pay only 10% when you sell.
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-4">
          <ButtonLink href="/signup" variant="dark" icon>Create Your Free Store</ButtonLink>
          <ButtonLink href="/login" variant="secondary" icon>Creator Login</ButtonLink>
        </div>
      </section>
    </SimplePage>
  );
}
