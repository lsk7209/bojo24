/* eslint-disable no-console */
import "dotenv/config";
import { fetchJson } from "@lib/http";
import { getServiceClient } from "@lib/supabaseClient";
import { env, validateEnv } from "@lib/env";
import type {
  ApiEnvelope,
  BenefitRecord,
  ServiceDetailItem,
  ServiceListItem,
  SupportConditionsItem
} from "@/types/benefit";

// 환경 변수 검증
validateEnv(['PUBLICDATA_SERVICE_KEY_ENC', 'SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY']);

const BASE_URL = env.PUBLICDATA_BASE_URL;
const SERVICE_KEY = decodeURIComponent(env.PUBLICDATA_SERVICE_KEY_ENC);
const PAGE_SIZE = env.PUBLICDATA_PAGE_SIZE;
const FETCH_DELAY = env.PUBLICDATA_DELAY_MS;

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
  return res.data[0] || null;
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
  return res.data[0] || null;
};

// 변경된 데이터만 감지하여 업데이트
const detectChanges = async (
  apiServices: ServiceListItem[],
  existingRecords: Map<string, BenefitRecord>
): Promise<{
  newServices: ServiceListItem[];
  updatedServices: ServiceListItem[];
  unchangedServices: ServiceListItem[];
}> => {
  const newServices: ServiceListItem[] = [];
  const updatedServices: ServiceListItem[] = [];
  const unchangedServices: ServiceListItem[] = [];

  for (const service of apiServices) {
    const serviceId = service["서비스ID"];
    const existing = existingRecords.get(serviceId);
    const apiUpdatedAt = service["수정일시"] || service["등록일시"];

    if (!existing) {
      // 새로운 서비스
      newServices.push(service);
    } else if (apiUpdatedAt && existing.last_updated_at) {
      // 수정일시 비교
      const apiDate = new Date(apiUpdatedAt);
      const dbDate = new Date(existing.last_updated_at);
      
      if (apiDate > dbDate) {
        // API 데이터가 더 최신
        updatedServices.push(service);
      } else {
        // 변경 없음
        unchangedServices.push(service);
      }
    } else {
      // 수정일시 정보가 없으면 안전하게 업데이트 대상으로 분류
      updatedServices.push(service);
    }
  }

  return { newServices, updatedServices, unchangedServices };
};

const processService = async (service: ServiceListItem): Promise<BenefitRecord | null> => {
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
};

const upsertRecords = async (records: BenefitRecord[]) => {
  const supabase = getServiceClient();
  let upserted = 0;
  let failed = 0;
  
  // 배치 단위로 처리 (200개씩)
  const BATCH_SIZE = 200;
  for (let i = 0; i < records.length; i += BATCH_SIZE) {
    const batch = records.slice(i, i + BATCH_SIZE);
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
  console.log("🔄 증분 업데이트 모드: 변경된 데이터만 수집합니다.\n");

  const supabase = getServiceClient();

  // 1. 기존 데이터 조회 (ID와 수정일시만)
  console.log("📊 기존 데이터 조회 중...");
  const { data: existingData, error: fetchError } = await supabase
    .from("benefits")
    .select("id, last_updated_at");

  if (fetchError) {
    console.error("기존 데이터 조회 실패:", fetchError);
    process.exit(1);
  }

  const existingMap = new Map<string, BenefitRecord>();
  existingData?.forEach((record) => {
    existingMap.set(record.id, record as BenefitRecord);
  });

  console.log(`✅ 기존 데이터: ${existingMap.size}개\n`);

  // 2. API에서 전체 목록 가져오기
  console.log("📡 공공데이터 API 목록 조회 중...");
  const firstPage = await fetchServiceList(1);
  const totalPages = Math.ceil(firstPage.totalCount / PAGE_SIZE);

  console.log(`총 ${totalPages} 페이지 (${firstPage.totalCount}건)`);

  const allServices: ServiceListItem[] = [...firstPage.data];
  for (let page = 2; page <= totalPages; page += 1) {
    const res = await fetchServiceList(page);
    allServices.push(...res.data);
    if (page % 10 === 0) {
      console.log(`  진행: ${page}/${totalPages} 페이지`);
    }
  }

  console.log(`✅ 목록 수집 완료: ${allServices.length}건\n`);

  // 3. 변경 감지
  console.log("🔍 변경 사항 감지 중...");
  const { newServices, updatedServices, unchangedServices } = await detectChanges(
    allServices,
    existingMap
  );

  console.log(`  ✨ 신규: ${newServices.length}개`);
  console.log(`  🔄 업데이트: ${updatedServices.length}개`);
  console.log(`  ✅ 변경 없음: ${unchangedServices.length}개\n`);

  if (newServices.length === 0 && updatedServices.length === 0) {
    console.log("🎉 모든 데이터가 최신 상태입니다!");
    return;
  }

  // 4. 변경된 데이터만 처리
  const servicesToProcess = [...newServices, ...updatedServices];
  console.log(`📦 처리 대상: ${servicesToProcess.length}개\n`);

  const BATCH_SIZE = 30;
  const batches: ServiceListItem[][] = [];
  for (let i = 0; i < servicesToProcess.length; i += BATCH_SIZE) {
    batches.push(servicesToProcess.slice(i, i + BATCH_SIZE));
  }

  let totalProcessed = 0;
  let totalSuccess = 0;
  let totalFailed = 0;

  for (let i = 0; i < batches.length; i++) {
    const batch = batches[i];
    console.log(`[${i + 1}/${batches.length}] 배치 처리 중...`);

    const promises = batch.map(processService);
    const results = await Promise.all(promises);
    const validRecords = results.filter((r): r is BenefitRecord => r !== null);

    if (validRecords.length > 0) {
      const { upserted, failed } = await upsertRecords(validRecords);
      totalSuccess += upserted;
      totalFailed += failed;
    }

    totalProcessed += batch.length;
    const progress = Math.round((totalProcessed / servicesToProcess.length) * 100);
    console.log(`  완료: ${totalSuccess}건 저장 (${progress}%)\n`);

    // Rate limit 방지
    await new Promise((r) => setTimeout(r, 400));
  }

  console.log("=== 최종 완료 ===");
  console.log(`처리 대상: ${servicesToProcess.length}개`);
  console.log(`저장 성공: ${totalSuccess}개`);
  console.log(`실패: ${totalFailed}개`);
  console.log(`변경 없음: ${unchangedServices.length}개`);
};

main().catch((err) => {
  console.error("스크립트 실행 실패:", err);
  process.exit(1);
});

