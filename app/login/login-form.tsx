"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { login } from "@/lib/auth";
import { SimplePage } from "@/components/simple-page";
import { PasswordInput } from "@/components/password-input";

function LoginFormInner() {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const { user, session } = await login(email, password);
      if (user && session) {
        const redirectParam = searchParams.get("redirect");
        const target = redirectParam && /^\/(?!\/)/.test(redirectParam)
          ? redirectParam
          : (() => {
              const role = user.user_metadata?.role ?? "creator";
              return role === "admin" ? "/admin/dashboard"
                : role === "buyer" ? "/buyer/dashboard"
                : "/creator/dashboard";
            })();
        window.location.href = target;
      } else {
        throw new Error("Login failed");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid email or password");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <SimplePage title="Creator Login" eyebrow="Welcome back" minimalFooter>
      <p>
        Log in to manage your products, track sales, and access your earnings dashboard.
      </p>
      {error && (
        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700">{error}</div>
      )}
      <form onSubmit={handleSubmit} className="mt-6 grid gap-4">
        <div>
          <label htmlFor="email" className="text-sm font-semibold">Email address</label>
          <input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1 w-full rounded-lg border border-neutral-300 px-4 py-2.5 text-sm focus:border-brand-green focus:outline-none" />
        </div>
        <div>
          <label htmlFor="password" className="text-sm font-semibold">Password</label>
          <PasswordInput id="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        <button type="submit" disabled={submitting} className="rounded-lg bg-brand-green px-6 py-3 text-sm font-bold text-white transition hover:bg-[#005C34] disabled:opacity-50">
          {submitting ? "Logging in..." : "Log in"}
        </button>
        <p className="text-sm text-neutral-600">
          <Link href="/forgot-password" className="font-semibold text-brand-green">Forgot your password?</Link>
        </p>
        <p className="text-sm text-neutral-600">
          No account yet? <Link href="/signup" className="font-semibold text-brand-green">Create your free store</Link>
        </p>
      </form>
    </SimplePage>
  );
}

export default function LoginForm() {
  return (
    <Suspense fallback={
      <div className="mx-auto max-w-4xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="space-y-6">
          <div className="h-4 w-32 animate-pulse rounded bg-neutral-200" />
          <div className="h-10 w-64 animate-pulse rounded bg-neutral-200" />
          <div className="h-4 w-96 animate-pulse rounded bg-neutral-200" />
          <div className="h-12 w-full animate-pulse rounded bg-neutral-200" />
          <div className="h-12 w-full animate-pulse rounded bg-neutral-200" />
          <div className="h-12 w-36 animate-pulse rounded bg-neutral-200" />
        </div>
      </div>
    }>
      <LoginFormInner />
    </Suspense>
  );
}
