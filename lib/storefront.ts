import { cache } from "react";
import { getOptionalSupabaseAdminClient } from "@/lib/supabase";

export function getCoverUrl(coverPath: string | null, _width?: number): string | null {
  if (!coverPath) return null;
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl) return null;
  return `${supabaseUrl}/storage/v1/object/public/covers/${encodeURIComponent(coverPath)}`;
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

export type DownloadPageState = {
  product: StorefrontProduct | null;
  verifiedToken: string | null;
  expired: boolean;
  serviceAvailable: boolean;
};

function withTimeout<T>(promise: PromiseLike<T>, timeoutMs = 10000): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => setTimeout(() => reject(new Error("Query timeout")), timeoutMs))
  ]);
}

async function getSupabase() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!supabaseUrl) return null;
  const supabase = getOptionalSupabaseAdminClient();
  if (!supabase) return null;
  return supabase;
}

export const getPublishedProductBySlug = cache(async function getPublishedProductBySlug(slug: string, bypassStatus = false): Promise<StorefrontProduct | null> {
  const supabase = await getSupabase();
  if (!supabase) return null;

  let query = supabase
    .from("products")
    .select("id,creator_id,store_id,slug,title,description,price,currency,file_mime,cover_path")
    .eq("slug", slug);

  if (!bypassStatus) query = query.eq("status", "published");

  const { data: product, error: productError } = await withTimeout(query.maybeSingle());

  if (productError || !product) return null;

  const { data: store, error: storeError } = await withTimeout(
    supabase
      .from("stores")
      .select("id,slug,name,status")
      .eq("id", product.store_id)
      .eq("status", "active")
      .maybeSingle()
  );

  if (storeError || !store) return null;

  const { data: creator, error: creatorError } = await withTimeout(
    supabase
      .from("creators")
      .select("id,display_name")
      .eq("id", product.creator_id)
      .maybeSingle()
  );

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
});

export async function getPublishedStoreByHandle(handle: string): Promise<StorefrontStore | null> {
  const supabase = await getSupabase();
  if (!supabase) return null;

  const { data: store, error: storeError } = await withTimeout(
    supabase
      .from("stores")
      .select("id,creator_id,slug,name,description")
      .eq("slug", handle)
      .eq("status", "active")
      .maybeSingle()
  );

  if (storeError || !store) return null;

  const { data: creator, error: creatorError } = await withTimeout(
    supabase
      .from("creators")
      .select("display_name")
      .eq("id", store.creator_id)
      .maybeSingle()
  );

  if (creatorError || !creator) return null;

  const { data: products, error: productsError } = await withTimeout(
    supabase
      .from("products")
      .select("id,creator_id,store_id,slug,title,description,price,currency,file_mime,cover_path")
      .eq("store_id", store.id)
      .eq("status", "published")
      .order("created_at", { ascending: false })
  );

  if (productsError) return null;

  return {
    id: store.id,
    handle: store.slug,
    name: store.name,
    description: store.description,
    creatorName: creator.display_name,
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
      creatorName: creator.display_name,
      storeId: product.store_id,
      storeHandle: store.slug,
      storeName: store.name
    }))
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

  const { data: download } = await withTimeout(
    supabase
      .from("downloads")
      .select("token,expires_at,product_id")
      .eq("token", token)
      .eq("product_id", product.id)
      .maybeSingle()
  );

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
