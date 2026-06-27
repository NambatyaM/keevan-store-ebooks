"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ButtonLink } from "@/components/button";

export function SiteHeaderAuth() {
  const [role, setRole] = useState<string | null>(null);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => { if (d.profile?.role) setRole(d.profile.role); })
      .catch((err) => console.error("Failed to fetch user role in header:", err))
      .finally(() => setChecked(true));
  }, []);

  if (!checked) {
    return (
      <div className="hidden items-center gap-3 md:flex">
        <div className="h-10 w-20 animate-pulse rounded bg-neutral-200" />
        <div className="h-10 w-36 animate-pulse rounded bg-neutral-200" />
      </div>
    );
  }

  if (role) {
    const href = role === "admin" ? "/admin/dashboard"
      : role === "buyer" ? "/buyer/dashboard"
      : "/creator/dashboard";
    return (
      <div className="hidden items-center gap-3 md:flex">
        <ButtonLink href={href} variant="secondary" className="min-h-10 px-4 py-2">
          Dashboard
        </ButtonLink>
      </div>
    );
  }

  return (
    <div className="hidden items-center gap-3 md:flex">
      <ButtonLink href="/login" variant="secondary" className="min-h-10 px-4 py-2">
        Login
      </ButtonLink>
      <ButtonLink href="/signup-buyer" variant="secondary" className="min-h-10 px-4 py-2">
        Sign Up
      </ButtonLink>
      <ButtonLink href="/signup" className="min-h-10 px-4 py-2">
        Start Selling Free
      </ButtonLink>
    </div>
  );
}
