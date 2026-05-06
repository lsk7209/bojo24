import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getAnonClient } from "@lib/supabaseClient";
import { buildCanonicalUrl } from "@lib/site";
import { formatStartupDate, latestStartupDate, sourceLabel } from "@lib/startup";
import { Badge, Card } from "@components/ui";
import type { StartupItem } from "@/types/startup";

type RouteParams = {
  params: Promise<{
    id: string;
  }>;
};

const fetchStartupItem = async (id: string) => {
  const db = getAnonClient();
  const { data, error } = await db
    .from("startup_items")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;
  return data as StartupItem | null;
};

export async function generateMetadata({ params }: RouteParams): Promise<Metadata> {
  const { id } = await params;
  const item = await fetchStartupItem(id).catch(() => null);
  if (!item) {
    return {
      title: "창업지원 공고",
      robots: { index: false, follow: true },
    };
  }

  return {
    title: item.title,
    description: (item.summary || `${sourceLabel(item.source)} 정보를 확인하세요.`).slice(0, 120),
    alternates: {
      canonical: buildCanonicalUrl(`/startup/${encodeURIComponent(item.id)}`),
    },
  };
}

const rawEntries = (raw: StartupItem["raw_json"]) => {
  if (!raw) return [];
  if (typeof raw === "string") {
    try {
      return Object.entries(JSON.parse(raw) as Record<string, unknown>);
    } catch {
      return [["원문", raw]] as [string, unknown][];
    }
  }
  return Object.entries(raw);
};

export default async function StartupDetailPage({ params }: RouteParams) {
  const { id } = await params;
  const item = await fetchStartupItem(id).catch(() => null);
  if (!item) notFound();

  const dates = [
    ["접수 시작", item.start_date],
    ["접수 종료", item.end_date],
    ["게시일", item.published_at],
    ["업데이트", latestStartupDate(item)],
  ].filter((entry): entry is [string, string] => Boolean(entry[1]));

  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-8 pb-12">
      <Link href="/startup" className="text-sm font-semibold text-blue-600 hover:text-blue-700">
        ← 창업지원 공고 목록
      </Link>

      <article className="space-y-6">
        <div className="space-y-4">
          <Badge tone="muted">{sourceLabel(item.source)}</Badge>
          <h1 className="text-3xl font-black leading-tight text-slate-950 md:text-4xl">
            {item.title}
          </h1>
          <p className="text-sm text-slate-500">
            {item.organization || "기관 정보 없음"}
          </p>
        </div>

        {item.summary && (
          <Card className="rounded-xl">
            <h2 className="mb-3 text-lg font-bold text-slate-950">요약</h2>
            <p className="whitespace-pre-wrap text-sm leading-7 text-slate-700">{item.summary}</p>
          </Card>
        )}

        <Card className="rounded-xl">
          <h2 className="mb-4 text-lg font-bold text-slate-950">기본 정보</h2>
          <dl className="grid gap-3 text-sm sm:grid-cols-2">
            {dates.map(([label, value]) => (
              <div key={label} className="rounded-lg bg-slate-50 p-3">
                <dt className="font-semibold text-slate-500">{label}</dt>
                <dd className="mt-1 text-slate-950">{formatStartupDate(value)}</dd>
              </div>
            ))}
            {item.category && (
              <div className="rounded-lg bg-slate-50 p-3">
                <dt className="font-semibold text-slate-500">분류</dt>
                <dd className="mt-1 text-slate-950">{item.category}</dd>
              </div>
            )}
            {item.status && (
              <div className="rounded-lg bg-slate-50 p-3">
                <dt className="font-semibold text-slate-500">상태</dt>
                <dd className="mt-1 text-slate-950">{item.status}</dd>
              </div>
            )}
          </dl>
          {item.url && (
            <a
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-5 inline-flex rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
            >
              공식 페이지 열기
            </a>
          )}
        </Card>

        <Card className="rounded-xl">
          <h2 className="mb-4 text-lg font-bold text-slate-950">원문 데이터</h2>
          <dl className="divide-y divide-slate-100 text-sm">
            {rawEntries(item.raw_json).map(([key, value]) => (
              <div key={key} className="grid gap-2 py-3 sm:grid-cols-[160px_1fr]">
                <dt className="font-semibold text-slate-500">{key}</dt>
                <dd className="whitespace-pre-wrap break-words text-slate-800">
                  {typeof value === "string" ? value : JSON.stringify(value)}
                </dd>
              </div>
            ))}
          </dl>
        </Card>
      </article>
    </main>
  );
}
