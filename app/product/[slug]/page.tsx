import { notFound } from "next/navigation";
import Link from "next/link";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { Check, Download, ShieldCheck, WifiOff } from "lucide-react";
import { ButtonLink } from "@/components/button";
import { BuyNowModal } from "@/components/buy-now-modal";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { TrackView } from "@/components/track-view";
import Image from "next/image";
import { formatUgx, site } from "@/lib/constants";
import { getCoverUrl, getPublishedProductBySlug } from "@/lib/storefront";
import { ProductReviews } from "@/components/product-reviews";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  try {
    const product = await getPublishedProductBySlug(slug);
    if (!product) return {};

    return {
      title: `${product.title} — Buy Digital E-book Online | Keevan Store`,
      description: product.description,
      alternates: { canonical: `${site.url}/product/${slug}` },
      openGraph: {
        title: `${product.title} — Buy Digital E-book Online`,
        description: product.description,
        type: "product",
        images: product.coverPath ? [{ url: product.coverPath }] : []
      },
      twitter: {
        card: "summary_large_image",
        title: `${product.title} — Buy Digital E-book Online`,
        description: product.description
      },
      keywords: [`${product.title}`, "digital e-book", "buy online Uganda", "Pesapal payment", "instant download"]
    };
  } catch {
    return {};
  }
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  let product;
  try {
    product = await getPublishedProductBySlug(slug);
  } catch {
    console.error("ProductPage: getPublishedProductBySlug failed");
    return (
      <>
        <SiteHeader />
        <main className="mx-auto flex max-w-7xl items-center justify-center px-4 py-24 sm:px-6 lg:px-8">
          <div className="text-center">
            <WifiOff className="mx-auto text-brand-green" size={48} aria-hidden />
            <h1 className="mt-4 text-2xl font-bold">Service Temporarily Unavailable</h1>
            <p className="mt-2 text-neutral-600">Our database service is currently unavailable. Please try again shortly.</p>
            <Link href="/" className="mt-6 inline-block text-brand-green hover:underline">Return to home</Link>
          </div>
        </main>
        <SiteFooter />
      </>
    );
  }

  if (!product) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (supabaseUrl && supabaseKey) {
      try {
        const cookieStore = await cookies();
        const sb = createServerClient(supabaseUrl, supabaseKey, {
          cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} },
        });
        const { data: { session } } = await sb.auth.getSession();
        if (session?.user) {
          const draftProduct = await getPublishedProductBySlug(slug, true);
          if (draftProduct) {
            const { data: creator } = await sb.from("creators").select("id").eq("user_id", session.user.id).maybeSingle();
            if (creator && creator.id === draftProduct.creatorId) {
              product = draftProduct;
            }
          }
        }
      } catch (e) { console.error("ProductPage: draft preview failed", e); }
    }
    if (!product) notFound();
  }

  const productSchema = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.title,
    description: product.description,
    brand: { "@type": "Person", name: product.creatorName },
    offers: {
      "@type": "Offer",
      price: product.price,
      priceCurrency: "UGX",
      availability: "https://schema.org/InStock",
      url: `${site.url}/product/${slug}`,
      priceValidUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
    },
    ...(product.coverPath ? { image: product.coverPath } : {})
  };

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: site.url },
      { "@type": "ListItem", position: 2, name: product.creatorName, item: `${site.url}/store/${product.storeHandle}` },
      { "@type": "ListItem", position: 3, name: product.title }
    ]
  };

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      { "@type": "Question", name: "How do I download after purchasing?", acceptedAnswer: { "@type": "Answer", text: "After payment is confirmed, you will receive a signed download link on the confirmation page and via the product's download page. No account needed." } },
      { "@type": "Question", name: "What payment methods are accepted?", acceptedAnswer: { "@type": "Answer", text: "Payments are processed through Pesapal, supporting mobile money (MTN, Airtel), debit and credit cards, and bank transfers in UGX." } },
      { "@type": "Question", name: "Can I get a refund?", acceptedAnswer: { "@type": "Answer", text: "Because digital products are delivered instantly, refunds are handled case by case for duplicate charges, failed delivery, or verified creator error." } }
    ]
  };

  return (
    <>
      <SiteHeader />
      <TrackView productId={product.id} storeId={product.storeId} eventType="product_view" />
      <main className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-[0.9fr_1.1fr] lg:px-8">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
        <nav aria-label="Breadcrumb" className="text-sm text-neutral-500 md:col-span-2">
          <Link href="/" className="hover:text-brand-green">Home</Link>
          <span className="mx-2">/</span>
          <Link href={`/store/${product.storeHandle}`} className="hover:text-brand-green">{product.creatorName}</Link>
          <span className="mx-2">/</span>
          <span className="text-neutral-800">{product.title}</span>
        </nav>
        <div className="relative grid aspect-[4/5] place-items-center overflow-hidden rounded-lg bg-neutral-100 p-6 text-center">
          {getCoverUrl(product.coverPath) ? (
            <Image src={getCoverUrl(product.coverPath, 600)!} alt={product.title} fill className="object-cover" sizes="(max-width: 768px) 100vw, 50vw" loading="lazy" />
          ) : (
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-brand-green">Digital Product</p>
              <h2 className="mt-3 text-3xl font-black text-brand-black">{product.title}</h2>
              <p className="mt-4 text-sm text-neutral-500">{product.fileMime} &middot; Instant download</p>
            </div>
          )}
        </div>
        <section>
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-brand-green">{product.fileMime}</p>
          <h1 className="mt-3 text-4xl font-black leading-tight text-brand-black">{product.title}</h1>
          <p className="mt-3 text-neutral-600">By <Link href={`/store/${product.storeHandle}`} className="text-brand-green hover:underline">{product.creatorName}</Link></p>
          <p className="mt-6 text-lg leading-8 text-neutral-700">{product.description}</p>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <div className="flex items-center gap-2 rounded-lg bg-brand-mist p-3 text-sm font-semibold">
              <Check size={17} className="text-brand-green" aria-hidden /> Secure Pesapal checkout
            </div>
            <div className="flex items-center gap-2 rounded-lg bg-brand-mist p-3 text-sm font-semibold">
              <Check size={17} className="text-brand-green" aria-hidden /> Instant delivery after verification
            </div>
            <div className="flex items-center gap-2 rounded-lg bg-brand-mist p-3 text-sm font-semibold">
              <Check size={17} className="text-brand-green" aria-hidden /> UGX pricing, no hidden fees
            </div>
            <div className="flex items-center gap-2 rounded-lg bg-brand-mist p-3 text-sm font-semibold">
              <Check size={17} className="text-brand-green" aria-hidden /> Protected signed download link
            </div>
          </div>
          <div className="mt-8 rounded-lg border border-neutral-200 p-5">
            <div className="flex items-center justify-between gap-5">
              <div>
                <p className="text-sm text-neutral-500">Price</p>
                <p className="text-3xl font-black">{formatUgx(product.price)}</p>
              </div>
              <ShieldCheck className="text-brand-green" aria-hidden />
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <BuyNowModal productId={product.id} productSlug={product.slug} price={product.price} title={product.title} />
              <ButtonLink href={`/store/${product.storeHandle}`} variant="secondary">
                Visit Creator Store
              </ButtonLink>
            </div>
            <p className="mt-4 flex items-center gap-2 text-sm text-neutral-600">
              <Download size={16} aria-hidden />
              Secure download appears after Pesapal payment verification.
            </p>
          </div>
          <div className="mt-8">
            <h3 className="text-lg font-bold">Frequently asked questions about this product</h3>
            <div className="mt-4 grid gap-4">
              {[
                { q: "How do I download after purchasing?", a: "After payment is confirmed, you will receive a signed download link on the confirmation page and via the product's download page. No account needed." },
                { q: "What payment methods are accepted?", a: "Payments are processed through Pesapal, supporting mobile money (MTN, Airtel), debit and credit cards, and bank transfers in UGX." },
                { q: "Can I get a refund?", a: "Because digital products are delivered instantly, refunds are handled case by case for duplicate charges, failed delivery, or verified creator error." }
              ].map(({ q, a }) => (
                <section key={q} className="rounded-lg border border-neutral-200 p-4">
                  <h4 className="font-bold">{q}</h4>
                  <p className="mt-1 text-sm text-neutral-600">{a}</p>
                </section>
              ))}
            </div>
          <ProductReviews productId={product.id} />
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
