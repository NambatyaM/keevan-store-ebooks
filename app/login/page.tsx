"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { login } from "@/lib/auth";
import { SimplePage } from "@/components/simple-page";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      await login(email, password);

      const redirect = new URL(window.location.href).searchParams.get("redirect");
      if (redirect?.startsWith("/")) {
        router.push(redirect);
        return;
      }

      const res = await fetch("/api/auth/me");
      if (res.ok) {
        const { profile } = await res.json();
        router.push(profile?.role === "admin" ? "/admin/dashboard" : "/creator/dashboard");
      } else {
        router.push("/creator/dashboard");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to log in.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <SimplePage title="Creator Login" eyebrow="Welcome back">
      <form className="grid gap-4 rounded-lg border border-neutral-200 p-5" onSubmit={handleSubmit}>
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
            autoComplete="current-password"
            required
          />
        </label>
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        <button
          className="focus-ring inline-flex min-h-11 items-center justify-center rounded-md bg-brand-green px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#006f43] disabled:cursor-not-allowed disabled:opacity-70"
          disabled={submitting}
          type="submit"
        >
          {submitting ? "Logging in..." : "Login"}
        </button>
        <p className="text-center text-sm text-neutral-600">
          <Link href="/forgot-password" className="text-brand-green hover:underline">
            Forgot password?
          </Link>
        </p>
        <p className="text-center text-sm text-neutral-600">
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="text-brand-green hover:underline">
            Sign up
          </Link>
        </p>
      </form>
    </SimplePage>
  );
}
