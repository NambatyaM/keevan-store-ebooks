import { describe, it, expect, vi, beforeEach } from "vitest";
import { getDownloadPageState } from "@/lib/storefront";

const mockGetOptionalSupabaseAdminClient = vi.hoisted(() => vi.fn());

vi.mock("@/lib/supabase", () => ({
  getOptionalSupabaseAdminClient: mockGetOptionalSupabaseAdminClient
}));

beforeEach(() => {
  vi.clearAllMocks();
});

describe("getDownloadPageState", () => {
  it("returns serviceAvailable=false when supabase client is null", async () => {
    mockGetOptionalSupabaseAdminClient.mockReturnValue(null);

    const result = await getDownloadPageState("my-ebook");
    expect(result).toEqual({
      product: null,
      verifiedToken: null,
      expired: false,
      serviceAvailable: false
    });
  });

  function makeChain(opts: { single: ReturnType<typeof vi.fn> }) {
    const chain = {
      select: vi.fn(() => chain),
      eq: vi.fn(() => chain),
      single: opts.single,
    };
    return () => chain;
  }

  it("returns product null and serviceAvailable=true when slug not found", async () => {
    const mockSingle = vi.fn().mockResolvedValue({ data: null, error: null });
    mockGetOptionalSupabaseAdminClient.mockReturnValue({ from: makeChain({ single: mockSingle }) });

    const result = await getDownloadPageState("nonexistent");
    expect(result.serviceAvailable).toBe(true);
    expect(result.product).toBeNull();
    expect(result.verifiedToken).toBeNull();
  });

  it("returns product with no verified token when no token provided", async () => {
    const fakeProduct = {
      id: "prod-1",
      creator_id: "creator-1",
      store_id: "store-1",
      slug: "my-ebook",
      title: "My E-Book",
      description: "A great book",
      price: 50000,
      currency: "UGX",
      file_mime: "application/pdf",
      cover_path: null
    };

    const fakeStore = { id: "store-1", slug: "my-store", name: "My Store", status: "active" };
    const fakeCreator = { id: "creator-1", display_name: "Author Name" };

    const mockSingle = vi.fn()
      .mockResolvedValueOnce({ data: fakeProduct, error: null })
      .mockResolvedValueOnce({ data: fakeStore, error: null })
      .mockResolvedValueOnce({ data: fakeCreator, error: null });

    mockGetOptionalSupabaseAdminClient.mockReturnValue({ from: makeChain({ single: mockSingle }) });

    const result = await getDownloadPageState("my-ebook");
    expect(result.serviceAvailable).toBe(true);
    expect(result.product).not.toBeNull();
    expect(result.product?.title).toBe("My E-Book");
    expect(result.product?.creatorName).toBe("Author Name");
    expect(result.product?.storeName).toBe("My Store");
    expect(result.verifiedToken).toBeNull();
    expect(result.expired).toBe(false);
  });

  it("returns product with verified token when valid token provided", async () => {
    const fakeProduct = {
      id: "prod-1",
      creator_id: "creator-1",
      store_id: "store-1",
      slug: "my-ebook",
      title: "My E-Book",
      description: "A great book",
      price: 50000,
      currency: "UGX",
      file_mime: "application/pdf",
      cover_path: null
    };

    const fakeStore = { id: "store-1", slug: "my-store", name: "My Store", status: "active" };
    const fakeCreator = { id: "creator-1", display_name: "Author Name" };

    const futureDate = new Date(Date.now() + 86400000).toISOString();
    const fakeDownload = {
      token: "valid-token-123",
      expires_at: futureDate,
      product_id: "prod-1"
    };

    const mockSingle = vi.fn()
      .mockResolvedValueOnce({ data: fakeProduct, error: null })
      .mockResolvedValueOnce({ data: fakeStore, error: null })
      .mockResolvedValueOnce({ data: fakeCreator, error: null });

    const mockSingleDownload = vi.fn().mockResolvedValue({ data: fakeDownload, error: null });
    const productChain = makeChain({ single: mockSingle });
    const downloadChain = makeChain({ single: mockSingleDownload });
    mockGetOptionalSupabaseAdminClient.mockReturnValue({
      from: vi.fn((table: string) => {
        if (table === "downloads") return downloadChain();
        return productChain();
      })
    });

    const result = await getDownloadPageState("my-ebook", "valid-token-123");
    expect(result.serviceAvailable).toBe(true);
    expect(result.product).not.toBeNull();
    expect(result.verifiedToken).toBe("valid-token-123");
    expect(result.expired).toBe(false);
  });

  it("returns expired token when download has expired", async () => {
    const fakeProduct = {
      id: "prod-1",
      creator_id: "creator-1",
      store_id: "store-1",
      slug: "my-ebook",
      title: "My E-Book",
      description: "A great book",
      price: 50000,
      currency: "UGX",
      file_mime: "application/pdf",
      cover_path: null
    };

    const fakeStore = { id: "store-1", slug: "my-store", name: "My Store", status: "active" };
    const fakeCreator = { id: "creator-1", display_name: "Author Name" };

    const pastDate = new Date(Date.now() - 86400000).toISOString();
    const fakeDownload = {
      token: "expired-token",
      expires_at: pastDate,
      product_id: "prod-1"
    };

    const mockSingle = vi.fn()
      .mockResolvedValueOnce({ data: fakeProduct, error: null })
      .mockResolvedValueOnce({ data: fakeStore, error: null })
      .mockResolvedValueOnce({ data: fakeCreator, error: null });

    const mockSingleDownload = vi.fn().mockResolvedValue({ data: fakeDownload, error: null });
    const productChain = makeChain({ single: mockSingle });
    const downloadChain = makeChain({ single: mockSingleDownload });
    mockGetOptionalSupabaseAdminClient.mockReturnValue({
      from: vi.fn((table: string) => {
        if (table === "downloads") return downloadChain();
        return productChain();
      })
    });

    const result = await getDownloadPageState("my-ebook", "expired-token");
    expect(result.serviceAvailable).toBe(true);
    expect(result.product).not.toBeNull();
    expect(result.verifiedToken).toBeNull();
    expect(result.expired).toBe(true);
  });

  it("returns no verified token when download token not found", async () => {
    const fakeProduct = {
      id: "prod-1",
      creator_id: "creator-1",
      store_id: "store-1",
      slug: "my-ebook",
      title: "My E-Book",
      description: "A great book",
      price: 50000,
      currency: "UGX",
      file_mime: "application/pdf",
      cover_path: null
    };

    const fakeStore = { id: "store-1", slug: "my-store", name: "My Store", status: "active" };
    const fakeCreator = { id: "creator-1", display_name: "Author Name" };

    const mockSingle = vi.fn()
      .mockResolvedValueOnce({ data: fakeProduct, error: null })
      .mockResolvedValueOnce({ data: fakeStore, error: null })
      .mockResolvedValueOnce({ data: fakeCreator, error: null });

    const mockSingleDownload = vi.fn().mockResolvedValue({ data: null, error: null });
    const productChain = makeChain({ single: mockSingle });
    const downloadChain = makeChain({ single: mockSingleDownload });
    mockGetOptionalSupabaseAdminClient.mockReturnValue({
      from: vi.fn((table: string) => {
        if (table === "downloads") return downloadChain();
        return productChain();
      })
    });

    const result = await getDownloadPageState("my-ebook", "invalid-token");
    expect(result.serviceAvailable).toBe(true);
    expect(result.product).not.toBeNull();
    expect(result.verifiedToken).toBeNull();
    expect(result.expired).toBe(false);
  });
});
