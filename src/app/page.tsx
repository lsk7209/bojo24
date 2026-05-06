import Link from "next/link";
import type { Metadata } from "next";
import { Badge, Card } from "@components/ui";
import { SectionHeader } from "@components/section-header";
import { buildCanonicalUrl, SITE_DESCRIPTION, SITE_NAME } from "@lib/site";
import {
  faqItems,
  popularCategories,
  processSteps,
  qualityPrinciples,
  userCases,
} from "@lib/home-content";

export const metadata: Metadata = {
  title: "정부 지원금 찾기",
  description: "보조24 공공데이터 기반으로 정부 지원금 대상, 신청 방법, 서류, 공식 링크를 쉽게 확인하세요.",
  alternates: {
    canonical: buildCanonicalUrl("/"),
  },
  openGraph: {
    title: `${SITE_NAME} - 정부 지원금 찾기`,
    description: SITE_DESCRIPTION,
    url: buildCanonicalUrl("/"),
    locale: "ko_KR",
    type: "website",
  },
};

export default function HomePage() {
  const websiteJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url: buildCanonicalUrl("/"),
    description: SITE_DESCRIPTION,
    potentialAction: {
      "@type": "SearchAction",
      target: `${buildCanonicalUrl("/benefit")}?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
  };

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqItems.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };

  return (
    <main className="flex flex-col gap-14 pb-20 pt-2">
      <header className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-7 shadow-sm sm:p-10">
        <div className="relative z-10 grid gap-8 lg:grid-cols-[1.25fr,0.95fr] lg:items-start">
          <div className="max-w-3xl">
            <Badge className="mb-5 bg-blue-50 text-blue-700 hover:bg-blue-50">
              공공데이터 기반 안내 서비스
            </Badge>
            <h1 className="text-3xl font-extrabold leading-tight text-slate-950 sm:text-5xl">
              정부 지원금,
              <span className="block text-blue-700">신청 전에 필요한 정보만 먼저 확인하세요</span>
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-8 text-slate-600 sm:text-lg">
              보조24는 행정안전부 공공데이터를 바탕으로 신청 대상, 지원 내용, 준비 서류,
              접수 방법, 공식 확인 경로를 한 화면에서 읽기 쉽게 정리합니다.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/benefit"
                className="inline-flex h-12 items-center justify-center rounded-xl bg-blue-600 px-6 text-sm font-semibold text-white shadow-sm shadow-blue-200 transition hover:bg-blue-700"
              >
                지원금 바로 찾기
              </Link>
              <Link
                href="/editorial-policy"
                className="inline-flex h-12 items-center justify-center rounded-xl border border-slate-300 bg-white px-6 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
              >
                운영 원칙 보기
              </Link>
            </div>
          </div>

          <Card className="border-slate-200 bg-slate-50 p-6 shadow-none">
            <p className="text-xs font-bold uppercase text-blue-700">검수 준비 기준</p>
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
            <div className="mt-6 rounded-xl border border-slate-200 bg-white p-4 text-sm leading-6 text-slate-600">
              애드센스는 자동광고 방식으로 운영하며, 승인 전 빈 광고 영역이 본문보다 먼저 보이지 않게 구성합니다.
            </div>
          </Card>
        </div>
      </header>

      <section aria-labelledby="popular-categories" className="space-y-6">
        <SectionHeader
          title="많이 찾는 지원 분야"
          description="처음 방문한 사용자가 바로 탐색할 수 있도록 생활 상황별 진입점을 먼저 배치했습니다."
        />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {popularCategories.map((item) => (
            <Link key={item.title} href={item.href} className="group">
              <Card className="h-full border-slate-200 bg-white transition group-hover:border-blue-300 group-hover:shadow-md">
                <h2 className="text-lg font-bold text-slate-900">{item.title}</h2>
                <p className="mt-3 text-sm leading-7 text-slate-600">{item.description}</p>
              </Card>
            </Link>
          ))}
        </div>
      </section>

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
            <Link href="/disclaimer" className="rounded-2xl border border-slate-200 p-4 transition hover:border-blue-300 hover:bg-blue-50">
              <p className="font-semibold text-slate-900">면책조항</p>
              <p className="mt-2 text-sm text-slate-600">정보 제공 범위와 공식 확인 원칙을 안내합니다.</p>
            </Link>
          </div>
        </Card>

        <Card className="border-slate-200 bg-slate-900 text-white">
          <p className="text-xs font-bold uppercase text-blue-200">Auto Ads Ready</p>
          <h2 className="mt-3 text-2xl font-bold text-white">자동광고는 승인 이후에 자연스럽게 노출</h2>
          <p className="mt-4 text-sm leading-7 text-slate-200">
            현재 페이지는 콘텐츠와 신뢰 정보를 먼저 보여주도록 구성되어 있습니다. 애드센스 승인 뒤 자동광고가 켜져도
            본문 탐색을 방해하지 않도록 빈 수동 슬롯 의존도를 낮춥니다.
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

      {[websiteJsonLd, faqJsonLd].map((data, index) => (
        <script
          key={index}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
        />
      ))}
    </main>
  );
}
