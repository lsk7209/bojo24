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
      {/* GA4 Enhanced Measurement: 스크롤·검색·외부링크·혜택클릭 추적 */}
      <Script
        id="ga4-enhanced"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            (function() {
              // 1) 스크롤 깊이 50/90%
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

              // 2) 검색 폼 제출 추적 (/benefit?q=...)
              document.addEventListener('submit', function(e) {
                var form = e.target;
                if (!form || form.tagName !== 'FORM') return;
                var q = form.querySelector('input[name="q"]');
                if (q && q.value) {
                  gtag('event', 'search', {search_term: q.value.trim().slice(0, 100)});
                }
              });

              // 3) 외부 링크 클릭 추적
              document.addEventListener('click', function(e) {
                var a = e.target && e.target.closest('a');
                if (!a) return;
                var href = a.getAttribute('href') || '';
                if (href.startsWith('http') && !href.includes('bojo24.kr')) {
                  gtag('event', 'click', {event_category: 'outbound', event_label: href.slice(0, 200), transport_type: 'beacon'});
                }
                // 지원금 상세 클릭
                if (href.includes('/benefit/') && href.split('/').length >= 4) {
                  var parts = href.split('/');
                  gtag('event', 'benefit_click', {benefit_category: parts[2] || '', benefit_id: parts[3] || ''});
                }
                // 블로그 포스트 클릭
                if (href.includes('/blog/')) {
                  gtag('event', 'post_click', {post_slug: href.replace('/blog/', '').slice(0, 100)});
                }
              });
            })();
          `,
        }}
      />
    </>
  );
}
