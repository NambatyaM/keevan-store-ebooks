"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createSupabaseBrowserClient } from "@/lib/auth";
import { SimplePage } from "@/components/simple-page";
import { PasswordInput } from "@/components/password-input";

export default function UpdatePasswordForm() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setReady(true);
      else setError("Invalid or expired reset link. Please request a new password reset.");
    });
  }, []);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setSubmitting(true);
    try {
      const supabase = createSupabaseBrowserClient();
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) throw updateError;
      setSuccess(true);
      setTimeout(() => router.push("/login"), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update password.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <SimplePage title="Set New Password" eyebrow="Account" minimalFooter>
      {success ? (
        <div className="rounded-lg border border-green-200 bg-green-50 p-5">
          <p className="font-semibold text-green-800">Password updated successfully</p>
          <p className="mt-2 text-sm text-green-700">Redirecting you to login...</p>
        </div>
      ) : (
        <>
          <p>Enter your new password below.</p>
          {error && (
            <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-semibold text-red-700">{error}</div>
          )}
          <form onSubmit={handleSubmit} className="mt-6 grid gap-4">
            <div>
              <label htmlFor="password" className="text-sm font-semibold">New password</label>
              <PasswordInput id="password" value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
            <div>
              <label htmlFor="confirmPassword" className="text-sm font-semibold">Confirm new password</label>
              <PasswordInput id="confirmPassword" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
            </div>
            <button type="submit" disabled={submitting || !ready} className="rounded-lg bg-brand-green px-6 py-3 text-sm font-bold text-white transition hover:bg-[#005C34] disabled:opacity-50">
              {submitting ? "Updating..." : "Update Password"}
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
