/* eslint-disable no-console */
import "./loadScriptEnv";
import crypto from "crypto";
import { getServiceClient } from "@lib/supabaseClient";
import { buildCanonicalUrl } from "@lib/site";
import { validateEnv } from "@lib/env";
import type { BenefitRecord } from "@/types/benefit";

type Intent = "조건" | "서류" | "신청" | "주의사항" | "FAQ";

type TitlePlan = {
  benefit: BenefitRecord;
  title: string;
  slug: string;
  category: string;
  intent: Intent;
  mainKeyword: string;
  expandedKeywords: string[];
  qualityScore: number;
  nearestExistingTitle: string;
  maxExistingSimilarity: number;
};

type CliOptions = {
  dryRun: boolean;
  posts: number;
  intervalHours: number;
  startDelayHours: number;
};

type ExistingPost = {
  title: string;
  slug: string;
  benefit_id: string | null;
  published_at: string | null;
  created_at: string;
  is_published: boolean | null;
};

type QualityResult = {
  score: number;
  issues: string[];
};

const TARGET_GROUPS = [
  { key: "보조금24 사용법", quota: 25, hints: ["보조금", "정부지원금", "정부 지원금"] },
  { key: "생애주기별 지원금", quota: 35, hints: ["청년", "노인", "출산", "임신", "아동", "신혼", "중장년"] },
  { key: "가구상황별 지원금", quota: 30, hints: ["저소득", "한부모", "차상위", "기초생활", "다자녀", "장애인", "다문화"] },
  { key: "주거·생활비 지원", quota: 25, hints: ["주거", "월세", "전세", "생활", "에너지", "난방", "교통"] },
  { key: "취업·교육·훈련", quota: 25, hints: ["취업", "교육", "훈련", "장학", "일자리", "창업"] },
  { key: "소상공인·자영업자", quota: 30, hints: ["소상공인", "자영업", "중소기업", "사업자", "상권"] },
  { key: "지역별 지원금", quota: 20, hints: ["서울", "경기", "부산", "대구", "인천", "광주", "대전", "울산", "충청", "전라", "경상", "제주"] },
  { key: "신청 실무", quota: 10, hints: ["신청", "서류", "접수", "문의", "기한"] },
] as const;

const INTENTS: Intent[] = ["조건", "서류", "신청", "주의사항", "FAQ"];

const cleanText = (value: unknown, fallback = "정보 없음") => {
  if (value === null || value === undefined) return fallback;
  const text = String(value)
    .replace(/\r?\n+/g, " ")
    .replace(/[●○※]/g, "")
    .replace(/\s+/g, " ")
    .trim();
  return text || fallback;
};

const compact = (value: string, maxLength: number) =>
  value.length > maxLength ? `${value.slice(0, maxLength - 1)}…` : value;

const compactTitleKeyword = (value: string) =>
  value.length > 18 ? value.slice(0, 18).trim() : value;

const normalize = (value: string) =>
  value
    .toLowerCase()
    .replace(/20\d{2}년?/g, "")
    .replace(/[^\p{L}\p{N}]+/gu, "");

