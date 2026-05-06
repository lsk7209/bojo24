/* eslint-disable no-console */
import "./loadScriptEnv";
import { getServiceClient } from "@lib/supabaseClient";
import { env, validateEnv } from "@lib/env";
import { findFirstString, stableStartupId } from "@lib/startup";
import type { StartupItem, StartupSource } from "@/types/startup";

validateEnv(["PUBLICDATA_SERVICE_KEY_ENC", "SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"]);

type SourceConfig = {
  source: StartupSource;
  baseUrl: string;
  path: string;
  format: "json" | "xml";
  pageParam: "page" | "pageNo";
  sizeParam: "perPage" | "numOfRows";
  pageSize: number;
  maxPages: number;
};

const serviceKey = decodeURIComponent(env.PUBLICDATA_SERVICE_KEY_ENC);
const delayMs = Number(process.env.STARTUP_FETCH_DELAY_MS || 600);
const defaultMaxPages = Number(process.env.STARTUP_FETCH_MAX_PAGES || 5);

const sources: SourceConfig[] = [
  {
    source: "mss_biz",
    baseUrl: process.env.MSS_BIZ_BASE_URL || "https://apis.data.go.kr/1421000/mssBizService_v2",
    path: "getbizList_v2",
    format: "xml",
    pageParam: "pageNo",
    sizeParam: "numOfRows",
    pageSize: Number(process.env.MSS_BIZ_PAGE_SIZE || 50),
    maxPages: Number(process.env.MSS_BIZ_MAX_PAGES || Math.min(defaultMaxPages, 2)),
  },
  {
    source: "kstartup_announcement",
    baseUrl: process.env.KSTARTUP_BASE_URL || "https://apis.data.go.kr/B552735/kisedKstartupService01",
    path: "getAnnouncementInformation01",
    format: "json",
    pageParam: "page",
    sizeParam: "perPage",
    pageSize: Number(process.env.KSTARTUP_PAGE_SIZE || 100),
    maxPages: defaultMaxPages,
  },
  {
    source: "kstartup_business",
    baseUrl: process.env.KSTARTUP_BASE_URL || "https://apis.data.go.kr/B552735/kisedKstartupService01",
    path: "getBusinessInformation01",
    format: "json",
    pageParam: "page",
    sizeParam: "perPage",
    pageSize: Number(process.env.KSTARTUP_PAGE_SIZE || 100),
    maxPages: defaultMaxPages,
  },
  {
    source: "kstartup_content",
    baseUrl: process.env.KSTARTUP_BASE_URL || "https://apis.data.go.kr/B552735/kisedKstartupService01",
    path: "getContentInformation01",
    format: "json",
    pageParam: "page",
    sizeParam: "perPage",
    pageSize: Number(process.env.KSTARTUP_PAGE_SIZE || 100),
    maxPages: defaultMaxPages,
  },
  {
    source: "kstartup_statistics",
    baseUrl: process.env.KSTARTUP_BASE_URL || "https://apis.data.go.kr/B552735/kisedKstartupService01",
    path: "getStatisticalInformation01",
    format: "json",
    pageParam: "page",
    sizeParam: "perPage",
    pageSize: Number(process.env.KSTARTUP_PAGE_SIZE || 100),
    maxPages: defaultMaxPages,
  },
];

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const decodeXml = (value: string) =>
  value
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");

const stripTags = (value: string) => decodeXml(value).replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();

const parseXmlItems = (xml: string) => {
  const itemMatches = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)];
  return itemMatches.map((match) => {
    const row: Record<string, string> = {};
    for (const tag of match[1].matchAll(/<([A-Za-z0-9_:-]+)(?:\s[^>]*)?>([\s\S]*?)<\/\1>/g)) {
      row[tag[1]] = stripTags(tag[2]);
    }
    return row;
  });
};

const rowsFromJson = (payload: unknown): Record<string, unknown>[] => {
  if (!payload || typeof payload !== "object") return [];
  const root = payload as Record<string, unknown>;
  const candidates = [
    root.data,
    (root.response as Record<string, unknown> | undefined)?.body &&
      ((root.response as Record<string, unknown>).body as Record<string, unknown>).items,
    root.items,
  ];

  for (const candidate of candidates) {
    if (Array.isArray(candidate)) return candidate.filter((item): item is Record<string, unknown> => Boolean(item && typeof item === "object"));
    if (candidate && typeof candidate === "object") {
      const item = (candidate as Record<string, unknown>).item;
      if (Array.isArray(item)) return item.filter((entry): entry is Record<string, unknown> => Boolean(entry && typeof entry === "object"));
      if (item && typeof item === "object") return [item as Record<string, unknown>];
    }
  }

  return [];
};

const buildUrl = (source: SourceConfig, page: number) => {
  const url = new URL(`${source.baseUrl.replace(/\/$/, "")}/${source.path}`);
  url.searchParams.set("serviceKey", serviceKey);
  url.searchParams.set(source.pageParam, String(page));
  url.searchParams.set(source.sizeParam, String(source.pageSize));
  if (source.format === "json") {
    url.searchParams.set("returnType", "JSON");
  } else {
    url.searchParams.set("_type", "xml");
  }
  return url;
};

