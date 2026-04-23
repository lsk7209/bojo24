import Link from "next/link";
import { BannerAd } from "@components/adsense-ad";
import { Badge, Card } from "@components/ui";
import { SectionHeader } from "@components/section-header";
import { AD_SLOTS } from "@lib/ads";
import {
  faqItems,
  processSteps,
  qualityPrinciples,
  userCases,
} from "@lib/home-content";

export default function HomePage() {
  return (
    <main className="flex flex-col gap-16 pb-20 pt-4">
      <header className="relative overflow-hidden rounded-[2rem] border border-slate-200 bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.18),_transparent_38%),linear-gradient(135deg,_#ffffff_0%,_#f8fafc_45%,_#eff6ff_100%)] p-8 shadow-sm sm:p-12">
        <div className="relative z-10 grid gap-8 lg:grid-cols-[1.35fr,0.95fr] lg:items-start">
          <div className="max-w-3xl">
            <Badge className="mb-5 bg-blue-100 text-blue-700 hover:bg-blue-100">
              공공데이터 기반 안내 서비스
            </Badge>
            <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl">
              보조24에서
              <br />
              받을 수 있는 정부 지원금을
              <span className="block text-blue-600">읽기 쉽게 다시 정리합니다</span>
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">
              정책명만 나열된 목록 대신 신청 대상, 준비 서류, 접수 방식, 공식 확인 경로를 한 화면에서
              파악할 수 있게 구성했습니다. 광고보다 정보가 먼저 보이도록 화면 구조도 함께 다듬고 있습니다.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/benefit"
                className="inline-flex h-12 items-center justify-center rounded-full bg-blue-600 px-6 text-sm font-semibold text-white shadow-sm shadow-blue-200 transition hover:bg-blue-700"
              >
                지원금 바로 찾기
              </Link>
              <Link
                href="/about"
                className="inline-flex h-12 items-center justify-center rounded-full border border-slate-300 bg-white px-6 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
              >
                서비스 소개 보기
              </Link>
            </div>
          </div>

          <Card className="border-slate-200 bg-white/90 p-6 shadow-lg shadow-blue-100/40">
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-blue-600">신뢰 체크포인트</p>
            <div className="mt-5 space-y-4">
              {qualityPrinciples.map((item) => (
                <div key={item} className="flex gap-3">
                  <span className="mt-1 inline-flex h-6 w-6 flex-none items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">
                    ✓
                  </span>
                  <p className="text-sm leading-6 text-slate-700">{item}</p>
                </div>
              ))}
            </div>
            <div className="mt-6 rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
              운영 정책, 문의 채널, 데이터 출처를 공개해 광고 검수와 검색 품질 평가에서 필요한 기본
              신뢰 요소를 분리해 제공합니다.
            </div>
          </Card>
        </div>

        <div className="pointer-events-none absolute -right-20 -top-16 h-60 w-60 rounded-full bg-blue-100/70 blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 left-0 h-32 w-32 rounded-full bg-amber-100/60 blur-2xl" />
      </header>

      <section aria-labelledby="user-cases" className="space-y-6">
        <SectionHeader
          title="보조24가 필요한 순간"
          description="신청 직전에 사용자가 가장 많이 막히는 지점을 중심으로 콘텐츠를 구성했습니다."
        />
        <div className="grid gap-4 md:grid-cols-3">
          {userCases.map((item) => (
            <Card key={item.title} className="h-full border-slate-200 bg-white">
              <h2 className="text-xl font-bold text-slate-900">{item.title}</h2>
              <p className="mt-3 text-sm leading-7 text-slate-600">{item.description}</p>
            </Card>
          ))}
        </div>
      </section>

      <BannerAd adSlot={AD_SLOTS.homeBanner} />

      <section aria-labelledby="content-process" className="space-y-6">
        <SectionHeader
          eyebrow="PROCESS"
          title="정보를 이렇게 정리합니다"
          description="공식 데이터 수집부터 사용자 친화적 설명, 공식 확인 경로 연결까지 한 흐름으로 설계합니다."
        />
        <div className="grid gap-4 lg:grid-cols-3">
          {processSteps.map((step) => (
            <Card key={step.title} className="h-full border-slate-200 bg-slate-50/70">
              <p className="text-sm font-bold text-blue-600">{step.eyebrow}단계</p>
              <h2 className="mt-3 text-xl font-bold text-slate-900">{step.title}</h2>
              <p className="mt-3 text-sm leading-7 text-slate-600">{step.description}</p>
            </Card>
          ))}
        </div>
      </section>

      <section aria-labelledby="trust-links" className="grid gap-4 lg:grid-cols-[1.1fr,0.9fr]">
        <Card className="border-slate-200 bg-white">
          <h2 id="trust-links" className="text-2xl font-bold text-slate-900">
            사이트 신뢰도를 높이기 위해 공개한 페이지
          </h2>
          <p className="mt-4 text-sm leading-7 text-slate-600">
            광고 검수 실패 사유 중 많은 부분이 운영 정보 부족, 얇은 홈 콘텐츠, 연락처 부재와 연결됩니다.
            그래서 핵심 링크를 메인 화면에서 바로 노출합니다.
          </p>
          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <Link href="/about" className="rounded-2xl border border-slate-200 p-4 transition hover:border-blue-300 hover:bg-blue-50">
              <p className="font-semibold text-slate-900">서비스 소개</p>
              <p className="mt-2 text-sm text-slate-600">사이트 목적과 제공 범위를 설명합니다.</p>
            </Link>
            <Link href="/editorial-policy" className="rounded-2xl border border-slate-200 p-4 transition hover:border-blue-300 hover:bg-blue-50">
              <p className="font-semibold text-slate-900">운영 원칙</p>
              <p className="mt-2 text-sm text-slate-600">콘텐츠 작성, 수정, 광고 구분 기준을 공개합니다.</p>
            </Link>
            <Link href="/contact" className="rounded-2xl border border-slate-200 p-4 transition hover:border-blue-300 hover:bg-blue-50">
              <p className="font-semibold text-slate-900">문의하기</p>
              <p className="mt-2 text-sm text-slate-600">정정 요청과 운영 문의 채널을 제공합니다.</p>
            </Link>
          </div>
        </Card>

        <Card className="border-slate-200 bg-slate-900 text-white">
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-blue-200">Review Ready</p>
          <h2 className="mt-3 text-2xl font-bold">광고보다 콘텐츠가 먼저 보이도록</h2>
          <p className="mt-4 text-sm leading-7 text-slate-200">
            실제 슬롯이 준비되지 않은 페이지에서는 빈 광고 상자를 노출하지 않습니다. 광고가 활성화되더라도
            본문과 구분된 위치, 별도 라벨, 충분한 설명 텍스트를 유지합니다.
          </p>
        </Card>
      </section>

      <section aria-labelledby="home-faq" className="space-y-6">
        <SectionHeader
          eyebrow="FAQ"
          title="자주 묻는 질문"
          description="광고 검수와 검색 품질에서 자주 문제 되는 지점을 먼저 정리했습니다."
        />
        <div className="space-y-4">
          {faqItems.map((item) => (
            <Card key={item.question} className="border-slate-200 bg-white">
              <h2 className="text-lg font-bold text-slate-900">{item.question}</h2>
              <p className="mt-3 text-sm leading-7 text-slate-600">{item.answer}</p>
            </Card>
          ))}
        </div>
      </section>
    </main>
  );
}
