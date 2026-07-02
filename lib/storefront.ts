import { cache } from "react";
import { getOptionalSupabaseAdminClient } from "@/lib/supabase";

export function getCoverUrl(coverPath: string | null, _width?: number): string | null {
  if (!coverPath) return null;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl) return null;
  const encodedPath = coverPath.split("/").map((s) => encodeURIComponent(s)).join("/");
  return `${supabaseUrl}/storage/v1/object/public/covers/${encodedPath}`;
}

export type StorefrontProduct = {
  id: string;
  slug: string;
  title: string;
  description: string;
  price: number;
  currency: string;
  fileMime: string;
  coverPath: string | null;
  creatorId: string;
  creatorName: string;
  storeId: string;
  storeHandle: string;
  storeName: string;
};

export type StorefrontStore = {
  id: string;
  handle: string;
  name: string;
  description: string | null;
  creatorName: string;
  products: StorefrontProduct[];
};

/**
 * Discriminated result for storefront store lookups.
 * - "found"     → store exists and is active, data is populated
 * - "suspended" → store exists but has been suspended by admin
 * - "not_found" → no store with this handle exists
 */
export type StorefrontStoreResult =
  | { status: "found"; store: StorefrontStore }
  | { status: "suspended" }
  | { status: "not_found" };

export type DownloadPageState = {
  product: StorefrontProduct | null;
  verifiedToken: string | null;
  expired: boolean;
  serviceAvailable: boolean;
};

async function withTimeout<T>(promise: PromiseLike<T>, timeoutMs = 10000): Promise<{ ok: true; value: T } | { ok: false }> {
  // Attach a noop catch to silence orphaned rejections: if the timeout wins the
  // race the original promise is left dangling; its eventual rejection would
  // trigger an unhandledRejection crash in Next.js server component rendering.
  const safePromise = Promise.resolve(promise);
  safePromise.catch(() => {});
  try {
    const value = await Promise.race([
      safePromise as Promise<T>,
      new Promise<T>((_, reject) => setTimeout(() => reject(new Error("Query timeout")), timeoutMs))
    ]);
    return { ok: true, value };
  } catch {
    return { ok: false };
  }
}

async function getSupabase() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl) return null;
  const supabase = getOptionalSupabaseAdminClient();
  if (!supabase) return null;
  return supabase;
}

export const getPublishedProductBySlug = cache(async (slug: string, bypassStatus = false): Promise<StorefrontProduct | null> => {
  try {
    const supabase = await getSupabase();
    if (!supabase) return null;

    let query = supabase
      .from("products")
      .select("id,creator_id,store_id,slug,title,description,price,currency,file_mime,cover_path")
      .eq("slug", slug);

    if (!bypassStatus) query = query.eq("status", "published");

    const productResult = await withTimeout(query.maybeSingle());
    if (!productResult.ok) return null;
    const { data: product, error: productError } = productResult.value;
    if (productError || !product) return null;

    const storeResult = await withTimeout(
      supabase
        .from("stores")
        .select("id,slug,name,status")
        .eq("id", product.store_id)
        .eq("status", "active")
        .maybeSingle()
    );
    if (!storeResult.ok) return null;
    const { data: store, error: storeError } = storeResult.value;
    if (storeError || !store) return null;

    const creatorResult = await withTimeout(
      supabase
        .from("creators")
        .select("id,display_name")
        .eq("id", product.creator_id)
        .maybeSingle()
    );
    if (!creatorResult.ok) return null;
    const { data: creator, error: creatorError } = creatorResult.value;
    if (creatorError || !creator) return null;

    return {
      id: product.id,
      slug: product.slug,
      title: product.title,
      description: product.description,
      price: product.price,
      currency: product.currency,
      fileMime: product.file_mime,
      coverPath: product.cover_path,
      creatorId: product.creator_id,
      creatorName: creator.display_name,
      storeId: store.id,
      storeHandle: store.slug,
      storeName: store.name
    };
  } catch (e) {
    console.error("[storefront] getPublishedProductBySlug unexpected error:", e);
    return null;
  }
});

export async function getPublishedStoreByHandle(handle: string): Promise<StorefrontStoreResult> {
  const supabase = await getSupabase();
  if (!supabase) return { status: "not_found" };

  const storeResult = await withTimeout(
    supabase
      .from("stores")
      .select("id,creator_id,slug,name,description,status")
      .eq("slug", handle)
      .maybeSingle()
  );
  if (!storeResult.ok) return { status: "not_found" };
  const { data: store, error: storeError } = storeResult.value;
  if (storeError || !store) return { status: "not_found" };
  if (store.status === "suspended") return { status: "suspended" };
  if (store.status !== "active") return { status: "not_found" };

  const creatorResult = await withTimeout(
    supabase
      .from("creators")
      .select("display_name")
      .eq("id", store.creator_id)
      .maybeSingle()
  );
  if (!creatorResult.ok) return { status: "not_found" };
  const { data: creator, error: creatorError } = creatorResult.value;
  if (creatorError || !creator) return { status: "not_found" };

  const productsResult = await withTimeout(
    supabase
      .from("products")
      .select("id,creator_id,store_id,slug,title,description,price,currency,file_mime,cover_path")
      .eq("store_id", store.id)
      .eq("status", "published")
      .order("created_at", { ascending: false })
  );
  if (!productsResult.ok) return { status: "not_found" };
  const { data: products, error: productsError } = productsResult.value;
  if (productsError) return { status: "not_found" };

  const creatorName: string = creator.display_name ?? "";

  return {
    status: "found",
    store: {
      id: store.id,
      handle: store.slug,
      name: store.name,
      description: store.description,
      creatorName,
      products: (products ?? []).map((product) => ({
        id: product.id,
        slug: product.slug,
        title: product.title,
        description: product.description,
        price: product.price,
        currency: product.currency,
        fileMime: product.file_mime,
        coverPath: product.cover_path,
        creatorId: product.creator_id,
        creatorName,
        storeId: product.store_id,
        storeHandle: store.slug,
        storeName: store.name
      }))
    }
  };
}

export async function getDownloadPageState(slug: string, token?: string): Promise<DownloadPageState> {
  const product = await getPublishedProductBySlug(slug);
  if (!product || !token) {
    return { product, verifiedToken: null, expired: false, serviceAvailable: !!product };
  }

  const supabase = await getSupabase();
  if (!supabase) {
    return { product, verifiedToken: null, expired: false, serviceAvailable: false };
  }

  const downloadResult = await withTimeout(
    supabase
      .from("downloads")
      .select("token,expires_at,product_id")
      .eq("token", token)
      .eq("product_id", product.id)
      .maybeSingle()
  );

  if (!downloadResult.ok) {
    return { product, verifiedToken: null, expired: false, serviceAvailable: true };
  }
  const download = downloadResult.value.data ?? null;

  if (!download) {
    return { product, verifiedToken: null, expired: false, serviceAvailable: true };
  }

  const expired = new Date(download.expires_at).getTime() < Date.now();

  return {
    product,
    verifiedToken: expired ? null : download.token,
    expired,
    serviceAvailable: true
  };
}
