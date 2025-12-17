import Link from "next/link";
import { Button } from "@components/ui";
import { BannerAd } from "@components/adsense-ad";

export default function HomePage() {
  return (
    <main className="flex flex-col gap-10 pb-16 pt-6">
      {/* 상단 배너 광고 */}
      <BannerAd adSlot="1234567890" className="mb-4" />
      {/* Hero Section */}
      <header className="relative overflow-hidden rounded-3xl bg-gradient-to-b from-blue-50/50 via-white to-white p-8 sm:p-12 ring-1 ring-slate-200/50 shadow-sm">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-600 mb-6">
            ✨ Beta Version
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl mb-6">
            보조금 파인더 <br className="hidden sm:block" />
            <span className="text-blue-600">스마트하게 찾으세요</span>
          </h1>
          <p className="text-lg text-slate-600 leading-relaxed mb-8 max-w-xl">
            행정안전부 보조금24 데이터를 실시간으로 분석해 <br className="hidden sm:block" />
            AI가 3줄 요약과 핵심 FAQ를 제공합니다.
          </p>
          <div className="flex flex-wrap items-center gap-4">
            <Link href="/benefit">
              <Button variant="primary" className="rounded-full px-8 py-3 text-base">
                지금 지원금 찾기
              </Button>
            </Link>
          </div>
        </div>

        {/* Decorative background element */}
        <div className="absolute top-0 right-0 -mr-20 -mt-20 h-[400px] w-[400px] rounded-full bg-gradient-to-br from-blue-100/40 to-indigo-50/40 blur-3xl" />
      </header>

      {/* Category Quick Links */}
      <section
        className="rounded-3xl bg-slate-50 p-8 sm:p-10"
        aria-label="카테고리 탐색"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">관심 분야별 찾아보기</h2>
            <p className="mt-1 text-slate-600">
              나에게 맞는 카테고리를 선택해 보세요.
            </p>
          </div>
          <Link href="/benefit" className="text-sm font-semibold text-blue-600 hover:text-blue-700">
            전체보기 →
          </Link>
        </div>

        <div className="flex flex-wrap gap-3">
          {["육아/교육", "일자리", "주거", "생활안정", "창업/경영", "농림수산", "문화/예술", "기타"].map(
            (cat) => (
              <Link
                key={cat}
                href={`/benefit?category=${encodeURIComponent(cat)}`}
                className="group relative flex items-center gap-3 overflow-hidden rounded-2xl bg-white px-5 py-4 shadow-sm transition-all hover:shadow-md hover:-translate-y-1 ring-1 ring-slate-200/50"
              >
                <span className="font-semibold text-slate-700 group-hover:text-blue-600">
                  {cat}
                </span>
              </Link>
            )
          )}
        </div>
      </section>
    </main>
  );
}
