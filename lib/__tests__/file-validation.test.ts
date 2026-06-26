import { describe, it, expect } from "vitest";
import { validateMime, validateExtension, validateFileSignature, validateUploadFile } from "@/lib/file-validation";

function makeBuffer(...bytes: number[]): ArrayBuffer {
  return new Uint8Array(bytes).buffer;
}

function makePdfBuffer(): ArrayBuffer {
  return makeBuffer(0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x34);
}

function makeZipBuffer(): ArrayBuffer {
  return makeBuffer(0x50, 0x4b, 0x03, 0x04, 0x00, 0x00, 0x00, 0x00);
}

function makeJpegBuffer(): ArrayBuffer {
  return makeBuffer(0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10);
}

function makePngBuffer(): ArrayBuffer {
  return makeBuffer(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d);
}

function makeWebpBuffer(): ArrayBuffer {
  const riff = makeBuffer(0x52, 0x49, 0x46, 0x46);
  const size = makeBuffer(0x00, 0x00, 0x00, 0x00);
  const webp = makeBuffer(0x57, 0x45, 0x42, 0x50);
  const combined = new Uint8Array(riff.byteLength + size.byteLength + webp.byteLength);
  combined.set(new Uint8Array(riff), 0);
  combined.set(new Uint8Array(size), riff.byteLength);
  combined.set(new Uint8Array(webp), riff.byteLength + size.byteLength);
  return combined.buffer;
}

function makeMobiBuffer(): ArrayBuffer {
  return makeBuffer(0x42, 0x4f, 0x4f, 0x4b, 0x4d, 0x4f, 0x42, 0x49);
}

describe("validateMime", () => {
  it("accepts valid PDF MIME", () => {
    expect(validateMime("application/pdf")).toBe(true);
  });

  it("accepts valid EPUB MIME", () => {
    expect(validateMime("application/epub+zip")).toBe(true);
  });

  it("accepts valid MOBI MIME", () => {
    expect(validateMime("application/x-mobipocket-ebook")).toBe(true);
  });

  it("accepts valid ZIP MIME", () => {
    expect(validateMime("application/zip")).toBe(true);
  });

  it("accepts valid JPEG MIME", () => {
    expect(validateMime("image/jpeg")).toBe(true);
  });

  it("accepts valid PNG MIME", () => {
    expect(validateMime("image/png")).toBe(true);
  });

  it("accepts valid WebP MIME", () => {
    expect(validateMime("image/webp")).toBe(true);
  });

  it("rejects unsupported MIME types", () => {
    expect(validateMime("text/plain")).toBe(false);
    expect(validateMime("application/json")).toBe(false);
    expect(validateMime("image/gif")).toBe(false);
    expect(validateMime("")).toBe(false);
  });
});

describe("validateExtension", () => {
  it("validates PDF with .pdf extension", () => {
    expect(validateExtension("book.pdf", "application/pdf")).toBe(true);
  });

  it("validates EPUB with .epub extension", () => {
    expect(validateExtension("book.epub", "application/epub+zip")).toBe(true);
  });

  it("validates MOBI with .mobi extension", () => {
    expect(validateExtension("book.mobi", "application/x-mobipocket-ebook")).toBe(true);
  });

  it("validates ZIP with .zip extension", () => {
    expect(validateExtension("archive.zip", "application/zip")).toBe(true);
  });

  it("validates JPEG with .jpg and .jpeg extensions", () => {
    expect(validateExtension("photo.jpg", "image/jpeg")).toBe(true);
    expect(validateExtension("photo.jpeg", "image/jpeg")).toBe(true);
  });

  it("validates PNG with .png extension", () => {
    expect(validateExtension("image.png", "image/png")).toBe(true);
  });

  it("validates WebP with .webp extension", () => {
    expect(validateExtension("image.webp", "image/webp")).toBe(true);
  });

  it("rejects mismatched extension", () => {
    expect(validateExtension("book.pdf", "application/zip")).toBe(false);
  });

  it("rejects unknown MIME", () => {
    expect(validateExtension("file.txt", "text/plain")).toBe(false);
  });

  it("rejects file with no extension", () => {
    expect(validateExtension("README", "application/pdf")).toBe(false);
  });

  it("handles uppercase extension", () => {
    expect(validateExtension("BOOK.PDF", "application/pdf")).toBe(true);
  });

  it("handles multiple dots", () => {
    expect(validateExtension("my.book.final.pdf", "application/pdf")).toBe(true);
  });
});

