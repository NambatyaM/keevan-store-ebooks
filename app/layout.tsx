import type { Metadata } from "next";
import "./globals.css";
import { site } from "@/lib/constants";
import { WhatsAppButton } from "@/components/whatsapp-button";

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: "Keevan Store - Sell Your E-books Online in Minutes",
    template: "%s | Keevan Store"
  },
  description:
    "Create your own digital store, accept payments through Pesapal, and deliver e-books instantly to customers across East Africa.",
  openGraph: {
    title: "Keevan Store",
    description: "Creator commerce for East African authors and digital creators.",
    url: site.url,
    siteName: site.name,
    type: "website"
  },
  alternates: {
    canonical: site.url
  }
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        {children}
        <WhatsAppButton />
      </body>
    </html>
  );
}
