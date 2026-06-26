import Link from "next/link";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";

export default function NotFound() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto grid min-h-[60vh] max-w-7xl place-items-center px-4 py-16 sm:px-6 lg:px-8">
        <div className="text-center">
          <p className="text-6xl font-black text-brand-green">404</p>
          <h1 className="mt-4 text-3xl font-bold">Page not found</h1>
          <p className="mt-3 text-neutral-600">
            The page you are looking for does not exist or may have been moved.
          </p>
          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link href="/" className="inline-flex min-h-11 items-center justify-center rounded-md bg-brand-green px-5 py-3 text-sm font-semibold text-white hover:bg-[#006f43]">
              Go home
            </Link>
            <Link href="/faq" className="inline-flex min-h-11 items-center justify-center rounded-md border border-brand-green bg-white px-5 py-3 text-sm font-semibold text-brand-green hover:bg-brand-mist">
              Visit FAQ
            </Link>
            <Link href="/contact" className="inline-flex min-h-11 items-center justify-center rounded-md border border-neutral-300 bg-white px-5 py-3 text-sm font-semibold text-neutral-700 hover:bg-neutral-50">
              Contact support
            </Link>
          </div>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}
