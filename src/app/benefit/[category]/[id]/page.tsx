import { InlineAd } from "@components/adsense-ad";
import { FloatingActionButton } from "@components/fab-button";
import { buildAllStructuredData } from "./schema";
import { AD_SLOTS } from "@lib/ads";
import { getServiceClient } from "@lib/supabaseClient";
import { formatDescription } from "@lib/formattext";
import { formatMarkdown } from "@lib/formatMarkdown";
import { cleanMarkdown } from "@lib/cleanMarkdown";
import { buildStructuredAnswers } from "@lib/zeroClickOptimization";
import { optimizeBenefitContent, generateSummary } from "@lib/benefitContentOptimizer";
import { resolveSiteUrl } from "@lib/site";
import { Badge, Card } from "@components/ui";
import type { BenefitRecord } from "@/types/benefit";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { SectionHeader } from "@components/section-header";
import { unstable_cache } from "next/cache";

type PageParams = {
  params: Promise<{ category: string; id: string }>;
};

export const revalidate = 86400;

const fetchBenefit = unstable_cache(async (id: string) => {
  const supabase = getServiceClient();
  const { data } = await supabase
    .from("benefits")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  return data as BenefitRecord | null;
}, ["benefit-detail"], { revalidate: 86400 });

const getOptimizedContent = unstable_cache(optimizeBenefitContent, ["benefit-optimized-content"], {
  revalidate: 86400,
});

export const generateMetadata = async ({
  params
}: PageParams): Promise<Metadata> => {
  const { category: routeCategory, id } = await params;
  const benefit = await fetchBenefit(id);
  if (!benefit) {
    return {
      title: "보조금 정보를 찾을 수 없습니다",
      description: "요청하신 보조금 정보를 찾을 수 없습니다."
    };
  }

  const BASE_URL = resolveSiteUrl();
  const canonicalUrl = `${BASE_URL}/benefit/${routeCategory}/${id}`;
  
  // SEO 최적화된 제목 (키워드 포함)
  const titleBase = benefit.name;
  const category = benefit.category || "정부 지원금";
  const org = benefit.governing_org || "정부 기관";
  
  const benefitDetail = benefit.detail_json as {
    list?: Record<string, string>;
    detail?: Record<string, string>;
    supportConditions?: Record<string, string>;
  } | undefined;
  
  // 공공데이터 기반 최적화된 컨텐츠 생성 (부족한 부분은 Gemini로 보완)
  // 메타데이터 생성 시에는 빠른 응답을 위해 공공데이터만 사용 (Gemini 보완 제외)
  const detailData = benefitDetail?.detail || benefitDetail?.list || {};
  const publicSummary = generateSummary(benefit.name, category, org, detailData);
  const optimizedContent = {
    summary: publicSummary,
    keywords: [
      benefit.name,
      category,
      org,
      "보조금",
      "정부 지원금",
      "신청 방법",
      "자격 요건"
    ].filter(Boolean)
  };

  // Zero-click 스니펫 최적화를 위한 메타 설명 (공공데이터 기반)
  const description = optimizedContent.summary.length > 120
    ? `${optimizedContent.summary.substring(0, 120)}...`
    : `${category} 분야의 ${benefit.name} 정보. ${org}에서 제공하는 지원금 자격 요건, 신청 방법, 혜택 내용을 확인하세요.`;

  // 키워드 추출 (자연어 질문 최적화)
  const keywords = optimizedContent.keywords.length > 0
    ? optimizedContent.keywords
    : [
        benefit.name,
        category,
        org,
        "보조금",
        "정부 지원금",
        "신청 방법",
        "자격 요건",
        `${benefit.name} 신청`,
        `${benefit.name} 자격`,
        `${benefit.name} 받는 방법`,
        `${category} 보조금`
      ].filter(Boolean);

  // Zero-click 답변을 위한 요약 (구글 스니펫 타겟팅)
  const snippet = optimizedContent.summary.split('\n')[0] || optimizedContent.summary.substring(0, 100);

  const detail = benefit.detail_json as {
    list?: Record<string, string>;
    detail?: Record<string, string>;
  } | undefined;

  const ogImage = `${BASE_URL}/opengraph-image`;

  // Zero-click 스니펫을 위한 추가 메타데이터
  const answerSnippet = snippet; // 구글 스니펫에 표시될 답변

  return {
    title: `${titleBase} | ${category} | ${org}`,
    description,
    keywords: keywords.join(", "),
    alternates: {
      canonical: canonicalUrl
    },
    openGraph: {
      title: `${titleBase} - ${category}`,
      description,
      url: canonicalUrl,
      siteName: "보조24",
      locale: "ko_KR",
      type: "article",
      publishedTime: benefit.last_updated_at || undefined,
      modifiedTime: benefit.last_updated_at || undefined,
      authors: [org],
      tags: keywords,
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: benefit.name
        }
      ],
      // Zero-click 최적화
      section: category
    },
    twitter: {
      card: "summary_large_image",
      title: `${titleBase} - ${category}`,
      description,
      images: [ogImage],
      creator: "@bojo24" // 트위터 계정이 있다면
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-video-preview": -1,
        "max-image-preview": "large",
        "max-snippet": -1, // 전체 스니펫 표시 허용
        "noimageindex": false
      }
    },
    // 추가 메타 태그 (Zero-click 최적화)
    other: {
      "answer": answerSnippet, // 구글 스니펫 답변
      "article:author": "보조24",
      "article:published_time": benefit.last_updated_at || new Date().toISOString(),
      "article:modified_time": benefit.last_updated_at || new Date().toISOString(),
      "article:section": category,
      "article:tag": keywords.join(", ")
    }
  };
};

