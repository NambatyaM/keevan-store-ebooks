import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { formatUgx, site } from "@/lib/constants";
import { getPublishedStoreByHandle } from "@/lib/storefront";

export async function generateMetadata({ params }: { params: Promise<{ handle: string }> }) {
  const { handle } = await params;
  const store = await getPublishedStoreByHandle(handle);
  if (!store) return {};

  return {
    title: `${store.creatorName} on Keevan Store`,
    description: store.description ?? `${store.creatorName}'s creator store on Keevan Store.`,
    alternates: { canonical: `${site.url}/store/${handle}` }
  };
}

export default async function StorePage({ params }: { params: Promise<{ handle: string }> }) {
  const { handle } = await params;
  const store = await getPublishedStoreByHandle(handle);
  if (!store) notFound();

  return (
    <>
      <SiteHeader />
      <main>
        <section className="border-b border-neutral-200 bg-brand-mist">
          <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
              <div className="grid h-20 w-20 place-items-center rounded-lg bg-brand-green text-2xl font-black text-white">
                {store.creatorName.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <p className="text-sm font-bold uppercase tracking-[0.18em] text-brand-green">Creator store</p>
                <h1 className="mt-2 text-4xl font-black text-brand-black">{store.creatorName}</h1>
                <p className="mt-2 max-w-2xl text-neutral-700">{store.description ?? `${store.creatorName} is building a digital storefront on Keevan Store.`}</p>
                <p className="mt-2 text-sm text-neutral-600">Store URL: /store/{store.handle}</p>
              </div>
            </div>
          </div>
        </section>
        <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold">Products</h2>
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
              No published products are live in this store yet.
            </div>
          )}
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
