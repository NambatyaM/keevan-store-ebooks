import type { MetadataRoute } from "next";
import { site } from "@/lib/constants";
import { getOptionalSupabaseAdminClient } from "@/lib/supabase";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticPages: MetadataRoute.Sitemap = [
    { url: site.url, priority: 1.0, changeFrequency: "weekly" },
    { url: `${site.url}/about`, priority: 0.8, changeFrequency: "monthly" },
    { url: `${site.url}/features`, priority: 0.8, changeFrequency: "monthly" },
    { url: `${site.url}/pricing`, priority: 0.8, changeFrequency: "monthly" },
    { url: `${site.url}/faq`, priority: 0.8, changeFrequency: "monthly" },
    { url: `${site.url}/contact`, priority: 0.6, changeFrequency: "monthly" },
    { url: `${site.url}/terms`, priority: 0.4, changeFrequency: "monthly" },
    { url: `${site.url}/privacy`, priority: 0.4, changeFrequency: "monthly" },
    { url: `${site.url}/refund-policy`, priority: 0.4, changeFrequency: "monthly" },
    { url: `${site.url}/request-refund`, priority: 0.4, changeFrequency: "monthly" },
    { url: `${site.url}/signup`, priority: 0.5, changeFrequency: "monthly" },
    { url: `${site.url}/login`, priority: 0.3, changeFrequency: "monthly" },
    { url: `${site.url}/forgot-password`, priority: 0.2, changeFrequency: "monthly" },
  ];

  try {
    const supabase = getOptionalSupabaseAdminClient();
    if (!supabase) throw new Error("No admin client");

    const { data: products } = await supabase
      .from("products")
      .select("slug, updated_at")
      .eq("status", "published");

    const productPages: MetadataRoute.Sitemap = (products ?? []).map((p) => ({
      url: `${site.url}/product/${p.slug}`,
      priority: 0.9,
      changeFrequency: "weekly" as const,
      lastModified: p.updated_at ? new Date(p.updated_at) : undefined,
    }));

    const { data: stores } = await supabase
      .from("stores")
      .select("handle, updated_at");

    const storePages: MetadataRoute.Sitemap = (stores ?? []).map((s) => ({
      url: `${site.url}/store/${s.handle}`,
      priority: 0.7,
      changeFrequency: "weekly" as const,
      lastModified: s.updated_at ? new Date(s.updated_at) : undefined,
    }));

    return [...staticPages, ...productPages, ...storePages];
  } catch {
    return staticPages;
  }
}
