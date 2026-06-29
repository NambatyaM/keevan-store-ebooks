import { describe, it, expect } from "vitest";
import {
  registerSchema,
  loginSchema,
  productSchema,
  checkoutSchema,
  withdrawalSchema,
  analyticsEventSchema,
  resetPasswordSchema,
  storeSchema,
  productUpdateSchema,
  paymentVerifySchema,
  withdrawalDecisionSchema
} from "@/lib/schemas";

describe("registerSchema", () => {
  const valid = {
    email: "test@example.com",
    password: "Password1",
    fullName: "Test User",
    storeHandle: "my-store"
  };

  it("accepts valid registration input", () => {
    expect(() => registerSchema.parse(valid)).not.toThrow();
  });

  it("rejects invalid email", () => {
    expect(() => registerSchema.parse({ ...valid, email: "notanemail" })).toThrow();
  });

  it("rejects short password", () => {
    expect(() => registerSchema.parse({ ...valid, password: "Aa1" })).toThrow();
  });

  it("rejects password without lowercase", () => {
    const result = registerSchema.safeParse({ ...valid, password: "PASSWORD1" });
    expect(result.success).toBe(false);
  });

  it("rejects password without uppercase", () => {
    const result = registerSchema.safeParse({ ...valid, password: "password1" });
    expect(result.success).toBe(false);
  });

  it("rejects password without number", () => {
    const result = registerSchema.safeParse({ ...valid, password: "Password" });
    expect(result.success).toBe(false);
  });

  it("rejects short fullName", () => {
    expect(() => registerSchema.parse({ ...valid, fullName: "A" })).toThrow();
  });

  it("rejects invalid storeHandle", () => {
    expect(() => registerSchema.parse({ ...valid, storeHandle: "UPPERCASE" })).toThrow();
    expect(() => registerSchema.parse({ ...valid, storeHandle: "" })).toThrow();
  });

  it("accepts storeHandle with hyphens", () => {
    expect(() => registerSchema.parse({ ...valid, storeHandle: "my-store-123" })).not.toThrow();
  });

  it("rejects missing required fields", () => {
    expect(() => registerSchema.parse({})).toThrow();
  });
});

describe("loginSchema", () => {
  const valid = { email: "test@example.com", password: "anypassword" };

  it("accepts valid login input", () => {
    expect(() => loginSchema.parse(valid)).not.toThrow();
  });

  it("rejects invalid email", () => {
    expect(() => loginSchema.parse({ ...valid, email: "bad" })).toThrow();
  });

  it("rejects empty password", () => {
    expect(() => loginSchema.parse({ ...valid, password: "" })).toThrow();
  });

  it("rejects missing fields", () => {
    expect(() => loginSchema.parse({})).toThrow();
  });
});

describe("resetPasswordSchema", () => {
  it("accepts valid email", () => {
    expect(() => resetPasswordSchema.parse({ email: "user@example.com" })).not.toThrow();
  });

  it("rejects invalid email", () => {
    expect(() => resetPasswordSchema.parse({ email: "" })).toThrow();
  });
});

describe("storeSchema", () => {
  const valid = { name: "My Store", slug: "my-store", description: "A great store" };

  it("accepts valid store input", () => {
    expect(() => storeSchema.parse(valid)).not.toThrow();
  });

  it("rejects short name", () => {
    expect(() => storeSchema.parse({ ...valid, name: "A" })).toThrow();
  });

  it("rejects invalid slug", () => {
    expect(() => storeSchema.parse({ ...valid, slug: "BAD SLUG" })).toThrow();
  });

  it("accepts optional description", () => {
    expect(() => storeSchema.parse({ name: "Store", slug: "store" })).not.toThrow();
  });

  it("rejects description exceeding 500 chars", () => {
    expect(() => storeSchema.parse({ ...valid, description: "x".repeat(501) })).toThrow();
  });
});

