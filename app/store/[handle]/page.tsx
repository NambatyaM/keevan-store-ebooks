import Link from "next/link";
import { notFound } from "next/navigation";
import { WifiOff } from "lucide-react";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { TrackView } from "@/components/track-view";
import { formatUgx, site } from "@/lib/constants";
import { getPublishedStoreByHandle } from "@/lib/storefront";

export async function generateMetadata({ params }: { params: Promise<{ handle: string }> }) {
  const { handle } = await params;
  try {
    const store = await getPublishedStoreByHandle(handle);
    if (!store) return {};

    return {
      title: `${store.creatorName} — Digital Store on Keevan Store | Buy E-books Online`,
      description: store.description ?? `Browse digital products by ${store.creatorName}. Buy e-books, guides, and templates securely via Pesapal with instant download.`,
      alternates: { canonical: `${site.url}/store/${handle}` },
      openGraph: {
        title: `${store.creatorName} — Digital Store on Keevan Store`,
        description: store.description ?? `Browse digital products by ${store.creatorName}.`
      },
      twitter: {
        card: "summary_large_image",
        title: `${store.creatorName} — Digital Store on Keevan Store`,
        description: store.description ?? `Browse digital products by ${store.creatorName}.`
      },
      keywords: [`${store.creatorName}`, "digital store", "buy e-books online", "Uganda digital marketplace"]
    };
  } catch {
    return {};
  }
}

export default async function StorePage({ params }: { params: Promise<{ handle: string }> }) {
  const { handle } = await params;
  let store;
  try {
    store = await getPublishedStoreByHandle(handle);
  } catch {
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

  if (!store) notFound();

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: site.url },
      { "@type": "ListItem", position: 2, name: store.creatorName }
    ]
  };

  return (
    <>
      <SiteHeader />
      <TrackView storeId={store.id} eventType="store_view" />
      <main>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
        <nav aria-label="Breadcrumb" className="mx-auto max-w-7xl px-4 pt-6 text-sm text-neutral-500 sm:px-6 lg:px-8">
          <Link href="/" className="hover:text-brand-green">Home</Link>
          <span className="mx-2">/</span>
          <span className="text-neutral-800">{store.creatorName}</span>
        </nav>
        <section className="border-b border-neutral-200 bg-brand-mist">
          <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
              <div className="grid h-20 w-20 place-items-center rounded-lg bg-brand-green text-2xl font-black text-white">
                {store.creatorName.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <p className="text-sm font-bold uppercase tracking-[0.18em] text-brand-green">Creator store</p>
                <h1 className="mt-2 text-4xl font-black text-brand-black">{store.creatorName}</h1>
                <p className="mt-2 max-w-2xl text-neutral-700">
                  {store.description ?? `${store.creatorName} sells digital products on Keevan Store. Browse available e-books, guides, and templates below.`}
                </p>
                {store.products.length > 0 && (
                  <p className="mt-2 text-sm text-neutral-600">{store.products.length} product{store.products.length !== 1 ? "s" : ""} available</p>
                )}
              </div>
            </div>
          </div>
        </section>
        <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold">Products by {store.creatorName}</h2>
          {store.products.length ? (
            <div className="mt-6 grid gap-5 md:grid-cols-2">
              {store.products.map((product) => (
              <Link key={product.id} href={`/product/${product.slug}`} className="group rounded-lg border border-neutral-200 bg-white p-4 transition hover:shadow-soft">
                <div className="grid gap-4 sm:grid-cols-[160px_1fr]">
                  <div className="grid aspect-[4/3] place-items-center rounded-md bg-neutral-100 px-4 text-center text-sm font-semibold text-neutral-500">
                    Digital product
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-brand-green">{product.fileMime}</p>
                    <h3 className="mt-1 text-xl font-bold text-brand-black">{product.title}</h3>
                    <p className="mt-2 line-clamp-2 text-sm leading-6 text-neutral-600">{product.description}</p>
                    <p className="mt-4 text-lg font-black">{formatUgx(product.price)}</p>
                  </div>
                </div>
              </Link>
              ))}
            </div>
          ) : (
            <div className="mt-6 rounded-lg border border-dashed border-neutral-300 bg-white p-8 text-center text-neutral-600">
              This creator has not published any products yet.
            </div>
          )}
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
