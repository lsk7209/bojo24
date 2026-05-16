import Link from "next/link";
import { CONTACT_EMAIL, SITE_NAME, SITE_TAGLINE } from "@lib/site";

const navItems = [
  { href: "/benefit", label: "지원금 찾기" },
  { href: "/startup", label: "창업지원" },
  { href: "/blog", label: "블로그" },
  { href: "/about", label: "서비스 소개" },
  { href: "/contact", label: "문의" },
] as const;

const footerLinks = [
  { href: "/about", label: "서비스 소개" },
  { href: "/startup", label: "창업지원" },
  { href: "/editorial-policy", label: "운영 원칙" },
  { href: "/contact", label: "문의하기" },
  { href: "/privacy", label: "개인정보처리방침" },
  { href: "/terms", label: "이용약관" },
  { href: "/disclaimer", label: "면책조항" },
] as const;

export const Header = () => {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-4 md:px-6">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-xl font-bold text-blue-600">{SITE_NAME}</span>
          <span className="hidden text-sm font-medium text-slate-600 sm:inline-block">
            {SITE_TAGLINE}
          </span>
        </Link>
        <nav className="flex items-center gap-4 text-sm font-medium text-slate-600 sm:gap-6">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href} className="transition-colors hover:text-blue-600">
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
};

export const Footer = () => {
  return (
    <footer className="border-t border-slate-200 bg-white py-12 text-sm text-slate-500">
      <div className="mx-auto max-w-5xl px-4 md:px-6">
        <div className="grid gap-8 md:grid-cols-[1.3fr,0.9fr]">
          <div className="space-y-3">
            <strong className="block text-lg font-bold text-slate-900">{SITE_NAME}</strong>
            <p>{SITE_TAGLINE}</p>
            <p className="text-sm leading-7 text-slate-500">
              보조24는 행정안전부 보조24 공공데이터와 창업지원 공공데이터를 바탕으로
              신청 대상, 필요 서류, 접수 방식, 공식 링크를 한눈에 확인할 수 있게 정리합니다.
            </p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2">
            <div className="space-y-2">
              <p className="font-semibold text-slate-900">바로가기</p>
              {footerLinks.map((item) => (
                <Link key={item.href} href={item.href} className="block hover:text-slate-900">
                  {item.label}
                </Link>
              ))}
            </div>
            <div className="space-y-2">
              <p className="font-semibold text-slate-900">운영 정보</p>
              <p>문의: {CONTACT_EMAIL}</p>
              <p>데이터 출처: 행정안전부 보조24, 창업진흥원, 중소벤처기업부</p>
              <p className="text-xs text-slate-600">© 2026 보조24. All rights reserved.</p>
            </div>
          </div>
        </div>

        <div className="mt-8 border-t border-slate-100 pt-8 text-xs text-slate-600">
          <p className="mb-2">
            본 사이트는 공공데이터포털의 공공서비스 정보를 활용하여 제공합니다. 정확한 정보는 반드시 해당 기관의 공식 웹사이트를 통해 확인하시기 바랍니다.
          </p>
          <p>
            광고가 노출되는 경우, 사용자 혼동을 막기 위해 별도 표기를 유지하며 본문 정보와 명확히 구분합니다.
          </p>
        </div>
      </div>
    </footer>
  );
};
