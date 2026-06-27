"use client";

import { useState } from "react";
import Link from "next/link";
import { createSupabaseBrowserClient } from "@/lib/auth";
import { SimplePage } from "@/components/simple-page";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const supabase = createSupabaseBrowserClient();
      const origin = window.location.origin;
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${origin}/update-password`
      });
      if (resetError) throw resetError;
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to send reset email.");
    } finally {
      setSubmitting(false);
    }
  }

  if (sent) {
    return (
      <SimplePage title="Check Your Email" eyebrow="Password reset">
        <p>If an account with that email exists, we have sent a password reset link.</p>
        <div className="mt-6">
          <Link href="/login" className="text-brand-green hover:underline">
            Return to login
          </Link>
        </div>
      </SimplePage>
    );
  }

  return (
    <SimplePage title="Reset Password" eyebrow="Forgot your password?">
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
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        <button
          className="focus-ring inline-flex min-h-11 items-center justify-center rounded-md bg-brand-green px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#006f43] disabled:cursor-not-allowed disabled:opacity-70"
          disabled={submitting}
          type="submit"
        >
          {submitting ? "Sending..." : "Send Reset Link"}
        </button>
        <p className="text-center text-sm text-neutral-600">
          <Link href="/login" className="text-brand-green hover:underline">
            Back to login
          </Link>
        </p>
      </form>
    </SimplePage>
  );
}
