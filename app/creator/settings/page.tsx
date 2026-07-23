"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { DashboardShell } from "@/components/dashboard-shell";
import { useToast } from "@/components/ui/toast";
import { Modal } from "@/components/ui/modal";
import { cn } from "@/lib/utils";
import {
  User,
  Banknote,
  Shield,
  Bell,
  Store,
  Eye,
  Smartphone,
  Laptop,
  Copy,
  ExternalLink,
  Save,
  Check,
  Camera,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";

type Tab = "store" | "account" | "payout" | "security" | "notifications";

const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: "store", label: "My Store", icon: <Store size={16} /> },
  { id: "account", label: "Account", icon: <User size={16} /> },
  { id: "payout", label: "Payout Details", icon: <Banknote size={16} /> },
  { id: "security", label: "Security", icon: <Shield size={16} /> },
  { id: "notifications", label: "Notifications", icon: <Bell size={16} /> },
];

export default function CreatorSettingsPage() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<Tab>("account");
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [autoSaved, setAutoSaved] = useState(false);

  // Store fields
  const [storeName, setStoreName] = useState("");
  const [storeSlug, setStoreSlug] = useState("");
  const [storeTagline, setStoreTagline] = useState("");
  const [storeDescription, setStoreDescription] = useState("");
  const [storeCategory, setStoreCategory] = useState("E-books");
  const [avatarPath, setAvatarPath] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  // Account fields
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [bio, setBio] = useState("");
  const [phone, setPhone] = useState("");

  // Payout fields
  const [preferredMethod, setPreferredMethod] = useState("mtn");
  const [mtnNumber, setMtnNumber] = useState("");
  const [airtelNumber, setAirtelNumber] = useState("");
  const [bankName, setBankName] = useState("");
  const [bankAccount, setBankAccount] = useState("");
  const [accountName, setAccountName] = useState("");

  // Security
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Notifications
  const [notifSale, setNotifSale] = useState(true);
  const [notifWithdrawal, setNotifWithdrawal] = useState(true);
  const [notifRefund, setNotifRefund] = useState(true);
  const [notifWeekly, setNotifWeekly] = useState(true);
  const [notifUpdates, setNotifUpdates] = useState(false);

  const [previewMode, setPreviewMode] = useState<"desktop" | "mobile">("desktop");

  // Social links
  const [socialLinks, setSocialLinks] = useState<Record<string, string>>({});
  const socialPlatforms = ["Instagram", "Twitter/X", "Facebook", "TikTok", "Website"];

  // Extract tab from URL search params or hash
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const fromSearch = params.get("tab") as Tab | null;
    const fromHash = window.location.hash.replace("#", "") as Tab;
    const tab = fromSearch || fromHash;
    if (tab && tabs.some((t) => t.id === tab)) {
      setActiveTab(tab);
    }
  }, []);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => {
        if (d.profile) {
          const p = d.profile;
          setProfile(p);
          setDisplayName(p.display_name ?? "");
          setEmail(p.email ?? "");
          setBio(p.bio ?? "");
          setPhone(p.phone ?? "");
          setStoreName(p.store_name ?? "");
          setStoreSlug(p.store_slug ?? "");
          setStoreTagline(p.store_tagline ?? "");
          setStoreDescription(p.store_description ?? "");
          setStoreCategory(p.store_category ?? "E-books");
          setAvatarPath(p.avatar_path ?? null);
          setPreferredMethod(p.payout_method ?? "mtn");
          setMtnNumber(p.mtn_number ?? "");
          setAirtelNumber(p.airtel_number ?? "");
          setBankName(p.bank_name ?? "");
          setBankAccount(p.bank_account ?? "");
          setAccountName(p.account_name ?? "");
          setNotifSale(p.notif_sale ?? true);
          setNotifWithdrawal(p.notif_withdrawal ?? true);
          setNotifRefund(p.notif_refund ?? true);
          setNotifWeekly(p.notif_weekly ?? true);
          setNotifUpdates(p.notif_updates ?? false);
          setSocialLinks(p.social_links ?? {});
        }
      })
      .catch(() => toast("error", "Failed to load settings"))
      .finally(() => setLoading(false));
  }, [toast]);

  // Auto-save for store settings
  const autoSave = useCallback(async () => {
    if (!profile?.store_id) return;
    setAutoSaved(false);
    try {
      await fetch(`/api/stores/${profile.store_id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: storeName || undefined,
          slug: storeSlug || undefined,
          tagline: storeTagline || undefined,
          description: storeDescription || undefined,
          category: storeCategory || undefined,
          social_links: Object.keys(socialLinks).length > 0 ? socialLinks : undefined,
        }),
      });
      setAutoSaved(true);
    } catch {}
  }, [storeName, storeSlug, storeTagline, storeDescription, storeCategory, socialLinks, profile]);

  useEffect(() => {
    if (activeTab !== "store") return;
    const timer = setTimeout(autoSave, 3000);
    return () => clearTimeout(timer);
  }, [autoSave, activeTab]);

  const handleSaveAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (profile?.creator_id) {
        const res = await fetch(`/api/creators/${profile.creator_id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ display_name: displayName, bio, phone }),
        });
        if (!res.ok) throw new Error("Failed");
      }
      toast("success", "Account details saved successfully");
    } catch {
      toast("error", "Failed to save account details");
    } finally {
      setSaving(false);
    }
  };

  const handleSavePayout = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/auth/me", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({
        payout_method: preferredMethod,
        mtn_number: mtnNumber,
        airtel_number: airtelNumber,
        bank_name: bankName,
        bank_account: bankAccount,
        account_name: accountName,
      })});
      if (!res.ok) throw new Error("Failed");
      toast("success", "Payout details saved successfully");
    } catch {
      toast("error", "Failed to save payout details");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast("error", "Passwords do not match");
      return;
    }
    if (newPassword.length < 8) {
      toast("error", "Password must be at least 8 characters");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/auth/update-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error?.message || "Failed to update password");
      toast("success", "Password updated successfully");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      toast("error", err instanceof Error ? err.message : "Failed to update password");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveNotifications = async () => {
    try {
      await fetch("/api/auth/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          notif_sale: notifSale,
          notif_withdrawal: notifWithdrawal,
          notif_refund: notifRefund,
          notif_weekly: notifWeekly,
          notif_updates: notifUpdates,
        }),
      });
      toast("success", "Notification preferences saved");
    } catch {
      toast("error", "Failed to save preferences");
    }
  };

  const copyStoreLink = () => {
    if (storeSlug) {
      navigator.clipboard.writeText(`${window.location.origin}/store/${storeSlug}`);
      toast("success", "Store link copied!");
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !profile?.store_id) return;
    if (file.size > 2 * 1024 * 1024) {
      toast("error", "Avatar must be 2 MB or less.");
      return;
    }
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      toast("error", "Avatar must be a JPEG, PNG, or WebP image.");
      return;
    }
    setUploadingAvatar(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch(`/api/stores/${profile.store_id}/avatar`, {
        method: "POST",
        body: formData,
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data?.error?.message || "Failed to upload avatar");
      }
      const data = await res.json();
      setAvatarPath(data.avatarPath);
      toast("success", "Avatar uploaded successfully");
    } catch (err) {
      toast("error", err instanceof Error ? err.message : "Failed to upload avatar");
    } finally {
      setUploadingAvatar(false);
      if (avatarInputRef.current) avatarInputRef.current.value = "";
    }
  };

  const handleAvatarDelete = async () => {
    if (!profile?.store_id) return;
    setUploadingAvatar(true);
    try {
      const res = await fetch(`/api/stores/${profile.store_id}/avatar`, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to remove avatar");
      setAvatarPath(null);
      toast("success", "Avatar removed");
    } catch {
      toast("error", "Failed to remove avatar");
    } finally {
      setUploadingAvatar(false);
    }
  };

  if (loading) {
    return (
      <DashboardShell title="Settings" subtitle="Manage your account and store" role="creator">
        <div className="rounded-xl border border-border bg-surface-card p-8 text-center text-muted">
          <div className="skeleton mx-auto mb-4 h-8 w-48 rounded" />
          <div className="skeleton mx-auto h-4 w-64 rounded" />
        </div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell title="Settings" subtitle="Manage your account, store, and preferences" role="creator">
      {/* Tab bar */}
      <div className="mb-6 flex overflow-x-auto gap-1 rounded-xl border border-border bg-surface-card p-1 shadow-card">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold whitespace-nowrap transition",
              activeTab === tab.id
                ? "bg-brand-green text-white shadow-sm"
                : "text-muted hover:text-brand-black hover:bg-surface",
            )}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* STORE TAB */}
      {activeTab === "store" && (
        <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
          {/* Settings form */}
          <div className="space-y-5">
            <div className="rounded-xl border border-border bg-surface-card p-5 shadow-card">
              <h3 className="font-bold text-brand-black">Store Profile</h3>

              {/* Avatar upload */}
              <div className="mt-4 flex items-center gap-4">
                <div className="relative">
                  {(() => {
                    const avatarUrl = avatarPath
                      ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/avatars/${avatarPath}`
                      : null;
                    return avatarUrl ? (
                      <Image
                        src={avatarUrl}
                        alt={storeName || "Store avatar"}
                        width={80}
                        height={80}
                        className="h-20 w-20 rounded-xl object-cover"
                      />
                    ) : (
                      <div className="grid h-20 w-20 place-items-center rounded-xl bg-brand-green text-2xl font-bold text-white">
                        {(storeName || "S").charAt(0).toUpperCase()}
                      </div>
                    );
                  })()}
                  {uploadingAvatar && (
                    <div className="absolute inset-0 grid place-items-center rounded-xl bg-black/40">
                      <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    </div>
                  )}
                </div>
                <div>
                  <input
                    ref={avatarInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={handleAvatarUpload}
                  />
                  <button
                    type="button"
                    disabled={uploadingAvatar}
                    onClick={() => avatarInputRef.current?.click()}
                    className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-semibold text-brand-black transition hover:bg-surface disabled:opacity-50"
                  >
                    <Camera size={14} />
                    {avatarPath ? "Change photo" : "Upload photo"}
                  </button>
                  {avatarPath && (
                    <button
                      type="button"
                      disabled={uploadingAvatar}
                      onClick={handleAvatarDelete}
                      className="ml-2 inline-flex items-center gap-1 rounded-lg border border-border px-3 py-2 text-sm font-semibold text-red-500 transition hover:bg-red-50 disabled:opacity-50"
                    >
                      <Trash2 size={14} />
                      Remove
                    </button>
                  )}
                  <p className="mt-1 text-xs text-muted">JPEG, PNG, or WebP. Max 2 MB.</p>
                </div>
              </div>

              <div className="mt-4 space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-brand-black mb-1">Store Name</label>
                  <input
                    value={storeName}
                    onChange={(e) => setStoreName(e.target.value)}
                    className="w-full rounded-lg border border-border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green"
                    placeholder="My Digital Store"
                    maxLength={100}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-brand-black mb-1">Store URL</label>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 rounded-lg border border-border bg-surface px-4 py-2.5 text-sm text-muted">
                      keevanstore.in/store/{storeSlug || "your-slug"}
                    </div>
                    <button
                      onClick={copyStoreLink}
                      className="rounded-lg border border-border p-2.5 text-muted transition hover:bg-surface"
                    >
                      <Copy size={16} />
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-brand-black mb-1">Store Tagline</label>
                  <input
                    value={storeTagline}
                    onChange={(e) => setStoreTagline(e.target.value)}
                    className="w-full rounded-lg border border-border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green"
                    placeholder="Short description of your store"
                    maxLength={120}
                  />
                  <p className="mt-1 text-xs text-muted">{storeTagline.length}/120</p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-brand-black mb-1">Store Description</label>
                  <textarea
                    value={storeDescription}
                    onChange={(e) => setStoreDescription(e.target.value)}
                    className="w-full rounded-lg border border-border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green"
                    rows={3}
                    placeholder="Tell buyers about your store..."
                    maxLength={500}
                  />
                  <p className="mt-1 text-xs text-muted">{storeDescription.length}/500</p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-brand-black mb-1">Store Category</label>
                  <select
                    value={storeCategory}
                    onChange={(e) => setStoreCategory(e.target.value)}
                    className="w-full rounded-lg border border-border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green"
                  >
                    {["E-books", "Education", "Design", "Tech", "Health", "Business", "Other"].map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              {autoSaved && (
                <div className="mt-3 flex items-center gap-2 text-xs font-semibold text-success">
                  <Check size={14} /> Auto-saved
                </div>
              )}
            </div>

            {/* Social links */}
            <div className="rounded-xl border border-border bg-surface-card p-5 shadow-card">
              <h3 className="font-bold text-brand-black">Social Links (Optional)</h3>
              <div className="mt-4 space-y-3">
                {socialPlatforms.map((platform) => (
                  <div key={platform}>
                    <label className="block text-xs font-semibold text-muted mb-1">{platform}</label>
                    <input
                      type="url"
                      value={socialLinks[platform] ?? ""}
                      onChange={(e) => setSocialLinks((prev) => ({ ...prev, [platform]: e.target.value }))}
                      className="w-full rounded-lg border border-border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green"
                      placeholder={`https://${platform.toLowerCase().replace("/x", "").replace("/", "")}.com/...`}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Live preview */}
          <div className="rounded-xl border border-border bg-surface-card shadow-card overflow-hidden">
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <h3 className="font-bold text-brand-black">Store Preview</h3>
              <div className="flex items-center gap-1 rounded-lg border border-border p-0.5">
                <button
                  onClick={() => setPreviewMode("desktop")}
                  className={`rounded-md p-1.5 ${previewMode === "desktop" ? "bg-brand-green text-white" : "text-muted"}`}
                >
                  <Laptop size={14} />
                </button>
                <button
                  onClick={() => setPreviewMode("mobile")}
                  className={`rounded-md p-1.5 ${previewMode === "mobile" ? "bg-brand-green text-white" : "text-muted"}`}
                >
                  <Smartphone size={14} />
                </button>
              </div>
            </div>
            <div className={cn("p-6", previewMode === "mobile" ? "max-w-[375px] mx-auto" : "")}>
              {/* Simulated storefront preview */}
              <div className="rounded-xl border border-border overflow-hidden">
                <div className="h-32 bg-gradient-to-br from-brand-green/20 to-brand-green/5" />
                <div className="px-4 pb-4 -mt-8">
                  {(() => {
                    const previewAvatarUrl = avatarPath
                      ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/avatars/${avatarPath}`
                      : null;
                    return previewAvatarUrl ? (
                      <Image
                        src={previewAvatarUrl}
                        alt="Store avatar preview"
                        width={64}
                        height={64}
                        className="mx-auto h-16 w-16 rounded-full object-cover ring-4 ring-white"
                      />
                    ) : (
                      <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-brand-green text-2xl font-bold text-white ring-4 ring-white">
                        {(storeName || "S").charAt(0).toUpperCase()}
                      </div>
                    );
                  })()}
                  <h4 className="mt-2 text-center font-bold">{storeName || "Your Store Name"}</h4>
                  <p className="text-center text-xs text-muted">{storeTagline || "Your store tagline"}</p>
                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <div className="aspect-[4/3] rounded-lg bg-neutral-100" />
                    <div className="aspect-[4/3] rounded-lg bg-neutral-100" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ACCOUNT TAB */}
      {activeTab === "account" && (
        <form onSubmit={handleSaveAccount} className="max-w-2xl space-y-5">
          <div className="rounded-xl border border-border bg-surface-card p-5 shadow-card">
            <h3 className="font-bold text-brand-black">Account Details</h3>
            <div className="mt-4 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-brand-black mb-1">Full Name</label>
                <input
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full rounded-lg border border-border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-brand-black mb-1">Email</label>
                <div className="flex items-center gap-2">
                  <input
                    value={email}
                    readOnly
                    className="w-full rounded-lg border border-border bg-surface px-4 py-2.5 text-sm text-muted"
                  />
                  <span className="text-xs text-muted whitespace-nowrap">Contact support to change</span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-brand-black mb-1">Phone</label>
                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full rounded-lg border border-border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green"
                  placeholder="+256..."
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-brand-black mb-1">Bio</label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className="w-full rounded-lg border border-border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green"
                  rows={3}
                  placeholder="Tell customers about yourself"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={saving}
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-brand-green px-5 py-2.5 font-semibold text-white transition hover:bg-brand-green-deep disabled:opacity-50"
            >
              <Save size={16} />
              {saving ? "Saving..." : "Save Account Details"}
            </button>
          </div>
        </form>
      )}

      {/* PAYOUT TAB */}
      {activeTab === "payout" && (
        <form onSubmit={handleSavePayout} className="max-w-2xl space-y-5">
          <div className="rounded-xl border border-border bg-surface-card p-5 shadow-card">
            <h3 className="font-bold text-brand-black">Payout Details</h3>
            <p className="mt-1 text-xs text-muted">These details are used for withdrawal processing and reviewed by the admin team.</p>
            <div className="mt-4 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-brand-black mb-2">Preferred Payout Method</label>
                <div className="grid gap-2">
                  {[
                    { value: "mtn", label: "MTN Mobile Money" },
                    { value: "airtel", label: "Airtel Money" },
                    { value: "bank", label: "Bank Transfer" },
                  ].map((m) => (
                    <label key={m.value} className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 text-sm ${
                      preferredMethod === m.value ? "border-brand-green bg-brand-mist" : "border-border"
                    }`}>
                      <input type="radio" name="method" value={m.value} checked={preferredMethod === m.value}
                        onChange={(e) => setPreferredMethod(e.target.value)} className="accent-brand-green" />
                      {m.label}
                    </label>
                  ))}
                </div>
              </div>
              {preferredMethod === "mtn" && (
                <div>
                  <label className="block text-sm font-semibold text-brand-black mb-1">MTN Mobile Money Number</label>
                  <input value={mtnNumber} onChange={(e) => setMtnNumber(e.target.value)}
                    className="w-full rounded-lg border border-border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green"
                    placeholder="0772XXXXXX" />
                </div>
              )}
              {preferredMethod === "airtel" && (
                <div>
                  <label className="block text-sm font-semibold text-brand-black mb-1">Airtel Money Number</label>
                  <input value={airtelNumber} onChange={(e) => setAirtelNumber(e.target.value)}
                    className="w-full rounded-lg border border-border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green"
                    placeholder="0772XXXXXX" />
                </div>
              )}
              {preferredMethod === "bank" && (
                <>
                  <div>
                    <label className="block text-sm font-semibold text-brand-black mb-1">Bank Name</label>
                    <input value={bankName} onChange={(e) => setBankName(e.target.value)}
                      className="w-full rounded-lg border border-border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-brand-black mb-1">Account Name</label>
                    <input value={accountName} onChange={(e) => setAccountName(e.target.value)}
                      className="w-full rounded-lg border border-border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-brand-black mb-1">Account Number</label>
                    <input value={bankAccount} onChange={(e) => setBankAccount(e.target.value)}
                      className="w-full rounded-lg border border-border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green" />
                  </div>
                </>
              )}
            </div>
            <button type="submit" disabled={saving}
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-brand-green px-5 py-2.5 font-semibold text-white transition hover:bg-brand-green-deep disabled:opacity-50">
              <Save size={16} /> {saving ? "Saving..." : "Save Payout Details"}
            </button>
          </div>
        </form>
      )}

      {/* SECURITY TAB */}
      {activeTab === "security" && (
        <form onSubmit={handleUpdatePassword} className="max-w-md space-y-5">
          <div className="rounded-xl border border-border bg-surface-card p-5 shadow-card">
            <h3 className="font-bold text-brand-black">Change Password</h3>
            <div className="mt-4 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-brand-black mb-1">Current Password</label>
                <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full rounded-lg border border-border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green" required />
              </div>
              <div>
                <label className="block text-sm font-semibold text-brand-black mb-1">New Password</label>
                <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full rounded-lg border border-border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green" required minLength={8} />
              </div>
              <div>
                <label className="block text-sm font-semibold text-brand-black mb-1">Confirm New Password</label>
                <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full rounded-lg border border-border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green" required />
              </div>
              <div className="h-2 rounded-full bg-neutral-200 overflow-hidden">
                <div className={`h-full rounded-full transition-all ${
                  newPassword.length < 8 ? "w-1/3 bg-error" : newPassword.length < 12 ? "w-2/3 bg-warning" : "w-full bg-success"
                }`} />
              </div>
              <p className="text-xs text-muted">Password strength: {newPassword.length < 8 ? "Weak" : newPassword.length < 12 ? "Medium" : "Strong"}</p>
            </div>
            <button type="submit" disabled={saving}
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-brand-green px-5 py-2.5 font-semibold text-white transition hover:bg-brand-green-deep disabled:opacity-50">
              <Save size={16} /> {saving ? "Updating..." : "Update Password"}
            </button>
          </div>
        </form>
      )}

      {/* NOTIFICATIONS TAB */}
      {activeTab === "notifications" && (
        <div className="max-w-lg space-y-5">
          <div className="rounded-xl border border-border bg-surface-card p-5 shadow-card">
            <h3 className="font-bold text-brand-black">Email Notifications</h3>
            <div className="mt-4 space-y-4">
              {[
                { label: "When I make a sale", value: notifSale, set: setNotifSale },
                { label: "When a withdrawal is approved", value: notifWithdrawal, set: setNotifWithdrawal },
                { label: "When a refund is requested", value: notifRefund, set: setNotifRefund },
                { label: "Weekly earnings summary", value: notifWeekly, set: setNotifWeekly },
                { label: "Platform updates & announcements", value: notifUpdates, set: setNotifUpdates },
              ].map((n) => (
                <label key={n.label} className="flex items-center justify-between cursor-pointer">
                  <span className="text-sm text-brand-black">{n.label}</span>
                  <button
                    type="button"
                    onClick={() => n.set(!n.value)}
                    className={`relative h-6 w-11 rounded-full transition-colors ${n.value ? "bg-brand-green" : "bg-neutral-300"}`}
                  >
                    <span className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${n.value ? "translate-x-5" : ""}`} />
                  </button>
                </label>
              ))}
            </div>
            <button onClick={handleSaveNotifications}
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-brand-green px-5 py-2.5 font-semibold text-white transition hover:bg-brand-green-deep">
              <Save size={16} /> Save Preferences
            </button>
          </div>
        </div>
      )}
    </DashboardShell>
  );
}
