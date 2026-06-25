import { getOptionalSupabaseAdminClient } from "@/lib/supabase";

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
};

export async function getPublishedProductBySlug(slug: string): Promise<StorefrontProduct | null> {
  const supabase = getOptionalSupabaseAdminClient();
  if (!supabase) {
    return null;
  }

  const { data: product } = await supabase
    .from("products")
    .select("id,creator_id,store_id,slug,title,description,price,currency,file_mime,cover_path")
    .eq("slug", slug)
    .eq("status", "published")
    .single();

  if (!product) {
    return null;
  }

  const [{ data: store }, { data: creator }] = await Promise.all([
    supabase.from("stores").select("id,slug,name,status").eq("id", product.store_id).eq("status", "active").single(),
    supabase.from("creators").select("id,display_name").eq("id", product.creator_id).single()
  ]);

  if (!store || !creator) {
    return null;
  }

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
}

export async function getPublishedStoreByHandle(handle: string): Promise<StorefrontStore | null> {
  const supabase = getOptionalSupabaseAdminClient();
  if (!supabase) {
    return null;
  }

  const { data: store } = await supabase
    .from("stores")
    .select("id,creator_id,slug,name,description")
    .eq("slug", handle)
    .eq("status", "active")
    .single();

  if (!store) {
    return null;
  }

  const [{ data: creator }, { data: products }] = await Promise.all([
    supabase.from("creators").select("display_name").eq("id", store.creator_id).single(),
    supabase
      .from("products")
      .select("id,creator_id,store_id,slug,title,description,price,currency,file_mime,cover_path")
      .eq("store_id", store.id)
      .eq("status", "published")
      .order("created_at", { ascending: false })
  ]);

  if (!creator) {
    return null;
  }

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
    return { product, verifiedToken: null, expired: false };
  }

  const supabase = getOptionalSupabaseAdminClient();
  if (!supabase) {
    return { product, verifiedToken: null, expired: false };
  }

  const { data: download } = await supabase
    .from("downloads")
    .select("token,expires_at,product_id")
    .eq("token", token)
    .eq("product_id", product.id)
    .single();

  if (!download) {
    return { product, verifiedToken: null, expired: false };
  }

  const expired = new Date(download.expires_at).getTime() < Date.now();

  return {
    product,
    verifiedToken: expired ? null : download.token,
    expired
  };
}