describe("validateFileSignature", () => {
  it("validates PDF signature", () => {
    expect(validateFileSignature(makePdfBuffer(), "application/pdf")).toBe(true);
  });

  it("rejects non-PDF content for PDF MIME", () => {
    expect(validateFileSignature(makePngBuffer(), "application/pdf")).toBe(false);
  });

  it("validates ZIP signature", () => {
    expect(validateFileSignature(makeZipBuffer(), "application/zip")).toBe(true);
  });

  it("validates EPUB signature (uses ZIP magic)", () => {
    expect(validateFileSignature(makeZipBuffer(), "application/epub+zip")).toBe(true);
  });

  it("validates MOBI signature as ZIP (PalmDoc variant)", () => {
    expect(validateFileSignature(makeZipBuffer(), "application/x-mobipocket-ebook")).toBe(true);
  });

  it("validates MOBI signature via BOOKMOBI marker", () => {
    expect(validateFileSignature(makeMobiBuffer(), "application/x-mobipocket-ebook")).toBe(true);
  });

  it("rejects non-MOBI content for MOBI MIME", () => {
    expect(validateFileSignature(makePdfBuffer(), "application/x-mobipocket-ebook")).toBe(false);
  });

  it("validates JPEG signature", () => {
    expect(validateFileSignature(makeJpegBuffer(), "image/jpeg")).toBe(true);
  });

  it("rejects non-JPEG content for JPEG MIME", () => {
    expect(validateFileSignature(makePngBuffer(), "image/jpeg")).toBe(false);
  });

  it("validates PNG signature", () => {
    expect(validateFileSignature(makePngBuffer(), "image/png")).toBe(true);
  });

  it("rejects non-PNG content for PNG MIME", () => {
    expect(validateFileSignature(makeJpegBuffer(), "image/png")).toBe(false);
  });

  it("validates WebP signature (RIFF + WEBP)", () => {
    expect(validateFileSignature(makeWebpBuffer(), "image/webp")).toBe(true);
  });

  it("rejects non-WebP content for WebP MIME", () => {
    expect(validateFileSignature(makePngBuffer(), "image/webp")).toBe(false);
  });

  it("rejects empty buffer", () => {
    expect(validateFileSignature(new ArrayBuffer(0), "application/pdf")).toBe(false);
  });

  it("returns false for unknown MIME", () => {
    expect(validateFileSignature(makePdfBuffer(), "text/plain")).toBe(false);
  });
});

describe("validateUploadFile", () => {
  it("rejects empty file", async () => {
    const result = await validateUploadFile({
      name: "empty.pdf",
      size: 0,
      type: "application/pdf",
      arrayBuffer: async () => new ArrayBuffer(0)
    });
    expect(result).toEqual({ ok: false, error: "empty_file", message: "File is empty." });
  });

  it("rejects unsupported MIME type", async () => {
    const result = await validateUploadFile({
      name: "script.exe",
      size: 100,
      type: "application/x-msdownload",
      arrayBuffer: async () => new ArrayBuffer(100)
    });
    expect(result).toEqual({ ok: false, error: "unsupported_mime", message: "Unsupported file type." });
  });

  it("rejects mismatched extension", async () => {
    const result = await validateUploadFile({
      name: "book.png",
      size: 100,
      type: "application/pdf",
      arrayBuffer: async () => makePdfBuffer()
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBe("invalid_extension");
      expect(result.message).toContain("pdf");
    }
  });

  it("rejects content that does not match declared type", async () => {
    const result = await validateUploadFile({
      name: "fake.pdf",
      size: 100,
      type: "application/pdf",
      arrayBuffer: async () => makePngBuffer()
    });
    expect(result).toEqual({ ok: false, error: "invalid_signature", message: "File content does not match the declared type." });
  });

  it("accepts a valid PDF file", async () => {
    const result = await validateUploadFile({
      name: "doc.pdf",
      size: 1000,
      type: "application/pdf",
      arrayBuffer: async () => makePdfBuffer()
    });
    expect(result).toEqual({ ok: true, mime: "application/pdf" });
  });

  it("accepts a valid PNG image", async () => {
    const result = await validateUploadFile({
      name: "cover.png",
      size: 2000,
      type: "image/png",
      arrayBuffer: async () => makePngBuffer()
    });
    expect(result).toEqual({ ok: true, mime: "image/png" });
  });

  it("accepts a valid WebP image", async () => {
    const result = await validateUploadFile({
      name: "image.webp",
      size: 1500,
      type: "image/webp",
      arrayBuffer: async () => makeWebpBuffer()
    });
    expect(result).toEqual({ ok: true, mime: "image/webp" });
  });

  it("accepts a valid JPEG image", async () => {
    const result = await validateUploadFile({
      name: "photo.jpg",
      size: 800,
      type: "image/jpeg",
      arrayBuffer: async () => makeJpegBuffer()
    });
    expect(result).toEqual({ ok: true, mime: "image/jpeg" });
  });

  it("rejects empty file before checking MIME", async () => {
    const result = await validateUploadFile({
      name: "",
      size: 0,
      type: "",
      arrayBuffer: async () => new ArrayBuffer(0)
    });
    expect(result?.ok).toBe(false);
  });
});
