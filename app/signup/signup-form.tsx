"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { login } from "@/lib/auth";
import { SimplePage } from "@/components/simple-page";
import { PasswordInput } from "@/components/password-input";

export default function SignupForm() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [storeHandle, setStoreHandle] = useState("");
  const [currency, setCurrency] = useState("UGX");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName, email, password, storeHandle, currency }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || data.message || "Registration failed");

      const { user, session } = await login(email, password);
      if (user && session) {
        router.push("/creator/dashboard");
      } else {
        throw new Error("Auto-login failed. Please log in manually.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <SimplePage title="Create Your Free Creator Store" eyebrow="Get started">
      <p>
        No credit card required. Your store is live the moment you sign up.
      </p>
      {error && (
        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700">{error}</div>
      )}
      <form onSubmit={handleSubmit} className="mt-6 grid gap-4">
        <div>
          <label htmlFor="fullName" className="text-sm font-semibold">Full name</label>
          <input id="fullName" type="text" required value={fullName} onChange={(e) => setFullName(e.target.value)} className="mt-1 w-full rounded-lg border border-neutral-300 px-4 py-2.5 text-sm focus:border-brand-green focus:outline-none" />
        </div>
        <div>
          <label htmlFor="email" className="text-sm font-semibold">Email address</label>
          <input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1 w-full rounded-lg border border-neutral-300 px-4 py-2.5 text-sm focus:border-brand-green focus:outline-none" />
        </div>
        <div>
          <label htmlFor="password" className="text-sm font-semibold">Password</label>
          <PasswordInput id="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          <p className="mt-1 text-xs text-neutral-500">At least 8 characters with uppercase, lowercase, and a number.</p>
        </div>
        <div>
          <label htmlFor="storeHandle" className="text-sm font-semibold">Store URL handle</label>
          <div className="mt-1 flex items-center rounded-lg border border-neutral-300 px-4 py-2.5 text-sm focus-within:border-brand-green">
            <span className="text-neutral-500">keevanstore.in/store/</span>
            <input id="storeHandle" type="text" required value={storeHandle} onChange={(e) => setStoreHandle(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))} className="ml-1 flex-1 border-none p-0 focus:outline-none" placeholder="your-store" />
          </div>
          <p className="mt-1 text-xs text-neutral-500">Lowercase letters, numbers, and hyphens only.</p>
        </div>
        <div>
          <label htmlFor="currency" className="text-sm font-semibold">Store currency</label>
          <select id="currency" value={currency} onChange={(e) => setCurrency(e.target.value)} className="mt-1 w-full rounded-lg border border-neutral-300 px-4 py-2.5 text-sm focus:border-brand-green focus:outline-none">
            <option value="UGX">UGX — Uganda Shilling</option>
            <option value="KES">KES — Kenyan Shilling</option>
            <option value="TZS">TZS — Tanzanian Shilling</option>
            <option value="RWF">RWF — Rwandan Franc</option>
            <option value="USD">USD — US Dollar</option>
          </select>
          <p className="mt-1 text-xs text-neutral-500">Currency cannot be changed after your first paid order.</p>
        </div>
        <button type="submit" disabled={submitting} className="rounded-lg bg-brand-green px-6 py-3 text-sm font-bold text-white transition hover:bg-[#005C34] disabled:opacity-50">
          {submitting ? "Creating your store..." : "Create Your Free Store"}
        </button>
        <p className="text-sm text-neutral-600">
          Already have an account? <Link href="/login" className="font-semibold text-brand-green">Log in</Link>
        </p>
      </form>
    </SimplePage>
  );
}
