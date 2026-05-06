import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getAnonClient } from "@lib/supabaseClient";
import { buildCanonicalUrl } from "@lib/site";
import { cleanStartupText, formatStartupDate, latestStartupDate, sourceLabel } from "@lib/startup";
import { Badge, Card } from "@components/ui";
import type { StartupItem } from "@/types/startup";

type RouteParams = {
  params: Promise<{
    id: string;
  }>;
};

const decodeRouteId = (id: string) => {
  try {
    return decodeURIComponent(id);
  } catch {
    return id;
  }
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
  const item = await fetchStartupItem(decodeRouteId(id)).catch(() => null);
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

const rawRecord = (raw: StartupItem["raw_json"]) => {
  if (!raw) return {};
  if (typeof raw === "string") {
    try {
      return JSON.parse(raw) as Record<string, unknown>;
    } catch {
      return { 원문: raw };
    }
  }
  return raw;
};

const getRawText = (raw: Record<string, unknown>, keys: string[]) => {
  for (const key of keys) {
    const value = raw[key];
    if (value === null || value === undefined) continue;
    if (typeof value === "string" && value.trim()) return cleanStartupText(value);
    if (typeof value === "number") return String(value);
  }
  return "";
};

const detailRows = (item: StartupItem) => {
  const raw = rawRecord(item.raw_json);
  return [
    ["신청 대상", getRawText(raw, ["aply_trgt_ctnt", "aply_trgt", "biz_supt_trgt_info", "dataContents"])],
    ["지원 내용", getRawText(raw, ["biz_supt_ctnt", "supt_biz_intrd_info", "pbanc_ctnt", "ctnt", "dataContents"]) || item.summary || ""],
    ["신청 방법", getRawText(raw, ["aply_mthd_onli_rcpt_istc", "biz_aply_url", "viewUrl", "detl_pg_url"])],
    ["담당 부서", getRawText(raw, ["biz_prch_dprt_nm", "writerPosition", "pbanc_ntrp_nm", "sprv_inst"]) || item.organization || ""],
    ["문의처", getRawText(raw, ["prch_cnpl_no", "writerPhone", "writerEmail"])],
    ["지원 지역", getRawText(raw, ["supt_regin"])],
  ].filter((entry): entry is [string, string] => Boolean(entry[1]));
};

export default async function StartupDetailPage({ params }: RouteParams) {
  const { id } = await params;
  const item = await fetchStartupItem(decodeRouteId(id)).catch(() => null);
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
                <dd className="mt-1 text-slate-950">{item.status === "Y" ? "모집중" : item.status === "N" ? "마감" : item.status}</dd>
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

        {detailRows(item).length > 0 && (
          <Card className="rounded-xl">
            <h2 className="mb-4 text-lg font-bold text-slate-950">상세 안내</h2>
            <dl className="divide-y divide-slate-100 text-sm">
              {detailRows(item).map(([label, value]) => (
                <div key={label} className="grid gap-2 py-4 sm:grid-cols-[120px_1fr]">
                  <dt className="font-semibold text-slate-500">{label}</dt>
                  <dd className="whitespace-pre-wrap break-words leading-7 text-slate-800">{value}</dd>
                </div>
              ))}
            </dl>
          </Card>
        )}
      </article>
    </main>
  );
}
