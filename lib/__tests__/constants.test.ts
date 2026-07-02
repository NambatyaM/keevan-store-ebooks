import { describe, it, expect } from "vitest";
import { formatUgx, calculateSaleSplit, site, ebookUpload, imageUpload, currencyPhoneRegex, minimumWithdrawalByCurrency } from "@/lib/constants";

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

  it("platformFee + creatorEarnings always equals grossAmount (lossless)", () => {
    // Exhaustive check over a range of amounts to ensure integer math holds
    for (const amount of [1, 99, 100, 999, 9999, 54321, 1_000_000, 99_999_999]) {
      const r = calculateSaleSplit(amount);
      expect(r.platformFee + r.creatorEarnings).toBe(r.grossAmount);
      expect(Number.isInteger(r.platformFee)).toBe(true);
      expect(Number.isInteger(r.creatorEarnings)).toBe(true);
    }
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

describe("currencyPhoneRegex", () => {
  // Uganda (UGX) — +256 or 0, then 9 digits
  describe("UGX", () => {
    it("accepts +256 format", () => expect(currencyPhoneRegex.UGX.test("+256772123456")).toBe(true));
    it("accepts 0 format", () => expect(currencyPhoneRegex.UGX.test("0772123456")).toBe(true));
    it("rejects wrong country code", () => expect(currencyPhoneRegex.UGX.test("+254772123456")).toBe(false));
    it("rejects too few digits", () => expect(currencyPhoneRegex.UGX.test("+25677212345")).toBe(false));
    it("rejects too many digits", () => expect(currencyPhoneRegex.UGX.test("+2567721234567")).toBe(false));
    it("rejects bare digits without prefix", () => expect(currencyPhoneRegex.UGX.test("772123456")).toBe(false));
  });

  // Kenya (KES) — +254 or 0, then 9 digits
  describe("KES", () => {
    it("accepts +254 format", () => expect(currencyPhoneRegex.KES.test("+254712345678")).toBe(true));
    it("accepts 0 format", () => expect(currencyPhoneRegex.KES.test("0712345678")).toBe(true));
    it("rejects wrong country code", () => expect(currencyPhoneRegex.KES.test("+256712345678")).toBe(false));
    it("rejects too few digits", () => expect(currencyPhoneRegex.KES.test("+25471234567")).toBe(false));
  });

  // Tanzania (TZS) — +255 or 0, then 9 digits
  describe("TZS", () => {
    it("accepts +255 format", () => expect(currencyPhoneRegex.TZS.test("+255754123456")).toBe(true));
    it("accepts 0 format", () => expect(currencyPhoneRegex.TZS.test("0754123456")).toBe(true));
    it("rejects wrong country code", () => expect(currencyPhoneRegex.TZS.test("+254754123456")).toBe(false));
  });

  // Rwanda (RWF) — +250 or 0, then 9 digits
  describe("RWF", () => {
    it("accepts +250 format", () => expect(currencyPhoneRegex.RWF.test("+250788123456")).toBe(true));
    it("accepts 0 format", () => expect(currencyPhoneRegex.RWF.test("0788123456")).toBe(true));
    it("rejects wrong country code", () => expect(currencyPhoneRegex.RWF.test("+256788123456")).toBe(false));
  });

  // USA (USD) — +1XXXXXXXXXX, 1XXXXXXXXXX, or XXXXXXXXXX (exactly 10 significant digits)
  describe("USD", () => {
    it("accepts 10-digit NANP number", () => expect(currencyPhoneRegex.USD.test("2125551234")).toBe(true));
    it("accepts +1 prefix", () => expect(currencyPhoneRegex.USD.test("+12125551234")).toBe(true));
    it("accepts 1 prefix without +", () => expect(currencyPhoneRegex.USD.test("12125551234")).toBe(true));
    it("rejects 7-digit number (too short)", () => expect(currencyPhoneRegex.USD.test("2125551")).toBe(false));
    it("rejects 9-digit number", () => expect(currencyPhoneRegex.USD.test("212555123")).toBe(false));
    it("rejects 11-digit number without country code", () => expect(currencyPhoneRegex.USD.test("21255512345")).toBe(false));
    it("rejects letters", () => expect(currencyPhoneRegex.USD.test("212555ABCD")).toBe(false));
  });
});

describe("minimumWithdrawalByCurrency", () => {
  it("UGX minimum is 50000", () => expect(minimumWithdrawalByCurrency.UGX).toBe(50000));
  it("KES minimum is 1500", () => expect(minimumWithdrawalByCurrency.KES).toBe(1500));
  it("TZS minimum is 30000", () => expect(minimumWithdrawalByCurrency.TZS).toBe(30000));
  it("RWF minimum is 20000", () => expect(minimumWithdrawalByCurrency.RWF).toBe(20000));
  it("USD minimum is 20", () => expect(minimumWithdrawalByCurrency.USD).toBe(20));
  it("all minimums are positive integers", () => {
    for (const val of Object.values(minimumWithdrawalByCurrency)) {
      expect(val).toBeGreaterThan(0);
      expect(Number.isInteger(val)).toBe(true);
    }
  });
});
