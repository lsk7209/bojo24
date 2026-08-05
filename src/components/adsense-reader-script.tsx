import Script from "next/script";
import { ADSENSE_CLIENT } from "@lib/ads";

export function AdSenseReaderScript() {
  return (
    <Script
      id="adsense-reader-loader"
      async
      src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADSENSE_CLIENT}`}
      crossOrigin="anonymous"
      strategy="afterInteractive"
    />
  );
}
