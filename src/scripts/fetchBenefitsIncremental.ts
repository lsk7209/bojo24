/* eslint-disable no-console */
import "./loadScriptEnv";
import { fetchJson } from "@lib/http";
import { getServiceClient } from "@lib/supabaseClient";
import { env, validateEnv } from "@lib/env";
import type {
  ApiEnvelope,
  BenefitRecord,
  ServiceDetailItem,
  ServiceListItem,
  SupportConditionsItem,
} from "@/types/benefit";

validateEnv(["PUBLICDATA_SERVICE_KEY_ENC", "SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"]);

const BASE_URL = env.PUBLICDATA_BASE_URL;
const SERVICE_KEY = decodeURIComponent(env.PUBLICDATA_SERVICE_KEY_ENC);
const PAGE_SIZE = env.PUBLICDATA_PAGE_SIZE;
const FETCH_DELAY = env.PUBLICDATA_DELAY_MS;
const DETAIL_BATCH_SIZE = 30;
const UPSERT_BATCH_SIZE = 200;

const SERVICE_ID = "서비스ID";
const SERVICE_NAME = "서비스명";
const SERVICE_CATEGORY = "서비스분야";
const USER_TYPE = "사용자구분";
const SUPPORT_TYPE = "지원유형";
const ORG_NAME = "소관기관명";
const DEPARTMENT_NAME = "부서명";
const CREATED_AT = "등록일시";
const UPDATED_AT = "수정일시";

const buildUrl = (path: string, params: Record<string, string | number>) => {
  const url = new URL(`${BASE_URL.replace(/\/$/, "")}/${path}`);
  url.searchParams.set("serviceKey", SERVICE_KEY);
  url.searchParams.set("returnType", "JSON");
  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.set(key, String(value));
  });
  return url;
};

const fetchServiceList = async (page: number): Promise<ApiEnvelope<ServiceListItem>> => {
  const url = buildUrl("serviceList", { page, perPage: PAGE_SIZE });
  return fetchJson<ApiEnvelope<ServiceListItem>>(url, {
    delayMs: FETCH_DELAY,
    retries: 2,
  });
};

const fetchServiceDetail = async (serviceId: string): Promise<ServiceDetailItem | null> => {
  const url = buildUrl("serviceDetail", {
    page: 1,
    perPage: 1,
    "cond[서비스ID::EQ]": serviceId,
  });
  const res = await fetchJson<ApiEnvelope<ServiceDetailItem>>(url, {
    delayMs: FETCH_DELAY,
    retries: 2,
  });
  return res.data?.[0] ?? null;
};

const fetchSupportConditions = async (serviceId: string): Promise<SupportConditionsItem | null> => {
  const url = buildUrl("supportConditions", {
    page: 1,
    perPage: 1,
    "cond[서비스ID::EQ]": serviceId,
  });
  const res = await fetchJson<ApiEnvelope<SupportConditionsItem>>(url, {
    delayMs: FETCH_DELAY,
    retries: 2,
  });
  return res.data?.[0] ?? null;
};

const chunk = <T>(items: T[], size: number) => {
  const result: T[][] = [];
  for (let index = 0; index < items.length; index += size) {
    result.push(items.slice(index, index + size));
  }
  return result;
};

const toStringValue = (value: unknown) => (typeof value === "string" ? value.trim() : "");

const getServiceId = (service: ServiceListItem) => toStringValue(service[SERVICE_ID]);

const getUpdatedAt = (service: ServiceListItem, detail?: ServiceDetailItem | null) =>
  toStringValue(detail?.[UPDATED_AT]) ||
  toStringValue(service[UPDATED_AT]) ||
  toStringValue(service[CREATED_AT]) ||
  new Date().toISOString();

const detectChanges = (
  apiServices: ServiceListItem[],
  existingRecords: Map<string, BenefitRecord>
) => {
  const newServices: ServiceListItem[] = [];
  const updatedServices: ServiceListItem[] = [];
  const unchangedServices: ServiceListItem[] = [];

  for (const service of apiServices) {
    const serviceId = getServiceId(service);
    if (!serviceId) continue;

    const existing = existingRecords.get(serviceId);
    const apiUpdatedAt = getUpdatedAt(service);

    if (!existing) {
      newServices.push(service);
      continue;
    }

    if (!existing.last_updated_at || new Date(apiUpdatedAt) > new Date(existing.last_updated_at)) {
      updatedServices.push(service);
    } else {
      unchangedServices.push(service);
    }
  }

  return { newServices, updatedServices, unchangedServices };
};

