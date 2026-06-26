import type { MetadataRoute } from "next";
import { site } from "@/lib/constants";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/product/", "/store/", "/checkout/", "/download/"],
        disallow: ["/creator/", "/admin/", "/api/", "/update-password"]
      },
      {
        userAgent: "GPTBot",
        allow: ["/", "/product/", "/store/", "/faq", "/about", "/pricing", "/features"],
        disallow: ["/creator/", "/admin/", "/api/"]
      },
      {
        userAgent: "ChatGPT-User",
        allow: ["/", "/product/", "/store/", "/faq", "/about", "/pricing", "/features"],
        disallow: ["/creator/", "/admin/", "/api/"]
      }
    ],
    sitemap: `${site.url}/sitemap.xml`
  };
}
