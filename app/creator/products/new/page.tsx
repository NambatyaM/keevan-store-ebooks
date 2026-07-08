"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { DashboardShell } from "@/components/dashboard-shell";
import { creatorNav } from "@/app/creator/nav";

export default function NewProductPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState<string | null>(null);

  const [storeId, setStoreId] = useState("");
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [status, setStatus] = useState<"draft" | "published" | "disabled">("draft");

  const [filePath, setFilePath] = useState("");
  const [fileSize, setFileSize] = useState(0);
  const [fileMime, setFileMime] = useState("");
  const [uploadingFile, setUploadingFile] = useState(false);
  const [fileName, setFileName] = useState("");

  const [coverPath, setCoverPath] = useState("");
  const [coverSize, setCoverSize] = useState(0);
  const [coverMime, setCoverMime] = useState("");
  const [uploadingCover, setUploadingCover] = useState(false);
  const [coverName, setCoverName] = useState("");

  useEffect(() => {
    fetch("/api/auth/me").then((r) => r.json()).then((d) => {
      if (d.profile?.store_id) setStoreId(d.profile.store_id);
    }).catch((err) => { console.error("Failed to fetch store ID:", err); setError("Failed to load your profile. Please try refreshing."); });
  }, []);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>, kind: "ebook" | "image") => {
    const file = e.target.files?.[0];
    if (!file) return;

    const maxBytes = kind === "ebook" ? 4 * 1024 * 1024 : 2 * 1024 * 1024;
    if (file.size > maxBytes) {
      const maxMB = maxBytes / 1024 / 1024;
      setMessage(`${kind === "ebook" ? "Product file" : "Cover image"} exceeds the ${maxMB} MB limit. Please choose a smaller file.`);
      e.target.value = "";
      return;
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("kind", kind);

    if (kind === "ebook") setUploadingFile(true);
    else setUploadingCover(true);
    setMessage("");

    try {
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) { setMessage(data.error?.message ?? "Upload failed."); return; }
      if (kind === "ebook") {
        setFilePath(data.path); setFileSize(data.size); setFileMime(data.mime); setFileName(data.originalName);
      } else {
        setCoverPath(data.path); setCoverSize(data.size); setCoverMime(data.mime); setCoverName(data.originalName);
      }
    } catch (err) {
      const msg = err instanceof TypeError ? "Connection lost during upload. The file may be too large or your connection may be unstable." : "Upload failed. Please try again.";
      setMessage(msg);
      console.error("Upload error:", err);
    }
    finally {
      if (kind === "ebook") setUploadingFile(false);
      else setUploadingCover(false);
    }
  };

  const generateSlug = (t: string) =>
    t.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 96);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");
    const numPrice = Number(price);
    if (isNaN(numPrice) || numPrice <= 0) { setMessage("Enter a valid price (must be greater than 0)."); return; }
    if (!filePath) { setMessage("Upload the product file first."); return; }
    if (!slug || slug.length < 3) { setMessage("Slug must be at least 3 characters."); return; }

    setLoading(true);
    try {
      if (!storeId) { setMessage("Store not found. Complete your profile first."); setLoading(false); return; }
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          storeId,
          slug,
          title,
          description,
          price: numPrice,
          status,
          filePath,
          fileSize,
          fileMime,
          ...(coverPath ? { coverPath, coverSize, coverMime } : {})
        })
      });
      const data = await res.json();
      if (!res.ok) {
        const err = data.error;
        if (err?.details?.fieldErrors) {
          const msgs = Object.entries(err.details.fieldErrors).map(([field, msgs]) => `${field}: ${(msgs as string[]).join(", ")}`);
          setMessage(msgs.join("; "));
        } else {
          setMessage(err?.message ?? "Creation failed.");
        }
      } else { router.push("/creator/products"); }
    } catch (err) {
      const msg = err instanceof TypeError ? "Connection lost. Please check your internet and try again." : "An unexpected error occurred. Please try again.";
      setMessage(msg);
      console.error("Product creation error:", err);
    }
    finally { setLoading(false); }
  };

  return (
      <DashboardShell title="New Product" subtitle="Upload files, set pricing, and publish your digital product." role="creator">
      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700">{error}</div>
      )}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="rounded-lg border border-neutral-200 bg-white p-5">
          <h2 className="text-xl font-bold">Product Details</h2>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <div>
              <label className="block text-sm font-semibold text-neutral-700">Title</label>
              <input value={title} onChange={(e) => { setTitle(e.target.value); if (!slug || slug === generateSlug(slug)) setSlug(generateSlug(e.target.value)); }} className="focus-ring mt-1 w-full rounded-md border border-neutral-300 px-4 py-3" placeholder="My E-book" required />
            </div>
            <div>
              <label className="block text-sm font-semibold text-neutral-700">Slug</label>
              <input value={slug} onChange={(e) => setSlug(generateSlug(e.target.value))} className="focus-ring mt-1 w-full rounded-md border border-neutral-300 px-4 py-3 font-mono text-sm" placeholder="my-ebook" required />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-neutral-700">Description</label>
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} className="focus-ring mt-1 w-full rounded-md border border-neutral-300 px-4 py-3" rows={4} placeholder="Describe your product" required />
            </div>
            <div>
              <label className="block text-sm font-semibold text-neutral-700">Price (UGX)</label>
              <input type="number" min="1" value={price} onChange={(e) => setPrice(e.target.value)} className="focus-ring mt-1 w-full rounded-md border border-neutral-300 px-4 py-3" placeholder="25000" required />
            </div>
            <div>
              <label className="block text-sm font-semibold text-neutral-700">Status</label>
              <select value={status} onChange={(e) => setStatus(e.target.value as typeof status)} className="focus-ring mt-1 w-full rounded-md border border-neutral-300 px-4 py-3">
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="disabled">Disabled</option>
              </select>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-neutral-200 bg-white p-5">
          <h2 className="text-xl font-bold">Product File</h2>
          <p className="mt-1 text-sm text-neutral-600">PDF, EPUB, MOBI, or ZIP — max 4 MB</p>
          <div className="mt-4">
            <input type="file" accept=".pdf,.epub,.mobi,.zip,application/pdf,application/epub+zip,application/x-mobipocket-ebook,application/zip" onChange={(e) => handleUpload(e, "ebook")} className="block w-full text-sm file:mr-4 file:rounded file:border-0 file:bg-brand-green file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-brand-green/90" />
            {uploadingFile && <p className="mt-2 text-sm text-neutral-500">Uploading...</p>}
            {fileName && !uploadingFile && <p className="mt-2 text-sm text-green-700">Uploaded: {fileName}</p>}
          </div>
        </div>

        <div className="rounded-lg border border-neutral-200 bg-white p-5">
          <h2 className="text-xl font-bold">Cover Image (optional)</h2>
          <p className="mt-1 text-sm text-neutral-600">JPEG, PNG, or WebP — max 2 MB</p>
          <div className="mt-4">
            <input type="file" accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp" onChange={(e) => handleUpload(e, "image")} className="block w-full text-sm file:mr-4 file:rounded file:border-0 file:bg-brand-green file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-brand-green/90" />
            {uploadingCover && <p className="mt-2 text-sm text-neutral-500">Uploading...</p>}
            {coverName && !uploadingCover && <p className="mt-2 text-sm text-green-700">Uploaded: {coverName}</p>}
          </div>
        </div>

        {message && <p className={`text-sm font-semibold ${message.includes("successfully") ? "text-green-700" : "text-red-700"}`}>{message}</p>}

        <button type="submit" disabled={loading} className="rounded-md bg-brand-green px-6 py-3 font-bold text-white hover:bg-brand-green/90 disabled:opacity-50">
          {loading ? "Creating..." : "Create Product"}
        </button>
      </form>
    </DashboardShell>
  );
}
