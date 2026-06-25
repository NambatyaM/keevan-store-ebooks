import { notFound } from "next/navigation";
import { CheckoutForm } from "@/components/checkout-form";
import { SimplePage } from "@/components/simple-page";
import { formatUgx } from "@/lib/constants";
import { getPublishedProductBySlug } from "@/lib/storefront";

export default async function CheckoutPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await getPublishedProductBySlug(slug);
  if (!product) notFound();

  return (
    <SimplePage title="Secure Checkout" eyebrow="Pesapal payment">
      <div className="grid gap-6 md:grid-cols-[1fr_0.8fr]">
        <CheckoutForm productId={product.id} />
        <aside className="rounded-lg bg-neutral-100 p-5">
          <p className="font-bold">{product.title}</p>
          <p className="mt-2 text-sm text-neutral-600">{product.fileMime}</p>
          <p className="mt-6 text-3xl font-black">{formatUgx(product.price)}</p>
          <p className="mt-4 text-sm text-neutral-600">Buyers do not need an account. The file unlocks after payment verification.</p>
        </aside>
      </div>
    </SimplePage>
  );
}
