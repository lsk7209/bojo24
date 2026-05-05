"use client";

import { useEffect, useRef } from "react";
import { ADSENSE_CLIENT, normalizeAdSlot } from "@lib/ads";

declare global {
  interface Window {
    adsbygoogle: any[];
  }
}

type AdSenseAdProps = {
  adSlot?: string | null;
  format?: "auto" | "rectangle" | "vertical" | "horizontal";
  responsive?: boolean;
  className?: string;
  label?: string;
  style?: React.CSSProperties;
};

type AdSlotWrapperProps = {
  adSlot?: string | null;
  className?: string;
};

export function AutoAdsNotice() {
  return null;
}

export function AdSenseAd({
  adSlot,
  format = "auto",
  responsive = true,
  className = "",
  label = "광고",
  style,
}: AdSenseAdProps) {
  const pushedRef = useRef(false);
  const normalizedAdSlot = normalizeAdSlot(adSlot);

  useEffect(() => {
    if (!normalizedAdSlot || pushedRef.current) {
      return;
    }

    try {
      window.adsbygoogle = window.adsbygoogle || [];
      window.adsbygoogle.push({});
      pushedRef.current = true;
    } catch {
      pushedRef.current = false;
    }
  }, [normalizedAdSlot]);

  if (!normalizedAdSlot) {
    return null;
  }

  return (
    <aside
      aria-label={label}
      className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm"
    >
      <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">
        광고
      </p>
      <ins
        className={`adsbygoogle ${className}`}
        style={{
          display: "block",
          ...style,
        }}
        data-ad-client={ADSENSE_CLIENT}
        data-ad-slot={normalizedAdSlot}
        data-ad-format={format}
        data-full-width-responsive={responsive ? "true" : "false"}
        aria-label={label}
      />
    </aside>
  );
}

export function ResponsiveAd({ adSlot, className = "" }: AdSlotWrapperProps) {
  return (
    <div className={`w-full ${className}`}>
      <AdSenseAd
        adSlot={adSlot}
        format="auto"
        responsive={true}
        className="min-h-[100px]"
        label="반응형 광고"
      />
    </div>
  );
}

export function InlineAd({ adSlot, className = "" }: AdSlotWrapperProps) {
  return (
    <div className={`my-8 flex justify-center ${className}`}>
      <AdSenseAd
        adSlot={adSlot}
        format="horizontal"
        responsive={true}
        className="min-h-[250px] max-w-full"
        label="인라인 광고"
      />
    </div>
  );
}

export function SidebarAd({ adSlot, className = "" }: AdSlotWrapperProps) {
  return (
    <div className={`sticky top-4 ${className}`}>
      <AdSenseAd
        adSlot={adSlot}
        format="vertical"
        responsive={true}
        className="min-h-[600px]"
        label="사이드바 광고"
      />
    </div>
  );
}

export function BannerAd({ adSlot, className = "" }: AdSlotWrapperProps) {
  return (
    <div className={`w-full ${className}`}>
      <AdSenseAd
        adSlot={adSlot}
        format="horizontal"
        responsive={true}
        className="min-h-[90px]"
        label="배너 광고"
      />
    </div>
  );
}
