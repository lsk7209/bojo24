/* eslint-disable no-console */
/**
 * 생성된 블로그 글 품질 감사 스크립트
 *
 * 최근 N시간 내 생성된 글을 조회하여 품질 점수를 채점하고
 * 90점 미만인 글을 Turso에서 삭제(또는 unpublish)합니다.
 *
 * 실행:
 *   TURSO_DATABASE_URL=... TURSO_AUTH_TOKEN=... \
 *   npx tsx src/scripts/auditGeneratedPosts.ts [--hours 2] [--delete] [--min-score 90]
 */
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });
dotenv.config();

const args = process.argv.slice(2);
const HOURS_BACK = Number(args[args.indexOf("--hours") + 1] || process.env.AUDIT_HOURS || 3);
const MIN_SCORE = Number(args[args.indexOf("--min-score") + 1] || process.env.AUDIT_MIN_SCORE || 90);
const DELETE_LOW = args.includes("--delete") || process.env.AUDIT_DELETE === "true";

// ── 품질 채점 (bulkGenerate300 동일 로직) ────────────────────────────────────
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

function scoreQuality(content: string, title: string): { score: number; breakdown: Record<string, number> } {
  const breakdown: Record<string, number> = {};
  const words = content.replace(/\s+/g, " ").length;

  if (words >= 2000) breakdown.length = 20;
  else if (words >= 1500) breakdown.length = 15;
  else if (words >= 1000) breakdown.length = 8;
  else breakdown.length = 0;

  const h2Count = (content.match(/^##\s+/gm) || []).length;
  if (h2Count >= 5) breakdown.h2 = 20;
  else if (h2Count >= 4) breakdown.h2 = 15;
  else if (h2Count >= 3) breakdown.h2 = 10;
  else breakdown.h2 = 0;

  breakdown.table = content.includes("|---") || content.includes("| ---") ? 10 : 0;

  const sourceCount = SOURCE_PATTERNS.filter((p) => p.test(content)).length;
  if (sourceCount >= 4) breakdown.sources = 15;
  else if (sourceCount >= 2) breakdown.sources = 10;
  else if (sourceCount >= 1) breakdown.sources = 5;
  else breakdown.sources = 0;

  breakdown.faq = /##\s*자주\s*(묻는|하는)\s*질문/.test(content) || /\*\*Q\d+\./.test(content) ? 10 : 0;

  const clicheCount = CLICHE_PATTERNS.filter((p) => p.test(content)).length;
  if (clicheCount === 0) breakdown.cliche = 15;
  else if (clicheCount <= 1) breakdown.cliche = 5;
  else breakdown.cliche = 0;

  const titleWords = title.replace(/[^가-힣a-zA-Z0-9\s]/g, " ").split(/\s+/).filter((w) => w.length >= 2);
  const keywordsFound = titleWords.filter((w) => content.includes(w)).length;
  breakdown.keywords = titleWords.length > 0 && keywordsFound / titleWords.length >= 0.6 ? 5 : 0;

  breakdown.ymyl = /⚠️|면책|공식\s*(공고|출처|링크)|확인\s*(하시기\s*바랍니다|필요)/.test(content) ? 5 : 0;

  const score = Object.values(breakdown).reduce((a, b) => a + b, 0);
  return { score, breakdown };
}

async function main() {
  const tursoUrl = process.env.TURSO_DATABASE_URL;
  const tursoToken = process.env.TURSO_AUTH_TOKEN;
  if (!tursoUrl || !tursoToken) throw new Error("TURSO_DATABASE_URL/TURSO_AUTH_TOKEN 필요");

  const { createClient } = await import("@libsql/client");
  const db = createClient({ url: tursoUrl, authToken: tursoToken });

  const since = new Date(Date.now() - HOURS_BACK * 60 * 60 * 1000).toISOString();
  const { rows } = await db.execute({
    sql: `SELECT id, title, content, published_at FROM posts
          WHERE is_published = 1 AND published_at >= ?
          ORDER BY published_at DESC`,
    args: [since],
  });

  if (rows.length === 0) {
    console.log(`최근 ${HOURS_BACK}시간 내 생성된 글 없음.`);
    return;
  }

  console.log(`\n📊 품질 감사: ${rows.length}개 글 (최근 ${HOURS_BACK}h, 기준 ${MIN_SCORE}점)\n`);

  const results = rows.map((row) => {
    const { score, breakdown } = scoreQuality(
      String(row.content || ""),
      String(row.title || "")
    );
    return { id: row.id as string, title: row.title as string, score, breakdown };
  });

  const passing = results.filter((r) => r.score >= MIN_SCORE);
  const failing = results.filter((r) => r.score < MIN_SCORE);

  console.log(`✅ 통과 (${MIN_SCORE}점+): ${passing.length}개`);
  console.log(`❌ 미달 (<${MIN_SCORE}점): ${failing.length}개\n`);

  if (failing.length > 0) {
    console.log("미달 목록:");
    for (const r of failing) {
      console.log(`  [${r.score}점] ${String(r.title).slice(0, 60)}`);
      console.log(`    상세: ${JSON.stringify(r.breakdown)}`);
    }
  }

  // 점수 분포
  const hist: Record<string, number> = { "90-100": 0, "80-89": 0, "70-79": 0, "<70": 0 };
  for (const r of results) {
    if (r.score >= 90) hist["90-100"]++;
    else if (r.score >= 80) hist["80-89"]++;
    else if (r.score >= 70) hist["70-79"]++;
    else hist["<70"]++;
  }
  console.log("\n점수 분포:", hist);
  const avg = results.reduce((s, r) => s + r.score, 0) / results.length;
  console.log(`평균 점수: ${avg.toFixed(1)}점`);

  if (DELETE_LOW && failing.length > 0) {
    console.log(`\n🗑️ 미달 글 ${failing.length}개 unpublish 처리...`);
    for (const r of failing) {
      await db.execute({
        sql: "UPDATE posts SET is_published = 0 WHERE id = ?",
        args: [r.id],
      });
    }
    console.log("완료.");
  } else if (failing.length > 0) {
    console.log(`\n(미달 글 삭제하려면 --delete 옵션 추가)`);
  }

  // CI 실패 조건: 미달 비율이 20% 초과
  const failRate = failing.length / results.length;
  if (failRate > 0.2) {
    console.error(`\n⚠️ 미달 비율 ${(failRate * 100).toFixed(1)}% > 20% — 주의 필요`);
    process.exit(1);
  }
}

main().catch((e) => {
  console.error("Fatal:", e);
  process.exit(1);
});
