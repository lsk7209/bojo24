import type { Metadata } from "next";
import { Noto_Sans_KR } from "next/font/google";
import { Header, Footer } from "@components/layout-common";
import { AnalyticsTracker } from "@components/analytics-tracker";
import { DynamicHead } from "@components/dynamic-head";
import { GoogleAnalytics } from "@components/google-analytics";
import { ADSENSE_CLIENT } from "@lib/ads";
import { SITE_DESCRIPTION, SITE_NAME, resolveSiteUrl } from "@lib/site";
import "./globals.css";

const notoSansKr = Noto_Sans_KR({
  subsets: ["latin"],
  weight: ["100", "300", "400", "500", "700", "900"],
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
  },
  icons: {
    icon: "/favicon.svg",
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
        {/* 구글 애드센스 스크립트 */}
        <script
          async
          src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT}`}
          crossOrigin="anonymous"
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
