export type FAQItem = { q: string; a: string };

export const faqs: FAQItem[] = [
  { q: "What is Keevan Store?", a: "Keevan Store is a creator commerce platform for East African authors, educators, coaches, and digital creators to sell e-books, guides, templates, and digital products directly to customers through branded storefronts." },
  { q: "Do buyers need an account to purchase?", a: "No. Buyers can pay securely through Pesapal using mobile money, card, or bank transfer and download their file instantly — no account creation required." },
  { q: "How do creators get paid?", a: "Keevan Store collects payments from buyers, records earnings in your creator dashboard, and processes manual withdrawal requests once your balance reaches the minimum threshold." },
  { q: "What is the minimum withdrawal amount?", a: "The minimum withdrawal depends on your store's currency: 50,000 UGX, 1,500 KES, 30,000 TZS, 20,000 RWF, or 20 USD. You can request a payout anytime your available balance meets the threshold." },
  { q: "How much does it cost to sell on Keevan Store?", a: "Keevan Store has no monthly fees. Creators pay a 10% platform commission on each successful sale. If you do not sell anything, you pay nothing." },
  { q: "What is the platform commission used for?", a: "The 10% commission covers payment processing, secure file storage and delivery, analytics and dashboards, customer support, and platform administration." },
  { q: "Which file formats are supported?", a: "Keevan Store supports PDF, EPUB, MOBI, and ZIP files up to 4 MB per upload. These formats cover e-books, guides, worksheets, templates, and bundled resources." },
  { q: "Can I update my product after publishing?", a: "Yes. Your creator dashboard lets you edit product titles, descriptions, prices, and uploaded files at any time." },
  { q: "How are files delivered to customers?", a: "After Pesapal confirms payment, Keevan Store generates a signed, time-limited download URL that the customer can access immediately. No manual delivery required." },
  { q: "How does payment verification work?", a: "Keevan Store uses server-side verification that cross-checks the payment reference with Pesapal's transaction status API. The file is only unlocked when payment is confirmed." },
  { q: "What payment methods do buyers use?", a: "Buyers pay through Pesapal, which supports mobile money (MTN, Airtel), debit and credit cards, and bank transfers." },
  { q: "Is my content protected?", a: "Yes. Files are stored securely in cloud storage with signed, expiring download URLs. Only verified purchasers can access the download link. Payment verification happens server-side before any file access." },
  { q: "Can I see how many people viewed my products?", a: "Yes. The analytics dashboard shows product and store page views, purchase counts, download numbers, and conversion rates." },
  { q: "Who can sell on Keevan Store?", a: "Any East African creator who owns the rights to their content. Authors, educators, course creators, template designers, and digital artists. Currently serving Uganda, Kenya, Tanzania, and Rwanda." },
  { q: "Do I need technical skills?", a: "No. Sign up, upload your file, set your price, and your store is live. No coding, no design, no hosting setup." },
  { q: "What happens if a buyer wants a refund?", a: "Because digital products are delivered instantly after payment, refunds are handled case by case. Contact support if there was a duplicate charge, failed delivery, or verified error." },
  { q: "How do I contact support?", a: "Support is available via WhatsApp at the phone number listed on the contact page. You can also visit the contact page for more information." },
  { q: "Is there a mobile app?", a: "Keevan Store is a web-based platform optimized for all devices. Creator dashboards and customer storefronts work on mobile browsers without installing an app." },
  { q: "Can I have multiple products?", a: "Yes. Creators can upload and manage multiple digital products under their single store. Each product gets its own page and purchase link." },
  { q: "How long does withdrawal processing take?", a: "Withdrawal requests are typically processed within 1–3 business days after submission. You will be notified once the payout is completed." }
];

export const sections: { title: string; slice: [number, number] }[] = [
  { title: "General questions", slice: [0, 5] },
  { title: "Selling on Keevan Store", slice: [5, 13] },
  { title: "Payments and withdrawals", slice: [13, 17] },
  { title: "Account and platform questions", slice: [17, 20] },
];