describe("productSchema", () => {
  const valid = {
    storeId: "550e8400-e29b-41d4-a716-446655440000",
    slug: "my-ebook",
    title: "Great E-Book",
    description: "This is a fantastic e-book about testing.",
    price: 50000,
    status: "published",
    filePath: "uploads/ebook.pdf",
    fileSize: 2 * 1024 * 1024,
    fileMime: "application/pdf"
  };

  it("accepts valid product input", () => {
    expect(() => productSchema.parse(valid)).not.toThrow();
  });

  it("rejects invalid UUID for storeId", () => {
    expect(() => productSchema.parse({ ...valid, storeId: "not-a-uuid" })).toThrow();
  });

  it("rejects slug with uppercase", () => {
    expect(() => productSchema.parse({ ...valid, slug: "My-Ebook" })).toThrow();
  });

  it("rejects short title", () => {
    expect(() => productSchema.parse({ ...valid, title: "A" })).toThrow();
  });

  it("rejects short description", () => {
    expect(() => productSchema.parse({ ...valid, description: "Short" })).toThrow();
  });

  it("rejects negative price", () => {
    expect(() => productSchema.parse({ ...valid, price: -100 })).toThrow();
  });

  it("rejects zero price", () => {
    expect(() => productSchema.parse({ ...valid, price: 0 })).toThrow();
  });

  it("defaults status to draft", () => {
    const { status, ...noStatus } = valid;
    const parsed = productSchema.parse(noStatus);
    expect(parsed.status).toBe("draft");
  });

  it("rejects invalid status", () => {
    expect(() => productSchema.parse({ ...valid, status: "deleted" })).toThrow();
  });

  it("rejects fileSize exceeding 4MB", () => {
    expect(() => productSchema.parse({ ...valid, fileSize: 5 * 1024 * 1024 + 1 })).toThrow();
  });

  it("rejects invalid fileMime", () => {
    expect(() => productSchema.parse({ ...valid, fileMime: "text/plain" })).toThrow();
  });

  it("accepts optional cover fields", () => {
    const withCover = {
      ...valid,
      coverPath: "covers/image.jpg",
      coverSize: 500 * 1024,
      coverMime: "image/jpeg" as const
    };
    expect(() => productSchema.parse(withCover)).not.toThrow();
  });

  it("rejects coverSize exceeding 2MB", () => {
    expect(() => productSchema.parse({
      ...valid,
      coverPath: "covers/image.jpg",
      coverSize: 3 * 1024 * 1024,
      coverMime: "image/jpeg"
    })).toThrow();
  });

  it("rejects invalid coverMime", () => {
    expect(() => productSchema.parse({
      ...valid,
      coverPath: "covers/image.gif",
      coverSize: 100,
      coverMime: "image/gif"
    })).toThrow();
  });
});

describe("productUpdateSchema", () => {
  const valid = {
    slug: "my-ebook",
    title: "Great E-Book",
    description: "This is a fantastic e-book about testing.",
    price: 50000,
    status: "published"
  };

  it("accepts valid update input without optional fields", () => {
    expect(() => productUpdateSchema.parse(valid)).not.toThrow();
  });

  it("accepts update with optional file fields", () => {
    expect(() => productUpdateSchema.parse({
      ...valid,
      filePath: "uploads/new.pdf",
      fileSize: 1 * 1024 * 1024,
      fileMime: "application/epub+zip"
    })).not.toThrow();
  });

  it("rejects fileSize exceeding 4MB in update", () => {
    expect(() => productUpdateSchema.parse({
      ...valid,
      fileSize: 10 * 1024 * 1024
    })).toThrow();
  });
});

describe("checkoutSchema", () => {
  const valid = {
    productId: "550e8400-e29b-41d4-a716-446655440000",
    buyerEmail: "buyer@example.com",
    buyerName: "John Doe"
  };

  it("accepts valid checkout input", () => {
    expect(() => checkoutSchema.parse(valid)).not.toThrow();
  });

  it("rejects invalid UUID", () => {
    expect(() => checkoutSchema.parse({ ...valid, productId: "bad" })).toThrow();
  });

  it("rejects invalid email", () => {
    expect(() => checkoutSchema.parse({ ...valid, buyerEmail: "bad" })).toThrow();
  });

  it("rejects short buyerName", () => {
    expect(() => checkoutSchema.parse({ ...valid, buyerName: "A" })).toThrow();
  });

  it("accepts optional phone", () => {
    expect(() => checkoutSchema.parse({ ...valid, phone: "+256700000000" })).not.toThrow();
  });
});

