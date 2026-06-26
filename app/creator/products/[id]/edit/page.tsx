"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { DashboardShell } from "@/components/dashboard-shell";
import { creatorNav } from "@/app/creator/nav";

export default function EditProductPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState<string | null>(null);

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

  const [newFileUploaded, setNewFileUploaded] = useState(false);
  const [newCoverUploaded, setNewCoverUploaded] = useState(false);

  useEffect(() => {
    fetch(`/api/products/${params.id}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.product) {
          const p = d.product;
          setTitle(p.title ?? "");
          setSlug(p.slug ?? "");
          setDescription(p.description ?? "");
          setPrice(String(p.price ?? ""));
          setStatus(p.status ?? "draft");
          setFilePath(p.file_path ?? "");
          setFileSize(p.file_size ?? 0);
          setFileMime(p.file_mime ?? "");
          setCoverPath(p.cover_path ?? "");
          setCoverSize(p.cover_size ?? 0);
          setCoverMime(p.cover_mime ?? "");
        }
      })
      .catch((err) => { console.error("Failed to load product:", err); setError("Failed to load product."); })
      .finally(() => setLoading(false));
  }, [params.id]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>, kind: "ebook" | "image") => {
    const file = e.target.files?.[0];
    if (!file) return;

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
        setNewFileUploaded(true);
      } else {
        setCoverPath(data.path); setCoverSize(data.size); setCoverMime(data.mime); setCoverName(data.originalName);
        setNewCoverUploaded(true);
      }
    } catch { setMessage("Network error during upload."); }
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
    if (isNaN(numPrice) || numPrice < 0) { setMessage("Enter a valid price (0 or more)."); return; }
    if (!slug) { setMessage("Enter a slug."); return; }

    setSaving(true);
    try {
      const res = await fetch(`/api/products/${params.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug,
          title,
          description,
          price: numPrice,
          status,
          ...(newFileUploaded ? { filePath, fileSize, fileMime } : {}),
          ...(newCoverUploaded ? { coverPath, coverSize, coverMime } : {})
        })
      });
      const data = await res.json();
      if (!res.ok) { setMessage(data.error?.message ?? "Save failed."); }
      else { router.push("/creator/products"); }
    } catch { setMessage("Network error."); }
    finally { setSaving(false); }
  };

  if (loading) {
    return (
      <DashboardShell title="Edit Product" subtitle="" nav={creatorNav}>
        <div className="rounded-lg border border-dashed border-neutral-300 bg-white p-8 text-center text-neutral-600">Loading...</div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell title="Edit Product" subtitle="Update product details, pricing, status, or replace files." nav={creatorNav}>
      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700">{error}</div>
      )}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="rounded-lg border border-neutral-200 bg-white p-5">
          <h2 className="text-xl font-bold">Product Details</h2>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <div>
              <label className="block text-sm font-semibold text-neutral-700">Title</label>
              <input value={title} onChange={(e) => { setTitle(e.target.value); if (!slug || slug === generateSlug(slug)) setSlug(generateSlug(e.target.value)); }} className="focus-ring mt-1 w-full rounded-md border border-neutral-300 px-4 py-3" required />
            </div>
            <div>
              <label className="block text-sm font-semibold text-neutral-700">Slug</label>
              <input value={slug} onChange={(e) => setSlug(generateSlug(e.target.value))} className="focus-ring mt-1 w-full rounded-md border border-neutral-300 px-4 py-3 font-mono text-sm" required />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-neutral-700">Description</label>
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} className="focus-ring mt-1 w-full rounded-md border border-neutral-300 px-4 py-3" rows={4} required />
            </div>
            <div>
              <label className="block text-sm font-semibold text-neutral-700">Price (UGX)</label>
              <input type="number" min="0" value={price} onChange={(e) => setPrice(e.target.value)} className="focus-ring mt-1 w-full rounded-md border border-neutral-300 px-4 py-3" required />
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
          <p className="mt-1 text-sm text-neutral-600">Current: {filePath ? filePath.split("/").pop() : "None"} — upload a new file to replace it.</p>
          <div className="mt-4">
            <input type="file" accept=".pdf,.epub,.mobi,.zip,application/pdf,application/epub+zip,application/x-mobipocket-ebook,application/zip" onChange={(e) => handleUpload(e, "ebook")} className="block w-full text-sm file:mr-4 file:rounded file:border-0 file:bg-brand-green file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-brand-green/90" />
            {uploadingFile && <p className="mt-2 text-sm text-neutral-500">Uploading...</p>}
            {fileName && !uploadingFile && <p className="mt-2 text-sm text-green-700">Uploaded: {fileName}</p>}
          </div>
        </div>

        <div className="rounded-lg border border-neutral-200 bg-white p-5">
          <h2 className="text-xl font-bold">Cover Image</h2>
          <p className="mt-1 text-sm text-neutral-600">{coverPath ? `Current: ${coverPath.split("/").pop()}` : "No cover image set."}</p>
          <div className="mt-4">
            <input type="file" accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp" onChange={(e) => handleUpload(e, "image")} className="block w-full text-sm file:mr-4 file:rounded file:border-0 file:bg-brand-green file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-brand-green/90" />
            {uploadingCover && <p className="mt-2 text-sm text-neutral-500">Uploading...</p>}
            {coverName && !uploadingCover && <p className="mt-2 text-sm text-green-700">Uploaded: {coverName}</p>}
          </div>
        </div>

        {message && <p className={`text-sm font-semibold ${message.includes("successfully") ? "text-green-700" : "text-red-700"}`}>{message}</p>}

        <button type="submit" disabled={saving} className="rounded-md bg-brand-green px-6 py-3 font-bold text-white hover:bg-brand-green/90 disabled:opacity-50">
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </form>
    </DashboardShell>
  );
}
