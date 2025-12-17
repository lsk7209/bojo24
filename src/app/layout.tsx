import type { Metadata } from "next";
import { Noto_Sans_KR } from "next/font/google";
import Script from "next/script";
import { Header, Footer } from "@components/layout-common";
import { AnalyticsTracker } from "@components/analytics-tracker";
import { DynamicHead } from "@components/dynamic-head";
import "./globals.css";

const notoSansKr = Noto_Sans_KR({
  subsets: ["latin"],
  weight: ["100", "300", "400", "500", "700", "900"],
  variable: "--font-noto-sans-kr",
  display: "swap",
});

const siteName = "보조24";
const siteDescription =
  "행정안전부 보조24 공공데이터를 분석하여 쉽고 정확한 정보를 제공하는 플랫폼";

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || "https://bojo24.kr";

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
  },
  verification: {
    google: "wsoEFYnqrAkhjBrkV4Q9iWCOzfZBySwWZZhRVQbI04M",
    other: {
      "naver-site-verification": "2e4e153be51c48838641e6e87c005fa0a8663b3d",
    },
  },
  alternates: {
    canonical: siteUrl,
    types: {
      "application/rss+xml": [{ url: `${siteUrl}/rss.xml` }],
    },
  }
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko" className={notoSansKr.className}>
      <head>
        {/* 구글 애드센스 스크립트 */}
        <Script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-3050601904412736"
          crossOrigin="anonymous"
          strategy="afterInteractive"
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
