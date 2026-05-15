import Script from "next/script";
import { resolveGaMeasurementId } from "@lib/site";

const measurementId = resolveGaMeasurementId();

export function GoogleAnalytics() {
  if (!measurementId) {
    return null;
  }

  return (
    <>
      <Script
        async
        src={`https://www.googletagmanager.com/gtag/js?id=${measurementId}`}
        strategy="afterInteractive"
      />
      <Script
        id="google-analytics"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${measurementId}', {
              page_path: window.location.pathname,
              send_page_view: true,
              cookie_flags: 'SameSite=None;Secure',
            });
          `,
        }}
      />
      {/* GA4 Enhanced Measurement: 스크롤 50%·90% 깊이 추적 */}
      <Script
        id="ga4-scroll-depth"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            (function() {
              var milestones = {50: false, 90: false};
              function onScroll() {
                var scrolled = (window.scrollY + window.innerHeight) / document.documentElement.scrollHeight * 100;
                Object.keys(milestones).forEach(function(pct) {
                  if (!milestones[pct] && scrolled >= Number(pct)) {
                    milestones[pct] = true;
                    gtag('event', 'scroll_depth', {event_category: 'engagement', event_label: pct + '%', value: Number(pct)});
                  }
                });
              }
              window.addEventListener('scroll', onScroll, {passive: true});
            })();
          `,
        }}
      />
    </>
  );
}
