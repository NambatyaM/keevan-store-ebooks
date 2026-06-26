const MIME_EXTENSIONS: Record<string, string[]> = {
  "application/pdf": ["pdf"],
  "application/epub+zip": ["epub"],
  "application/x-mobipocket-ebook": ["mobi"],
  "application/zip": ["zip"],
  "image/jpeg": ["jpg", "jpeg"],
  "image/png": ["png"],
  "image/webp": ["webp"],
};

const ALLOWED_MIMES = new Set(Object.keys(MIME_EXTENSIONS));

function readBytes(buffer: ArrayBuffer, offset: number, length: number): Uint8Array {
  return new Uint8Array(buffer, offset, length);
}

function bytesMatch(buffer: ArrayBuffer, offset: number, expected: number[]): boolean {
  if (buffer.byteLength - offset < expected.length) return false;
  const view = new Uint8Array(buffer, offset, expected.length);
  for (let i = 0; i < expected.length; i++) {
    if (view[i] !== expected[i]) return false;
  }
  return true;
}

const MAGIC_PDF = [0x25, 0x50, 0x44, 0x46];
const MAGIC_ZIP = [0x50, 0x4b, 0x03, 0x04];
const MAGIC_JPEG = [0xff, 0xd8, 0xff];
const MAGIC_PNG = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
const MAGIC_RIFF = [0x52, 0x49, 0x46, 0x46];
const MAGIC_WEBP = [0x57, 0x45, 0x42, 0x50];

function containsBytes(buffer: ArrayBuffer, needle: number[], maxOffset: number): boolean {
  const view = new Uint8Array(buffer, 0, Math.min(maxOffset, buffer.byteLength));
  for (let i = 0; i <= view.length - needle.length; i++) {
    let match = true;
    for (let j = 0; j < needle.length; j++) {
      if (view[i + j] !== needle[j]) { match = false; break; }
    }
    if (match) return true;
  }
  return false;
}

type ValidationError =
  | "empty_file"
  | "unsupported_mime"
  | "invalid_extension"
  | "invalid_signature";

export type ValidationResult =
  | { ok: true; mime: string }
  | { ok: false; error: ValidationError; message: string };

export function validateMime(mime: string): mime is keyof typeof MIME_EXTENSIONS {
  return ALLOWED_MIMES.has(mime);
}

export function validateExtension(filename: string, mime: string): boolean {
  const allowedExts = MIME_EXTENSIONS[mime];
  if (!allowedExts) return false;
  const ext = filename.split(".").pop()?.toLowerCase() ?? "";
  return allowedExts.includes(ext);
}

export function validateFileSignature(buffer: ArrayBuffer, mime: string): boolean {
  if (buffer.byteLength === 0) return false;

  switch (mime) {
    case "application/pdf":
      return bytesMatch(buffer, 0, MAGIC_PDF);

    case "application/epub+zip":
    case "application/zip":
      return bytesMatch(buffer, 0, MAGIC_ZIP);

    case "application/x-mobipocket-ebook":
      if (bytesMatch(buffer, 0, MAGIC_ZIP)) return true;
      return containsBytes(buffer, [0x42, 0x4f, 0x4f, 0x4b, 0x4d, 0x4f, 0x42, 0x49], 512);

    case "image/jpeg":
      return bytesMatch(buffer, 0, MAGIC_JPEG);

    case "image/png":
      return bytesMatch(buffer, 0, MAGIC_PNG);

    case "image/webp":
      return bytesMatch(buffer, 0, MAGIC_RIFF) && bytesMatch(buffer, 8, MAGIC_WEBP);

    default:
      return false;
  }
}

export function validateUploadFile(
  file: { name: string; size: number; type: string; arrayBuffer: () => Promise<ArrayBuffer> }
): Promise<ValidationResult> {
  return validateUpload({ name: file.name, size: file.size, type: file.type, data: () => file.arrayBuffer() });
}

export async function validateUpload(input: {
  name: string;
  size: number;
  type: string;
  data: () => Promise<ArrayBuffer>;
}): Promise<ValidationResult> {
  if (input.size === 0) {
    return { ok: false, error: "empty_file", message: "File is empty." };
  }

  if (!validateMime(input.type)) {
    return { ok: false, error: "unsupported_mime", message: "Unsupported file type." };
  }

  if (!validateExtension(input.name, input.type)) {
    const allowed = MIME_EXTENSIONS[input.type].join(", ");
    return { ok: false, error: "invalid_extension", message: `File extension must be one of: ${allowed}.` };
  }

  const buffer = await input.data();

  if (!validateFileSignature(buffer, input.type)) {
    return { ok: false, error: "invalid_signature", message: "File content does not match the declared type." };
  }

  return { ok: true, mime: input.type };
}
