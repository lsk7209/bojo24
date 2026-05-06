/* eslint-disable no-console */
import "./loadScriptEnv";
import { createHash } from "crypto";
import { readFile } from "fs/promises";
import { getServiceClient } from "@lib/supabaseClient";
import { validateEnv } from "@lib/env";
import type { BenefitRecord } from "@/types/benefit";

validateEnv(["SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"]);

const CSV_URL =
  "https://www.data.go.kr/cmm/cmm/fileDownload.do?atchFileId=FILE_000000003519010&fileDetailSn=1&insertDataPrcus=N";
const DATA_LAST_MODIFIED = "2025-11-10T00:00:00.000Z";
const localCsvPath = process.argv[2];

const parseCsv = (text: string) => {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let inQuotes = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];

    if (char === '"' && inQuotes && next === '"') {
      cell += '"';
      index += 1;
      continue;
    }

    if (char === '"') {
      inQuotes = !inQuotes;
      continue;
    }

    if (char === "," && !inQuotes) {
      row.push(cell.trim());
      cell = "";
      continue;
    }

    if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && next === "\n") index += 1;
      row.push(cell.trim());
      if (row.some(Boolean)) rows.push(row);
      row = [];
      cell = "";
      continue;
    }

    cell += char;
  }

  if (cell || row.length > 0) {
    row.push(cell.trim());
    if (row.some(Boolean)) rows.push(row);
  }

  return rows;
};

const recordId = (org: string, name: string, startDate: string) =>
  createHash("sha1").update(`${org}|${name}|${startDate}`).digest("hex").slice(0, 16);

const mapRow = (headers: string[], row: string[]): BenefitRecord | null => {
  const record = Object.fromEntries(headers.map((header, index) => [header, row[index] || ""]));
  const org = record["기관명"];
  const name = record["사업명"];
  if (!org || !name) return null;

  const category = record["관심주제"] || record["생애주기"] || "민간복지";
  const summary = record["사업목적"] || record["지원내용"] || record["지원대상"] || "";

  return {
    id: `welfare-private:${recordId(org, name, record["사업시작일"])}`,
    name,
    category,
    governing_org: org,
    detail_json: {
      source: "welfare-private",
      sourceLabel: "민간복지서비스정보",
      list: record,
      summary,
    },
    last_updated_at: DATA_LAST_MODIFIED,
  };
};

const upsertRecords = async (records: BenefitRecord[]) => {
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

async function main() {
  const buffer = localCsvPath
    ? await readFile(localCsvPath)
    : await fetchRemoteCsv();
  const text = new TextDecoder("euc-kr").decode(buffer);
  const rows = parseCsv(text);
  const [headers, ...dataRows] = rows;

  if (!headers || dataRows.length === 0) {
    throw new Error("민간복지 CSV 데이터가 비어 있습니다.");
  }

  const records = dataRows
    .map((row) => mapRow(headers, row))
    .filter((record): record is BenefitRecord => record !== null);

  const saved = await upsertRecords(records);
  console.log(`민간복지서비스 저장 완료: ${saved}/${records.length}개`);
}

async function fetchRemoteCsv() {
  const response = await fetch(CSV_URL);
  if (!response.ok) {
    throw new Error(`민간복지 CSV 다운로드 실패: ${response.status} ${response.statusText}`);
  }
  return Buffer.from(await response.arrayBuffer());
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("민간복지서비스 수집 실패", error);
    process.exit(1);
  });
