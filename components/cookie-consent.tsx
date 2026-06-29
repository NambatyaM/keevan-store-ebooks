"use client";

import { useState, useEffect } from "react";

export function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem("cookie-consent");
    if (!consent) setVisible(true);
  }, []);

  function accept() {
    localStorage.setItem("cookie-consent", "accepted");
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div className="fixed bottom-20 right-4 left-4 z-50 mx-auto max-w-md rounded-lg border border-neutral-200 bg-white p-4 shadow-lg sm:left-auto">
      <p className="text-sm text-neutral-700">
        This site uses cookies for analytics and payment processing. By continuing, you accept our{" "}
        <a href="/privacy" className="text-brand-green underline">Privacy Policy</a>.
      </p>
      <button onClick={accept} className="mt-3 rounded-lg bg-brand-green px-4 py-2 text-sm font-semibold text-white hover:bg-[#005C34]">
        Got it
      </button>
    </div>
  );
}
