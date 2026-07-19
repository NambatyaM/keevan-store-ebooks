"use client";

import { useMemo, useState, useEffect, useRef } from "react";
import Link from "next/link";
import { SimplePage } from "@/components/simple-page";
import { PasswordInput } from "@/components/password-input";
import { Check, X, AlertTriangle, Store, Banknote, Download, ShieldCheck, Loader2, BookOpen } from "lucide-react";

const passwordChecks = (pw: string) => ({
  length: pw.length >= 8,
  upper: /[A-Z]/.test(pw),
  lower: /[a-z]/.test(pw),
  number: /[0-9]/.test(pw),
});

function strengthLabel(checks: ReturnType<typeof passwordChecks>): { label: string; color: string; width: string } {
  const passed = [checks.length, checks.upper, checks.lower, checks.number].filter(Boolean).length;
  if (passed === 0) return { label: "", color: "bg-neutral-200", width: "0%" };
  if (passed <= 2) return { label: "Weak", color: "bg-red-500", width: "25%" };
  if (passed === 3) return { label: "Medium", color: "bg-amber-500", width: "50%" };
  if (passed === 4) return { label: "Strong", color: "bg-green-500", width: "100%" };
  return { label: "", color: "bg-neutral-200", width: "0%" };
}

export default function SignupForm() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [storeHandle, setStoreHandle] = useState("");
  const [handleAvailable, setHandleAvailable] = useState<boolean | null>(null);
  const [checkingHandle, setCheckingHandle] = useState(false);
  const [currency, setCurrency] = useState("UGX");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const checkTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const checks = useMemo(() => passwordChecks(password), [password]);
  const strength = useMemo(() => strengthLabel(checks), [checks]);
  const passwordsMatch = password === confirmPassword;
  const canSubmit = checks.length && checks.upper && checks.lower && checks.number && passwordsMatch && !submitting;

  const benefits = [
    { icon: Store, text: "Branded store URL live in 10 minutes" },
    { icon: Banknote, text: "Keep 90% of every sale" },
    { icon: Download, text: "Instant file delivery to buyers" },
    { icon: ShieldCheck, text: "Withdraw to MTN or Airtel Money" },
  ];

  useEffect(() => {
    if (checkTimeout.current) clearTimeout(checkTimeout.current);

    const handle = storeHandle.trim();
    if (handle.length < 3) {
      setHandleAvailable(null);
      setCheckingHandle(false);
      return;
    }

    setCheckingHandle(true);
    setHandleAvailable(null);

    checkTimeout.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/auth/check-handle?handle=${encodeURIComponent(handle)}`);
        const data = await res.json();
        setHandleAvailable(data.available);
      } catch {
        setHandleAvailable(null);
      } finally {
        setCheckingHandle(false);
      }
    }, 400);

    return () => {
      if (checkTimeout.current) clearTimeout(checkTimeout.current);
    };
  }, [storeHandle]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSubmit) return;
    setError(null);
    setSubmitting(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName, email, password, storeHandle, currency }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(typeof data.error === "string" ? data.error : data.error?.message || data.message || "Registration failed");

      const loginRes = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (!loginRes.ok) {
        const loginBody = await loginRes.json().catch(() => ({}));
        throw new Error(typeof loginBody.error === "string" ? loginBody.error : loginBody.error?.message || "Auto-login failed. Please log in manually.");
      }
      window.location.href = "/creator/dashboard";
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  const form = (
    <>
      <p>No credit card required. Your store is live the moment you sign up.</p>
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
          {password && (
            <div className="mt-2">
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-neutral-200">
                <div className={`h-full ${strength.color} transition-all`} style={{ width: strength.width }} />
              </div>
              {strength.label && <p className="mt-1 text-xs font-semibold text-neutral-600">{strength.label}</p>}
              <ul className="mt-1.5 space-y-1 text-xs">
                {[
                  { key: "length", label: "At least 8 characters" },
                  { key: "upper", label: "One uppercase letter" },
                  { key: "lower", label: "One lowercase letter" },
                  { key: "number", label: "One number" },
                ].map(({ key, label }) => (
                  <li key={key} className={`flex items-center gap-1.5 ${checks[key as keyof typeof checks] ? "text-green-600" : "text-neutral-400"}`}>
                    {checks[key as keyof typeof checks] ? <Check size={13} /> : <X size={13} />}
                    {label}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
        <div>
          <label htmlFor="confirmPassword" className="text-sm font-semibold">Confirm password</label>
          <PasswordInput id="confirmPassword" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
          {confirmPassword && (
            <p className={`mt-1 flex items-center gap-1 text-xs ${passwordsMatch ? "text-green-600" : "text-red-500"}`}>
              {passwordsMatch ? <Check size={13} /> : <X size={13} />}
              {passwordsMatch ? "Passwords match" : "Passwords do not match"}
            </p>
          )}
        </div>
        <div>
          <label htmlFor="storeHandle" className="text-sm font-semibold">Store URL handle</label>
          <div className="mt-1 flex items-center rounded-lg border border-neutral-300 px-4 py-2.5 text-sm focus-within:border-brand-green">
            <span className="text-neutral-500">keevanstore.in/store/</span>
            <input id="storeHandle" type="text" required value={storeHandle} onChange={(e) => setStoreHandle(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))} className="ml-1 flex-1 border-none p-0 focus:outline-none" placeholder="your-store" />
          </div>
          {storeHandle && (
            <p className="mt-1 text-xs text-neutral-500">
              Your store will be at: <span className="font-mono font-semibold text-brand-green">keevanstore.in/store/{storeHandle}</span>
            </p>
          )}
          {checkingHandle && (
            <p className="mt-1 flex items-center gap-1 text-xs text-neutral-500">
              <Loader2 size={13} className="animate-spin" />
              Checking availability...
            </p>
          )}
          {!checkingHandle && handleAvailable === true && (
            <p className="mt-1 flex items-center gap-1 text-xs text-green-600">
              <Check size={13} />
              This handle is available!
            </p>
          )}
          {!checkingHandle && handleAvailable === false && (
            <p className="mt-1 flex items-center gap-1 text-xs text-red-500">
              <X size={13} />
              This handle is already taken. Please choose a different one.
            </p>
          )}
          <p className="mt-1 text-xs text-neutral-500">Lowercase letters, numbers, and hyphens only. Must be unique.</p>
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
          <div className="mt-2 flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800">
            <AlertTriangle size={15} className="mt-0.5 shrink-0" />
            <p>Currency cannot be changed after your first paid order. Choose carefully — this determines your payout currency and minimum withdrawal threshold.</p>
          </div>
        </div>
        <button type="submit" disabled={!canSubmit} className="rounded-lg bg-brand-green px-6 py-3 text-sm font-bold text-white transition hover:bg-[#005C34] disabled:opacity-50">
          {submitting ? "Creating your store..." : "Create Your Free Store"}
        </button>
        <p className="text-sm text-neutral-600">
          Already have an account? <Link href="/login" className="font-semibold text-brand-green">Log in</Link>
        </p>
      </form>
    </>
  );

  return (
    <SimplePage title="Create Your Free Creator Store" eyebrow="Get started" minimalFooter>
      <div className="grid gap-8 md:grid-cols-[1fr_280px]">
        <div>{form}</div>
        <div className="hidden md:block">
          <div className="sticky top-24 rounded-lg border border-neutral-200 bg-neutral-50 p-5">
            <p className="mb-4 text-sm font-bold uppercase tracking-wide text-brand-green">What you get</p>
            <ul className="space-y-4">
              {benefits.map(({ icon: Icon, text }) => (
                <li key={text} className="flex items-start gap-3 text-sm">
                  <Icon size={18} className="mt-0.5 shrink-0 text-brand-green" />
                  <span>{text}</span>
                </li>
              ))}
            </ul>
            <hr className="my-4 border-neutral-200" />
            <p className="text-xs text-neutral-500">No monthly fees · Pay only 10% per sale</p>
            <div className="mt-4 rounded-lg border border-brand-green/30 bg-brand-mist p-4">
              <div className="flex items-start gap-2">
                <BookOpen size={16} className="mt-0.5 shrink-0 text-brand-green" />
                <div>
                  <p className="text-xs font-bold text-brand-black">New to selling digital products?</p>
                  <p className="mt-1 text-xs text-neutral-600">Learn how to create, price, and market your products — using free AI tools.</p>
                  <Link href="/guide" className="mt-2 inline-block text-xs font-semibold text-brand-green hover:underline">
                    Read the free guide &rarr;
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </SimplePage>
  );
}
