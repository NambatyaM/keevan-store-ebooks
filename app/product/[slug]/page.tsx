import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { ShieldCheck } from "lucide-react";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { formatCurrency, site, type Currency } from "@/lib/constants";
import { getCoverUrl, getPublishedProductBySlug } from "@/lib/storefront";
import type { StorefrontProduct } from "@/lib/storefront";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  try {
    const product = await getPublishedProductBySlug(slug);
    if (!product) return {};
    return {
      title: `${product.title} — Buy Digital E-book Online`,
      description: product.description,
      alternates: { canonical: `${site.url}/product/${slug}` },
      openGraph: {
        title: `${product.title} — Buy Digital E-book Online`,
        description: product.description,
        type: "product",
        images: product.coverPath ? [{ url: getCoverUrl(product.coverPath) }] : []
      },
    };
  } catch {
    return {};
  }
}

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  let product: StorefrontProduct | null = null;

  try {
    product = await getPublishedProductBySlug(slug);
  } catch (e) {
    console.error("ProductPage: failed to fetch product", e);
  }

  if (!product) notFound();

  const coverUrl = getCoverUrl(product.coverPath, 600);

  return (
    <>
      <SiteHeader />
      <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <h1>{product.title}</h1>
        <p>{product.description}</p>
        {coverUrl && (
          <Image src={coverUrl} alt={product.title} width={300} height={400} unoptimized />
        )}
        <p>{formatCurrency(product.price, product.currency as Currency)}</p>
      </main>
      <SiteFooter />
    </>
  );
}
