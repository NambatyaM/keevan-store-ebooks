import { describe, it, expect } from "vitest";
import { formatUgx, calculateSaleSplit, site, ebookUpload, imageUpload } from "@/lib/constants";

describe("formatUgx", () => {
  it("formats zero", () => {
    const result = formatUgx(0);
    expect(result).toContain("0");
    expect(result).toMatch(/UGX|USh/);
  });

  it("formats whole number without decimals", () => {
    const result = formatUgx(50000);
    expect(result).toContain("50,000");
    expect(result).not.toContain(".");
  });

  it("formats large amounts with commas", () => {
    const result = formatUgx(1000000);
    expect(result).toContain("1,000,000");
  });

  it("formats small amounts correctly", () => {
    const result = formatUgx(100);
    expect(result).toContain("100");
  });

  it("rounds decimal amounts to nearest integer", () => {
    const result = formatUgx(50000.75);
    expect(result).not.toContain(".");
  });

  it("includes UGX currency symbol or code", () => {
    const result = formatUgx(1000);
    expect(result).toMatch(/UGX|USh/);
  });
});

describe("calculateSaleSplit", () => {
  it("calculates platform fee as 10% of gross", () => {
    const result = calculateSaleSplit(100000);
    expect(result.platformFee).toBe(10000);
    expect(result.creatorEarnings).toBe(90000);
    expect(result.grossAmount).toBe(100000);
  });

  it("rounds platform fee to integer", () => {
    const result = calculateSaleSplit(9999);
    expect(Number.isInteger(result.platformFee)).toBe(true);
    expect(result.creatorEarnings).toBe(9999 - result.platformFee);
  });

  it("handles zero gross amount", () => {
    const result = calculateSaleSplit(0);
    expect(result.platformFee).toBe(0);
    expect(result.creatorEarnings).toBe(0);
  });

  it("handles large amounts", () => {
    const result = calculateSaleSplit(10_000_000);
    expect(result.platformFee).toBe(1_000_000);
    expect(result.creatorEarnings).toBe(9_000_000);
  });

  it("ensures gross = platformFee + creatorEarnings", () => {
    const result = calculateSaleSplit(54321);
    expect(result.platformFee + result.creatorEarnings).toBe(result.grossAmount);
  });

  it("handles 1 UGX", () => {
    const result = calculateSaleSplit(1);
    expect(result.platformFee).toBe(0);
    expect(result.creatorEarnings).toBe(1);
  });
});

describe("site constants", () => {
  it("has a name", () => {
    expect(site.name).toBe("Keevan Store");
  });

  it("has a currency set to UGX", () => {
    expect(site.currency).toBe("UGX");
  });

  it("has commission rate of 0.1", () => {
    expect(site.commissionRate).toBe(0.1);
  });

  it("has minimum withdrawal of 50000", () => {
    expect(site.minimumWithdrawal).toBe(50000);
  });

  it("has a support phone", () => {
    expect(site.supportPhone).toBe("+256768345905");
  });

  it("has a WhatsApp link", () => {
    expect(site.supportWhatsApp).toContain("wa.me/256768345905");
  });
});

describe("ebookUpload constants", () => {
  it("has maxBytes of 4MB", () => {
    expect(ebookUpload.maxBytes).toBe(4 * 1024 * 1024);
  });

  it("includes PDF, EPUB, MOBI, ZIP types", () => {
    expect(ebookUpload.types).toContain("application/pdf");
    expect(ebookUpload.types).toContain("application/epub+zip");
    expect(ebookUpload.types).toContain("application/x-mobipocket-ebook");
    expect(ebookUpload.types).toContain("application/zip");
  });
});

describe("imageUpload constants", () => {
  it("has maxBytes of 2MB", () => {
    expect(imageUpload.maxBytes).toBe(2 * 1024 * 1024);
  });

  it("includes JPEG, PNG, WebP types", () => {
    expect(imageUpload.types).toContain("image/jpeg");
    expect(imageUpload.types).toContain("image/png");
    expect(imageUpload.types).toContain("image/webp");
  });
});
