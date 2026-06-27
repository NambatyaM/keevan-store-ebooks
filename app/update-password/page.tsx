"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createSupabaseBrowserClient } from "@/lib/auth";
import { SimplePage } from "@/components/simple-page";
import { PasswordInput } from "@/components/password-input";

export default function UpdatePasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" && session) {
        setReady(true);
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      setSubmitting(false);
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      setSubmitting(false);
      return;
    }

    try {
      const supabase = createSupabaseBrowserClient();
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) throw updateError;
      setSuccess(true);
      setTimeout(() => router.push("/login"), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to update password.");
    } finally {
      setSubmitting(false);
    }
  }

  if (success) {
    return (
      <SimplePage title="Password Updated" eyebrow="Success">
        <p className="text-green-700">Your password has been updated successfully.</p>
        <div className="mt-6">
          <Link href="/login" className="text-brand-green hover:underline">
            Return to login
          </Link>
        </div>
      </SimplePage>
    );
  }

  if (!ready) {
    return (
      <SimplePage title="Set New Password" eyebrow="Password reset">
        <p className="text-neutral-600">
          If you followed the link from your email, your session is being verified. Please wait...
        </p>
        <p className="mt-2 text-sm text-neutral-500">
          No session detected.{" "}
          <Link href="/forgot-password" className="text-brand-green hover:underline">
            Request a new reset link
          </Link>
        </p>
      </SimplePage>
    );
  }

  return (
    <SimplePage title="Set New Password" eyebrow="Password reset">
      <form className="grid gap-4 rounded-lg border border-neutral-200 p-5" onSubmit={handleSubmit}>
        <label className="grid gap-2 text-sm font-medium text-neutral-700">
          New password
          <PasswordInput
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
            minLength={8}
            required
          />
        </label>
        <label className="grid gap-2 text-sm font-medium text-neutral-700">
          Confirm new password
          <PasswordInput
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            autoComplete="new-password"
            minLength={8}
            required
          />
        </label>
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        <button
          className="focus-ring inline-flex min-h-11 items-center justify-center rounded-md bg-brand-green px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#006f43] disabled:cursor-not-allowed disabled:opacity-70"
          disabled={submitting}
          type="submit"
        >
          {submitting ? "Updating..." : "Update Password"}
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
