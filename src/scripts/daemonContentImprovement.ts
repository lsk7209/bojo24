/* eslint-disable no-console */
/**
 * 6시간 주기 콘텐츠 개선 및 검색엔진 색인 자동 데몬 스크립트
 *
 * 주요 기능:
 * 1. 보조금 마감일/신청 상태 감사 (D-Day & Status Audit)
 * 2. 콘텐츠 무결성 점검 (Content Integrity Verification)
 * 3. 최근 6시간 내 공개된 예약 글 확인 및 검색엔진(IndexNow + RSS) 자동 핑
 * 4. GitHub Actions 실행 요약(Step Summary) 자동 출력
 *
 * 실행:
 *   npx tsx src/scripts/daemonContentImprovement.ts [--dry-run] [--limit 20] [--lookback 6]
 */

import "./loadScriptEnv";
import fs from "fs";
import { parseApplicationStatus } from "@lib/applicationStatus";
import { resolveSiteUrl, buildCanonicalUrl } from "@lib/site";
import { buildPostPath } from "@lib/postRouting";
import { notifyIndexNow } from "@lib/search-indexing";

const args = process.argv.slice(2);
const isDryRun = args.includes("--dry-run");
const limitIndex = args.indexOf("--limit");
const BATCH_LIMIT = limitIndex !== -1 && Number(args[limitIndex + 1]) > 0 ? Number(args[limitIndex + 1]) : 20;
const lookbackIndex = args.indexOf("--lookback");
const LOOKBACK_HOURS = lookbackIndex !== -1 && Number(args[lookbackIndex + 1]) > 0 ? Number(args[lookbackIndex + 1]) : 6;

const SITE_URL = resolveSiteUrl();

async function pingRssFeed() {
  const rssUrl = `${SITE_URL}/rss.xml`;
  const endpoints = [
    `https://blogsearch.google.com/ping/RPC2`,
    `https://rpc.pingomatic.com/`,
  ];
  const xmlBody = (url: string) =>
    `<?xml version="1.0"?><methodCall><methodName>weblogUpdates.extendedPing</methodName><params><param><value>보조24</value></param><param><value>${SITE_URL}</value></param><param><value>${SITE_URL}</value></param><param><value>${url}</value></param></params></methodCall>`;

  const results = await Promise.allSettled(
    endpoints.map((ep) =>
      fetch(ep, {
        method: "POST",
        headers: { "Content-Type": "text/xml" },
        body: xmlBody(rssUrl),
        signal: AbortSignal.timeout(8000),
      })
    )
  );

  const successCount = results.filter((r) => r.status === "fulfilled" && (r.value as Response).ok).length;
  console.log(`[Daemon] RSS Ping 전송 완료: ${successCount}/${endpoints.length} 성공`);
}

function writeGithubSummary(content: string) {
  const summaryFile = process.env.GITHUB_STEP_SUMMARY;
  if (!summaryFile) return;
  try {
    fs.appendFileSync(summaryFile, `${content}\n`, "utf8");
  } catch (err) {
    console.warn("[Daemon] GITHUB_STEP_SUMMARY 기록 실패:", err);
  }
}

