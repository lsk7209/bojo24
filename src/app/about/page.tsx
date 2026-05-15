import type { Metadata } from "next";
import Link from "next/link";
import { Card } from "@components/ui";
import { SectionHeader } from "@components/section-header";
import { SITE_NAME, buildCanonicalUrl, resolveSiteUrl, CONTACT_EMAIL } from "@lib/site";

const siteUrl = resolveSiteUrl();

export const metadata: Metadata = {
  title: "서비스 소개",
  description: "보조24는 행정안전부 공공데이터를 바탕으로 정부 지원금·복지 혜택 신청 정보를 쉽고 정확하게 정리하는 큐레이션 서비스입니다. 운영 원칙, 데이터 출처, 편집 기준을 공개합니다.",
  alternates: { canonical: buildCanonicalUrl("/about") },
  openGraph: {
    title: `서비스 소개 | ${SITE_NAME}`,
    description: "보조24 운영 원칙, 데이터 출처, 편집 기준을 공개합니다.",
    url: buildCanonicalUrl("/about"),
    locale: "ko_KR",
    type: "website",
    images: [{ url: `${siteUrl}/opengraph-image`, width: 1200, height: 630 }],
  },
};

const dataSources = [
  { name: "행정안전부 보조24 공공데이터", url: "https://www.gov.kr", desc: "국가 보조금 통합 DB" },
  { name: "보건복지부 (mohw.go.kr)", url: "https://www.mohw.go.kr", desc: "복지·의료·돌봄 정책" },
  { name: "복지로 (bokjiro.go.kr)", url: "https://www.bokjiro.go.kr", desc: "복지 서비스 신청 포털" },
  { name: "정부24 (gov.kr)", url: "https://www.gov.kr", desc: "전자 정부 민원 포털" },
  { name: "고용노동부 (moel.go.kr)", url: "https://www.moel.go.kr", desc: "고용·노동·취업 지원" },
  { name: "중소벤처기업부 (mss.go.kr)", url: "https://www.mss.go.kr", desc: "창업·중소기업 지원" },
] as const;

const editorialPrinciples = [
  {
    title: "공식 출처 우선",
    body: "모든 정보는 정부 공공데이터 API 또는 공식 공고를 1차 출처로 합니다. 출처 불명 정보는 게재하지 않습니다.",
  },
  {
    title: "신청 정보 먼저",
    body: "신청 자격·준비 서류·접수 경로를 상단에 배치합니다. 불필요한 배경 설명보다 실질적인 안내를 우선합니다.",
  },
  {
    title: "확정 표현 금지",
    body: "\"반드시 받을 수 있습니다\", \"보장됩니다\" 같은 확정 표현을 사용하지 않습니다. 최종 수급 가능 여부는 공식 기관에 확인을 안내합니다.",
  },
  {
    title: "광고 명확히 구분",
    body: "광고 영역은 \'광고\' 레이블로 명시하고 본문보다 앞에 노출하지 않습니다.",
  },
  {
    title: "AI 활용 공개",
    body: "일부 콘텐츠는 AI 도구를 활용해 공공데이터를 정리·요약합니다. 해당 글 하단에 AI 활용 사실을 명시합니다.",
  },
] as const;

const workflow = [
  { step: "1", title: "공공데이터 수집", desc: "행정안전부 보조24 API를 통해 전국 정부 지원금 정보를 매일 자동 업데이트합니다." },
  { step: "2", title: "신청자 관점 재구성", desc: "정책명 중심의 원본 데이터를 신청 대상·지원 내용·준비 서류·접수 방법 순서로 재편집합니다." },
  { step: "3", title: "공식 확인 경로 연결", desc: "정확한 신청은 기관 공지를 우선하도록 공식 링크와 문의처를 함께 안내합니다." },
] as const;

