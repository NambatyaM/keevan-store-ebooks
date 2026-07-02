import { notFound } from "next/navigation";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { getPublishedProductBySlug } from "@/lib/storefront";
import type { StorefrontProduct } from "@/lib/storefront";

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  let product: StorefrontProduct | null = null;

  try {
    product = await getPublishedProductBySlug(slug);
  } catch (e) {
    console.error("ProductPage: failed to fetch product", e);
  }

  if (!product) notFound();

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <h1>{product.title}</h1>
      </main>
      <SiteFooter />
    </>
  );
}
