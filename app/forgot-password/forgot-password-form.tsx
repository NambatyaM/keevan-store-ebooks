"use client";

import { useState } from "react";
import Link from "next/link";
import { createSupabaseBrowserClient } from "@/lib/auth";
import { SimplePage } from "@/components/simple-page";

export default function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      const supabase = createSupabaseBrowserClient();
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/update-password`,
      });
      if (resetError) throw resetError;
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <SimplePage title="Reset Your Password" eyebrow="Account">
      {sent ? (
        <div className="rounded-lg border border-green-200 bg-green-50 p-5">
          <p className="font-semibold text-green-800">Check your email</p>
          <p className="mt-2 text-sm text-green-700">If an account exists with that email, you will receive password reset instructions.</p>
        </div>
      ) : (
        <>
          <p>Enter the email address associated with your creator account and we will send you reset instructions.</p>
          {error && (
            <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700">{error}</div>
          )}
          <form onSubmit={handleSubmit} className="mt-6 grid gap-4">
            <div>
              <label htmlFor="email" className="text-sm font-semibold">Email address</label>
              <input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1 w-full rounded-lg border border-neutral-300 px-4 py-2.5 text-sm focus:border-brand-green focus:outline-none" />
            </div>
            <button type="submit" disabled={submitting} className="rounded-lg bg-brand-green px-6 py-3 text-sm font-bold text-white transition hover:bg-[#005C34] disabled:opacity-50">
              {submitting ? "Sending..." : "Send Reset Instructions"}
            </button>
            <p className="text-sm text-neutral-600">
              <Link href="/login" className="font-semibold text-brand-green">Back to login</Link>
            </p>
          </form>
        </>
      )}
    </SimplePage>
  );
}
