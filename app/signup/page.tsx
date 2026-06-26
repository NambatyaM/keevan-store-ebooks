"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { login } from "@/lib/auth";
import { SimplePage } from "@/components/simple-page";

export default function SignupPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [storeHandle, setStoreHandle] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName, email, password, storeHandle })
      });

      const payload = await response.json();

      if (!response.ok) {
        setError(payload?.error?.message ?? "Unable to create account.");
        return;
      }

      await login(email, password);

      const res = await fetch("/api/auth/me");
      if (res.ok) {
        const { profile } = await res.json();
        router.push(profile?.role === "admin" ? "/admin/dashboard" : "/creator/dashboard");
      } else {
        router.push("/creator/dashboard");
      }
    } catch {
      setError("Unable to reach the registration service.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <SimplePage title="Create Your Creator Store" eyebrow="Start selling free">
      <form className="grid gap-4 rounded-lg border border-neutral-200 p-5" onSubmit={handleSubmit}>
        <label className="grid gap-2 text-sm font-medium text-neutral-700">
          Full name
          <input
            className="focus-ring rounded-md border border-neutral-300 px-4 py-3"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            autoComplete="name"
            required
          />
        </label>
        <label className="grid gap-2 text-sm font-medium text-neutral-700">
          Email address
          <input
            className="focus-ring rounded-md border border-neutral-300 px-4 py-3"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            required
          />
        </label>
        <label className="grid gap-2 text-sm font-medium text-neutral-700">
          Password
          <input
            className="focus-ring rounded-md border border-neutral-300 px-4 py-3"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
            minLength={8}
            required
          />
        </label>
        <label className="grid gap-2 text-sm font-medium text-neutral-700">
          Store handle
          <input
            className="focus-ring rounded-md border border-neutral-300 px-4 py-3"
            value={storeHandle}
            onChange={(e) => setStoreHandle(e.target.value)}
            placeholder="my-store-name"
            pattern="^[a-z0-9-]{3,64}$"
            required
          />
        </label>
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        <button
          className="focus-ring inline-flex min-h-11 items-center justify-center rounded-md bg-brand-green px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#006f43] disabled:cursor-not-allowed disabled:opacity-70"
          disabled={submitting}
          type="submit"
        >
          {submitting ? "Creating account..." : "Create Your Store"}
        </button>
        <p className="text-center text-sm text-neutral-600">
          Already have an account?{" "}
          <Link href="/login" className="text-brand-green hover:underline">
            Log in
          </Link>
        </p>
      </form>
    </SimplePage>
  );
}
