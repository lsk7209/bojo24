import type { ReactNode } from "react";
import { AdSenseReaderScript } from "@components/adsense-reader-script";

export default function BlogArticleLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <AdSenseReaderScript />
      {children}
    </>
  );
}
