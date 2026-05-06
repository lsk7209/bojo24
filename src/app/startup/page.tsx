import Link from "next/link";
import type { Metadata } from "next";
import { getAnonClient } from "@lib/supabaseClient";
import { buildCanonicalUrl } from "@lib/site";
import { buildStartupPath, formatStartupDate, latestStartupDate, sourceLabel } from "@lib/startup";
import { Badge, Card } from "@components/ui";
import type { StartupItem, StartupSource } from "@/types/startup";

type SearchParams = {
  q?: string;
  source?: string;
};

const SOURCES: { value: "all" | StartupSource; label: string }[] = [
  { value: "all", label: "전체" },
  { value: "mss_biz", label: "중기부 사업공고" },
  { value: "kstartup_announcement", label: "K-Startup 공고" },
  { value: "kstartup_business", label: "K-Startup 사업소개" },
  { value: "kstartup_content", label: "K-Startup 콘텐츠" },
  { value: "kstartup_statistics", label: "K-Startup 통계" },
];

export const metadata: Metadata = {
  title: "창업지원 공고",
  description: "K-Startup과 중소벤처기업부 창업·사업공고 정보를 한곳에서 확인합니다.",
  alternates: {
    canonical: buildCanonicalUrl("/startup"),
  },
};

const fetchStartupItems = async ({ q, source }: SearchParams): Promise<StartupItem[]> => {
  try {
    const db = getAnonClient();
    const query = db
      .from("startup_items")
      .select("id, source, source_id, title, category, organization, status, start_date, end_date, published_at, updated_at, url, summary, raw_json")
      .order("updated_at", { ascending: false, nullsFirst: false })
      .order("end_date", { ascending: false, nullsFirst: false })
      .order("start_date", { ascending: false, nullsFirst: false })
      .limit(30);

    if (q) query.ilike("title", `%${q}%`);
    if (source && source !== "all") query.eq("source", source);

    const { data, error } = await query;
    if (error) throw error;
    return (data ?? []) as StartupItem[];
  } catch {
    return [];
  }
};

export default async function StartupPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const resolvedSearchParams = await searchParams;
  const q = resolvedSearchParams.q || "";
  const source = resolvedSearchParams.source || "all";
  const items = await fetchStartupItems({ q, source });

  return (
    <main className="flex flex-col gap-8 pb-12">
      <section className="space-y-3">
        <p className="text-sm font-semibold uppercase tracking-wide text-blue-600">
          Startup Support
        </p>
        <h1 className="text-3xl font-black tracking-tight text-slate-950 md:text-4xl">
          창업지원 공고
        </h1>
        <p className="max-w-3xl text-sm leading-7 text-slate-600 md:text-base">
          K-Startup과 중소벤처기업부 사업공고 데이터를 수집해 예비창업자와
          초기기업이 확인해야 할 공고를 최신순으로 정리합니다.
        </p>
      </section>

      <Card className="rounded-xl">
        <form className="flex flex-col gap-4">
          <div className="flex gap-2">
            <input
              name="q"
              className="input flex-1"
              placeholder="검색어를 입력하세요 (예: 창업, 스마트공장, 소상공인)"
              defaultValue={q}
              autoComplete="off"
            />
            <button
              type="submit"
              className="rounded-xl bg-blue-600 px-5 text-sm font-semibold text-white hover:bg-blue-700"
            >
              검색
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {SOURCES.map((item) => (
              <button
                key={item.value}
                type="submit"
                name="source"
                value={item.value}
                className="pill"
                data-active={source === item.value}
              >
                {item.label}
              </button>
            ))}
          </div>
        </form>
      </Card>

      {items.length === 0 ? (
        <section className="rounded-xl border border-dashed border-slate-300 bg-white py-16 text-center">
          <h2 className="text-lg font-bold text-slate-900">수집된 창업지원 데이터가 없습니다</h2>
          <p className="mt-2 text-sm text-slate-500">
            공공데이터 API 승인키가 정상 반영된 뒤 자동 수집 결과가 이곳에 표시됩니다.
          </p>
        </section>
      ) : (
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <Link
              key={item.id}
              href={buildStartupPath(item)}
              className="group flex min-h-64 flex-col justify-between rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:border-blue-300 hover:shadow-md"
            >
              <div className="space-y-3">
                <Badge tone="muted">{sourceLabel(item.source)}</Badge>
                <h2 className="line-clamp-3 text-lg font-bold leading-7 text-slate-950 group-hover:text-blue-600">
                  {item.title}
                </h2>
                <p className="line-clamp-2 text-sm leading-6 text-slate-500">
                  {item.summary || item.organization || "상세 정보에서 원문 항목을 확인하세요."}
                </p>
              </div>
              <div className="mt-5 border-t border-slate-100 pt-4 text-xs text-slate-500">
                <p>{item.organization || "기관 정보 없음"}</p>
                <p className="mt-1">업데이트: {formatStartupDate(latestStartupDate(item))}</p>
              </div>
            </Link>
          ))}
        </section>
      )}
    </main>
  );
}
