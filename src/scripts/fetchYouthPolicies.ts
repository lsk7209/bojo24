/* eslint-disable no-console */
import "./loadScriptEnv";
import { getServiceClient } from "@lib/supabaseClient";
import type { BenefitRecord } from "@/types/benefit";

type YouthPolicy = {
  plcyNo?: string;
  plcyNm?: string;
  plcyKywdNm?: string;
  plcyExplnCn?: string;
  lclsfNm?: string;
  mclsfNm?: string;
  plcySprtCn?: string;
  sprvsnInstCdNm?: string;
  operInstCdNm?: string;
  bizPrdBgngYmd?: string;
  bizPrdEndYmd?: string;
  bizPrdEtcCn?: string;
  plcyAplyMthdCn?: string;
  aplyUrlAddr?: string;
  sbmsnDcmntCn?: string;
  etcMttrCn?: string;
  refUrlAddr1?: string;
  refUrlAddr2?: string;
  sprtTrgtMinAge?: string;
  sprtTrgtMaxAge?: string;
  addAplyQlfcCndCn?: string;
  ptcpPrpTrgtCn?: string;
  zipCd?: string;
  aplyYmd?: string;
  frstRegDt?: string;
  lastMdfcnDt?: string;
  [key: string]: unknown;
};

type YouthPolicyResponse = {
  resultCode?: number;
  resultMessage?: string;
  result?: {
    pagging?: {
      totCount?: number;
      pageNum?: number;
      pageSize?: number;
    };
    youthPolicyList?: YouthPolicy[];
  };
};

const API_URL = "https://www.youthcenter.go.kr/go/ythip/getPlcy";
const PAGE_SIZE = Number(process.env.YOUTHCENTER_PAGE_SIZE || 100);
const MAX_PAGES = Number(process.env.YOUTHCENTER_MAX_PAGES || 30);
const DELAY_MS = Number(process.env.YOUTHCENTER_DELAY_MS || 400);
const UPSERT_BATCH_SIZE = 200;

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const requireApiKey = () => {
  const apiKey = process.env.YOUTHCENTER_API_KEY || process.env.YOUTHCENTER_API_KEY_NM;
  if (!apiKey) {
    throw new Error("YOUTHCENTER_API_KEY 환경변수가 필요합니다.");
  }
  return apiKey;
};

const asText = (value: unknown, fallback = "") => {
  if (value === null || value === undefined) return fallback;
  const text = String(value)
    .replace(/[᭼･]/g, "·")
    .replace(/\s+/g, " ")
    .trim();
  return text || fallback;
};

const normalizeDate = (value: unknown) => {
  const text = asText(value);
  if (!text) return "";
  const digits = text.replace(/\D/g, "");
  if (digits.length === 8) {
    return `${digits.slice(0, 4)}-${digits.slice(4, 6)}-${digits.slice(6, 8)}`;
  }
  return text;
};

const buildUrl = (apiKey: string, pageNum: number) => {
  const url = new URL(API_URL);
  url.searchParams.set("apiKeyNm", apiKey);
  url.searchParams.set("pageNum", String(pageNum));
  url.searchParams.set("pageSize", String(PAGE_SIZE));
  url.searchParams.set("pageType", "1");
  url.searchParams.set("rtnType", "json");
  return url;
};

const fetchPage = async (apiKey: string, pageNum: number) => {
  const response = await fetch(buildUrl(apiKey, pageNum), {
    headers: { Accept: "application/json" },
  });
  const text = await response.text();

  if (!response.ok) {
    throw new Error(`YouthCenter API ${response.status}: ${text.slice(0, 200)}`);
  }

  const payload = JSON.parse(text) as YouthPolicyResponse;
  if (payload.resultCode && Number(payload.resultCode) !== 200) {
    throw new Error(`YouthCenter API error ${payload.resultCode}: ${payload.resultMessage || "unknown"}`);
  }
  return payload;
};