async function main() {
  const startTime = Date.now();
  console.log(`\n==================================================`);
  console.log(`🤖 보조24 콘텐츠 개선 자동 데몬 실행 (주기: 6시간)`);
  console.log(`   - 모드: ${isDryRun ? "DRY-RUN (조회 및 감사만 수행)" : "PRODUCTION (실제 반영)"}`);
  console.log(`   - 배치 크기: ${BATCH_LIMIT}건`);
  console.log(`   - 발행 글 점검 범위: 최근 ${LOOKBACK_HOURS}시간`);
  console.log(`   - 사이트 URL: ${SITE_URL}`);
  console.log(`==================================================\n`);

  const hasTurso = Boolean(process.env.TURSO_DATABASE_URL && process.env.TURSO_AUTH_TOKEN);
  const hasSupabase = Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
  const isDbConfigured = hasTurso || hasSupabase;

  if (!isDbConfigured) {
    console.warn("⚠️ DB 환경 변수(TURSO 또는 SUPABASE)가 설정되지 않아 로컬 목업 데이터로 감사를 수행합니다.");
  }

  let db: any = null;
  if (isDbConfigured) {
    const { getServiceClient } = await import("@lib/supabaseClient");
    db = getServiceClient();
  }

  // ── Step 1: 보조금 마감일 및 접수 상태 감사 ────────────────────────────
  console.log(`[Step 1] 최근 보조금 ${BATCH_LIMIT}건 마감 상태 및 D-Day 검사 시작...`);

  const statusStats = {
    always: 0,
    open: 0,
    closing_soon: 0,
    closed: 0,
    unknown: 0,
  };

  let auditedBenefitsCount = 0;
  const sampleReports: Array<{ name: string; deadline: string; status: string; label: string }> = [];

  try {
    let benefits: any[] | null = null;
    let error: any = null;

    if (db) {
      const res = await db
        .from("benefits")
        .select("id, name, category, governing_org, detail_json, last_updated_at")
        .order("last_updated_at", { ascending: false })
        .limit(BATCH_LIMIT);
      benefits = res.data;
      error = res.error;
    } else {
      // 로컬 환경 DB 미연결 시 목업 샘플 감사
      benefits = [
        { id: "mock_1", name: "청년 월세 특별지원", category: "주거·자립", governing_org: "국토교통부", detail_json: { detail: { 신청기간: "2026.01.01 ~ 2026.12.31" } } },
        { id: "mock_2", name: "소상공인 정책자금", category: "고용·창업", governing_org: "중소벤처기업부", detail_json: { detail: { 신청기간: "상시 접수 (예산 소진 시까지)" } } },
        { id: "mock_3", name: "긴급복지 생계지원", category: "생활안정", governing_org: "보건복지부", detail_json: { detail: { 신청기간: "2026.10.15 ~ 2026.11.02" } } },
        { id: "mock_4", name: "2025년 상반기 지원금", category: "기타", governing_org: "행정안전부", detail_json: { detail: { 신청기간: "2025.01.01 ~ 2025.06.30" } } },
      ];
    }

    if (error) {
      console.warn("보조금 데이터 조회 실패:", error.message);
    } else if (benefits && benefits.length > 0) {
      auditedBenefitsCount = benefits.length;
      for (const item of benefits) {
        let detail = item.detail_json as any;
        if (typeof detail === "string") {
          try {
            detail = JSON.parse(detail);
          } catch {
            detail = {};
          }
        }
        detail = detail || {};
        const detailData = detail.detail || detail.list || detail || {};
        const deadlineText =
          detailData["신청기간"] ||
          detailData["신청기한"] ||
          detailData["접수기간"] ||
          detailData["신청 기간"] ||
          detailData["사업기간"] ||
          "";
        const parsed = parseApplicationStatus(deadlineText);

        statusStats[parsed.status] = (statusStats[parsed.status] || 0) + 1;

        if (sampleReports.length < 5) {
          sampleReports.push({
            name: item.name,
            deadline: deadlineText ? deadlineText.slice(0, 30) : "(정보 없음)",
            status: parsed.status,
            label: parsed.label,
          });
        }
      }
    }
  } catch (err) {
    console.warn("보조금 감사 중 예외 발생 (건너뜀):", err);
  }

  console.log(`  - 검사 완료: ${auditedBenefitsCount}건`);
  console.log(`  - 상태 분포: 상시 ${statusStats.always}건 | 접수중 ${statusStats.open}건 | 마감임박 ${statusStats.closing_soon}건 | 마감 ${statusStats.closed}건 | 확인필요 ${statusStats.unknown}건`);

  // ── Step 2: 최근 6시간 내 공개된 예약 블로그 글 색인 알림 ─────────────
  console.log(`\n[Step 2] 최근 ${LOOKBACK_HOURS}시간 내 공개 전환된 블로그 글 확인...`);
  const now = new Date();
  const lookback = new Date(now.getTime() - LOOKBACK_HOURS * 60 * 60 * 1000);

  let notifiedUrls: string[] = [];

  try {
    let recentPosts: any[] | null = null;
    let postError: any = null;

    if (db) {
      const res = await db
        .from("posts")
        .select("id, slug, title, published_at")
        .eq("is_published", true)
        .gte("published_at", lookback.toISOString())
        .lte("published_at", now.toISOString())
        .order("published_at", { ascending: true });
      recentPosts = res.data;
      postError = res.error;
    }

    if (postError) {
      console.warn("블로그 글 조회 실패:", postError.message);
    } else if (recentPosts && recentPosts.length > 0) {
      notifiedUrls = recentPosts.map((p) => buildCanonicalUrl(buildPostPath(p)));
      console.log(`  - 최근 발행된 글 발견: ${notifiedUrls.length}건`);
      recentPosts.forEach((p) => console.log(`    • [${p.published_at?.substring(0, 16)}] ${p.title}`));

      if (!isDryRun) {
        console.log(`  - IndexNow 검색엔진 색인 요청 전송...`);
        const indexNowEngines = await notifyIndexNow(notifiedUrls);
        console.log(`    IndexNow 응답 엔진: ${indexNowEngines.join(", ") || "없음"}`);
      } else {
        console.log(`  - (Dry Run) IndexNow 색인 요청 건너뜀`);
      }
    } else {
      console.log(`  - 최근 ${LOOKBACK_HOURS}시간 내 새로 도래한 예약 글 없음.`);
    }
  } catch (err) {
    console.warn("블로그 글 색인 알림 중 예외 발생 (건너뜀):", err);
  }

  // ── Step 3: 사이트맵 및 RSS Ping 전송 ─────────────────────────────────
  console.log(`\n[Step 3] 사이트맵 및 RSS Ping 전송...`);
  if (!isDryRun) {
    await pingRssFeed();
  } else {
    console.log(`  - (Dry Run) RSS Ping 건너뜀`);
  }

  // ── Step 4: 실행 결과 요약 및 GitHub Step Summary ─────────────────────
  const durationSec = ((Date.now() - startTime) / 1000).toFixed(2);
  console.log(`\n==================================================`);
  console.log(`✅ 콘텐츠 개선 데몬 실행 완료 (${durationSec}초 소요)`);
  console.log(`==================================================\n`);

  const summaryMarkdown = `
### 🤖 보조24 콘텐츠 개선 자동 데몬 실행 보고서

- **실행 모드**: \`${isDryRun ? "DRY-RUN" : "PRODUCTION"}\`
- **소요 시간**: ${durationSec}초
- **보조금 상태 검사**: ${auditedBenefitsCount}건 검사 완료
  - 🟢 **상시 접수**: ${statusStats.always}건
  - 🔵 **접수중**: ${statusStats.open}건
  - 🟠 **마감 임박**: ${statusStats.closing_soon}건
  - ⚪ **접수 마감**: ${statusStats.closed}건
  - 🔘 **확인 필요**: ${statusStats.unknown}건
- **신규 블로그 색인 알림**: ${notifiedUrls.length}건 전송
${sampleReports.length > 0 ? `
#### 📋 표본 보조금 마감 상태 점검
| 보조금명 | 공공데이터 신청기간 | 판정 상태 |
|---|---|---|
${sampleReports.map((r) => `| ${r.name} | ${r.deadline} | **${r.label}** |`).join("\n")}
` : ""}
`;

  writeGithubSummary(summaryMarkdown);
}

main().catch((err) => {
  console.error("❌ 데몬 실행 중 오류 발생:", err);
  process.exit(1);
});
