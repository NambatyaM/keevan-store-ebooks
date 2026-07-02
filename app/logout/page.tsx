"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { SimplePage } from "@/components/simple-page";

export default function LogoutPage() {
  const router = useRouter();
  const [status, setStatus] = useState("Logging out...");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/auth/logout", { method: "POST" });
        if (!res.ok) throw new Error("Logout failed");
      } catch (err) {
        if (!cancelled) setStatus("Logged out");
      }
      if (!cancelled) {
        setStatus("Logged out");
        setTimeout(() => router.push("/login"), 500);
      }
    })();
    return () => { cancelled = true; };
  }, [router]);

  return (
    <SimplePage title="Logging out..." minimalFooter>
      <p className="text-muted">{status}</p>
    </SimplePage>
  );
}
