import type { Metadata } from "next";
import Script from "next/script";
import { Noto_Sans_KR } from "next/font/google";
import { Header, Footer } from "@components/layout-common";
import { AnalyticsTracker } from "@components/analytics-tracker";
import { DynamicHead } from "@components/dynamic-head";
import { GoogleAnalytics } from "@components/google-analytics";
import { MicrosoftClarity } from "@components/microsoft-clarity";
import { ADSENSE_CLIENT } from "@lib/ads";
import { SITE_DESCRIPTION, SITE_NAME, resolveSiteUrl } from "@lib/site";
import "./globals.css";

// 불필요한 weight 제거: 100·300·900 → 필수 3종만 로드
const notoSansKr = Noto_Sans_KR({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-noto-sans-kr",
  display: "swap",
});

const siteName = SITE_NAME;
const siteDescription = SITE_DESCRIPTION;
const siteUrl = resolveSiteUrl();

export const metadata: Metadata = {
  title: {
    default: siteName,
    template: `%s | ${siteName}`,
  },
  description: siteDescription,
  metadataBase: new URL(siteUrl),
  openGraph: {
    title: siteName,
    description: siteDescription,
    siteName,
    url: siteUrl,
    locale: "ko_KR",
    type: "website",
    images: [{ url: `${siteUrl}/opengraph-image`, width: 1200, height: 630, alt: siteName }],
  },
  twitter: {
    card: "summary_large_image",
    title: siteName,
    description: siteDescription,
    images: [`${siteUrl}/opengraph-image`],
  },
  verification: {
    google: [
      "wsoEFYnqrAkhjBrkV4Q9iWCOzfZBySwWZZhRVQbI04M",
      "vnWEJOwroGT64YZ1DiNVGx27dG2YDLCYJr5vro19Lz8",
    ],
    other: {
      "naver-site-verification": "2e4e153be51c48838641e6e87c005fa0a8663b3d",
    },
  },
  alternates: {
    canonical: siteUrl,
    types: {
      "application/rss+xml": [{ url: `${siteUrl}/rss.xml`, title: `${siteName} RSS` }],
    },
  },
  icons: {
    icon: "/favicon.svg",
  },
};

const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "@id": `${siteUrl}/#organization`,
  name: siteName,
  url: siteUrl,
  logo: {
    "@type": "ImageObject",
    url: `${siteUrl}/opengraph-image`,
    width: 1200,
    height: 630,
  },
  description: siteDescription,
  contactPoint: {
    "@type": "ContactPoint",
    email: "contact@bojo24.kr",
    contactType: "customer support",
    availableLanguage: "Korean",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko" className={notoSansKr.className}>
      <head>
        <GoogleAnalytics />
        <MicrosoftClarity />
        {/* AdSense: afterInteractive 전략으로 렌더링 블로킹 방지 */}
        <Script
          id="adsense-loader"
          async
          src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT}`}
          crossOrigin="anonymous"
          strategy="afterInteractive"
        />
        {/* Organization 구조화 데이터 (전 페이지 공통) */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
        />
        {/* 관리자 설정 동적 스크립트 */}
        <DynamicHead />
      </head>
      <body className="flex min-h-screen flex-col bg-slate-50 text-slate-900 antialiased selection:bg-blue-100 selection:text-blue-900">
        <Header />
        <div className="flex-1 w-full mx-auto max-w-5xl px-4 py-8 md:px-6 md:py-12">
          {children}
          <AnalyticsTracker />
        </div>
        <Footer />
      </body>
    </html>
  );
}