const bigrams = (value: string) => {
  const normalized = normalize(value);
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

const getDetailValue = (benefit: BenefitRecord, key: string) => {
  const detailJson = benefit.detail_json as Record<string, Record<string, unknown> | undefined>;
  return cleanText(detailJson.detail?.[key] ?? detailJson.list?.[key]);
};

const getOfficialUrl = (benefit: BenefitRecord) => {
  const detailJson = benefit.detail_json as Record<string, Record<string, unknown> | undefined>;
  return cleanText(
    detailJson.detail?.["온라인신청사이트URL"] ??
      detailJson.list?.["상세조회URL"] ??
      detailJson.detail?.["상세조회URL"],
    `https://www.gov.kr/portal/rcvfvrSvc/dtlEx/${benefit.id}`
  );
};

const createSlug = (benefitId: string, intent: Intent, index: number) => {
  const intentSlug: Record<Intent, string> = {
    조건: "eligibility",
    서류: "documents",
    신청: "apply",
    주의사항: "checks",
    FAQ: "faq",
  };
  return `${benefitId}-${intentSlug[intent]}-${index + 1}`;
};

const classifyGroup = (benefit: BenefitRecord) => {
  const text = `${benefit.name} ${benefit.category || ""} ${benefit.governing_org || ""} ${benefit.gemini_summary || ""}`;
  const matched = TARGET_GROUPS.find((group) => group.hints.some((hint) => text.includes(hint)));
  return matched?.key || "신청 실무";
};

const createTitleCandidates = (benefit: BenefitRecord, intent: Intent) => {
  const name = compactTitleKeyword(benefit.name);
  const org = compact(benefit.governing_org || "담당기관", 12);
  const category = benefit.category || "정부지원";

  const candidates: Record<Intent, string[]> = {
    조건: [
      `${name} 대상 조건과 ${category} 신청 기준`,
      `${name} 자격 조건, 신청 전 확인할 기준`,
    ],
    서류: [
      `${name} 필요서류와 접수 전 체크할 항목`,
      `${name} 서류 준비, ${org} 안내 기준`,
    ],
    신청: [
      `${name} 신청방법과 접수기관 확인`,
      `${name} 신청 절차, 놓치기 쉬운 기준`,
    ],
    주의사항: [
      `${name} 신청 전 주의사항과 확인 기준`,
      `${name} 탈락 줄이는 신청 체크리스트`,
    ],
    FAQ: [
      `${name} FAQ, 대상·서류·신청방법 정리`,
      `${name} 자주 묻는 질문과 공식 확인법`,
    ],
  };

  return candidates[intent];
};

const scoreTitle = (title: string, benefitName: string, maxSimilarity: number) => {
  let score = 45;
  if (title.includes(compact(benefitName, 12))) score += 15;
  if (title.length >= 28 && title.length <= 58) score += 15;
  if (/(대상|조건|서류|신청|기준|FAQ|주의사항|체크)/.test(title)) score += 15;
  if (maxSimilarity < 0.55) score += 10;
  if (!/(무조건|100%|손해|필독|꿀팁|완벽정리|A to Z|💰|✨)/.test(title)) score += 5;
  return Math.min(score, 100);
};

const findNearestTitle = (title: string, existingTitles: string[]) => {
  return existingTitles.reduce(
    (nearest, existingTitle) => {
      const current = similarity(title, existingTitle);
      return current > nearest.score ? { title: existingTitle, score: current } : nearest;
    },
    { title: "", score: 0 }
  );
};

const buildTitlePlan = (
  benefits: BenefitRecord[],
  existingTitles: string[],
  existingBenefitIds: Set<string>,
  total: number,
  startIndex: number
) => {
  const groupCounts = new Map<string, number>();
  const plannedTitles = new Set<string>();
  const plans: TitlePlan[] = [];

  for (const benefit of benefits) {
    if (plans.length >= total) break;
    if (existingBenefitIds.has(benefit.id)) continue;

    const group = classifyGroup(benefit);
    const currentGroupCount = groupCounts.get(group) ?? 0;

    const intent = INTENTS[plans.length % INTENTS.length];
    const candidates = createTitleCandidates(benefit, intent);
    const candidate = candidates
      .map((title) => {
        const nearest = findNearestTitle(title, [...existingTitles, ...plannedTitles]);
        const qualityScore = scoreTitle(title, benefit.name, nearest.score);
        return { title, nearest, qualityScore };
      })
      .filter((item) => item.qualityScore >= 85 && item.nearest.score < 0.72)
      .sort((a, b) => b.qualityScore - a.qualityScore)[0];

    if (!candidate || plannedTitles.has(normalize(candidate.title))) continue;

    const expandedKeywords = [
      benefit.category || "정부지원금",
      benefit.governing_org || "담당기관",
      `${intent} 기준`,
      "공식 확인",
    ];

    plans.push({
      benefit,
      title: candidate.title,
      slug: createSlug(benefit.id, intent, startIndex + plans.length),
      category: group,
      intent,
      mainKeyword: benefit.name,
      expandedKeywords,
      qualityScore: candidate.qualityScore,
      nearestExistingTitle: candidate.nearest.title,
      maxExistingSimilarity: Number(candidate.nearest.score.toFixed(3)),
    });
    plannedTitles.add(normalize(candidate.title));
    groupCounts.set(group, currentGroupCount + 1);
  }

  return plans;
};

const countMatches = (content: string, pattern: RegExp) => content.match(pattern)?.length ?? 0;

const hasMojibake = (content: string) => /[�]|[?]{2,}|ì|ë|ê|í|ð/.test(content);

const addPenalty = (result: QualityResult, condition: boolean, penalty: number, issue: string) => {
  if (!condition) return;
  result.score -= penalty;
  result.issues.push(issue);
};

const scorePlannedArticle = (plan: TitlePlan, content: string): QualityResult => {
  const result: QualityResult = { score: Math.min(100, plan.qualityScore), issues: [] };

  addPenalty(result, plan.maxExistingSimilarity >= 0.72, 25, `제목 유사도 높음 ${plan.maxExistingSimilarity}`);
  addPenalty(result, plan.title.length < 20 || plan.title.length > 60, 10, `제목 길이 ${plan.title.length}자`);
  addPenalty(result, !plan.title.includes(compact(plan.mainKeyword, 12)), 10, "제목 메인 키워드 부족");
  addPenalty(result, content.length < 1500, 18, `본문 길이 ${content.length}자`);
  addPenalty(result, !content.includes("2026년 5월 기준"), 5, "기준일 문구 없음");
  addPenalty(result, !content.includes("핵심 요약"), 8, "핵심 요약 없음");
  addPenalty(result, !/\|.+\|/.test(content), 8, "확인 표 없음");
  addPenalty(result, countMatches(content, /^\*\*Q\d\./gm) < 5, 10, "FAQ 5개 미만");
  addPenalty(result, countMatches(content, /^## /gm) < 4, 8, "H2 섹션 4개 미만");
  addPenalty(result, !content.includes("gov.kr"), 10, "공식 출처 링크 없음");
  addPenalty(result, !content.includes("/benefit/"), 6, "내부 혜택 상세 링크 없음");
  addPenalty(result, hasMojibake(`${plan.title}\n${content}`), 30, "문자 깨짐 의심");

  return { score: Math.max(0, result.score), issues: result.issues };
};

const buildQualitySupplement = (plan: TitlePlan, issues: string[]) => `

## 신청 전 최종 체크

이 글의 핵심 키워드는 ${plan.mainKeyword}입니다. 함께 확인할 확장 키워드는 ${plan.expandedKeywords.join(", ")}이며, 신청 전에는 아래 순서로 다시 점검하는 편이 안전합니다.

- 대상 조건과 제외 조건을 공식 안내에서 다시 확인
- 신청 기한, 접수기관, 문의처를 따로 저장
- 구비서류 원본과 추가 증빙 가능성을 함께 확인
- 유사한 지원금을 받고 있다면 중복 제한 여부 확인

보완 기준: ${issues.join(", ")}
`;

const createQualifiedArticle = (plan: TitlePlan, publishAt: Date) => {
  let content = createArticle(plan, publishAt);
  let result = scorePlannedArticle(plan, content);

  for (let attempt = 1; attempt <= 3 && result.score < 85; attempt += 1) {
    content = `${content}${buildQualitySupplement(plan, result.issues)}`;
    result = scorePlannedArticle(plan, content);
  }

  return { content, quality: result };
};

const createArticle = (plan: TitlePlan, publishAt: Date) => {
  const { benefit } = plan;
  const target = getDetailValue(benefit, "지원대상");
  const content = getDetailValue(benefit, "지원내용");
  const apply = getDetailValue(benefit, "신청방법");
  const documents = getDetailValue(benefit, "구비서류");
  const deadline = getDetailValue(benefit, "신청기한");
  const contact = getDetailValue(benefit, "문의처");
  const officialUrl = getOfficialUrl(benefit);
  const benefitUrl = buildCanonicalUrl(`/benefit/${encodeURIComponent(benefit.category || "기타")}/${benefit.id}`);

  return `2026년 5월 기준으로 ${benefit.name}을 확인하는 분이라면 대상 조건과 신청 절차를 먼저 나눠서 봐야 합니다. 이 글은 ${benefit.governing_org || "담당 기관"}의 공개 정보를 바탕으로 신청 전에 확인할 항목을 정리했습니다.

> **핵심 요약**
> - 대상: ${compact(target, 120)}
> - 내용: ${compact(content, 120)}
> - 신청: ${compact(apply, 120)}

## ${benefit.name}은 누가 확인해야 하나요?

${compact(target, 700)}

지원 대상 문구는 비슷해 보여도 실제 심사에서는 연령, 소득, 거주지, 가구 상황, 기존 수급 여부가 함께 확인될 수 있습니다. 본인이 해당될 가능성이 있다면 안내 문구만 보고 판단하지 말고, 신청 전에 담당 기관 공지와 접수 창구를 함께 확인하는 편이 안전합니다.

## 지원 내용은 무엇을 먼저 봐야 하나요?

${compact(content, 900)}

금액이나 지원 방식이 명시된 경우에도 지급 시점, 지급 횟수, 예산 소진 여부에 따라 체감 혜택이 달라질 수 있습니다. 특히 현금성 지원, 서비스 이용권, 감면, 융자형 지원은 준비해야 할 서류와 처리 기간이 서로 다릅니다.

| 확인 항목 | 신청 전 볼 내용 |
| --- | --- |
| 담당 기관 | ${benefit.governing_org || "공식 안내에서 확인"} |
| 지원 분야 | ${benefit.category || "정부지원"} |
| 신청 기한 | ${compact(deadline, 80)} |
| 문의처 | ${compact(contact, 80)} |

## 신청방법과 필요서류는 어떻게 준비하나요?

${compact(apply, 700)}

필요서류는 다음 항목을 먼저 확인하세요.

- ${compact(documents, 160)}
- 본인 확인 서류와 가구 상황 증빙이 필요한지 확인
- 온라인 신청이 가능한지, 방문 접수만 가능한지 확인
- 신청 후 보완 요청을 받을 수 있으므로 연락처를 정확히 입력

## 신청 전 주의사항은 무엇인가요?

- 같은 성격의 지원금을 이미 받고 있다면 중복 수급 제한이 있는지 확인합니다.
- 접수기관과 실제 심사기관이 다를 수 있으므로 문의처를 따로 저장합니다.
- 예산형 사업은 신청 가능 기간 안에도 조기 마감될 수 있습니다.
- 공식 안내가 수정되면 제출서류와 신청 경로가 달라질 수 있습니다.

공식 상세 안내는 [정부24 보조금 안내](${officialUrl})에서 다시 확인할 수 있습니다. 보조24 안의 상세 정리 페이지도 함께 보면 신청 조건을 빠르게 비교할 수 있습니다: [${benefit.name} 상세 정보](${benefitUrl}).

## 자주 묻는 질문 (FAQ)

**Q1. ${benefit.name}은 어디에서 신청하나요?**  
${compact(apply, 180)}

**Q2. 신청 전에 가장 먼저 확인할 것은 무엇인가요?**  
대상 조건과 신청 기한을 먼저 확인해야 합니다. 조건이 맞아도 기간이 지났거나 예산이 마감되면 신청이 어려울 수 있습니다.

**Q3. 필요서류는 어디에서 확인하나요?**  
공식 안내의 구비서류 항목과 접수기관 안내를 함께 확인하세요. 상황에 따라 추가 증빙을 요구받을 수 있습니다.

**Q4. 이 글만 보고 신청해도 되나요?**  
이 글은 이해를 돕는 정리 자료입니다. 최종 신청 전에는 반드시 공식 기관 안내와 접수 화면을 확인해야 합니다.

**Q5. 언제 발행된 정보인가요?**  
이 글은 ${publishAt.toISOString().slice(0, 10)} 발행 기준으로 작성됐으며, 원천 데이터의 수정일은 ${getDetailValue(benefit, "수정일시")}입니다.
`;
};

const createExcerpt = (plan: TitlePlan) =>
  `${plan.mainKeyword}의 대상, 신청방법, 필요서류와 공식 확인 경로를 2026년 5월 기준으로 정리했습니다.`;

const parseCli = (): CliOptions => {
  const args = process.argv.slice(2);
  const valueOf = (name: string, fallback: number) => {
    const index = args.indexOf(name);
    if (index === -1) return fallback;
    const value = Number(args[index + 1]);
    return Number.isFinite(value) && value > 0 ? value : fallback;
  };

  return {
    dryRun: args.includes("--dry-run"),
    posts: valueOf("--posts", valueOf("--limit", 200)),
    intervalHours: valueOf("--interval-hours", 5),
    startDelayHours: valueOf("--start-delay-hours", 5),
  };
};

const fetchBenefits = async (limit: number) => {
  const supabase = getServiceClient();
  const pageSize = 1000;
  const benefits: BenefitRecord[] = [];

  for (let start = 0; benefits.length < limit && start < 10000; start += pageSize) {
    const { data, error } = await supabase
      .from("benefits")
      .select("id, name, category, governing_org, detail_json, gemini_summary, gemini_faq_json")
      .order("last_updated_at", { ascending: false })
      .range(start, start + pageSize - 1);

    if (error) throw error;
    if (!data || data.length === 0) break;
    benefits.push(...(data as BenefitRecord[]));
  }

  return benefits;
};

const fetchExistingPosts = async () => {
  const supabase = getServiceClient();
  const { data, error } = await supabase
    .from("posts")
    .select("title, slug, benefit_id, published_at, created_at, is_published");

  if (error) throw error;

  return (data ?? []) as ExistingPost[];
};

const selectRecentScheduledPosts = (posts: ExistingPost[], batchSize: number) =>
  posts
    .filter((post) => post.is_published && post.published_at)
    .sort((a, b) => new Date(b.published_at ?? 0).getTime() - new Date(a.published_at ?? 0).getTime())
    .slice(0, batchSize);

const getLatestPublishTime = (posts: ExistingPost[]) =>
  posts.reduce((latest, post) => {
    const value = post.published_at ? new Date(post.published_at).getTime() : 0;
    return Number.isFinite(value) && value > latest ? value : latest;
  }, 0);

const buildExistingIndex = (posts: ExistingPost[]) => ({
  titles: posts.map((item) => item.title).filter(Boolean),
  benefitIds: new Set(posts.map((item) => item.benefit_id).filter(Boolean) as string[]),
});

const schedulePosts = async (plans: TitlePlan[], options: CliOptions, existingPosts: ExistingPost[]) => {
  const supabase = getServiceClient();
  const existingSlugs = new Set(existingPosts.map((post) => post.slug).filter(Boolean));
  const latestPublishTime = getLatestPublishTime(existingPosts);
  const firstPublishTime = latestPublishTime
    ? latestPublishTime + options.intervalHours * 60 * 60 * 1000
    : Date.now() + options.startDelayHours * 60 * 60 * 1000;

  for (let index = 0; index < plans.length; index += 1) {
    const plan = plans[index];
    const publishAt = new Date(firstPublishTime + index * options.intervalHours * 60 * 60 * 1000);
    const { content, quality } = createQualifiedArticle(plan, publishAt);

    if (quality.score < 85) {
      console.error(`품질 기준 미달: ${plan.title} / ${quality.score}점 / ${quality.issues.join(", ")}`);
      continue;
    }

    const contentHash = crypto
      .createHash("sha256")
      .update(`${plan.title}\n${content.slice(0, 1000)}\n${plan.benefit.id}`)
      .digest("hex");

    if (existingSlugs.has(plan.slug)) {
      console.error(`slug 중복으로 건너뜀: ${plan.slug}`);
      continue;
    }

    const payload = {
      benefit_id: plan.benefit.id,
      title: plan.title,
      slug: plan.slug,
      content,
      excerpt: createExcerpt(plan),
      tags: [plan.benefit.category, plan.intent, plan.category].filter(Boolean),
      published_at: publishAt.toISOString(),
      is_published: true,
    };

    if (options.dryRun) {
      console.log(
        JSON.stringify({
          index: index + 1,
          title: plan.title,
          slug: plan.slug,
          publishAt: publishAt.toISOString(),
          qualityScore: plan.qualityScore,
          articleQualityScore: quality.score,
          maxExistingSimilarity: plan.maxExistingSimilarity,
        })
      );
      continue;
    }

    const { data: duplicateHash, error: duplicateHashError } = await supabase
      .from("content_duplicates")
      .select("content_id")
      .eq("content_hash", contentHash)
      .maybeSingle();

    if (duplicateHashError) {
      console.error(`해시 중복 조회 실패: ${plan.slug} / ${duplicateHashError.message}`);
      continue;
    }

    if (duplicateHash) {
      console.error(`본문 해시 중복으로 건너뜀: ${plan.slug} / existing=${duplicateHash.content_id}`);
      continue;
    }

    const { error } = await supabase.from("posts").insert(payload);
    if (error) {
      console.error(`저장 실패: ${plan.title} / ${error.message}`);
      continue;
    }

    const { error: hashError } = await supabase.from("content_duplicates").insert({
      content_hash: contentHash,
      content_type: "post",
      content_id: plan.slug,
    });

    if (hashError && !hashError.message.includes("duplicate")) {
      console.error(`해시 저장 실패: ${plan.slug} / ${hashError.message}`);
    }

    console.log(`${index + 1}/${plans.length} 예약 완료: ${plan.title} (${publishAt.toISOString()})`);
  }
};

async function main() {
  validateEnv(["SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"]);

  const options = parseCli();
  const existingPosts = await fetchExistingPosts();
  const recentScheduledPosts = selectRecentScheduledPosts(existingPosts, options.posts);
  const missingCount = Math.max(options.posts - recentScheduledPosts.length, 0);

  console.log(
    JSON.stringify(
      {
        requested: options.posts,
        existingScheduledCohort: recentScheduledPosts.length,
        missingCount,
        action: missingCount === 0 ? "no_new_posts_required" : "create_missing_posts_only",
      },
      null,
      2
    )
  );

  if (missingCount === 0) {
    return;
  }

  const [benefits, existing] = await Promise.all([
    fetchBenefits(Math.max(missingCount * 8, 1000)),
    Promise.resolve(buildExistingIndex(existingPosts)),
  ]);
  const plans = buildTitlePlan(
    benefits,
    existing.titles,
    existing.benefitIds,
    missingCount,
    existingPosts.length
  );

  console.log(`제목 계획: ${plans.length}/${missingCount}개 생성`);
  const minScore = plans.length > 0 ? Math.min(...plans.map((plan) => plan.qualityScore)) : 0;
  console.log(`최저 제목 품질 점수: ${minScore}`);

  if (plans.length < missingCount) {
    console.warn(`요청 수량보다 적게 생성됐습니다. 생성 가능: ${plans.length}`);
  }

  await schedulePosts(plans, options, existingPosts);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