export default function AboutPage() {
  const organizationJsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${siteUrl}/#organization`,
    name: SITE_NAME,
    url: siteUrl,
    description: "행정안전부 공공데이터 기반 정부 지원금·복지 혜택 정보 큐레이션 서비스",
    logo: { "@type": "ImageObject", url: `${siteUrl}/opengraph-image`, width: 1200, height: 630 },
    contactPoint: { "@type": "ContactPoint", email: CONTACT_EMAIL, contactType: "customer support", availableLanguage: "Korean" },
    sameAs: [`${siteUrl}/editorial-policy`, `${siteUrl}/disclaimer`],
  };

  const webPageJsonLd = {
    "@context": "https://schema.org",
    "@type": "AboutPage",
    name: `서비스 소개 | ${SITE_NAME}`,
    url: buildCanonicalUrl("/about"),
    description: "보조24 운영 원칙, 데이터 출처, 편집 기준 안내",
    publisher: { "@type": "Organization", name: SITE_NAME, url: siteUrl },
  };

  return (
    <main className="mx-auto flex max-w-4xl flex-col gap-10 pb-16 pt-4">
      <header className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
        <p className="text-xs font-bold uppercase tracking-[0.25em] text-blue-600">About</p>
        <h1 className="mt-3 text-4xl font-extrabold tracking-tight text-slate-900">{SITE_NAME} 소개</h1>
        <p className="mt-4 text-base leading-8 text-slate-600 max-w-2xl">
          보조24는 행정안전부 공공데이터를 바탕으로 정부 지원금·복지 혜택 정보를 신청자 관점에서 정리하는
          큐레이션 서비스입니다. 법적 자문이나 수급 여부 확정 안내는 제공하지 않으며, 공식 출처 링크와
          문의처를 함께 안내합니다.
        </p>
        <div className="mt-6 flex flex-wrap gap-4 text-sm">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1 text-blue-700 font-medium">
            정보 큐레이션
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-slate-600 font-medium">
            공공데이터 기반
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-slate-600 font-medium">
            AI 활용 공개
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-slate-600 font-medium">
            매일 자동 업데이트
          </span>
        </div>
      </header>

      <section>
        <SectionHeader
          eyebrow="DATA SOURCES"
          title="데이터 출처"
          description="보조24가 사용하는 공식 공공데이터 출처입니다."
        />
        <div className="grid gap-3 sm:grid-cols-2">
          {dataSources.map((src) => (
            <Card key={src.name} className="border-slate-200 bg-white flex items-start gap-4">
              <div className="mt-0.5 flex h-9 w-9 flex-none items-center justify-center rounded-lg bg-blue-100 text-blue-700 font-bold text-xs">
                DB
              </div>
              <div>
                <p className="font-semibold text-slate-900 text-sm">{src.name}</p>
                <p className="text-xs text-slate-500 mt-0.5">{src.desc}</p>
              </div>
            </Card>
          ))}
        </div>
      </section>

      <section>
        <SectionHeader
          eyebrow="EDITORIAL POLICY"
          title="편집 원칙"
          description="콘텐츠 작성과 수정의 기준입니다."
        />
        <div className="space-y-3">
          {editorialPrinciples.map((item) => (
            <Card key={item.title} className="border-slate-200 bg-white flex items-start gap-4">
              <span className="mt-0.5 flex h-5 w-5 flex-none items-center justify-center rounded-full bg-blue-600 text-white text-xs font-bold">
                ✓
              </span>
              <div>
                <p className="font-semibold text-slate-900 text-sm">{item.title}</p>
                <p className="text-sm leading-6 text-slate-600 mt-0.5">{item.body}</p>
              </div>
            </Card>
          ))}
        </div>
      </section>

      <section>
        <SectionHeader
          eyebrow="WORKFLOW"
          title="정보 정리 방식"
          description="공식 데이터 수집부터 사용자 친화적 재구성까지의 흐름입니다."
        />
        <div className="space-y-3">
          {workflow.map((item) => (
            <Card key={item.title} className="border-slate-200 bg-white flex items-start gap-4">
              <span className="flex h-8 w-8 flex-none items-center justify-center rounded-lg bg-blue-600 text-white text-sm font-bold">
                {item.step}
              </span>
              <div>
                <p className="font-semibold text-slate-900 text-sm">{item.title}</p>
                <p className="text-sm leading-6 text-slate-600 mt-0.5">{item.desc}</p>
              </div>
            </Card>
          ))}
        </div>
      </section>

      <Card className="border-slate-200 bg-amber-50 border-amber-200">
        <h2 className="text-lg font-bold text-slate-900">중요한 안내</h2>
        <p className="mt-3 text-sm leading-7 text-slate-700">
          보조24는 <strong>신청 대행 서비스가 아니며</strong> 법적 자문·의료 조언·세무 상담을 제공하지 않습니다.
          본 사이트는 행정사·변호사·세무사 등 자격사가 운영하지 않습니다.
          실제 신청 자격과 일정은 해당 기관의 <strong>공식 공고 또는 주민센터 문의</strong>에서 최종 확인하세요.
        </p>
        <div className="mt-5 flex flex-wrap gap-3 text-sm">
          <Link href="/editorial-policy" className="font-semibold text-blue-600 hover:text-blue-700">
            운영 원칙 전문 →
          </Link>
          <Link href="/disclaimer" className="font-semibold text-blue-600 hover:text-blue-700">
            면책조항 →
          </Link>
          <Link href="/contact" className="font-semibold text-blue-600 hover:text-blue-700">
            문의·정정 요청 →
          </Link>
        </div>
      </Card>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webPageJsonLd) }}
      />
    </main>
  );
}