const fetchRows = async (source: SourceConfig, page: number) => {
  const url = buildUrl(source, page);
  const response = await fetch(url);
  const text = await response.text();

  if (!response.ok) {
    throw new Error(`${source.source} ${response.status}: ${text.slice(0, 200) || response.statusText}`);
  }

  if (source.format === "xml") return parseXmlItems(text);
  return rowsFromJson(JSON.parse(text));
};

const pickDate = (raw: Record<string, unknown>, keys: string[]) =>
  findFirstString(raw, keys).replace(/[.]/g, "-");

const normalizeRow = (source: StartupSource, raw: Record<string, unknown>): StartupItem | null => {
  const title = findFirstString(raw, [
    "title",
    "titleNm",
    "bizPbancNm",
    "pblancNm",
    "pbancNm",
    "announcementName",
    "businessName",
    "contentTitle",
    "ttl",
    "subject",
    "biz_pbanc_nm",
    "intg_pbanc_biz_nm",
    "supt_biz_titl_nm",
    "titl_nm",
    "사업공고명",
    "통합공고사업명",
    "제목명",
    "공고명",
    "사업명",
  ]);
  if (!title) return null;

  const { id, sourceId } = stableStartupId(source, raw);
  const startDate = pickDate(raw, ["startDate", "pbancRcptBgngDt", "pbanc_rcpt_bgng_dt", "receptStartDt", "공고접수시작일시", "공고시작일"]);
  const endDate = pickDate(raw, ["endDate", "pbancRcptEndDt", "pbanc_rcpt_end_dt", "receptEndDt", "공고접수종료일시", "공고종료일"]);
  const publishedAt = pickDate(raw, ["createdAt", "regDt", "fstm_reg_dt", "creatPnttm", "writngDe", "등록일시", "작성일"]);
  const updatedAt = pickDate(raw, ["updatedAt", "modDt", "last_mdfcn_dt", "updtPnttm", "수정일시", "변경일"]);

  return {
    id,
    source,
    source_id: sourceId,
    title,
    category: findFirstString(raw, ["category", "bizCategory", "suptBizClsfc", "supt_biz_clsfc", "biz_category_cd", "clss_cd", "지원사업분류", "구분코드"]) || null,
    organization: findFirstString(raw, ["organization", "jrsdInsttNm", "suptInsttNm", "pbanc_ntrp_nm", "biz_prch_dprt_nm", "sprv_inst", "agency", "수행기관", "소관기관명", "작성자"]) || null,
    status: findFirstString(raw, ["status", "recruitStatus", "rcrt_prgs_yn", "pbancSttsCd", "모집 진행 여부", "신청상태"]) || null,
    start_date: startDate || null,
    end_date: endDate || null,
    published_at: publishedAt || null,
    updated_at: updatedAt || publishedAt || startDate || endDate || null,
    url: findFirstString(raw, ["url", "detailUrl", "detl_pg_url", "pblancUrl", "atchFileUrl", "biz_gdnc_url", "biz_aply_url", "공고상세URL", "상세URL"]) || null,
    summary: findFirstString(raw, ["summary", "description", "bizSummary", "pbanc_ctnt", "biz_supt_ctnt", "supt_biz_intrd_info", "ctnt", "supportContent", "사업개요", "지원내용", "신청대상내용"]) || null,
    raw_json: raw,
  };
};

const upsertRows = async (rows: StartupItem[]) => {
  if (rows.length === 0) return 0;
  const db = getServiceClient();
  let saved = 0;

  for (let index = 0; index < rows.length; index += 200) {
    const batch = rows.slice(index, index + 200);
    const { error, data } = await db
      .from("startup_items")
      .upsert(batch, { onConflict: "source,source_id" })
      .select("id");
    if (error) throw error;
    saved += data?.length ?? batch.length;
  }

  return saved;
};

async function runSource(source: SourceConfig) {
  const collected: StartupItem[] = [];

  for (let page = 1; page <= source.maxPages; page += 1) {
    const rows = await fetchRows(source, page);
    const normalized = rows
      .map((row) => normalizeRow(source.source, row))
      .filter((item): item is StartupItem => item !== null);
    collected.push(...normalized);
    console.log(`${source.source}: ${page}/${source.maxPages} page, ${normalized.length} rows`);
    if (rows.length < source.pageSize) break;
    await sleep(delayMs);
  }

  const saved = await upsertRows(collected);
  return { source: source.source, collected: collected.length, saved };
}

async function main() {
  const results = [];
  const errors = [];

  for (const source of sources) {
    try {
      results.push(await runSource(source));
    } catch (error) {
      errors.push({
        source: source.source,
        message: error instanceof Error ? error.message : String(error),
      });
    }
  }

  console.log(JSON.stringify({ results, errors }, null, 2));
  if (results.every((result) => result.saved === 0) && errors.length > 0) {
    throw new Error("Startup API collection failed for all configured sources.");
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
