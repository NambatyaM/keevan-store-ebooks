"use client";

import { useState } from "react";
import Link from "next/link";
import { login } from "@/lib/auth";
import { SimplePage } from "@/components/simple-page";
import { PasswordInput } from "@/components/password-input";

export default function BuyerSignupPage() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/auth/register-buyer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName, email, password, phone: phone || undefined })
      });

      const payload = await response.json();

      if (!response.ok) {
        setError(payload?.error?.message ?? "Unable to create account.");
        return;
      }

      await login(email, password);
      window.location.href = "/buyer/dashboard";
    } catch {
      setError("Unable to reach the registration service.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <SimplePage title="Create Your Buyer Account" eyebrow="Welcome" minimalFooter>
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
          <PasswordInput
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
            minLength={8}
            required
          />
        </label>
        <label className="grid gap-2 text-sm font-medium text-neutral-700">
          Phone number (optional)
          <input
            className="focus-ring rounded-md border border-neutral-300 px-4 py-3"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            autoComplete="tel"
          />
        </label>
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        <button
          className="focus-ring inline-flex min-h-11 items-center justify-center rounded-md bg-brand-green px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#006f43] disabled:cursor-not-allowed disabled:opacity-70"
          disabled={submitting}
          type="submit"
        >
          {submitting ? "Creating account..." : "Create Account"}
        </button>
        <p className="text-center text-sm text-neutral-600">
          Already have an account?{" "}
          <Link href="/login?role=buyer" className="text-brand-green hover:underline">
            Log in
          </Link>
        </p>
        <p className="text-center text-sm text-neutral-600">
          Want to sell?{" "}
          <Link href="/signup" className="text-brand-green hover:underline">
            Create a creator store
          </Link>
        </p>
      </form>
    </SimplePage>
  );
}
