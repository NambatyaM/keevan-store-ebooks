import Link from "next/link";
import { site } from "@/lib/constants";

const links = [
  ["Product", ["/features", "/pricing", "/store/aminanak", "/product/write-and-sell-your-first-ebook"]],
  ["Company", ["/about", "/contact", "/faq"]],
  ["Legal", ["/terms", "/privacy", "/refund-policy"]]
];

export function SiteFooter() {
  return (
    <footer className="border-t border-neutral-200 bg-neutral-950 text-white">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-[1.4fr_2fr] lg:px-8">
        <div>
          <p className="text-lg font-bold">Keevan Store</p>
          <p className="mt-3 max-w-md text-sm leading-6 text-neutral-300">
            Creator commerce for East African authors selling e-books, guides, templates, and digital products.
          </p>
          <a className="mt-5 inline-block text-sm font-semibold text-brand-gold" href={site.supportWhatsApp}>
            WhatsApp support: {site.supportPhone}
          </a>
        </div>
        <div className="grid gap-8 sm:grid-cols-3">
          {links.map(([title, hrefs]) => (
            <div key={title as string}>
              <p className="text-sm font-semibold">{title}</p>
              <div className="mt-4 grid gap-3 text-sm text-neutral-300">
                {(hrefs as string[]).map((href) => (
                  <Link key={href} href={href} className="hover:text-white">
                    {href === "/refund-policy" ? "Refund Policy" : href.replace("/", "").replaceAll("-", " ") || "Home"}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </footer>
  );
}
