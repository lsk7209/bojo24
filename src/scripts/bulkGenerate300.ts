/* eslint-disable no-console */
/**
 * 300개 고품질 블로그 글 생성 스크립트
 *
 * 파이프라인: benefits 조회 → Gemini 리서치 → 구조화된 글 생성 → 품질 체크(90+) → Turso 삽입
 *
 * 실행:
 *   TURSO_DATABASE_URL=... TURSO_AUTH_TOKEN=... GEMINI_API_KEY=... \
 *   npx tsx src/scripts/bulkGenerate300.ts [--target 300] [--batch 5]
 */
import dotenv from "dotenv";
import crypto from "crypto";
import fs from "fs";
import path from "path";

dotenv.config({ path: ".env.local" });
dotenv.config();

// ── CLI args ──────────────────────────────────────────────────────────────────
const args = process.argv.slice(2);
const TARGET = Number(args[args.indexOf("--target") + 1] || process.env.GEN_TARGET || 300);
const BATCH = Number(args[args.indexOf("--batch") + 1] || process.env.GEN_BATCH || 5);
const DELAY_MS = Number(process.env.GEN_DELAY_MS || 3000);
const MIN_QUALITY = Number(process.env.GEN_MIN_QUALITY || 90);
const SCHEDULE_INTERVAL_HOURS = Number(process.env.SCHEDULE_INTERVAL_HOURS || 5);
const SCHEDULE_BASE_TIME = process.env.SCHEDULE_BASE_TIME || ""; // ISO 8601, 비어 있으면 DB max+5h 사용
const PROGRESS_FILE = path.join(process.cwd(), ".article-cache", "bulk-progress.json");

// ── 매크로/슬롯 결정 (seed.py 인라인 구현) ───────────────────────────────────
const MACROS = ["A", "B", "C", "E", "F"] as const;
const LENS_COMPAT: Record<string, Record<string, boolean>> = {
  L1: { A: true, B: false, C: true, E: true, F: false },
  L2: { A: true, B: true, C: true, E: true, F: false },
  L3: { A: true, B: true, C: true, E: true, F: false },
  L4: { A: true, B: true, C: false, E: true, F: true },
  L5: { A: true, B: true, C: false, E: true, F: true },
  L6: { A: true, B: true, C: true, E: true, F: false },
};
const HOOK_BY_MACRO: Record<string, string[]> = {
  A: ["H1", "H2", "H3", "H4", "H5"],
  B: ["H1"],
  C: ["H2"],
  E: ["H4", "H1"],
  F: ["H3", "H1"],
};
const OUTRO_BY_MACRO: Record<string, string[]> = {
  A: ["O1", "O2", "O3", "O4"],
  B: ["O1"],
  C: ["O4", "O1"],
  E: ["O1", "O2"],
  F: ["O2", "O1"],
};

function deriveSlots(title: string) {
  const h = crypto.createHash("sha256").update(title).digest("hex");
  const seed = parseInt(h.slice(0, 12), 16);
  const macro = MACROS[seed % MACROS.length];
  const lensOk = Object.keys(LENS_COMPAT).filter((l) => LENS_COMPAT[l][macro]);
  const lens = lensOk[(seed >> 4) % lensOk.length];
  const hookOk = HOOK_BY_MACRO[macro];
  const hook = hookOk[(seed >> 8) % hookOk.length];
  const outroOk = OUTRO_BY_MACRO[macro];
  const outro = outroOk[(seed >> 12) % outroOk.length];
  return { macro, lens, hook, outro };
}

// ── 진행 추적 ──────────────────────────────────────────────────────────────────
type Progress = { generated: number; skipped: number; failed: number; processedIds: string[] };

function loadProgress(): Progress {
  try {
    if (fs.existsSync(PROGRESS_FILE)) {
      return JSON.parse(fs.readFileSync(PROGRESS_FILE, "utf-8"));
    }
  } catch { /* ignore */ }
  return { generated: 0, skipped: 0, failed: 0, processedIds: [] };
}

function saveProgress(p: Progress) {
  fs.mkdirSync(path.dirname(PROGRESS_FILE), { recursive: true });
  fs.writeFileSync(PROGRESS_FILE, JSON.stringify(p, null, 2));
}

