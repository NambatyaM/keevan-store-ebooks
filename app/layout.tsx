import type { Metadata } from "next";
import "./globals.css";
import { site } from "@/lib/constants";
import { WhatsAppButton } from "@/components/whatsapp-button";
import { AuthProvider } from "@/components/auth-provider";
import { Analytics } from "@vercel/analytics/react";

const titleTemplate = "%s | Keevan Store";
const defaultTitle = "Keevan Store — Sell E-books Online in Minutes | East African Creator Commerce";
const description =
  "Keevan Store lets East African authors, educators, and digital creators sell e-books, PDFs, guides, and templates online. Create a branded store, accept Pesapal payments, and deliver files instantly. No monthly fees — pay only 10% per sale.";

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: { default: defaultTitle, template: titleTemplate },
  description,
  keywords: [
    "sell e-books online Uganda", "digital products East Africa", "creator commerce platform",
    "Pesapal payments", "sell PDFs online", "online bookstore Uganda",
    "digital storefront Africa", "sell e-books Kenya", "earn from writing Uganda",
    "African authors platform", "self-publishing Uganda"
  ],
  openGraph: {
    title: defaultTitle,
    description,
    url: site.url,
    siteName: site.name,
    type: "website",
    locale: "en_UG",
    images: [{ url: `${site.url}/og-image.png`, width: 1200, height: 630, alt: site.name }]
  },
  twitter: {
    card: "summary_large_image",
    title: defaultTitle,
    description,
    images: [`${site.url}/og-image.png`]
  },
  alternates: { canonical: site.url },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-video-preview": -1, "max-image-preview": "large", "max-snippet": -1 }
  }
};

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const supabaseOrigin = supabaseUrl ? new URL(supabaseUrl).origin : "";

const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: site.name,
  url: site.url,
  logo: "https://i.ibb.co/v6h94WVG/keevan-favicon.jpg",
  sameAs: [
    site.supportWhatsApp
  ],
  contactPoint: {
    "@type": "ContactPoint",
    telephone: site.supportPhone,
    contactType: "customer support",
    availableLanguage: ["English"]
  }
};

const webSiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: site.name,
  url: site.url,
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <head>
        <link rel="canonical" href={site.url} />
        <link rel="icon" type="image/jpeg" href="https://i.ibb.co/v6h94WVG/keevan-favicon.jpg" />
        <link rel="apple-touch-icon" href="https://i.ibb.co/v6h94WVG/keevan-favicon.jpg" />
        <meta name="theme-color" content="#00854a" />
        {supabaseOrigin && (
          <>
            <link rel="preconnect" href={supabaseOrigin} />
            <link rel="dns-prefetch" href={supabaseOrigin} />
          </>
        )}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(webSiteSchema) }}
        />
      </head>
      <body>
        <AuthProvider>
          {children}
          <WhatsAppButton />
          <Analytics />
        </AuthProvider>
      </body>
    </html>
  );
}