export default async function BenefitDetailPage({ params }: PageParams) {
  const { category: routeCategory, id } = await params;
  const benefit = await fetchBenefit(id);
  if (!benefit) notFound();

  const detail = benefit.detail_json as {
    list?: Record<string, string>;
    detail?: Record<string, string>;
    supportConditions?: Record<string, string>;
  } | undefined;
  
  // 공공데이터 기반 최적화된 컨텐츠 구조 생성
  // 특정 보조금 ID에 대해서만 Gemini 보완 가능 (환경 변수로 제어)
  const optimizedContent = await getOptimizedContent(
    benefit.name,
    benefit.category || "정부 지원금",
    benefit.governing_org || "정부 기관",
    detail || {},
    benefit.id // benefitId 전달 (Gemini 보완 활성화 여부 확인용)
  );
  
  // 모든 구조화 데이터 생성 (공공데이터 기반 FAQ 포함)
  const structuredData = buildAllStructuredData(benefit, routeCategory, optimizedContent.faqs);
  
  // Zero-click 스니펫 최적화 데이터
  const structuredAnswers = buildStructuredAnswers(benefit);
  const officialUrl =
    detail?.detail?.["온라인신청사이트URL"] ||
    detail?.list?.["상세조회URL"] ||
    "#";
  const contact =
    detail?.detail?.["문의처"] ||
    detail?.list?.["전화문의"] ||
    detail?.list?.["접수기관"] ||
    benefit.governing_org ||
    "문의처 정보가 없습니다.";
  const purpose =
    detail?.detail?.["서비스목적"] ||
    detail?.list?.["서비스목적요약"] ||
    "";

  // Gemini FAQ 제거, 공공데이터 기반 FAQ만 사용

  return (
    <main className="mx-auto flex max-w-4xl flex-col gap-6 pb-24 sm:pb-32">
      {/* 네비게이션 */}
      <nav className="flex items-center gap-2 text-sm text-slate-500 mb-2">
        <Link href="/" className="hover:text-blue-600">홈</Link>
        <span>&gt;</span>
        <Link href="/benefit" className="hover:text-blue-600">지원금 목록</Link>
        <span>&gt;</span>
        <span className="font-medium text-slate-900 line-clamp-1">{benefit.name}</span>
      </nav>

      {/* 헤더 카드 (Article Schema) */}
      <article className="relative overflow-hidden rounded-2xl bg-white p-6 sm:p-8 shadow-sm ring-1 ring-slate-200" itemScope itemType="https://schema.org/Article">
        <div className="relative z-10 flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="primary">{benefit.category}</Badge>
            <Badge tone="muted">{benefit.governing_org}</Badge>
            {benefit.last_updated_at && (
              <time 
                className="text-xs text-slate-400 ml-auto"
                dateTime={benefit.last_updated_at}
                itemProp="dateModified"
              >
                업데이트: {benefit.last_updated_at.substring(0, 10)}
              </time>
            )}
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold leading-tight text-slate-900 mb-4" itemProp="headline">
            {benefit.name}
          </h1>
          {purpose && (
            <p className="text-base sm:text-lg text-slate-700 leading-relaxed bg-gradient-to-r from-blue-50 to-indigo-50 p-5 rounded-xl border-2 border-blue-100 font-medium">
              <span className="inline-block mr-2 text-xl">💡</span>
              {purpose}
            </p>
          )}
        </div>
        <div className="absolute top-0 right-0 -mr-16 -mt-16 h-64 w-64 rounded-full bg-blue-50 blur-3xl opacity-60 pointer-events-none" />
        
        {/* 출처 정보 (GEO - Authoritativeness) */}
        <div className="mt-4 pt-4 border-t border-slate-100 text-xs text-slate-500">
          <span itemProp="publisher" itemScope itemType="https://schema.org/Organization">
            <span itemProp="name">보조24</span>
          </span>
          {" • "}
          <span>출처: 행정안전부 보조24 공공데이터</span>
          {" • "}
          <span itemProp="provider" itemScope itemType="https://schema.org/Organization">
            <span itemProp="name">{benefit.governing_org}</span>
          </span>
        </div>
      </article>

      {/* 핵심 요약 (Zero-click 스니펫 최적화) */}
      <section aria-label="요약" itemScope itemType="https://schema.org/Answer">
        <SectionHeader
          eyebrow="SUMMARY"
          title="핵심 요약"
          description="한눈에 파악하는 지원금 정보입니다."
        />
        <Card className="bg-gradient-to-br from-blue-50 via-blue-50/50 to-white border-2 border-blue-200 shadow-md">
          <div 
            className="text-base sm:text-lg leading-relaxed text-slate-900 whitespace-pre-line break-words"
            itemProp="text"
          >
            {cleanMarkdown(optimizedContent.summary)}
          </div>
          <div className="mt-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-t border-blue-200 pt-4">
            <div className="flex items-center gap-2 text-xs text-blue-600 font-semibold">
              <span className="inline-flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                공공데이터 기반
              </span>
              <span>•</span>
              <span itemProp="author" itemScope itemType="https://schema.org/Organization">
                <span itemProp="name">행정안전부 보조24</span>
              </span>
            </div>
            {benefit.last_updated_at && (
              <time 
                className="text-xs text-slate-500 font-medium"
                dateTime={benefit.last_updated_at}
                itemProp="dateModified"
              >
                최종 업데이트: {benefit.last_updated_at.substring(0, 10)}
              </time>
            )}
          </div>
        </Card>
      </section>
      


      {/* 주요 정보 그리드 (구글 검색 최적화 구조) */}
      <div className="grid gap-6 sm:grid-cols-2">
        {/* 지원 대상 섹션 */}
        <section aria-label={optimizedContent.sections.target.title} itemScope itemType="https://schema.org/Question">
          <h3 className="text-xl sm:text-2xl font-bold text-slate-900 mb-4 flex items-center gap-3">
            <span className="flex-shrink-0 w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center text-2xl">🎯</span>
            <span itemProp="name">{optimizedContent.sections.target.title}</span>
          </h3>
          <Card className="h-full bg-gradient-to-br from-slate-50 to-white border-2 border-slate-200 hover:border-blue-300 transition-colors">
            <div className="space-y-4 text-base text-slate-800 leading-relaxed">
              <div itemProp="acceptedAnswer" itemScope itemType="https://schema.org/Answer">
                <div itemProp="text">
                  {/* Gemini 보완된 내용은 마크다운 형식, 공공데이터는 일반 형식 */}
                  {optimizedContent.sections.target.content.includes("**") || 
                   optimizedContent.sections.target.content.includes("- ") ||
                   optimizedContent.sections.target.content.includes("•") 
                    ? formatMarkdown(optimizedContent.sections.target.content)
                    : formatDescription(optimizedContent.sections.target.content)}
                </div>
              </div>
              {optimizedContent.sections.target.criteria && (
                <div className="mt-5 pt-5 border-t-2 border-slate-200">
                  <strong className="block text-slate-900 mb-2 text-lg font-semibold">📋 선정 기준</strong>
                  <div className="text-slate-700">
                    {formatDescription(optimizedContent.sections.target.criteria)}
                  </div>
                </div>
              )}
            </div>
          </Card>
        </section>

        {/* 지원 내용 섹션 */}
        <section aria-label={optimizedContent.sections.benefit.title} itemScope itemType="https://schema.org/Question">
          <h3 className="text-xl sm:text-2xl font-bold text-slate-900 mb-4 flex items-center gap-3">
            <span className="flex-shrink-0 w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center text-2xl">🎁</span>
            <span itemProp="name">{optimizedContent.sections.benefit.title}</span>
          </h3>
          <Card className="h-full bg-gradient-to-br from-green-50/30 to-white border-2 border-green-200 hover:border-green-400 transition-colors">
            <div className="text-base text-slate-800 leading-relaxed">
              <div itemProp="acceptedAnswer" itemScope itemType="https://schema.org/Answer">
                <div itemProp="text">
                  {/* Gemini 보완된 내용은 마크다운 형식, 공공데이터는 일반 형식 */}
                  {optimizedContent.sections.benefit.content.includes("**") || 
                   optimizedContent.sections.benefit.content.includes("- ") ||
                   optimizedContent.sections.benefit.content.includes("•") 
                    ? formatMarkdown(optimizedContent.sections.benefit.content)
                    : formatDescription(optimizedContent.sections.benefit.content)}
                </div>
              </div>
              {(optimizedContent.sections.benefit.amount || optimizedContent.sections.benefit.type) && (
                <div className="mt-5 pt-5 border-t-2 border-green-200 flex flex-wrap gap-3">
                  {optimizedContent.sections.benefit.amount && (
                    <Badge tone="primary" className="text-sm px-4 py-1.5">💰 {optimizedContent.sections.benefit.amount}</Badge>
                  )}
                  {optimizedContent.sections.benefit.type && (
                    <Badge tone="muted" className="text-sm px-4 py-1.5">📋 {optimizedContent.sections.benefit.type}</Badge>
                  )}
                </div>
              )}
            </div>
          </Card>
        </section>
      </div>

      {/* 인라인 광고 (본문 중간) - 수익화 최적화 */}
      <InlineAd adSlot={AD_SLOTS.benefitDetailInline} className="my-8" />

      {/* 신청 방법 (구글 HowTo Schema 최적화) */}
      <section aria-label={optimizedContent.sections.apply.title} itemScope itemType="https://schema.org/HowTo">
        <SectionHeader title={optimizedContent.sections.apply.title} />
        <Card>
          {/* 신청 방법 설명 */}
          {optimizedContent.sections.apply.method && (
            <div 
              className="text-slate-800 leading-relaxed whitespace-pre-wrap mb-6"
              itemProp="description"
            >
              {formatDescription(optimizedContent.sections.apply.method)}
            </div>
          )}
          
          {/* 단계별 가이드 (구조화) */}
          {optimizedContent.sections.apply.steps.length > 0 && (
            <div className="space-y-4 mt-6">
              {optimizedContent.sections.apply.steps.map((step, index) => (
                <div 
                  key={index}
                  className="flex gap-4 p-5 bg-gradient-to-r from-blue-50/50 to-white rounded-xl border-2 border-blue-100 hover:border-blue-300 hover:shadow-md transition-all"
                  itemScope
                  itemType="https://schema.org/HowToStep"
                >
                  <div className="flex-shrink-0 w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-base shadow-md">
                    {index + 1}
                  </div>
                  <div className="flex-1 pt-0.5">
                    <div className="font-bold text-slate-900 mb-2 text-lg" itemProp="name">
                      단계 {index + 1}
                    </div>
                    <div className="text-slate-700 leading-relaxed text-base" itemProp="text">
                      {cleanMarkdown(step)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {/* 필요 서류 */}
          {optimizedContent.sections.apply.documents && optimizedContent.sections.apply.documents.length > 0 && (
            <div className="mt-8 pt-6 border-t-2 border-slate-200">
              <h4 className="font-bold text-slate-900 mb-4 text-lg flex items-center gap-2">
                <span className="text-xl">📄</span>
                필요 서류
              </h4>
              <ul className="space-y-3">
                {optimizedContent.sections.apply.documents.map((doc, idx) => (
                  <li key={idx} className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center text-xs font-bold mt-0.5">✓</span>
                    <span className="text-slate-800 leading-relaxed text-base">{doc}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          {/* 신청 기간 */}
          {optimizedContent.sections.apply.deadline && (
            <div className="mt-6 pt-6 border-t-2 border-slate-200">
              <div className="flex items-center gap-3 p-4 bg-orange-50 rounded-xl border-2 border-orange-200">
                <span className="text-2xl">📅</span>
                <div>
                  <strong className="block text-base font-bold text-slate-900 mb-1">신청 기간</strong>
                  <p className="text-base text-slate-800 font-medium">{optimizedContent.sections.apply.deadline}</p>
                </div>
              </div>
            </div>
          )}
        </Card>
      </section>

      {/* 정책 분석 섹션 (고유 컨텐츠 - 전문성 강조) */}
      {optimizedContent.sections.analysis && (
        <section aria-label="정책 분석" itemScope itemType="https://schema.org/Article">
          <SectionHeader
            eyebrow="ANALYSIS"
            title={optimizedContent.sections.analysis.title}
            description="공공데이터를 분석한 정책 인사이트입니다."
          />
          <Card className="bg-gradient-to-br from-purple-50 via-purple-50/30 to-white border-2 border-purple-200 shadow-md">
            <div className="text-base text-slate-900 leading-relaxed mb-6" itemProp="articleBody">
              {optimizedContent.sections.analysis.content}
            </div>
            {optimizedContent.sections.analysis.insights && optimizedContent.sections.analysis.insights.length > 0 && (
              <div className="mt-6 pt-6 border-t-2 border-purple-200">
                <h4 className="font-bold text-slate-900 mb-4 text-lg flex items-center gap-2">
                  <span className="text-xl">💡</span>
                  주요 인사이트
                </h4>
                <ul className="space-y-3">
                  {optimizedContent.sections.analysis.insights.map((insight, idx) => (
                    <li key={idx} className="flex items-start gap-3 p-3 bg-white rounded-lg border border-purple-100">
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-purple-500 text-white flex items-center justify-center text-xs font-bold mt-0.5">✓</span>
                      <span className="text-base text-slate-800 leading-relaxed">{insight}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <div className="mt-6 pt-4 border-t border-purple-100 text-xs text-slate-600 font-medium">
              <span itemProp="publisher" itemScope itemType="https://schema.org/Organization">
                <span itemProp="name">보조24</span>
              </span>
              {" • "}
              <span>공공데이터 기반 분석</span>
            </div>
          </Card>
        </section>
      )}

      {/* 실전 팁 섹션 (고유 컨텐츠 - 경험 기반) */}
      {optimizedContent.sections.tips && optimizedContent.sections.tips.items.length > 0 && (
        <section aria-label="실전 팁" itemScope itemType="https://schema.org/HowTo">
          <SectionHeader
            eyebrow="TIPS"
            title={optimizedContent.sections.tips.title}
            description="신청 시 유용한 실전 팁입니다."
          />
          <Card className="bg-gradient-to-br from-green-50 via-green-50/30 to-white border-2 border-green-200 shadow-md">
            <ul className="space-y-4">
              {optimizedContent.sections.tips.items.map((tip, idx) => (
                <li 
                  key={idx}
                  className="flex items-start gap-4 p-4 bg-white rounded-xl border-2 border-green-100 hover:border-green-300 hover:shadow-sm transition-all"
                  itemScope
                  itemType="https://schema.org/HowToTip"
                >
                  <span className="flex-shrink-0 w-8 h-8 rounded-xl bg-green-600 text-white flex items-center justify-center text-sm font-bold shadow-md">
                    {idx + 1}
                  </span>
                  <span className="text-base text-slate-800 leading-relaxed pt-1" itemProp="text">
                    {tip}
                  </span>
                </li>
              ))}
            </ul>
            <div className="mt-6 pt-4 border-t-2 border-green-100 text-xs text-slate-600 font-medium">
              💡 공공데이터 분석을 바탕으로 한 실용적인 조언입니다.
            </div>
          </Card>
        </section>
      )}

      {/* 신청 일정 섹션 */}
      {optimizedContent.sections.timeline && (
        <section aria-label="신청 일정">
          <SectionHeader
            eyebrow="TIMELINE"
            title={optimizedContent.sections.timeline.title}
            description="신청 및 지급 일정 정보입니다."
          />
          <Card className="bg-gradient-to-br from-orange-50 via-orange-50/30 to-white border-2 border-orange-200 shadow-md">
            <div className="text-base text-slate-900 leading-relaxed whitespace-pre-line font-medium">
              {optimizedContent.sections.timeline.content}
            </div>
            <div className="mt-6 pt-4 border-t-2 border-orange-100 text-xs text-slate-600 font-medium bg-orange-50/50 p-3 rounded-lg">
              ⚠️ 정확한 일정은 공식 홈페이지에서 최종 확인하시기 바랍니다.
            </div>
          </Card>
        </section>
      )}

      {/* FAQ 섹션 (AEO 최적화 - 자연어 질문 답변, 공공데이터 기반) */}
      {optimizedContent.faqs.length > 0 && (
        <section 
          aria-label="자주 묻는 질문"
          itemScope
          itemType="https://schema.org/QAPage"
        >
          <SectionHeader
            eyebrow="FAQ"
            title="자주 묻는 질문"
            description="공공데이터를 기반으로 자동 생성된 질문과 답변입니다."
          />
          <div className="space-y-4">
            {optimizedContent.faqs.map((item, idx) => (
              <div
                key={`faq-${idx}`}
                className="rounded-xl border-2 border-slate-200 bg-white p-6 transition-all hover:shadow-lg hover:border-blue-300"
                itemScope
                itemType="https://schema.org/Question"
              >
                <h4 
                  className="flex items-start gap-3 font-bold text-slate-900 text-lg mb-4"
                  itemProp="name"
                >
                  <span className="flex-shrink-0 w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center text-sm font-bold">Q</span>
                  <span className="pt-1">{item.question}</span>
                </h4>
                <div 
                  className="ml-11 text-base text-slate-800 leading-relaxed pl-4 border-l-2 border-blue-100"
                  itemProp="acceptedAnswer"
                  itemScope
                  itemType="https://schema.org/Answer"
                >
                  <p itemProp="text" className="font-medium">{cleanMarkdown(item.answer)}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* 하단 플로팅 버튼 (모바일용) */}
      {officialUrl !== "#" && (
        <FloatingActionButton
          href={officialUrl}
          label="지금 신청하러 가기"
          ariaLabel="공식 사이트로 이동"
        />
      )}

      {/* 구조화 데이터 (SEO + GEO + AEO 최적화) */}
      {structuredData.map((data, index) => (
        <script
          key={index}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: data }}
        />
      ))}
      
      {/* Zero-click 스니펫 메타 태그 */}
      <meta name="answer" content={structuredAnswers.zeroClickAnswer} />
      <meta name="description" content={structuredAnswers.zeroClickAnswer} />
    </main>
  );
}
