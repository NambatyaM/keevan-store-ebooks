import Link from "next/link";
import { site } from "@/lib/constants";

const links: [string, { href: string; label: string }[]][] = [
  ["Product", [
    { href: "/features", label: "Features" },
    { href: "/pricing", label: "Pricing" },
    { href: "/about", label: "About" },
    { href: "/faq", label: "FAQ" }
  ]],
  ["Support", [
    { href: "/contact", label: "Contact" },
    { href: "/faq", label: "Help Center" },
    { href: "/request-refund", label: "Request Refund" },
    { href: "/signup", label: "Create Account" },
    { href: "/login", label: "Creator Login" }
  ]],
  ["Legal", [
    { href: "/terms", label: "Terms of Service" },
    { href: "/privacy", label: "Privacy Policy" },
    { href: "/refund-policy", label: "Refund Policy" }
  ]]
];

export function SiteFooter() {
  return (
    <footer className="border-t border-neutral-200 bg-neutral-950 text-white">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-[1.4fr_2fr] lg:px-8">
        <div>
          <p className="text-lg font-bold">Keevan Store</p>
          <p className="mt-3 max-w-md text-sm leading-6 text-neutral-300">
            Creator commerce for East African authors, educators, and digital creators. Sell e-books, guides, templates, and digital products directly to your audience.
          </p>
          <a className="mt-5 inline-block text-sm font-semibold text-brand-gold" href={site.supportWhatsApp}>
            WhatsApp support: {site.supportPhone}
          </a>
        </div>
        <div className="grid gap-8 sm:grid-cols-3">
          {links.map(([title, hrefs]) => (
            <div key={title}>
              <p className="text-sm font-semibold">{title}</p>
              <div className="mt-4 grid gap-3 text-sm text-neutral-300">
                {hrefs.map(({ href, label }) => (
                  <Link key={href} href={href} className="hover:text-white">
                    {label}
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
