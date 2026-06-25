import { ebookUpload, imageUpload } from "@/lib/constants";

export type UploadKind = "ebook" | "image";

export function validateUpload(file: Pick<File, "size" | "type">, kind: UploadKind) {
  const rules = kind === "ebook" ? ebookUpload : imageUpload;

  if (file.size > rules.maxBytes) {
    return {
      ok: false,
      message: `${kind === "ebook" ? "E-book" : "Image"} must be ${rules.maxBytes / 1024 / 1024} MB or less.`
    };
  }

  if (!rules.types.includes(file.type)) {
    return {
      ok: false,
      message: `Unsupported ${kind} file type.`
    };
  }

  return { ok: true, message: "Ready to upload." };
}
