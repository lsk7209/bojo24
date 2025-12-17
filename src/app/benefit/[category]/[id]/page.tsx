import { InlineAd, BannerAd } from "@components/adsense-ad";
import { FloatingActionButton } from "@components/fab-button";
import { buildAllStructuredData } from "./schema";
import { getServiceClient } from "@lib/supabaseClient";
import { formatDescription } from "@lib/formattext";
import { buildStructuredAnswers } from "@lib/zeroClickOptimization";
import { optimizeBenefitContent } from "@lib/benefitContentOptimizer";
import { Badge, Card } from "@components/ui";
import type { BenefitRecord } from "@/types/benefit";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { SectionHeader } from "@components/section-header";

type PageParams = {
  params: { category: string; id: string };
};

const fetchBenefit = async (id: string) => {
  const supabase = getServiceClient();
  const { data } = await supabase
    .from("benefits")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  return data as BenefitRecord | null;
};

export const generateMetadata = async ({
  params
}: PageParams): Promise<Metadata> => {
  const benefit = await fetchBenefit(params.id);
  if (!benefit) {
    return {
      title: "보조금 정보를 찾을 수 없습니다",
      description: "요청하신 보조금 정보를 찾을 수 없습니다."
    };
  }

  const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://bojo24.kr';
  const canonicalUrl = `${BASE_URL}/benefit/${params.category}/${params.id}`;
  
  // SEO 최적화된 제목 (키워드 포함)
  const titleBase = benefit.name;
  const category = benefit.category || "정부 지원금";
  const org = benefit.governing_org || "정부 기관";
  
  // Zero-click 스니펫 최적화를 위한 메타 설명
  const description = benefit.gemini_summary 
    ? `${benefit.gemini_summary.substring(0, 120)}...`
    : `${category} 분야의 ${benefit.name} 정보. ${org}에서 제공하는 지원금 자격 요건, 신청 방법, 혜택 내용을 확인하세요.`;

  // 키워드 추출 (자연어 질문 최적화)
  const keywords = [
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
  const snippet = benefit.gemini_summary 
    ? benefit.gemini_summary.split('\n')[0] // 첫 번째 문장
    : `${benefit.name}은 ${org}에서 제공하는 ${category} 분야 지원금입니다.`;

  const detail = benefit.detail_json as {
    list?: Record<string, string>;
    detail?: Record<string, string>;
  } | undefined;

  // Open Graph 이미지 (향후 추가 가능)
  const ogImage = `${BASE_URL}/api/og?title=${encodeURIComponent(benefit.name)}&category=${encodeURIComponent(category)}`;

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
      "article:author": "보조금 파인더 AI",
      "article:published_time": benefit.last_updated_at || new Date().toISOString(),
      "article:modified_time": benefit.last_updated_at || new Date().toISOString(),
      "article:section": category,
      "article:tag": keywords.join(", ")
    }
  };
};

