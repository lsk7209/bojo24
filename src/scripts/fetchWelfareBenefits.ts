/* eslint-disable no-console */
import "./loadScriptEnv";
import { getServiceClient } from "@lib/supabaseClient";
import { env, validateEnv } from "@lib/env";
import type { BenefitRecord } from "@/types/benefit";

validateEnv(["PUBLICDATA_SERVICE_KEY_ENC", "SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"]);

type WelfareSource = {
  key: "welfare-local" | "welfare-national";
  label: string;
  endpoint: string;
  pageSize: number;
  params: Record<string, string>;
};

type XmlRecord = Record<string, string>;

const SERVICE_KEY = decodeURIComponent(env.PUBLICDATA_SERVICE_KEY_ENC);
const REQUEST_DELAY_MS = 500;

const SOURCES: WelfareSource[] = [
  {
    key: "welfare-local",
    label: "지자체복지서비스",
    endpoint: "https://apis.data.go.kr/B554287/LocalGovernmentWelfareInformations/LcgvWelfarelist",
    pageSize: 500,
    params: {},
  },
  {
    key: "welfare-national",
    label: "중앙부처복지서비스",
    endpoint: "https://apis.data.go.kr/B554287/NationalWelfareInformationsV001/NationalWelfarelistV001",
    pageSize: 500,
    params: {
      callTp: "L",
      srchKeyCode: "001",
    },
  },
];

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const decodeXml = (value: string) =>
  value
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");

const textOf = (xml: string, tag: string) => {
  const match = xml.match(new RegExp(`<${tag}>([\\s\\S]*?)<\\/${tag}>`));
  return match ? decodeXml(match[1]).trim() : "";
};

const parseItems = (xml: string): XmlRecord[] => {
  const itemMatches = [...xml.matchAll(/<servList>([\s\S]*?)<\/servList>/g)];
  return itemMatches.map((match) => {
    const record: XmlRecord = {};
    const fieldMatches = [...match[1].matchAll(/<([A-Za-z0-9]+)>([\s\S]*?)<\/\1>/g)];
    fieldMatches.forEach((field) => {
      record[field[1]] = decodeXml(field[2]).trim();
    });
    return record;
  });
};

const toIsoDate = (value: string) => {
  if (/^\d{8}$/.test(value)) {
    return `${value.slice(0, 4)}-${value.slice(4, 6)}-${value.slice(6, 8)}T00:00:00.000Z`;
  }
  if (/^\d{4}-\d{2}-\d{2}/.test(value)) return value;
  return new Date().toISOString();
};

const buildUrl = (source: WelfareSource, pageNo: number) => {
  const url = new URL(source.endpoint);
  url.searchParams.set("serviceKey", SERVICE_KEY);
  url.searchParams.set("pageNo", String(pageNo));
  url.searchParams.set("numOfRows", String(source.pageSize));
  Object.entries(source.params).forEach(([key, value]) => {
    url.searchParams.set(key, value);
  });
  return url;
};

const fetchXml = async (source: WelfareSource, pageNo: number) => {
  await delay(REQUEST_DELAY_MS);
  const response = await fetch(buildUrl(source, pageNo), {
    headers: { Accept: "application/xml,text/xml,*/*" },
  });
  if (!response.ok) {
    throw new Error(`${source.label} API 실패: ${response.status} ${response.statusText}`);
  }
  return response.text();
};

const mapRecord = (source: WelfareSource, record: XmlRecord): BenefitRecord | null => {
  const serviceId = record.servId;
  const name = record.servNm;
  if (!serviceId || !name) return null;

  const category =
    record.intrsThemaNmArray ||
    record.intrsThemaArray ||
    record.srvPvsnNm ||
    record.lifeNmArray ||
    record.lifeArray ||
    "복지";

  const governingOrg =
    record.bizChrDeptNm ||
    [record.jurMnofNm, record.jurOrgNm].filter(Boolean).join(" ") ||
    [record.ctpvNm, record.sggNm].filter(Boolean).join(" ") ||
    "한국사회보장정보원";

  const lastUpdated = record.lastModYmd || record.svcfrstRegTs || record.svcFrstRegTs || "";

  return {
    id: `${source.key}:${serviceId}`,
    name,
    category,
    governing_org: governingOrg,
    detail_json: {
      source: source.key,
      sourceLabel: source.label,
      list: record,
      detailUrl: record.servDtlLink || null,
      summary: record.servDgst || null,
    },
    last_updated_at: toIsoDate(lastUpdated),
  };
};

const upsertRecords = async (records: BenefitRecord[]) => {
  if (records.length === 0) return 0;

  const db = getServiceClient();
  let saved = 0;
  for (let index = 0; index < records.length; index += 200) {
    const batch = records.slice(index, index + 200);
    const { error, data } = await db
      .from("benefits")
      .upsert(batch, { onConflict: "id" })
      .select("id");

    if (error) throw error;
    saved += data?.length ?? batch.length;
  }
  return saved;
};

const fetchSource = async (source: WelfareSource) => {
  console.log(`${source.label} 목록 수집 시작`);

  const firstXml = await fetchXml(source, 1);
  const resultCode = textOf(firstXml, "resultCode");
  if (resultCode !== "0") {
    throw new Error(`${source.label} API 오류: ${resultCode} ${textOf(firstXml, "resultMessage")}`);
  }

  const totalCount = Number(textOf(firstXml, "totalCount") || 0);
  const totalPages = Math.ceil(totalCount / source.pageSize);
  const records = parseItems(firstXml);

  for (let page = 2; page <= totalPages; page += 1) {
    const xml = await fetchXml(source, page);
    records.push(...parseItems(xml));
    console.log(`${source.label}: ${page}/${totalPages} 페이지`);
  }

  const benefitRecords = records
    .map((record) => mapRecord(source, record))
    .filter((record): record is BenefitRecord => record !== null);

  const saved = await upsertRecords(benefitRecords);
  console.log(`${source.label} 저장 완료: ${saved}/${benefitRecords.length}개`);
  return saved;
};

async function main() {
  let totalSaved = 0;
  for (const source of SOURCES) {
    totalSaved += await fetchSource(source);
  }
  console.log(`복지서비스 API 반영 완료: ${totalSaved}개`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("복지서비스 수집 실패", error);
    process.exit(1);
  });
