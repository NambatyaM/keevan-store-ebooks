"use client";

import { useEffect, useState } from "react";
import { DashboardShell } from "@/components/dashboard-shell";
import { creatorNav } from "@/app/creator/nav";

export default function CreatorSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Creator fields
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [phone, setPhone] = useState("");

  // Store fields
  const [storeName, setStoreName] = useState("");
  const [storeSlug, setStoreSlug] = useState("");
  const [storeDescription, setStoreDescription] = useState("");

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => {
        if (d.profile) {
          const p = d.profile as any;
          setDisplayName(p.display_name ?? "");
          setBio(p.bio ?? "");
          setPhone(p.phone ?? "");
          setStoreName(p.store_name ?? "");
          setStoreSlug(p.store_slug ?? "");
          setStoreDescription(p.store_description ?? "");
        }
      })
      .catch((err) => { console.error("Failed to load settings:", err); setError("Failed to load settings."); })
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");
    setSaving(true);

    try {
      const res = await fetch("/api/auth/me");
      const d = await res.json();
      const p = d.profile as any;
      const storeId = p.store_id;
      const creatorId = p.creator_id;

      const ops: Promise<Response>[] = [];

      if (creatorId && (displayName || bio || phone)) {
        ops.push(
          fetch(`/api/creators/${creatorId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              ...(displayName && { display_name: displayName }),
              ...(bio && { bio }),
              ...(phone && { phone })
            })
          })
        );
      }

      if (storeId && (storeName || storeSlug || storeDescription)) {
        ops.push(
          fetch(`/api/stores/${storeId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              ...(storeName && { name: storeName }),
              ...(storeSlug && { slug: storeSlug }),
              ...(storeDescription && { description: storeDescription })
            })
          })
        );
      }

      if (ops.length === 0) {
        setMessage("No changes to save.");
        setSaving(false);
        return;
      }

      const results = await Promise.all(ops);
      const allOk = results.every((r) => r.ok);
      setMessage(allOk ? "Settings saved successfully!" : "Some changes failed to save.");
    } catch {
      setMessage("Network error.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <DashboardShell title="Settings" subtitle="Manage profile, store handle, support details, and payout information." nav={creatorNav}>
        <div className="rounded-lg border border-dashed border-neutral-300 bg-white p-8 text-center text-neutral-600">Loading...</div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell title="Settings" subtitle="Manage profile, store handle, support details, and payout information." nav={creatorNav}>
      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700">{error}</div>
      )}
      <form onSubmit={handleSave} className="space-y-8">
        <div className="rounded-lg border border-neutral-200 bg-white p-5">
          <h2 className="text-xl font-bold">Creator Profile</h2>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <div>
              <label className="block text-sm font-semibold text-neutral-700">Display Name</label>
              <input
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="focus-ring mt-1 w-full rounded-md border border-neutral-300 px-4 py-3"
                placeholder="Your display name"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-neutral-700">Phone</label>
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="focus-ring mt-1 w-full rounded-md border border-neutral-300 px-4 py-3"
                placeholder="+256..."
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-neutral-700">Bio</label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="focus-ring mt-1 w-full rounded-md border border-neutral-300 px-4 py-3"
                rows={3}
                placeholder="Tell customers about yourself"
              />
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-neutral-200 bg-white p-5">
          <h2 className="text-xl font-bold">Store Settings</h2>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <div>
              <label className="block text-sm font-semibold text-neutral-700">Store Name</label>
              <input
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                className="focus-ring mt-1 w-full rounded-md border border-neutral-300 px-4 py-3"
                placeholder="My Store"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-neutral-700">Store Handle</label>
              <input
                value={storeSlug}
                onChange={(e) => setStoreSlug(e.target.value)}
                className="focus-ring mt-1 w-full rounded-md border border-neutral-300 px-4 py-3"
                placeholder="my-store"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-neutral-700">Description</label>
              <textarea
                value={storeDescription}
                onChange={(e) => setStoreDescription(e.target.value)}
                className="focus-ring mt-1 w-full rounded-md border border-neutral-300 px-4 py-3"
                rows={3}
                placeholder="Describe your store"
              />
            </div>
          </div>
        </div>

        {message && (
          <p className={`text-sm font-semibold ${message.includes("successfully") ? "text-green-700" : "text-red-700"}`}>{message}</p>
        )}

        <button
          type="submit"
          disabled={saving}
          className="rounded-md bg-brand-green px-6 py-3 font-bold text-white hover:bg-brand-green/90 disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save Settings"}
        </button>
      </form>
    </DashboardShell>
  );
}