describe("paymentVerifySchema", () => {
  it("accepts valid input", () => {
    expect(() => paymentVerifySchema.parse({
      merchantReference: "REF-001",
      trackingId: "TRK-001"
    })).not.toThrow();
  });

  it("rejects empty merchantReference", () => {
    expect(() => paymentVerifySchema.parse({
      merchantReference: "",
      trackingId: "TRK-001"
    })).toThrow();
  });

  it("rejects empty trackingId", () => {
    expect(() => paymentVerifySchema.parse({
      merchantReference: "REF-001",
      trackingId: ""
    })).toThrow();
  });
});

describe("withdrawalSchema", () => {
  const valid = {
    amount: 100000,
    payoutMethod: "mobile_money",
    payoutDetails: { network: "MTN", number: "+256700000000" }
  };

  it("accepts valid withdrawal input", () => {
    expect(() => withdrawalSchema.parse(valid)).not.toThrow();
  });

  it("rejects zero amount", () => {
    expect(() => withdrawalSchema.parse({ ...valid, amount: 0 })).toThrow();
  });

  it("accepts amount at minimum boundary (1)", () => {
    expect(() => withdrawalSchema.parse({ ...valid, amount: 1 })).not.toThrow();
  });

  it("rejects amount with decimals", () => {
    const result = withdrawalSchema.safeParse({ ...valid, amount: 50000.5 });
    expect(result.success).toBe(false);
  });

  it("rejects short payoutMethod", () => {
    expect(() => withdrawalSchema.parse({ ...valid, payoutMethod: "A" })).toThrow();
  });

  it("defaults payoutDetails to empty object", () => {
    const { payoutDetails, ...withoutDetails } = valid;
    const parsed = withdrawalSchema.parse(withoutDetails);
    expect(parsed.payoutDetails).toEqual({});
  });
});

describe("withdrawalDecisionSchema", () => {
  it("accepts empty input", () => {
    expect(() => withdrawalDecisionSchema.parse({})).not.toThrow();
  });

  it("accepts notes", () => {
    expect(() => withdrawalDecisionSchema.parse({ notes: "Approved" })).not.toThrow();
  });

  it("rejects notes exceeding 1000 chars", () => {
    expect(() => withdrawalDecisionSchema.parse({ notes: "x".repeat(1001) })).toThrow();
  });
});

describe("analyticsEventSchema", () => {
  const valid = {
    storeId: "550e8400-e29b-41d4-a716-446655440000",
    productId: "550e8400-e29b-41d4-a716-446655440001",
    eventType: "purchase",
    source: "direct"
  };

  it("accepts valid analytics event", () => {
    expect(() => analyticsEventSchema.parse(valid)).not.toThrow();
  });

  it("rejects invalid eventType", () => {
    expect(() => analyticsEventSchema.parse({ ...valid, eventType: "click" })).toThrow();
  });

  it("accepts all valid event types", () => {
    for (const eventType of ["store_view", "product_view", "purchase", "download"]) {
      expect(() => analyticsEventSchema.parse({ ...valid, eventType })).not.toThrow();
    }
  });

  it("accepts optional fields", () => {
    expect(() => analyticsEventSchema.parse({ eventType: "store_view" })).not.toThrow();
  });

  it("defaults metadata to empty object", () => {
    const parsed = analyticsEventSchema.parse({ eventType: "store_view" });
    expect(parsed.metadata).toEqual({});
  });

  it("rejects source exceeding 200 chars", () => {
    expect(() => analyticsEventSchema.parse({ ...valid, source: "x".repeat(201) })).toThrow();
  });

  it("accepts string UUIDs for storeId and productId", () => {
    expect(() => analyticsEventSchema.parse({
      ...valid,
      storeId: "550e8400-e29b-41d4-a716-446655440000",
      productId: "550e8400-e29b-41d4-a716-446655440000"
    })).not.toThrow();
  });
});
