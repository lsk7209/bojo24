import { getAnonClient } from "@lib/supabaseClient";
import { SectionHeader } from "@components/section-header";
import { Button, Card } from "@components/ui";
import { InlineAd } from "@components/adsense-ad";
import { AD_SLOTS } from "@lib/ads";
import { BenefitListClient } from "@components/benefit-list-client";
import { buildCanonicalUrl } from "@lib/site";
import Link from "next/link";
import type { Metadata } from "next";
import type { BenefitListItem } from "@components/benefit-list-types";

const CATEGORIES = [
  "보육·교육",
  "고용·창업",
  "주거·자립",
  "생활안정",
  "보건·의료",
  "임신·출산",
  "보호·돌봄",
  "행정·안전",
  "기타"
] as const;

type SearchParams = {
  q?: string;
  category?: string;
};

const fetchBenefits = async ({
  q,
  category
}: SearchParams): Promise<BenefitListItem[]> => {
  try {
    const supabase = getAnonClient();
    const { data, error } = await supabase
      .from("benefits")
      .select("id, name, category, governing_org, last_updated_at")
      .match(
        category && category !== "all" ? { category } : {}
      )
      .ilike("name", q ? `%${q}%` : "%")
      .order("last_updated_at", { ascending: false })
      .limit(30);
    if (error) throw error;
    return data ?? [];
  } catch (err) {
    console.warn("데이터 로드 실패 또는 환경 미설정", err);
    return [];
  }
};


export const metadata: Metadata = {
  title: "지원금 목록",
  description: "수집된 보조24 지원금 목록을 한눈에 확인하세요.",
  alternates: {
    canonical: buildCanonicalUrl("/benefit"),
  },
};

export default async function BenefitListPage({
  searchParams
}: {
  searchParams: Promise<SearchParams>;
}) {
  const resolvedSearchParams = await searchParams;
  const q = resolvedSearchParams.q || "";
  const category = resolvedSearchParams.category || "all";
  const benefits = await fetchBenefits({ q, category });
  const hasData = benefits.length > 0;

  return (
    <main className="flex flex-col gap-8 pb-12">
      <SectionHeader
        eyebrow="Government Benefits"
        as="h1"
        title="지원금 찾기"
        description="나에게 필요한 정부 혜택을 검색해보세요. AI가 요약한 정보를 확인할 수 있습니다."
        action={
          <div className="hidden sm:block">
            <Link href="/">
              <Button variant="ghost">← 홈으로 돌아가기</Button>
            </Link>
          </div>
        }
      />

      {/* 검색 및 필터 영역 */}
      <div className="sticky top-4 z-20">
        <Card className="flex flex-col gap-4 shadow-lg ring-1 ring-slate-900/5 backdrop-blur-xl bg-white/80">
          <form className="flex flex-col gap-4">
            <div className="flex gap-2">
              <input
                name="q"
                className="input flex-1"
                placeholder="검색어를 입력하세요 (예: 청년수당, 임신, 주거급여)"
                defaultValue={q}
                autoComplete="off"
              />
              <Button type="submit" variant="primary" className="shrink-0 px-6">
                검색
              </Button>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold text-slate-500 mr-1">카테고리:</span>
              <input type="hidden" name="category" value={category} />

              <button
                type="submit"
                name="category"
                value="all"
                className={`pill ${category === "all" ? "data-[active=true]:bg-slate-900 data-[active=true]:text-white data-[active=true]:border-slate-900" : ""}`}
                data-active={category === "all"}
              >
                전체
              </button>

              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="submit"
                  name="category"
                  value={cat}
                  className="pill"
                  data-active={category === cat}
                >
                  {cat}
                </button>
              ))}
            </div>
          </form>
        </Card>
      </div>

      {/* 인라인 광고 (검색 결과 상단) */}
      {hasData && (
        <InlineAd adSlot={AD_SLOTS.benefitListInline} className="mb-6" />
      )}

      {/* 리스트 영역 */}
      {!hasData ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 py-20 text-center">
          <div className="mb-4 rounded-full bg-slate-100 p-4">
            <span className="text-4xl">🤔</span>
          </div>
          <h3 className="text-lg font-bold text-slate-900">검색 결과가 없습니다</h3>
          <p className="mt-2 text-slate-600 max-w-md mx-auto">
            조건에 맞는 지원금이 없거나 데이터가 업데이트되지 않았습니다. <br />
            다른 검색어로 시도해보시거나 잠시 후 다시 접속해주세요.
          </p>
          <div className="mt-6 p-4 bg-white rounded-lg border border-slate-200 text-left text-xs text-slate-500 font-mono">
            Tips: 데이터 수집이 필요할 수 있습니다. <br />
            npm run fetch:benefits
          </div>
        </div>
      ) : (
        <BenefitListClient 
          initialBenefits={benefits} 
          initialSearchParams={{ q, category }}
        />
      )}
    </main>
  );
}