// ── 품질 채점 (자동) ──────────────────────────────────────────────────────────
const CLICHE_PATTERNS = [
  /여러분(들)?\s*안녕하세요/,
  /오늘은\s*[^\n.]{0,30}에\s*대해\s*(알아보|살펴보|이야기)/,
  /도움이\s*(되셨|되셨길)\s*바랍니다/,
  /끝까지\s*읽어주셔서\s*감사합니다/,
  /이상으로\s*[^\n.]{0,40}을(를)?\s*(마치|마무리)/,
  /정말\s*(중요|놀라운|대단한)/,
  /매우\s*(중요|핵심|치명적)/,
  /꼭\s*(알아두|기억해|챙겨)야/,
  /반드시\s*(체크|확인|기억)/,
  /제가\s*(직접\s*)?(상담|진료|진단|처방)/,
  /보장(됩니다|해드립니다)/,
];
const SOURCE_PATTERNS = [/에\s*따르면/, /기준으로/, /통계/, /공식\s*(자료|안내|사이트)/, /고시/, /발표/];

function scoreQuality(content: string, title: string): number {
  let score = 0;
  const words = content.replace(/\s+/g, " ").length;

  // 길이 (20점)
  if (words >= 2000) score += 20;
  else if (words >= 1500) score += 15;
  else if (words >= 1000) score += 8;

  // H2 헤딩 수 (20점)
  const h2Count = (content.match(/^##\s+/gm) || []).length;
  if (h2Count >= 5) score += 20;
  else if (h2Count >= 4) score += 15;
  else if (h2Count >= 3) score += 10;

  // 표/비교 (10점)
  if (content.includes("|---") || content.includes("| ---")) score += 10;

  // 출처 인용 (15점)
  const sourceCount = SOURCE_PATTERNS.filter((p) => p.test(content)).length;
  if (sourceCount >= 4) score += 15;
  else if (sourceCount >= 2) score += 10;
  else if (sourceCount >= 1) score += 5;

  // FAQ 섹션 (10점)
  if (/##\s*자주\s*(묻는|하는)\s*질문/.test(content) || /\*\*Q\d+\./.test(content)) score += 10;

  // 클리셰 없음 (15점)
  const clicheCount = CLICHE_PATTERNS.filter((p) => p.test(content)).length;
  if (clicheCount === 0) score += 15;
  else if (clicheCount <= 1) score += 5;

  // 제목 키워드 본문 포함 (5점)
  const titleWords = title.replace(/[^가-힣a-zA-Z0-9\s]/g, " ").split(/\s+/).filter((w) => w.length >= 2);
  const keywordsFound = titleWords.filter((w) => content.includes(w)).length;
  if (keywordsFound / titleWords.length >= 0.6) score += 5;

  // YMYL 면책 조항 (5점)
  if (/⚠️|면책|공식\s*(공고|출처|링크)|확인\s*(하시기\s*바랍니다|필요)/.test(content)) score += 5;

  return score;
}

// ── 리서치 프롬프트 ────────────────────────────────────────────────────────────
function buildResearchPrompt(benefit: BenefitRow): string {
  const detail = (benefit.detail_json as Record<string, unknown>) || {};
  const d = (detail.detail as Record<string, string>) || (detail.list as Record<string, string>) || {};
  return `대한민국 정부 지원금 정보 리서치 태스크.

정책명: ${benefit.name}
카테고리: ${benefit.category || ""}
관할 기관: ${benefit.governing_org || ""}
AI 요약: ${benefit.gemini_summary || "없음"}
지원 대상: ${d["지원대상"] || ""}
지원 내용: ${d["지원내용"] || ""}
신청 방법: ${d["신청방법"] || ""}
문의처: ${d["문의처"] || d["전화문의"] || ""}

위 정책에 대해 다음 형식으로 리서치 결과를 JSON으로 반환하세요.
반드시 JSON만 반환하고 다른 텍스트는 포함하지 마세요.

{
  "target_audience": "주요 신청 대상 1~2줄",
  "key_benefit": "핵심 혜택 요약 1줄",
  "eligibility": ["자격 조건 1", "자격 조건 2", "자격 조건 3"],
  "application_steps": ["1단계", "2단계", "3단계"],
  "required_docs": ["서류1", "서류2"],
  "amount_or_scope": "지원 금액 또는 범위",
  "comparison_point": "유사 제도와 비교 또는 차별점",
  "common_mistakes": ["흔한 실수1", "흔한 실수2"],
  "faq": [
    {"q": "질문1?", "a": "답변1"},
    {"q": "질문2?", "a": "답변2"},
    {"q": "질문3?", "a": "답변3"}
  ],
  "stat_or_fact": "관련 통계 또는 사실 (출처 포함)",
  "article_angle": "A|B|C|E|F 중 추천 매크로와 이유"
}`;
}

// ── 누락 요소 자동 보정 ──────────────────────────────────────────────────────
function patchContent(content: string, benefit: BenefitRow, research: ResearchResult): string {
  let patched = content;

  // 1. 표가 없으면 핵심 정보 요약표 자동 삽입 (첫 번째 H2 바로 뒤)
  if (!patched.includes("|---") && !patched.includes("| ---")) {
    const tableBlock = `
| 항목 | 내용 |
|------|------|
| 지원 대상 | ${research.target_audience.slice(0, 40)} |
| 지원 내용 | ${research.amount_or_scope.slice(0, 40)} |
| 신청 방법 | ${research.application_steps[0]?.slice(0, 40) || "공식 채널 신청"} |
| 문의처 | ${(benefit.detail_json as Record<string, Record<string, string>>)?.detail?.["문의처"] || (benefit.detail_json as Record<string, Record<string, string>>)?.list?.["문의처"] || "주민센터 또는 해당 기관"} |

`;
    const h2Match = patched.match(/\n## .+\n/);
    if (h2Match?.index !== undefined) {
      const insertAt = h2Match.index + h2Match[0].length;
      patched = patched.slice(0, insertAt) + tableBlock + patched.slice(insertAt);
    } else {
      patched = tableBlock + patched;
    }
  }

  // 2. YMYL 면책 문구 없으면 맨 끝에 추가
  if (!/⚠️/.test(patched) && !/면책/.test(patched)) {
    patched += `\n\n⚠️ 이 글은 공개된 공공데이터를 바탕으로 정리한 안내 자료입니다. 수급 자격의 최종 확인은 해당 기관 공식 공고 또는 주민센터 문의를 우선하세요.`;
  }

  // 3. AI 공개 문구 없으면 추가
  if (!/이 글은 AI 도구/.test(patched)) {
    patched += `\n\n*이 글은 AI 도구를 활용해 공개된 정부 자료·공공데이터를 정리·요약한 결과입니다. 최신 공고는 출처 링크 원문을 우선 확인하세요.*`;
  }

  return patched;
}

// ── 글 생성 프롬프트 ──────────────────────────────────────────────────────────
function buildWritePrompt(
  benefit: BenefitRow,
  research: ResearchResult,
  slots: ReturnType<typeof deriveSlots>
): string {
  const macroDesc: Record<string, string> = {
    A: "포괄 가이드 (H2 5~7개, 카테고리별 정리, FAQ 포함)",
    B: "즉답형 Q&A (첫 문단에 직접 답, H2 4~5개, FAQ 포함)",
    C: "통계 중심 (첫 문단에 수치, 비교표 필수, H2 4~5개)",
    E: "비교형 (비교표 필수, 각 옵션 H2, 선택 가이드 H2)",
    F: "절차형 HowTo (H2가 '1단계. 행동' 형식, 5~7단계)",
  };
  const hookDesc: Record<string, string> = {
    H1: "직접 질문으로 시작 (물음표 끝, 컨텍스트, 약속)",
    H2: "출처 있는 수치로 시작 (수치+단위+출처, 의미, 약속)",
    H3: "구체적 장면·상황 묘사로 시작",
    H4: "통념 vs 실제 대비로 시작 (흔한 오해 → 실제)",
    H5: "권위 있는 인용으로 시작",
  };
  const outroDesc: Record<string, string> = {
    O1: "독자가 지금 바로 할 행동 3가지 나열",
    O2: "본문 핵심 3줄 요약 (이 글 한 줄 요약 → 핵심 3가지 → 누구에게 중요한지)",
    O3: "독자에게 던지는 열린 질문 1~2개",
    O4: "향후 전망·변수 1~2가지",
  };

  return `당신은 대한민국 정부 지원금 정보 큐레이션 에디터입니다.
아래 리서치 결과를 바탕으로 고품질 블로그 글을 작성하세요.

[글 정보]
제목: ${benefit.name} — ${research.key_benefit}
카테고리: ${benefit.category || ""}
매크로: ${slots.macro} — ${macroDesc[slots.macro]}
Hook: ${slots.hook} — ${hookDesc[slots.hook]}
Outro: ${slots.outro} — ${outroDesc[slots.outro]}

[리서치 데이터]
대상: ${research.target_audience}
핵심 혜택: ${research.key_benefit}
자격 조건: ${research.eligibility.join(", ")}
신청 절차: ${research.application_steps.join(" → ")}
필요 서류: ${research.required_docs.join(", ")}
지원 금액: ${research.amount_or_scope}
비교 포인트: ${research.comparison_point}
흔한 실수: ${research.common_mistakes.join(", ")}
통계/사실: ${research.stat_or_fact}
FAQ:
${research.faq.map((f) => `Q: ${f.q}\nA: ${f.a}`).join("\n")}

━━━ 절대 준수 체크리스트 (누락 시 재작성) ━━━

✅ [필수1] H2 섹션 최소 5개 이상
✅ [필수2] 마크다운 표(|헤더|헤더|\n|---|---|) 최소 1개 — 신청 자격·지원 내용·서류 비교에 사용
✅ [필수3] ## 자주 묻는 질문 섹션, **Q1. 질문?** 형식 3개 이상
✅ [필수4] 공식 출처 언급 4회 이상: "복지로 공식 안내에 따르면", "보건복지부 기준으로", "고용노동부 고시에 의하면", "정부24에서 확인" 등
✅ [필수5] 마지막 줄: ⚠️ 로 시작하는 면책 문구 (수급 자격 최종 확인은 공식 공고 참조)
✅ [필수6] 그 다음 줄: *이 글은 AI 도구를 활용해... 로 시작하는 AI 공개 문구
✅ [필수7] 전체 길이 2,000자 이상 (각 H2 섹션을 3~5문단씩 충분히 작성)

❌ [금지1] "여러분 안녕하세요", "도움이 되셨길 바랍니다", "끝까지 읽어주셔서 감사합니다"
❌ [금지2] "반드시 받을 수 있습니다", "보장됩니다", "확실히 해당됩니다"
❌ [금지3] H1 제목(# 한 개만 사용하는 것) 포함 금지 — ## 부터 시작

마크다운 형식으로만 작성하세요.`;
}

// ── 타입 ──────────────────────────────────────────────────────────────────────
type BenefitRow = {
  id: string;
  name: string;
  category: string | null;
  governing_org: string | null;
  detail_json: unknown;
  gemini_summary: string | null;
};

type ResearchResult = {
  target_audience: string;
  key_benefit: string;
  eligibility: string[];
  application_steps: string[];
  required_docs: string[];
  amount_or_scope: string;
  comparison_point: string;
  common_mistakes: string[];
  faq: { q: string; a: string }[];
  stat_or_fact: string;
  article_angle: string;
};

// ── 메인 ──────────────────────────────────────────────────────────────────────
async function main() {
  const tursoUrl = process.env.TURSO_DATABASE_URL;
  const tursoToken = process.env.TURSO_AUTH_TOKEN;
  const geminiKey = process.env.GEMINI_API_KEY;

  if (!tursoUrl || !tursoToken) throw new Error("TURSO_DATABASE_URL/TURSO_AUTH_TOKEN 필요");
  if (!geminiKey) throw new Error("GEMINI_API_KEY 필요");

  const { createClient } = await import("@libsql/client");
  const { GoogleGenerativeAI } = await import("@google/generative-ai");

  const db = createClient({ url: tursoUrl, authToken: tursoToken });
  const genAI = new GoogleGenerativeAI(geminiKey);
  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    generationConfig: { temperature: 0.9, maxOutputTokens: 8192 },
  });

  const progress = loadProgress();
  console.log(`\n🚀 300개 글 생성 시작 (목표: ${TARGET}개, 이미 생성: ${progress.generated}개)`);
  console.log(`   배치: ${BATCH}, 딜레이: ${DELAY_MS}ms, 최소 품질: ${MIN_QUALITY}점`);

  // 예약 발행 기준 시점 계산: 기존 글 중 가장 늦은 published_at + 5시간부터 시작
  let scheduleCursor: Date;
  if (SCHEDULE_BASE_TIME) {
    scheduleCursor = new Date(SCHEDULE_BASE_TIME);
  } else {
    const { rows: maxRows } = await db.execute(
      "SELECT MAX(published_at) AS max_at FROM posts WHERE is_published = 1"
    );
    const maxAt = maxRows[0]?.max_at as string | null;
    scheduleCursor = maxAt
      ? new Date(new Date(maxAt).getTime() + SCHEDULE_INTERVAL_HOURS * 3600 * 1000)
      : new Date(Date.now() + SCHEDULE_INTERVAL_HOURS * 3600 * 1000);
  }
  console.log(`   예약 시작: ${scheduleCursor.toISOString()} (간격 ${SCHEDULE_INTERVAL_HOURS}시간)\n`);

  if (progress.generated >= TARGET) {
    console.log("✅ 이미 목표 달성!");
    return;
  }

  // 이미 처리된 benefit_id 목록 (posts에 있는 것)
  const { rows: existingRows } = await db.execute(
    "SELECT DISTINCT benefit_id FROM posts WHERE benefit_id IS NOT NULL"
  );
  const existingBenefitIds = new Set([
    ...existingRows.map((r) => r.benefit_id as string),
    ...progress.processedIds,
  ]);

  // gemini_summary가 있는 benefits 로드 (랜덤 순서)
  const { rows: benefitRows } = await db.execute(`
    SELECT id, name, category, governing_org, detail_json, gemini_summary
    FROM benefits
    WHERE gemini_summary IS NOT NULL
    ORDER BY RANDOM()
    LIMIT 2000
  `);

  const benefits = benefitRows
    .map((r) => r as unknown as BenefitRow)
    .filter((b) => !existingBenefitIds.has(b.id));

  console.log(`   후보 benefits: ${benefits.length}개 (전체 ${benefitRows.length}개 중 미처리)`);

  let idx = 0;
  let consecutiveApiErrors = 0; // API 오류만 카운트 (품질 미달은 제외)

  while (progress.generated < TARGET && idx < benefits.length) {
    const batch = benefits.slice(idx, idx + BATCH);
    idx += BATCH;

    for (const benefit of batch) {
      if (progress.generated >= TARGET) break;
      if (consecutiveApiErrors >= 10) {
        console.error("연속 API 오류 10회 → 중단");
        saveProgress(progress);
        process.exit(1);
      }

      const total = progress.generated + 1;
      console.log(`\n[${total}/${TARGET}] ${benefit.name} (${benefit.category || "기타"})`);

      try {
        // ── Step 1: 리서치 ────────────────────────────────────────────────────
        const researchPrompt = buildResearchPrompt(benefit);
        const researchResult = await model.generateContent(researchPrompt);
        let researchText = researchResult.response.text().trim();
        researchText = researchText.replace(/^```json\n?/, "").replace(/\n?```$/, "").trim();

        let research: ResearchResult;
        try {
          research = JSON.parse(researchText);
        } catch {
          console.warn("  ⚠️ 리서치 JSON 파싱 실패, 기본값 사용");
          const detail = (benefit.detail_json as Record<string, unknown>) || {};
          const d = (detail.detail as Record<string, string>) || (detail.list as Record<string, string>) || {};
          research = {
            target_audience: d["지원대상"]?.slice(0, 100) || "해당 조건 충족 시민",
            key_benefit: d["지원내용"]?.slice(0, 80) || benefit.gemini_summary?.slice(0, 80) || "정부 지원",
            eligibility: [d["지원대상"]?.slice(0, 50) || "자격 조건 확인 필요"],
            application_steps: [d["신청방법"]?.slice(0, 80) || "주민센터 또는 복지로 신청"],
            required_docs: ["신분증", "신청서"],
            amount_or_scope: d["지원내용"]?.slice(0, 60) || "공고 참조",
            comparison_point: "유사 제도와 차별점은 공식 공고 확인",
            common_mistakes: ["신청 기간 확인 누락", "서류 미비"],
            faq: [
              { q: `${benefit.name} 신청 방법은?`, a: d["신청방법"]?.slice(0, 100) || "주민센터 방문 또는 복지로 온라인 신청" },
              { q: "지원 대상이 어떻게 되나요?", a: d["지원대상"]?.slice(0, 100) || "공고 참조" },
              { q: "문의는 어디로?", a: d["문의처"] || d["전화문의"] || "주민센터 또는 해당 기관" },
            ],
            stat_or_fact: `${benefit.governing_org || "정부"} 공식 자료 기준`,
            article_angle: "A",
          };
        }

        await sleep(DELAY_MS);

        // ── Step 2: 글 생성 ───────────────────────────────────────────────────
        const title = `${benefit.name} — ${research.key_benefit.slice(0, 30)}`;
        const slots = deriveSlots(title);
        const writePrompt = buildWritePrompt(benefit, research, slots);

        const writeResult = await model.generateContent(writePrompt);
        let content = writeResult.response.text().trim();

        // ── Step 3: 누락 요소 자동 보정 ─────────────────────────────────────
        content = patchContent(content, benefit, research);

        await sleep(DELAY_MS);

        // ── Step 4: 품질 체크 ─────────────────────────────────────────────────
        const quality = scoreQuality(content, title);
        console.log(`  품질 점수: ${quality}점`);

        if (quality < MIN_QUALITY) {
          console.warn(`  ⚠️ 품질 미달(${quality}점 < ${MIN_QUALITY}점) — 스킵 (API 오류 아님)`);
          progress.skipped++;
          progress.processedIds.push(benefit.id);
          saveProgress(progress);
          // 품질 미달은 consecutiveApiErrors에 포함하지 않음
          continue;
        }

        // ── Step 5: Turso 삽입 (5시간 간격 예약 발행) ─────────────────────────
        const slug = `${benefit.id.slice(0, 8)}-${Date.now().toString(36)}-${crypto.randomBytes(3).toString("hex")}`;
        const excerpt = content.replace(/[#*`>\-|]/g, "").replace(/\s+/g, " ").slice(0, 140).trim() + "…";
        const tags = JSON.stringify([benefit.category, "정부지원금", "2026정책"].filter(Boolean));
        const scheduledAt = new Date(scheduleCursor.getTime() + progress.generated * SCHEDULE_INTERVAL_HOURS * 3600 * 1000).toISOString();

        await db.execute({
          sql: `INSERT INTO posts (slug, title, content, excerpt, tags, is_published, published_at, benefit_id)
                VALUES (?, ?, ?, ?, ?, 1, ?, ?)`,
          args: [slug, title, content, excerpt, tags, scheduledAt, benefit.id],
        });
        console.log(`  📅 예약 발행: ${scheduledAt}`);

        progress.generated++;
        progress.processedIds.push(benefit.id);
        consecutiveApiErrors = 0;
        console.log(`  ✅ 저장 완료 [${progress.generated}/${TARGET}]`);
        saveProgress(progress);
      } catch (err) {
        console.error(`  ❌ API 오류:`, err instanceof Error ? err.message : String(err));
        progress.failed++;
        consecutiveApiErrors++;
        progress.processedIds.push(benefit.id);
        saveProgress(progress);
        await sleep(DELAY_MS * 2);
      }
    }

    // 배치 간 딜레이
    if (progress.generated < TARGET && idx < benefits.length) {
      await sleep(DELAY_MS);
    }
  }

  saveProgress(progress);
  console.log(`\n═══════════════════════════════════`);
  console.log(`✅ 생성 완료: ${progress.generated}개`);
  console.log(`⏭️  스킵(품질미달): ${progress.skipped}개`);
  console.log(`❌ 오류: ${progress.failed}개`);
  console.log(`═══════════════════════════════════`);

  if (progress.generated < TARGET) {
    console.warn(`\n⚠️ 목표 미달성 (${progress.generated}/${TARGET}). benefits 부족 또는 오류.`);
    process.exit(1);
  }
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

main().catch((e) => {
  console.error("Fatal:", e);
  process.exit(1);
});
