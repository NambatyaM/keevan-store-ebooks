import { notFound } from "next/navigation";
import { Check, Download, ShieldCheck } from "lucide-react";
import { ButtonLink } from "@/components/button";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { formatUgx, site } from "@/lib/constants";
import { getPublishedProductBySlug } from "@/lib/storefront";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await getPublishedProductBySlug(slug);
  if (!product) return {};

  return {
    title: product.title,
    description: product.description,
    alternates: { canonical: `${site.url}/product/${slug}` },
    openGraph: {
      title: product.title,
      description: product.description
    }
  };
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await getPublishedProductBySlug(slug);
  if (!product) notFound();

  const bullets = [
    "Secure Pesapal checkout",
    "Instant delivery after verification",
    "UGX billing with platform commission applied",
    "Protected storage-backed file access"
  ];

  const schema = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.title,
    description: product.description,
    brand: product.creatorName,
    offers: {
      "@type": "Offer",
      price: product.price,
      priceCurrency: "UGX",
      availability: "https://schema.org/InStock"
    }
  };

  return (
    <>
      <SiteHeader />
      <main className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-[0.9fr_1.1fr] lg:px-8">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
        <div className="grid aspect-[4/5] place-items-center rounded-lg bg-neutral-100 p-6 text-center">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-brand-green">Digital Product</p>
            <h2 className="mt-3 text-3xl font-black text-brand-black">{product.title}</h2>
          </div>
        </div>
        <section>
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-brand-green">{product.fileMime}</p>
          <h1 className="mt-3 text-4xl font-black leading-tight text-brand-black">{product.title}</h1>
          <p className="mt-3 text-neutral-600">By {product.creatorName}</p>
          <p className="mt-6 text-lg leading-8 text-neutral-700">{product.description}</p>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {bullets.map((bullet) => (
              <div key={bullet} className="flex items-center gap-2 rounded-lg bg-brand-mist p-3 text-sm font-semibold">
                <Check size={17} className="text-brand-green" aria-hidden />
                {bullet}
              </div>
            ))}
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
              <ButtonLink href={`/checkout/${product.slug}`} icon>
                Buy Now
              </ButtonLink>
              <ButtonLink href={`/store/${product.storeHandle}`} variant="secondary">
                Creator Store
              </ButtonLink>
            </div>
            <p className="mt-4 flex items-center gap-2 text-sm text-neutral-600">
              <Download size={16} aria-hidden />
              Secure download appears after Pesapal payment verification.
            </p>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
