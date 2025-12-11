/* eslint-disable no-console */
import "dotenv/config";
import { fetchJson } from "@lib/http";
import { getServiceClient } from "@lib/supabaseClient";
import type {
  ApiEnvelope,
  BenefitRecord,
  ServiceDetailItem,
  ServiceListItem,
  SupportConditionsItem
} from "@/types/benefit";

const BASE_URL =
  process.env.PUBLICDATA_BASE_URL ?? "https://api.odcloud.kr/api/gov24/v3";
const SERVICE_KEY = process.env.PUBLICDATA_SERVICE_KEY_ENC
  ? decodeURIComponent(process.env.PUBLICDATA_SERVICE_KEY_ENC)
  : null;
const PAGE_SIZE = Number(process.env.PUBLICDATA_PAGE_SIZE || 100);
const FETCH_DELAY = Number(process.env.PUBLICDATA_DELAY_MS || 600);
const MAX_PAGES = null; // 전체 페이지 수집 (제한 해제)

if (!SERVICE_KEY) {
  throw new Error("PUBLICDATA_SERVICE_KEY_ENC 환경 변수가 필요합니다.");
}

const buildUrl = (path: string, params: Record<string, string | number>) => {
  const url = new URL(`${BASE_URL.replace(/\/$/, "")}/${path}`);
  url.searchParams.set("serviceKey", SERVICE_KEY);
  url.searchParams.set("returnType", "JSON");
  Object.entries(params).forEach(([key, value]) =>
    url.searchParams.set(key, String(value))
  );
  return url;
};

const fetchServiceList = async (
  page: number
): Promise<ApiEnvelope<ServiceListItem>> => {
  const url = buildUrl("serviceList", { page, perPage: PAGE_SIZE });
  return fetchJson<ApiEnvelope<ServiceListItem>>(url, {
    delayMs: FETCH_DELAY,
    retries: 2
  });
};

const fetchServiceDetail = async (
  serviceId: string
): Promise<ServiceDetailItem | null> => {
  const url = buildUrl("serviceDetail", {
    page: 1,
    perPage: 1,
    "cond[서비스ID::EQ]": serviceId
  });
  const res = await fetchJson<ApiEnvelope<ServiceDetailItem>>(url, {
    delayMs: FETCH_DELAY,
    retries: 2
  });
  return res.data?.[0] ?? null;
};

const fetchSupportConditions = async (
  serviceId: string
): Promise<SupportConditionsItem | null> => {
  const url = buildUrl("supportConditions", {
    page: 1,
    perPage: 1,
    "cond[서비스ID::EQ]": serviceId
  });
  const res = await fetchJson<ApiEnvelope<SupportConditionsItem>>(url, {
    delayMs: FETCH_DELAY,
    retries: 2
  });
  return res.data?.[0] ?? null;
};

const chunk = <T>(arr: T[], size: number): T[][] => {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    out.push(arr.slice(i, i + size));
  }
  return out;
};

const upsertRecords = async (records: BenefitRecord[]) => {
  const supabase = getServiceClient();
  let upserted = 0;
  let failed = 0;
  for (const batch of chunk(records, 200)) {
    const { error, data } = await supabase
      .from("benefits")
      .upsert(batch, { onConflict: "id" })
      .select("id");
    if (error) {
      failed += batch.length;
      console.error("업서트 실패", error);
    } else {
      upserted += data?.length ?? batch.length;
    }
  }
  return { upserted, failed };
};

const main = async () => {
  console.log("보조금24 전체 데이터 수집 시작 (Full Scan)");

  // 1. 전체 목록 페이지 수집
  console.log("목록 조회 중...");
  const firstPage = await fetchServiceList(1);
  const totalPages = Math.ceil(firstPage.totalCount / PAGE_SIZE);
  // 전체 수집이므로 targetPages는 totalPages와 동일 (MAX_PAGES가 null이면)
  const targetPages = MAX_PAGES ? Math.min(totalPages, MAX_PAGES) : totalPages;

  console.log(`총 ${totalPages} 페이지 (${firstPage.totalCount}건) 수집 예정`);

  const allServices: ServiceListItem[] = [...firstPage.data];
  for (let page = 2; page <= targetPages; page += 1) {
    const res = await fetchServiceList(page);
    allServices.push(...res.data);
    if (page % 10 === 0) {
      console.log(`목록 수집 진행: ${page}/${targetPages} 페이지`);
    }
  }
  console.log(`목록 수집 완료: 총 ${allServices.length}건`);

  // 2. 상세 정보 수집 및 즉시 저장 (Batch Processing)
  const BATCH_SIZE = 30;
  let totalProcessed = 0;
  let totalSuccess = 0;
  let totalFailed = 0;

  const batches = chunk(allServices, BATCH_SIZE);

  console.log(`상세 수집 및 저장 시작 (총 ${batches.length} 배치)`);

  for (let i = 0; i < batches.length; i++) {
    const batch = batches[i];

    const promises = batch.map(async (service) => {
      try {
        const id = service["서비스ID"];
        const [detail, support] = await Promise.all([
          fetchServiceDetail(id),
          fetchSupportConditions(id)
        ]);

        const governingOrg =
          detail?.["소관기관명"] ??
          service["소관기관명"] ??
          service["부서명"] ??
          "미상";

        const category =
          service["서비스분야"] ?? service["사용자구분"] ?? service["지원유형"] ?? "기타";

        const lastUpdated =
          detail?.["수정일시"] ??
          service["수정일시"] ??
          service["등록일시"] ??
          new Date().toISOString();

        return {
          id,
          name: service["서비스명"],
          category,
          governing_org: governingOrg,
          detail_json: {
            list: service,
            detail,
            supportConditions: support
          },
          last_updated_at: lastUpdated
        } as BenefitRecord;
      } catch (err) {
        console.error(`  - [실패] 서비스ID: ${service["서비스ID"]}`, err);
        return null;
      }
    });

    const results = await Promise.all(promises);
    const validRecords = results.filter((r): r is BenefitRecord => r !== null);

    if (validRecords.length > 0) {
      const { upserted, failed } = await upsertRecords(validRecords);
      totalSuccess += upserted;
      totalFailed += failed;
    }

    totalProcessed += batch.length;
    console.log(
      `[${i + 1}/${batches.length}] 배치 완료. 누적 저장: ${totalSuccess}건 (${Math.round(
        (totalProcessed / allServices.length) * 100
      )}%)`
    );
    await new Promise((r) => setTimeout(r, 400));
  }

  console.log("=== 최종 완료 ===");
  console.log(`총 처리 대상: ${allServices.length}`);
  console.log(`저장 성공: ${totalSuccess}`);
  console.log(`실패: ${totalFailed}`);
};

main().catch((err) => {
  console.error("스크립트 실패", err);
  process.exit(1);
});
