/* eslint-disable no-console */
import "./loadScriptEnv";
import { getServiceClient } from "@lib/supabaseClient";
import { buildCanonicalUrl } from "@lib/site";
import { validateEnv } from "@lib/env";

type PostRecord = {
  id: string;
  title: string;
  slug: string;
  benefit_id: string | null;
  content: string | null;
  excerpt: string | null;
  published_at: string | null;
};

type ScoreResult = {
  score: number;
  issues: string[];
};

const DEFAULT_BATCH_SIZE = 200;
const MIN_SCORE = 85;
const HARD_SIMILARITY = 0.92;
const WARN_SIMILARITY = 0.85;

const parseBatchSize = () => {
  const index = process.argv.indexOf("--posts");
  const value = index === -1 ? DEFAULT_BATCH_SIZE : Number(process.argv[index + 1]);
  return Number.isFinite(value) && value > 0 ? value : DEFAULT_BATCH_SIZE;
};

const normalizeTitle = (value: string) =>
  value
    .toLowerCase()
    .replace(/20\d{2}년?/g, "")
    .replace(/[^\p{L}\p{N}]+/gu, "");

const bigrams = (value: string) => {
  const normalized = normalizeTitle(value);
  const result = new Set<string>();
  for (let index = 0; index < normalized.length - 1; index += 1) {
    result.add(normalized.slice(index, index + 2));
  }
  return result;
};

const similarity = (left: string, right: string) => {
  const a = bigrams(left);
  const b = bigrams(right);
  if (a.size === 0 || b.size === 0) return 0;

  let intersection = 0;
  a.forEach((item) => {
    if (b.has(item)) intersection += 1;
  });
  return intersection / Math.max(a.size, b.size);
};

const getNearestSimilarity = (post: PostRecord, posts: PostRecord[]) =>
  posts.reduce((nearest, other) => {
    if (other.id === post.id) return nearest;
    const current = similarity(post.title, other.title);
    return current > nearest ? current : nearest;
  }, 0);

const addPenalty = (result: ScoreResult, condition: boolean, penalty: number, issue: string) => {
  if (!condition) return;
  result.score -= penalty;
  result.issues.push(issue);
};

const countMatches = (content: string, pattern: RegExp) => content.match(pattern)?.length ?? 0;

const hasMojibake = (content: string) => /[�]|[?]{2,}|ì|ë|ê|í|ð/.test(content);

const scorePost = (post: PostRecord, duplicateTitles: Set<string>, maxSimilarity: number) => {
  const content = post.content ?? "";
  const result: ScoreResult = { score: 100, issues: [] };
  const titleLengthInvalid = post.title.length < 20 || post.title.length > 60;

  addPenalty(result, duplicateTitles.has(normalizeTitle(post.title)), 40, "제목 정규화 중복");
  addPenalty(result, maxSimilarity >= HARD_SIMILARITY, 20, `유사 제목 위험 ${maxSimilarity.toFixed(3)}`);
  addPenalty(
    result,
    maxSimilarity >= WARN_SIMILARITY && maxSimilarity < HARD_SIMILARITY,
    8,
    `유사 제목 주의 ${maxSimilarity.toFixed(3)}`
  );
  addPenalty(result, titleLengthInvalid, 10, `제목 길이 ${post.title.length}자`);
  addPenalty(result, content.length < 1500, 18, `본문 길이 ${content.length}자`);
  addPenalty(result, !content.includes("2026년 5월 기준"), 5, "기준일 문구 없음");
  addPenalty(result, !content.includes("핵심 요약"), 8, "핵심 요약 없음");
  addPenalty(result, !/\|.+\|/.test(content), 8, "비교/확인 표 없음");
  addPenalty(result, countMatches(content, /^\*\*Q\d\./gm) < 5, 10, "FAQ 5개 미만");
  addPenalty(result, countMatches(content, /^## /gm) < 4, 8, "H2 섹션 4개 미만");
  addPenalty(result, !content.includes("gov.kr"), 10, "공식 출처 링크 없음");
  addPenalty(result, !content.includes("/benefit/"), 6, "내부 혜택 상세 링크 없음");
  addPenalty(result, hasMojibake(`${post.title}\n${post.excerpt ?? ""}\n${content}`), 30, "문자 깨짐 의심");

  return { score: Math.max(0, result.score), issues: result.issues };
};

const fetchPosts = async () => {
  const supabase = getServiceClient();
  const { data, error } = await supabase
    .from("posts")
    .select("id, title, slug, benefit_id, content, excerpt, published_at")
    .eq("is_published", true)
    .order("created_at", { ascending: true });

  if (error) throw error;
  return (data ?? []) as PostRecord[];
};

const selectScheduledBatch = (posts: PostRecord[], batchSize: number) =>
  posts
    .filter((post) => post.published_at)
    .sort((a, b) => new Date(b.published_at ?? 0).getTime() - new Date(a.published_at ?? 0).getTime())
    .slice(0, batchSize)
    .sort((a, b) => new Date(a.published_at ?? 0).getTime() - new Date(b.published_at ?? 0).getTime());

const collectDuplicateTitles = (posts: PostRecord[]) => {
  const counts = new Map<string, number>();
  posts.forEach((post) => {
    const normalized = normalizeTitle(post.title);
    counts.set(normalized, (counts.get(normalized) ?? 0) + 1);
  });
  return new Set([...counts].filter(([, count]) => count > 1).map(([title]) => title));
};

const collectDuplicateValues = (values: string[]) => {
  const counts = new Map<string, number>();
  values.filter(Boolean).forEach((value) => counts.set(value, (counts.get(value) ?? 0) + 1));
  return new Set([...counts].filter(([, count]) => count > 1).map(([value]) => value));
};

const findFirstFutureSlug = (posts: PostRecord[]) =>
  posts.find((post) => new Date(post.published_at ?? 0) > new Date())?.slug;

async function main() {
  validateEnv(["SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"]);

  const batchSize = parseBatchSize();
  const posts = await fetchPosts();
  const scheduledPosts = selectScheduledBatch(posts, batchSize);
  const duplicateTitles = collectDuplicateTitles(posts);
  const duplicateSlugs = collectDuplicateValues(posts.map((post) => post.slug));
  const duplicatePublishTimes = collectDuplicateValues(scheduledPosts.map((post) => post.published_at ?? ""));
  const failedItems = scheduledPosts
    .map((post) => {
      const result = scorePost(post, duplicateTitles, getNearestSimilarity(post, posts));
      addPenalty(result, duplicateSlugs.has(post.slug), 40, "slug 중복");
      addPenalty(
        result,
        Boolean(post.published_at && duplicatePublishTimes.has(post.published_at)),
        12,
        "예약 시각 중복"
      );
      return { slug: post.slug, title: post.title, score: result.score, issues: result.issues };
    })
    .filter((item) => item.score < MIN_SCORE);

  const firstFutureSlug = findFirstFutureSlug(scheduledPosts);
  console.log(
    JSON.stringify(
      {
        audited: scheduledPosts.length,
        minimumScore: MIN_SCORE,
        failures: failedItems.length,
        firstPublishAt: scheduledPosts[0]?.published_at,
        lastPublishAt: scheduledPosts.at(-1)?.published_at,
        futureHiddenCheckUrl: firstFutureSlug ? buildCanonicalUrl(`/blog/${firstFutureSlug}`) : null,
        failedItems: failedItems.slice(0, 20),
      },
      null,
      2
    )
  );

  if (scheduledPosts.length !== batchSize || failedItems.length > 0) {
    process.exit(1);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