export default async function BenefitDetailPage({ params }: PageParams) {
  const benefit = await fetchBenefit(params.id);
  if (!benefit) notFound();

  const detail = benefit.detail_json as {
    list?: Record<string, string>;
    detail?: Record<string, string>;
    supportConditions?: Record<string, string>;
  };
  
  // 공공데이터 기반 최적화된 컨텐츠 구조 생성 (구글 검색 최적화)
  const optimizedContent = optimizeBenefitContent(
    benefit.name,
    benefit.category || "정부 지원금",
    benefit.governing_org || "정부 기관",
    detail
  );
  
  // 모든 구조화 데이터 생성 (공공데이터 기반 FAQ 포함)
  const structuredData = buildAllStructuredData(benefit, params.category, optimizedContent.faqs);
  
  // Zero-click 스니펫 최적화 데이터
  const structuredAnswers = buildStructuredAnswers(benefit);
  const officialUrl =
    detail.detail?.["온라인신청사이트URL"] ||
    detail.list?.["상세조회URL"] ||
    "#";
  const contact =
    detail.detail?.["문의처"] ||
    detail.list?.["전화문의"] ||
    detail.list?.["접수기관"] ||
    benefit.governing_org ||
    "문의처 정보가 없습니다.";
  const purpose =
    detail.detail?.["서비스목적"] ||
    detail.list?.["서비스목적요약"] ||
    "";

  const faqs = (benefit.gemini_faq_json as { q: string; a: string }[] | null) || [];

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
          <h1 className="text-2xl sm:text-3xl font-bold leading-tight text-slate-900" itemProp="headline">
            {benefit.name}
          </h1>
          {purpose && (
            <p className="text-base sm:text-lg text-slate-600 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-100">
              💡 {purpose}
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
          <span>출처: 행정안전부 보조금24 공공데이터</span>
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
          description="구글 검색 최적화된 요약 정보입니다."
        />
        <Card className="bg-gradient-to-br from-blue-50 to-white border-blue-100">
          <div 
            className="text-lg leading-relaxed text-slate-800 whitespace-pre-line font-medium"
            itemProp="text"
          >
            {optimizedContent.summary}
          </div>
          <div className="mt-4 flex items-center justify-between border-t border-blue-100 pt-4">
            <div className="flex items-center gap-2 text-xs text-blue-400 font-medium">
              <span>📊 공공데이터 기반</span>
              <span>•</span>
              <span itemProp="author" itemScope itemType="https://schema.org/Organization">
                <span itemProp="name">행정안전부 보조금24</span>
              </span>
            </div>
            {benefit.last_updated_at && (
              <time 
                className="text-xs text-slate-400"
                dateTime={benefit.last_updated_at}
                itemProp="dateModified"
              >
                업데이트: {benefit.last_updated_at.substring(0, 10)}
              </time>
            )}
          </div>
        </Card>
      </section>
      
      {/* AI 요약 (있는 경우 추가 표시) */}
      {benefit.gemini_summary && benefit.gemini_summary !== optimizedContent.summary && (
        <section aria-label="AI 요약" className="opacity-75">
          <Card className="bg-slate-50/50 border-slate-200">
            <div className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">
              {benefit.gemini_summary}
            </div>
            <div className="mt-2 text-xs text-slate-400">
              🤖 AI 생성 요약
            </div>
          </Card>
        </section>
      )}


      {/* 주요 정보 그리드 (구글 검색 최적화 구조) */}
      <div className="grid gap-6 sm:grid-cols-2">
        {/* 지원 대상 섹션 */}
        <section aria-label={optimizedContent.sections.target.title} itemScope itemType="https://schema.org/Question">
          <h3 className="text-lg font-bold text-slate-900 mb-3 flex items-center gap-2">
            <span className="text-xl">🎯</span>
            <span itemProp="name">{optimizedContent.sections.target.title}</span>
          </h3>
          <Card className="h-full bg-slate-50/50">
            <div className="space-y-4 text-sm text-slate-700">
              <div itemProp="acceptedAnswer" itemScope itemType="https://schema.org/Answer">
                <div itemProp="text">
                  {formatDescription(optimizedContent.sections.target.content)}
                </div>
              </div>
              {optimizedContent.sections.target.criteria && (
                <div className="mt-4 pt-4 border-t border-slate-200">
                  <strong className="block text-slate-900 mb-1">선정 기준</strong>
                  {formatDescription(optimizedContent.sections.target.criteria)}
                </div>
              )}
            </div>
          </Card>
        </section>

        {/* 지원 내용 섹션 */}
        <section aria-label={optimizedContent.sections.benefit.title} itemScope itemType="https://schema.org/Question">
          <h3 className="text-lg font-bold text-slate-900 mb-3 flex items-center gap-2">
            <span className="text-xl">🎁</span>
            <span itemProp="name">{optimizedContent.sections.benefit.title}</span>
          </h3>
          <Card className="h-full bg-slate-50/50">
            <div className="text-sm text-slate-700 leading-relaxed">
              <div itemProp="acceptedAnswer" itemScope itemType="https://schema.org/Answer">
                <div itemProp="text">
                  {formatDescription(optimizedContent.sections.benefit.content)}
                </div>
              </div>
              {(optimizedContent.sections.benefit.amount || optimizedContent.sections.benefit.type) && (
                <div className="mt-4 pt-4 border-t border-slate-200 flex flex-wrap gap-2">
                  {optimizedContent.sections.benefit.amount && (
                    <Badge tone="primary">💰 {optimizedContent.sections.benefit.amount}</Badge>
                  )}
                  {optimizedContent.sections.benefit.type && (
                    <Badge tone="muted">📋 {optimizedContent.sections.benefit.type}</Badge>
                  )}
                </div>
              )}
            </div>
          </Card>
        </section>
      </div>

      {/* 인라인 광고 (본문 중간) - 수익화 최적화 */}
      <InlineAd adSlot="1234567890" className="my-8" />

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
            <div className="space-y-3 mt-6">
              {optimizedContent.sections.apply.steps.map((step, index) => (
                <div 
                  key={index}
                  className="flex gap-3 p-4 bg-slate-50 rounded-lg border border-slate-200"
                  itemScope
                  itemType="https://schema.org/HowToStep"
                >
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm">
                    {index + 1}
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold text-slate-900 mb-1" itemProp="name">
                      단계 {index + 1}
                    </div>
                    <div className="text-slate-700" itemProp="text">
                      {step}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {/* 필요 서류 */}
          {optimizedContent.sections.apply.documents && optimizedContent.sections.apply.documents.length > 0 && (
            <div className="mt-6 pt-6 border-t border-slate-200">
              <h4 className="font-semibold text-slate-900 mb-3">📄 필요 서류</h4>
              <ul className="space-y-2">
                {optimizedContent.sections.apply.documents.map((doc, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm text-slate-700">
                    <span className="text-blue-500 mt-1">•</span>
                    <span>{doc}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          {/* 신청 기간 */}
          {optimizedContent.sections.apply.deadline && (
            <div className="mt-4 pt-4 border-t border-slate-200">
              <strong className="block text-sm font-semibold text-slate-900 mb-1">📅 신청 기간</strong>
              <p className="text-sm text-slate-700">{optimizedContent.sections.apply.deadline}</p>
            </div>
          )}
        </Card>
      </section>


      {/* FAQ 섹션 (AEO 최적화 - 자연어 질문 답변) */}
      {faqs.length > 0 && (
        <section 
          aria-label="자주 묻는 질문"
          itemScope
          itemType="https://schema.org/QAPage"
        >
          <SectionHeader
            eyebrow="FAQ"
            title="자주 묻는 질문"
            description="사용자들이 궁금해할 만한 내용을 미리 정리했습니다."
          />
          <div className="space-y-4">
            {/* 공공데이터 기반 FAQ 우선 표시 */}
            {optimizedContent.faqs.map((item, idx) => (
              <div
                key={`optimized-${idx}`}
                className="rounded-xl border border-slate-200 bg-white p-5 transition-shadow hover:shadow-sm"
                itemScope
                itemType="https://schema.org/Question"
              >
                <h4 
                  className="flex items-start gap-2 font-bold text-slate-900 text-lg"
                  itemProp="name"
                >
                  <span className="text-blue-600">Q.</span>
                  {item.question}
                </h4>
                <div 
                  className="mt-3 text-slate-700 leading-relaxed"
                  itemProp="acceptedAnswer"
                  itemScope
                  itemType="https://schema.org/Answer"
                >
                  <p itemProp="text">{item.answer}</p>
                </div>
              </div>
            ))}
            {/* Gemini 생성 FAQ (있는 경우) */}
            {faqs.map((item, idx) => (
              <div
                key={idx}
                className="rounded-xl border border-slate-200 bg-white p-5 transition-shadow hover:shadow-sm"
                itemScope
                itemType="https://schema.org/Question"
              >
                <h4 
                  className="flex items-start gap-2 font-bold text-slate-900 text-lg"
                  itemProp="name"
                >
                  <span className="text-blue-600">Q.</span>
                  {item.q}
                </h4>
                <div 
                  className="mt-3 flex items-start gap-2 text-slate-600 leading-relaxed pl-7 border-l-2 border-slate-100 ml-1"
                  itemScope
                  itemType="https://schema.org/Answer"
                  itemProp="acceptedAnswer"
                >
                  <span itemProp="text">{item.a}</span>
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
