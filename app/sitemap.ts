import type { MetadataRoute } from "next";
import { site } from "@/lib/constants";

const staticPages: { path: string; priority: number; changeFreq: "weekly" | "monthly" }[] = [
  { path: "", priority: 1, changeFreq: "weekly" },
  { path: "/about", priority: 0.8, changeFreq: "monthly" },
  { path: "/features", priority: 0.8, changeFreq: "monthly" },
  { path: "/pricing", priority: 0.8, changeFreq: "monthly" },
  { path: "/faq", priority: 0.8, changeFreq: "monthly" },
  { path: "/contact", priority: 0.6, changeFreq: "monthly" },
  { path: "/terms", priority: 0.4, changeFreq: "monthly" },
  { path: "/privacy", priority: 0.4, changeFreq: "monthly" },
  { path: "/refund-policy", priority: 0.4, changeFreq: "monthly" },
  { path: "/request-refund", priority: 0.4, changeFreq: "monthly" },
  { path: "/login", priority: 0.3, changeFreq: "monthly" },
  { path: "/signup", priority: 0.5, changeFreq: "monthly" },
  { path: "/forgot-password", priority: 0.2, changeFreq: "monthly" }
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return staticPages.map((p) => ({
      url: `${site.url}${p.path}`,
      lastModified: new Date(),
      changeFrequency: p.changeFreq,
      priority: p.priority
    }));
  }

  try {
    const { getSupabaseAdminClient } = await import("@/lib/supabase");
    const supabase = getSupabaseAdminClient();

    const [{ data: products }, { data: stores }] = await Promise.all([
      supabase.from("products").select("slug,updated_at").eq("status", "published"),
      supabase.from("stores").select("handle,updated_at")
    ]);

    const productPages = (products ?? []).map((p) => ({
      url: `${site.url}/product/${p.slug}`,
      lastModified: new Date(p.updated_at),
      changeFrequency: "weekly" as const,
      priority: 0.9
    }));

    const storePages = (stores ?? []).map((s) => ({
      url: `${site.url}/store/${s.handle}`,
      lastModified: new Date(s.updated_at),
      changeFrequency: "weekly" as const,
      priority: 0.7
    }));

    return [
      ...staticPages.map((p) => ({
        url: `${site.url}${p.path}`,
        lastModified: new Date(),
        changeFrequency: p.changeFreq,
        priority: p.priority
      })),
      ...productPages,
      ...storePages
    ];
  } catch {
    return staticPages.map((p) => ({
      url: `${site.url}${p.path}`,
      lastModified: new Date(),
      changeFrequency: p.changeFreq,
      priority: p.priority
    }));
  }
}
