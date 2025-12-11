import { AdPlaceholder } from "@components/ad-placeholder";
import { FloatingActionButton } from "@components/fab-button";
import { buildFaqJsonLd } from "./schema";
import { getServiceClient } from "@lib/supabaseClient";
import { formatDescription } from "@lib/formattext";
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
  const titleBase = benefit?.name ?? "공공서비스 상세";
  const category = benefit?.category ? ` | ${benefit.category}` : "";
  const last = benefit?.last_updated_at
    ? ` | 업데이트: ${benefit.last_updated_at?.substring(0, 10)}`
    : "";
  const listSummary =
    ((benefit?.detail_json as { list?: Record<string, string> } | undefined)
      ?.list?.["서비스목적요약"]) || undefined;
  const org = benefit?.governing_org ? ` | ${benefit.governing_org}` : "";
  return {
    title: `${titleBase}${category}${org}${last}`,
    description:
      benefit?.gemini_summary ??
      listSummary ??
      [benefit?.governing_org, benefit?.category, "보조금24 공공서비스 상세 정보"]
        .filter(Boolean)
        .join(" · "),
    alternates: {
      canonical: `https://example.com/benefit/${params.category}/${params.id}`
    }
  };
};

export default async function BenefitDetailPage({ params }: PageParams) {
  const benefit = await fetchBenefit(params.id);
  if (!benefit) notFound();

  const jsonLd = buildFaqJsonLd(benefit);
  const detail = benefit.detail_json as {
    list?: Record<string, string>;
    detail?: Record<string, string>;
    supportConditions?: Record<string, string>;
  };
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

      {/* 헤더 카드 */}
      <div className="relative overflow-hidden rounded-2xl bg-white p-6 sm:p-8 shadow-sm ring-1 ring-slate-200">
        <div className="relative z-10 flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="primary">{benefit.category}</Badge>
            <Badge tone="muted">{benefit.governing_org}</Badge>
            {benefit.last_updated_at && (
              <span className="text-xs text-slate-400 ml-auto">
                업데이트: {benefit.last_updated_at.substring(0, 10)}
              </span>
            )}
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold leading-tight text-slate-900">
            {benefit.name}
          </h1>
          {purpose && (
            <p className="text-base sm:text-lg text-slate-600 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-100">
              💡 {purpose}
            </p>
          )}
        </div>
        <div className="absolute top-0 right-0 -mr-16 -mt-16 h-64 w-64 rounded-full bg-blue-50 blur-3xl opacity-60 pointer-events-none" />
      </div>

      {/* AI 요약 섹션 */}
      {benefit.gemini_summary && (
        <section aria-label="AI 요약">
          <SectionHeader
            eyebrow="AI SUMMARY"
            title="3줄 요약"
            description="복잡한 내용을 AI가 알기 쉽게 정리했습니다."
          />
          <Card className="bg-gradient-to-br from-blue-50 to-white border-blue-100">
            <div className="text-lg leading-relaxed text-slate-800 whitespace-pre-line font-medium">
              {benefit.gemini_summary}
            </div>
            <div className="mt-4 text-xs text-blue-400 font-medium flex items-center gap-1">
              <span>🤖 Google Gemini 생성</span>
            </div>
          </Card>
        </section>
      )}

      {/* 주요 정보 그리드 */}
      <div className="grid gap-6 sm:grid-cols-2">
        <section aria-label="지원 대상">
          <h3 className="text-lg font-bold text-slate-900 mb-3 flex items-center gap-2">
            <span className="text-xl">🎯</span> 지원 대상
          </h3>
          <Card className="h-full bg-slate-50/50">
            <div className="space-y-4 text-sm text-slate-700">
              <div>
                <strong className="block text-slate-900 mb-1">대상 요건</strong>
                {formatDescription(detail.detail?.["지원대상"] || detail.list?.["지원대상"] || "상세 정보 없음")}
              </div>
              <div>
                <strong className="block text-slate-900 mb-1">선정 기준</strong>
                {formatDescription(detail.detail?.["선정기준"] || detail.list?.["선정기준"] || "상세 정보 없음")}
              </div>
            </div>
          </Card>
        </section>

        <section aria-label="지원 내용">
          <h3 className="text-lg font-bold text-slate-900 mb-3 flex items-center gap-2">
            <span className="text-xl">🎁</span> 지원 내용
          </h3>
          <Card className="h-full bg-slate-50/50">
            <div className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">
              {formatDescription(detail.detail?.["지원내용"] || detail.list?.["지원내용"] || "상세 정보 없음")}
            </div>
          </Card>
        </section>
      </div>

      {/* 광고 플레이스홀더 */}
      <AdPlaceholder label="맞춤형 혜택 광고 (준비중)" />

      {/* 신청 방법 - Step UI */}
      <section aria-label="신청 방법">
        <SectionHeader title="신청 방법" />
        <Card>
          <div className="text-slate-800 leading-relaxed whitespace-pre-wrap mb-6">
            {formatDescription(detail.detail?.["신청방법"] || detail.list?.["신청방법"] || "상세 정보 없음")}
          </div>

          <div className="flex flex-col sm:flex-row gap-4 border-t border-slate-100 pt-6">
            <div className="flex-1">
              <strong className="block text-sm font-semibold text-slate-900 mb-1">문의처</strong>
              <p className="text-sm text-slate-600">{contact}</p>
            </div>
            {officialUrl !== "#" && (
              <a
                href={officialUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-primary sm:w-auto w-full"
              >
                신청 사이트 이동하기 →
              </a>
            )}
          </div>
        </Card>
      </section>

      {/* FAQ 섹션 */}
      {faqs.length > 0 && (
        <section aria-label="자주 묻는 질문">
          <SectionHeader
            eyebrow="FAQ"
            title="자주 묻는 질문"
            description="사용자들이 궁금해할 만한 내용을 미리 정리했습니다."
          />
          <div className="space-y-4">
            {faqs.map((item, idx) => (
              <div
                key={idx}
                className="rounded-xl border border-slate-200 bg-white p-5 transition-shadow hover:shadow-sm"
              >
                <h4 className="flex items-start gap-2 font-bold text-slate-900 text-lg">
                  <span className="text-blue-600">Q.</span>
                  {item.q}
                </h4>
                <div className="mt-3 flex items-start gap-2 text-slate-600 leading-relaxed pl-7 border-l-2 border-slate-100 ml-1">
                  {item.a}
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

      {/* 구조화 데이터 */}
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: jsonLd }}
        />
      )}
    </main>
  );
}
