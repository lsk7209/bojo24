"use client";

import { useEffect, useRef } from "react";
import { ADSENSE_CLIENT, ADSENSE_SLOT_INLINE } from "@lib/ads";

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

export function AdSlot() {
  const pushed = useRef(false);

  useEffect(() => {
    if (pushed.current || !ADSENSE_SLOT_INLINE) return;
    pushed.current = true;
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch {
      // AdSense 스크립트가 아직 로드되지 않았거나 차단된 경우 조용히 무시
    }
  }, []);

  if (!ADSENSE_SLOT_INLINE) return null;

  return (
    <div className="w-full" style={{ minHeight: 250 }} aria-label="광고">
      <span className="mb-1 block text-center text-[10px] font-semibold uppercase tracking-wider text-slate-400">
        광고
      </span>
      <ins
        className="adsbygoogle"
        style={{ display: "block", minHeight: 250 }}
        data-ad-client={ADSENSE_CLIENT}
        data-ad-slot={ADSENSE_SLOT_INLINE}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </div>
  );
}
