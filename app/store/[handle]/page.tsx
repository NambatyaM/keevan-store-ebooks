import Link from "next/link";
import { notFound } from "next/navigation";
import { WifiOff, Star, ShoppingBag, ShieldCheck, BookOpen, AlertTriangle } from "lucide-react";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { TrackView } from "@/components/track-view";
import Image from "next/image";
import { formatCurrency, site, type Currency } from "@/lib/constants";
import { getCoverUrl, getAvatarUrl, getPublishedStoreByHandle } from "@/lib/storefront";

export async function generateMetadata({ params }: { params: Promise<{ handle: string }> }) {
  const { handle } = await params;
  try {
    const result = await getPublishedStoreByHandle(handle);
    if (result.status !== "found") return {};

    const { store } = result;
    return {
      title: `${store.creatorName} — Digital Store | Buy E-books Online`,
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
  let result: Awaited<ReturnType<typeof getPublishedStoreByHandle>>;
  try {
    result = await getPublishedStoreByHandle(handle);
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

  // Non-existent store → clean 404
  if (result.status === "not_found") notFound();

  // Suspended store → informative message (not a 404 or 500)
  if (result.status === "suspended") {
    return (
      <>
        <SiteHeader />
        <main className="mx-auto flex max-w-7xl items-center justify-center px-4 py-24 sm:px-6 lg:px-8">
          <div className="text-center">
            <AlertTriangle className="mx-auto text-amber-500" size={48} aria-hidden />
            <h1 className="mt-4 text-2xl font-bold">Store Unavailable</h1>
            <p className="mt-2 text-neutral-600">
              This store has been temporarily suspended. Please check back later or{" "}
              <Link href="/" className="text-brand-green hover:underline">browse other stores</Link>.
            </p>
          </div>
        </main>
        <SiteFooter />
      </>
    );
  }

  const { store } = result;

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

        <section className="relative overflow-hidden bg-gradient-to-br from-brand-green/10 via-white to-brand-mist">
          <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
            <div className="flex flex-col items-center gap-6 text-center sm:flex-row sm:text-left">
              {(() => {
                const avatarUrl = getAvatarUrl(store.avatarPath);
                return avatarUrl ? (
                  <Image
                    src={avatarUrl}
                    alt={store.creatorName}
                    width={96}
                    height={96}
                    className="h-24 w-24 shrink-0 rounded-2xl object-cover ring-4 ring-white shadow-soft"
                  />
                ) : (
                  <div className="grid h-24 w-24 shrink-0 place-items-center rounded-2xl bg-brand-green text-3xl font-black text-white shadow-soft ring-4 ring-white">
                    {(store.creatorName ?? "ST").slice(0, 2).toUpperCase()}
                  </div>
                );
              })()}
              <div className="min-w-0">
                <p className="text-sm font-bold uppercase tracking-[0.18em] text-brand-green">Creator store</p>
                <h1 className="mt-1 text-4xl font-black text-brand-black sm:text-5xl">{store.creatorName}</h1>
                <p className="mt-3 max-w-2xl text-lg leading-7 text-neutral-700">
                  {store.description ?? `${store.creatorName} sells digital products on Keevan Store. Browse available e-books, guides, and templates below.`}
                </p>
                <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-neutral-500">
                  <span className="flex items-center gap-1.5">
                    <ShoppingBag size={16} className="text-brand-green" aria-hidden />
                    {store.products.length} product{store.products.length !== 1 ? "s" : ""}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <ShieldCheck size={16} className="text-brand-green" aria-hidden />
                    Pesapal secure checkout
                  </span>
                  <span className="flex items-center gap-1.5">
                    <BookOpen size={16} className="text-brand-green" aria-hidden />
                    Instant download
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-brand-black">Products by {store.creatorName}</h2>
              <p className="mt-1 text-sm text-neutral-500">Digital products available for instant purchase and download.</p>
            </div>
          </div>

          {store.products.length ? (
            <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {store.products.map((product) => {
                const coverUrl = getCoverUrl(product.coverPath, 400);
                return (
                  <Link
                    key={product.id}
                    href={`/product/${product.slug}`}
                    className="group flex flex-col overflow-hidden rounded-xl border border-neutral-200 bg-white shadow-sm transition hover:shadow-soft"
                  >
                    <div className="relative aspect-[4/3] overflow-hidden bg-neutral-100">
                      {coverUrl ? (
                        <Image
                          src={coverUrl}
                          alt={product.title}
                          fill
                          className="object-cover transition duration-500 group-hover:scale-105"
                          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                          loading="lazy"
                        />
                      ) : (
                        <div className="grid h-full place-items-center px-6 text-center">
                          <div>
                            <BookOpen size={40} className="mx-auto text-neutral-300" aria-hidden />
                            <p className="mt-2 text-sm font-semibold text-neutral-400">Digital product</p>
                          </div>
                        </div>
                      )}
                      <span className="absolute left-3 top-3 rounded-md bg-white/90 px-2.5 py-1 text-xs font-semibold text-neutral-700 shadow-sm backdrop-blur">
                        {product.fileMime}
                      </span>
                    </div>
                    <div className="flex flex-1 flex-col p-5">
                      <h3 className="text-lg font-bold text-brand-black group-hover:text-brand-green">{product.title}</h3>
                      <p className="mt-2 line-clamp-2 flex-1 text-sm leading-6 text-neutral-600">{product.description}</p>
                      <div className="mt-5 flex items-center justify-between gap-4 border-t border-neutral-100 pt-4">
                        <p className="text-xl font-black text-brand-black">{formatCurrency(product.price, product.currency as Currency)}</p>
                        <span className="rounded-md bg-brand-green/10 px-3 py-1.5 text-xs font-semibold text-brand-green">Buy now</span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="mt-8 rounded-2xl border border-dashed border-neutral-300 bg-white p-16 text-center">
              <ShoppingBag size={48} className="mx-auto text-neutral-300" aria-hidden />
              <h3 className="mt-4 text-xl font-bold text-neutral-600">No products yet</h3>
              <p className="mt-2 text-neutral-500">This creator has not published any products yet. Check back soon.</p>
            </div>
          )}
        </section>

        <section className="border-t border-neutral-200 bg-neutral-50">
          <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
            <div className="rounded-2xl bg-brand-green p-8 text-white sm:p-12">
              <div className="mx-auto max-w-2xl text-center">
                <h2 className="text-2xl font-bold sm:text-3xl">Why buy on Keevan Store?</h2>
                <div className="mt-6 grid gap-4 text-left sm:grid-cols-3">
                  <div className="rounded-xl bg-white/10 p-4 text-center">
                    <ShieldCheck size={28} className="mx-auto text-brand-gold" aria-hidden />
                    <p className="mt-2 font-bold">Secure payments</p>
                    <p className="mt-1 text-sm text-white/80">Pesapal encrypted checkout with mobile money, card, and bank transfer options.</p>
                  </div>
                  <div className="rounded-xl bg-white/10 p-4 text-center">
                    <ShoppingBag size={28} className="mx-auto text-brand-gold" aria-hidden />
                    <p className="mt-2 font-bold">Instant delivery</p>
                    <p className="mt-1 text-sm text-white/80">Files delivered immediately after payment verification. No waiting.</p>
                  </div>
                  <div className="rounded-xl bg-white/10 p-4 text-center">
                    <Star size={28} className="mx-auto text-brand-gold" aria-hidden />
                    <p className="mt-2 font-bold">Support creators</p>
                    <p className="mt-1 text-sm text-white/80">90% of your payment goes directly to the creator. You support East African talent.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