const processService = async (service: ServiceListItem): Promise<BenefitRecord | null> => {
  const id = getServiceId(service);
  if (!id) return null;

  try {
    const [detail, supportConditions] = await Promise.all([
      fetchServiceDetail(id),
      fetchSupportConditions(id),
    ]);

    const name = toStringValue(service[SERVICE_NAME]) || toStringValue(detail?.[SERVICE_NAME]);
    if (!name) return null;

    const category =
      toStringValue(service[SERVICE_CATEGORY]) ||
      toStringValue(service[USER_TYPE]) ||
      toStringValue(service[SUPPORT_TYPE]) ||
      "기타";

    const governingOrg =
      toStringValue(detail?.[ORG_NAME]) ||
      toStringValue(service[ORG_NAME]) ||
      toStringValue(service[DEPARTMENT_NAME]) ||
      "미상";

    return {
      id,
      name,
      category,
      governing_org: governingOrg,
      detail_json: {
        source: "gov24",
        list: service,
        detail,
        supportConditions,
      },
      last_updated_at: getUpdatedAt(service, detail),
    };
  } catch (error) {
    console.error(`상세 수집 실패: ${id}`, error);
    return null;
  }
};

const upsertRecords = async (records: BenefitRecord[]) => {
  const db = getServiceClient();
  let upserted = 0;
  let failed = 0;

  for (const batch of chunk(records, UPSERT_BATCH_SIZE)) {
    const { error, data } = await db
      .from("benefits")
      .upsert(batch, { onConflict: "id" })
      .select("id");

    if (error) {
      failed += batch.length;
      console.error("DB 저장 실패", error);
    } else {
      upserted += data?.length ?? batch.length;
    }
  }

  return { upserted, failed };
};

async function main() {
  console.log("공공데이터포털 보조24 증분 업데이트 시작");

  const db = getServiceClient();
  const { data: existingData, error: existingError } = await db
    .from("benefits")
    .select("id, last_updated_at");

  if (existingError) throw existingError;

  const existingMap = new Map<string, BenefitRecord>();
  existingData?.forEach((record: BenefitRecord) => {
    existingMap.set(record.id, record);
  });

  const firstPage = await fetchServiceList(1);
  const totalPages = Math.ceil(firstPage.totalCount / PAGE_SIZE);
  const allServices = [...firstPage.data];

  for (let page = 2; page <= totalPages; page += 1) {
    const res = await fetchServiceList(page);
    allServices.push(...res.data);
    if (page % 10 === 0) {
      console.log(`목록 수집 진행: ${page}/${totalPages}`);
    }
  }

  const { newServices, updatedServices, unchangedServices } = detectChanges(allServices, existingMap);
  const servicesToProcess = [...newServices, ...updatedServices];

  console.log(`전체 ${allServices.length}개, 신규 ${newServices.length}개, 변경 ${updatedServices.length}개, 유지 ${unchangedServices.length}개`);

  if (servicesToProcess.length === 0) {
    console.log("모든 보조24 데이터가 최신입니다.");
    return;
  }

  let totalSuccess = 0;
  let totalFailed = 0;
  let processed = 0;

  for (const [index, batch] of chunk(servicesToProcess, DETAIL_BATCH_SIZE).entries()) {
    const results = await Promise.all(batch.map(processService));
    const validRecords = results.filter((record): record is BenefitRecord => record !== null);
    const { upserted, failed } = await upsertRecords(validRecords);

    totalSuccess += upserted;
    totalFailed += failed;
    processed += batch.length;
    console.log(`[${index + 1}] ${processed}/${servicesToProcess.length} 처리, 저장 ${totalSuccess}개`);
  }

  console.log(`완료: 저장 ${totalSuccess}개, 실패 ${totalFailed}개, 변경 없음 ${unchangedServices.length}개`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("공공데이터 수집 실패", error);
    process.exit(1);
  });
