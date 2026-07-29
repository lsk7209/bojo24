"use client";

import { usePathname } from "next/navigation";
import Script from "next/script";
import { useEffect, useState } from "react";

const isReaderDetailPath = (pathname: string) =>
  /^\/(?:benefit\/[^/]+\/[^/]+|blog\/[^/]+|startup\/[^/]+)$/.test(pathname);

export function AdSenseLoader({ publisherId }: { publisherId: string }) {
  const pathname = usePathname() ?? "/";
  const [shouldLoad, setShouldLoad] = useState(false);

  useEffect(() => {
    const robots = document.querySelector('meta[name="robots"]')?.getAttribute("content")?.toLowerCase() ?? "";
    setShouldLoad(isReaderDetailPath(pathname) && !robots.includes("noindex"));
  }, [pathname]);

  if (!shouldLoad) return null;

  return (
    <Script
      id="adsense-loader"
      async
      src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${publisherId}`}
      crossOrigin="anonymous"
      strategy="afterInteractive"
    />
  );
}
