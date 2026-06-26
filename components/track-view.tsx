"use client";

import { useEffect, useRef } from "react";

type TrackViewProps = {
  storeId?: string;
  productId?: string;
  eventType: "store_view" | "product_view";
};

const DEDUP_MS = 30 * 60 * 1000;

export function TrackView({ storeId, productId, eventType }: TrackViewProps) {
  const sent = useRef(false);

  useEffect(() => {
    if (sent.current) return;

    const id = storeId ?? productId;
    if (!id) return;

    const key = `track_${eventType}_${id}`;

    try {
      const last = localStorage.getItem(key);
      if (last) {
        const elapsed = Date.now() - Number(last);
        if (elapsed < DEDUP_MS) return;
      }
    } catch {
      /* localStorage not available */
    }

    sent.current = true;

    fetch("/api/analytics/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ storeId, productId, eventType, source: "web" })
    }).catch((err) => console.error("Failed to track analytics event:", err));

    try {
      localStorage.setItem(key, String(Date.now()));
    } catch {
      /* localStorage not available */
    }
  }, [storeId, productId, eventType]);

  return null;
}