const toBenefitRecord = (policy: YouthPolicy): BenefitRecord | null => {
  const plcyNo = asText(policy.plcyNo);
  const name = asText(policy.plcyNm);
  if (!plcyNo || !name) return null;

  const category = asText(policy.lclsfNm, "청년정책");
  const governingOrg =
    asText(policy.sprvsnInstCdNm) ||
    asText(policy.operInstCdNm) ||
    asText(policy.rgtrInstCdNm) ||
    "청년정책";
  const lastUpdatedAt = normalizeDate(policy.lastMdfcnDt) || normalizeDate(policy.frstRegDt) || new Date().toISOString();
  const applyUrl = asText(policy.aplyUrlAddr) || asText(policy.refUrlAddr1) || asText(policy.refUrlAddr2);

  return {
    id: `youth_${plcyNo}`,
    name,
    category,
    governing_org: governingOrg,
    detail_json: {
      source: "youthcenter",
      original_id: plcyNo,
      list: {
        서비스ID: `youth_${plcyNo}`,
        서비스명: name,
        서비스분야: category,
        사용자구분: "청년",
        지원유형: asText(policy.mclsfNm, "청년정책"),
        소관기관명: governingOrg,
        등록일시: normalizeDate(policy.frstRegDt),
        수정일시: lastUpdatedAt,
      },
      detail: {
        서비스ID: `youth_${plcyNo}`,
        서비스명: name,
        서비스목적요약: asText(policy.plcyExplnCn),
        지원대상: [asText(policy.addAplyQlfcCndCn), asText(policy.ptcpPrpTrgtCn)]
          .filter(Boolean)
          .join(" / "),
        선정기준: asText(policy.plcyKywdNm),
        지원내용: asText(policy.plcySprtCn),
        신청방법: asText(policy.plcyAplyMthdCn),
        신청기한: asText(policy.aplyYmd) || [normalizeDate(policy.bizPrdBgngYmd), normalizeDate(policy.bizPrdEndYmd)]
          .filter(Boolean)
          .join(" ~ "),
        구비서류: asText(policy.sbmsnDcmntCn),
        접수기관명: asText(policy.operInstCdNm),
        문의처: asText(policy.sprvsnInstPicNm),
        온라인신청사이트URL: applyUrl,
        상세조회URL: applyUrl || "https://www.youthcenter.go.kr",
        기타사항: asText(policy.etcMttrCn),
        지원대상연령: [asText(policy.sprtTrgtMinAge), asText(policy.sprtTrgtMaxAge)]
          .filter(Boolean)
          .join("~"),
      },
      raw: policy,
    },
    last_updated_at: lastUpdatedAt,
    gemini_summary: asText(policy.plcyExplnCn) || null,
    gemini_faq_json: null,
  };
};

const chunk = <T>(items: T[], size: number) => {
  const chunks: T[][] = [];
  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }
  return chunks;
};

const upsertRecords = async (records: BenefitRecord[]) => {
  const db = getServiceClient();
  let saved = 0;

  for (const batch of chunk(records, UPSERT_BATCH_SIZE)) {
    const { error, data } = await db.from("benefits").upsert(batch, { onConflict: "id" }).select("id");
    if (error) throw error;
    saved += data?.length ?? batch.length;
  }

  return saved;
};

async function main() {
  const apiKey = requireApiKey();
  const records: BenefitRecord[] = [];
  const firstPage = await fetchPage(apiKey, 1);
  const totalCount = firstPage.result?.pagging?.totCount ?? 0;
  const totalPages = Math.ceil(totalCount / PAGE_SIZE);
  const pagesToFetch = Math.min(Math.max(totalPages, 1), MAX_PAGES);

  records.push(...(firstPage.result?.youthPolicyList ?? []).map(toBenefitRecord).filter((item): item is BenefitRecord => item !== null));

  for (let page = 2; page <= pagesToFetch; page += 1) {
    await sleep(DELAY_MS);
    const payload = await fetchPage(apiKey, page);
    const pageRecords = (payload.result?.youthPolicyList ?? [])
      .map(toBenefitRecord)
      .filter((item): item is BenefitRecord => item !== null);
    records.push(...pageRecords);
    console.log(`youthcenter: ${page}/${pagesToFetch} page, ${pageRecords.length} rows`);
  }

  const saved = await upsertRecords(records);
  console.log(JSON.stringify({ source: "youthcenter", totalCount, fetched: records.length, saved }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
