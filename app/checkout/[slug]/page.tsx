import { notFound } from "next/navigation";
import Link from "next/link";
import { WifiOff } from "lucide-react";
import { CheckoutForm } from "@/components/checkout-form";
import { SimplePage } from "@/components/simple-page";
import { formatUgx, site } from "@/lib/constants";
import { getPublishedProductBySlug } from "@/lib/storefront";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  try {
    const product = await getPublishedProductBySlug(slug);
    if (!product) return {};

    return {
      title: `Checkout — ${product.title}`,
      description: `Buy ${product.title} securely via Pesapal. Instant download after payment confirmation. No account required.`,
      alternates: { canonical: `${site.url}/checkout/${slug}` },
      robots: { index: false, follow: true }
    };
  } catch {
    return {};
  }
}

export default async function CheckoutPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  let product;
  try {
    product = await getPublishedProductBySlug(slug);
  } catch {
    return (
      <SimplePage title="Service Unavailable" eyebrow="Temporarily offline">
        <div className="text-center">
          <WifiOff className="mx-auto text-brand-green" size={48} aria-hidden />
          <h1 className="mt-4 text-2xl font-bold">Service Temporarily Unavailable</h1>
          <p className="mt-2 text-neutral-600">Our database service is currently unavailable. Please try again shortly.</p>
          <Link href="/" className="mt-6 inline-block text-brand-green hover:underline">Return to home</Link>
        </div>
      </SimplePage>
    );
  }

  if (!product) notFound();

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: site.url },
      { "@type": "ListItem", position: 2, name: product.title, item: `${site.url}/product/${slug}` },
      { "@type": "ListItem", position: 3, name: "Checkout" }
    ]
  };

  return (
    <SimplePage title="Secure Checkout" eyebrow="Pesapal payment">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      <div className="grid gap-6 md:grid-cols-[1fr_0.8fr]">
        <CheckoutForm productId={product.id} />
        <aside className="rounded-lg bg-neutral-100 p-5">
          <p className="font-bold">{product.title}</p>
          <p className="mt-2 text-sm text-neutral-600">{product.fileMime}</p>
          <p className="mt-6 text-3xl font-black">{formatUgx(product.price)}</p>
          <ul className="mt-4 grid gap-2 text-sm text-neutral-600">
            <li>&check; Secure Pesapal checkout</li>
            <li>&check; No account required</li>
            <li>&check; Instant download after verification</li>
          </ul>
        </aside>
      </div>
    </SimplePage>
  );
}
