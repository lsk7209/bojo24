"use client";

import { useEffect } from "react";
import Script from "next/script";

declare global {
  interface Window {
    adsbygoogle: any[];
  }
}

type AdSenseAdProps = {
  /**
   * AdSense 광고 슬롯 ID
   * 예: "1234567890"
   */
  adSlot: string;
  /**
   * 광고 형식
   */
  format?: "auto" | "rectangle" | "vertical" | "horizontal";
  /**
   * 반응형 광고 여부
   */
  responsive?: boolean;
  /**
   * 광고 스타일 클래스
   */
  className?: string;
  /**
   * 광고 레이블 (접근성)
   */
  label?: string;
  /**
   * 광고 크기 (비반응형일 때)
   */
  style?: React.CSSProperties;
};

/**
 * Google AdSense 광고 컴포넌트
 * 
 * 사용 예시:
 * <AdSenseAd 
 *   adSlot="1234567890" 
 *   format="auto" 
 *   responsive={true}
 * />
 */
export function AdSenseAd({
  adSlot,
  format = "auto",
  responsive = true,
  className = "",
  label = "광고",
  style
}: AdSenseAdProps) {
  useEffect(() => {
    try {
      // AdSense 스크립트가 로드된 후 광고 푸시
      if (window.adsbygoogle && !(window.adsbygoogle as any).loaded) {
        window.adsbygoogle = window.adsbygoogle || [];
        window.adsbygoogle.push({});
      }
    } catch (err) {
      console.error("AdSense error:", err);
    }
  }, []);

  // AdSense Publisher ID (환경 변수 또는 하드코딩)
  const adClient = process.env.NEXT_PUBLIC_ADSENSE_CLIENT || "ca-pub-3050601904412736";

  return (
    <>
      <ins
        className={`adsbygoogle ${className}`}
        style={{
          display: "block",
          ...style
        }}
        data-ad-client={adClient}
        data-ad-slot={adSlot}
        data-ad-format={format}
        data-full-width-responsive={responsive ? "true" : "false"}
        aria-label={label}
      />
      <Script
        id={`adsense-${adSlot}`}
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            (adsbygoogle = window.adsbygoogle || []).push({});
          `
        }}
      />
    </>
  );
}

/**
 * 반응형 광고 래퍼 컴포넌트
 * 모바일/데스크톱 최적화
 */
export function ResponsiveAd({ adSlot, className = "" }: { adSlot: string; className?: string }) {
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

/**
 * 인라인 광고 컴포넌트 (본문 중간)
 */
export function InlineAd({ adSlot, className = "" }: { adSlot: string; className?: string }) {
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

/**
 * 사이드바 광고 컴포넌트
 */
export function SidebarAd({ adSlot, className = "" }: { adSlot: string; className?: string }) {
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

/**
 * 배너 광고 컴포넌트 (상단/하단)
 */
export function BannerAd({ adSlot, className = "" }: { adSlot: string; className?: string }) {
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

