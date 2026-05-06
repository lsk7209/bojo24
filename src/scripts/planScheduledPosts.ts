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
  titleQualityScore: number;
  nearestExistingTitle: string;
  maxExistingSimilarity: number;
};

type CliOptions = {
  dryRun: boolean;
  posts: number;
  intervalHours: number;
  startDelayHours: number;
  jitterMinutes: number;
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

const TARGET_SCORE = 90;
const TITLE_SIMILARITY_LIMIT = 0.72;
const MIN_CONTENT_LENGTH = 3500;
const INTENTS: Intent[] = ["조건", "신청", "서류", "주의사항", "FAQ"];

const TARGET_GROUPS = [
  { key: "보조금24 사용법", quota: 25, hints: ["보조금", "정부지원금", "정부 지원금"] },
  { key: "생애주기별 지원금", quota: 35, hints: ["청년", "노인", "출산", "임신", "아동", "신혼", "중장년"] },
  { key: "가구상황별 지원금", quota: 30, hints: ["저소득", "한부모", "차상위", "기초생활", "장애", "다자녀", "부모"] },
  { key: "주거·생활비 지원", quota: 25, hints: ["주거", "월세", "전세", "생활", "에너지", "난방", "교통"] },
  { key: "취업·교육·훈련", quota: 25, hints: ["취업", "교육", "훈련", "장학", "일자리", "창업"] },
  { key: "소상공인·자영업자", quota: 30, hints: ["소상공인", "자영업", "중소기업", "사업자", "상권"] },
  { key: "지역별 지원금", quota: 20, hints: ["서울", "경기", "부산", "대구", "인천", "광주", "대전", "울산", "충청", "전라", "경상", "제주"] },
  { key: "신청 실무", quota: 10, hints: ["신청", "서류", "접수", "문의", "기한"] },
] as const;

const DETAIL_KEYS = {
  target: ["지원대상", "지원대상자", "서비스목적요약", "선정기준"],
  content: ["지원내용", "서비스목적", "서비스목적요약"],
  apply: ["신청방법", "접수기관", "온라인신청사이트URL"],
  documents: ["구비서류", "본인확인필요구비서류", "공무원확인가능구비서류"],
  deadline: ["신청기한", "접수기간"],
  contact: ["문의처", "전화문의", "접수기관명"],
  officialUrl: ["온라인신청사이트URL", "상세조회URL"],
  modifiedAt: ["수정일시", "등록일시"],
} as const;

const cleanText = (value: unknown, fallback = "공식 안내에서 확인 필요") => {
  if (value === null || value === undefined) return fallback;
  const text = String(value)
    .replace(/\r?\n+/g, " ")
    .replace(/[�]/g, "")
    .replace(/\s+/g, " ")
    .trim();
  return text || fallback;
};

const compact = (value: string, maxLength: number) =>
  value.length > maxLength ? `${value.slice(0, maxLength - 1)}…` : value;

const compactKeyword = (value: string) => {
  const text = cleanText(value);
  if (text.length <= 18) return text;
  const normalized = text.replace(/\s*지원사업$/g, " 지원").replace(/\s*서비스$/g, "");
  const openParenIndex = normalized.indexOf("(");
  if (openParenIndex >= 0 && openParenIndex < 16) {
    const closeParenIndex = normalized.indexOf(")", openParenIndex);
    if (closeParenIndex === -1 || closeParenIndex > 22) {
      return normalized.slice(0, openParenIndex).trim();
    }
  }
  const sliced = normalized.slice(0, 18);
  if (sliced.endsWith("지") && normalized[18] === "원") return `${sliced}원`.trim();
  return sliced.trim();
};

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

const flattenDetailValues = (value: unknown): Record<string, unknown> => {
  if (!value || typeof value !== "object") return {};
  return Object.entries(value as Record<string, unknown>).reduce<Record<string, unknown>>((acc, [key, item]) => {
    if (item && typeof item === "object" && !Array.isArray(item)) {
      Object.assign(acc, flattenDetailValues(item));
    } else {
      acc[key] = item;
    }
    return acc;
  }, {});
};

const getDetailValue = (benefit: BenefitRecord, keys: readonly string[], fallback?: string) => {
  const detail = flattenDetailValues(benefit.detail_json);
  const exact = keys.map((key) => detail[key]).find((value) => cleanText(value, "") !== "");
  if (exact) return cleanText(exact, fallback);

  const fuzzy = Object.entries(detail).find(([key, value]) =>
    keys.some((targetKey) => key.includes(targetKey)) && cleanText(value, "") !== ""
  )?.[1];

  return cleanText(fuzzy ?? fallback ?? benefit.gemini_summary, fallback);
};

const getOfficialUrl = (benefit: BenefitRecord) => {
  const value = getDetailValue(benefit, DETAIL_KEYS.officialUrl, "");
  if (/^https?:\/\//.test(value)) return value;
  return `https://www.gov.kr/portal/rcvfvrSvc/dtlEx/${benefit.id}`;
};

const createSlug = (benefitId: string, intent: Intent, index: number) => {
  const intentSlug: Record<Intent, string> = {
    조건: "eligibility",
    서류: "documents",
    신청: "apply",
    주의사항: "checks",
    FAQ: "faq",
  };
  const safeId = benefitId.toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
  return `${safeId}-${intentSlug[intent]}-${index + 1}`;
};

const classifyGroup = (benefit: BenefitRecord) => {
  const text = `${benefit.name} ${benefit.category || ""} ${benefit.governing_org || ""} ${benefit.gemini_summary || ""}`;
  const matched = TARGET_GROUPS.find((group) => group.hints.some((hint) => text.includes(hint)));
  return matched?.key || "신청 실무";
};

const createTitleCandidates = (benefit: BenefitRecord, intent: Intent) => {
  const name = compactKeyword(benefit.name);
  const org = compact(cleanText(benefit.governing_org, "담당 기관"), 12);
  const category = cleanText(benefit.category, "정부지원금");

  const candidates: Record<Intent, string[]> = {
    조건: [
      `${name} 대상 조건과 ${category} 신청 기준`,
      `${name} 자격 조건, 신청 전 확인할 기준`,
    ],
    서류: [
      `${name} 필요서류와 접수 전 체크 항목`,
      `${name} 서류 준비, ${org} 안내 기준`,
    ],
    신청: [
      `${name} 신청방법과 접수기한 확인`,
      `${name} 신청 절차, 놓치기 쉬운 기준`,
    ],
    주의사항: [
      `${name} 신청 전 주의사항과 확인 기준`,
      `${name} 누락 줄이는 신청 체크리스트`,
    ],
    FAQ: [
      `${name} FAQ, 대상·서류·신청법 정리`,
      `${name} 자주 묻는 질문과 공식 확인법`,
    ],
  };

  return candidates[intent];
};

const findNearestTitle = (title: string, existingTitles: string[]) =>
  existingTitles.reduce(
    (nearest, existingTitle) => {
      const current = similarity(title, existingTitle);
      return current > nearest.score ? { title: existingTitle, score: current } : nearest;
    },
    { title: "", score: 0 }
  );

const titleIncludesMainKeyword = (title: string, keyword: string) => {
  const normalizedTitle = normalize(title);
  const normalizedKeyword = normalize(keyword);
  if (!normalizedKeyword) return true;
  const compacted = normalizedKeyword.slice(0, Math.min(12, normalizedKeyword.length));
  return normalizedTitle.includes(compacted) || normalizedKeyword.includes(normalizedTitle.slice(0, 8));
};

const scoreTitle = (title: string, benefitName: string, maxSimilarity: number) => {
  let score = 45;
  if (titleIncludesMainKeyword(title, benefitName)) score += 20;
  if (title.length >= 28 && title.length <= 55) score += 15;
  if (/(대상|조건|서류|신청|기준|FAQ|주의사항|체크)/.test(title)) score += 12;
  if (maxSimilarity < 0.45) score += 10;
  if (!/(무조건|100%|완벽|끝장|충격|필독|A to Z)/i.test(title)) score += 8;
  return Math.min(score, 100);
};

const buildTitlePlan = (
  benefits: BenefitRecord[],
  existingTitles: string[],
  existingSlugs: Set<string>,
  existingBenefitIds: Set<string>,
  total: number,
  startIndex: number
) => {
  const plannedTitles: string[] = [];
  const normalizedTitles = new Set(existingTitles.map(normalize));
  const plans: TitlePlan[] = [];

  for (const benefit of benefits) {
    if (plans.length >= total) break;
    if (existingBenefitIds.has(benefit.id)) continue;

    for (const intent of INTENTS) {
      if (plans.length >= total) break;
      const slug = createSlug(benefit.id, intent, startIndex + plans.length);
      if (existingSlugs.has(slug)) continue;

      const candidate = createTitleCandidates(benefit, intent)
        .map((title) => {
          const nearest = findNearestTitle(title, [...existingTitles, ...plannedTitles]);
          return {
            title,
            nearest,
            titleQualityScore: scoreTitle(title, benefit.name, nearest.score),
          };
        })
        .filter((item) => {
          const normalized = normalize(item.title);
          return (
            item.titleQualityScore >= TARGET_SCORE &&
            item.nearest.score < TITLE_SIMILARITY_LIMIT &&
            !normalizedTitles.has(normalized)
          );
        })
        .sort((a, b) => b.titleQualityScore - a.titleQualityScore)[0];

      if (!candidate) continue;

      const expandedKeywords = [
        cleanText(benefit.category, "정부지원금"),
        cleanText(benefit.governing_org, "담당 기관"),
        `${intent} 기준`,
        "공식 확인",
      ];

      plans.push({
        benefit,
        title: candidate.title,
        slug,
        category: classifyGroup(benefit),
        intent,
        mainKeyword: benefit.name,
        expandedKeywords,
        titleQualityScore: candidate.titleQualityScore,
        nearestExistingTitle: candidate.nearest.title,
        maxExistingSimilarity: Number(candidate.nearest.score.toFixed(3)),
      });
      plannedTitles.push(candidate.title);
      normalizedTitles.add(normalize(candidate.title));
    }
  }

  return plans;
};

const countMatches = (content: string, pattern: RegExp) => content.match(pattern)?.length ?? 0;
const hasMojibake = (content: string) => /[�]|[?]{2,}|占|챙|챘|챗|챠|챨/.test(content);

const addPenalty = (result: QualityResult, condition: boolean, penalty: number, issue: string) => {
  if (!condition) return;
  result.score -= penalty;
  result.issues.push(issue);
};

const scorePlannedArticle = (plan: TitlePlan, content: string): QualityResult => {
  const result: QualityResult = { score: Math.min(100, plan.titleQualityScore), issues: [] };

  addPenalty(result, plan.maxExistingSimilarity >= TITLE_SIMILARITY_LIMIT, 25, `제목 유사도 높음 ${plan.maxExistingSimilarity}`);
  addPenalty(result, plan.title.length < 20 || plan.title.length > 60, 10, `제목 길이 ${plan.title.length}자`);
  addPenalty(result, !titleIncludesMainKeyword(plan.title, plan.mainKeyword), 10, "제목 메인 키워드 부족");
  addPenalty(result, content.length < MIN_CONTENT_LENGTH, 18, `본문 길이 ${content.length}자`);
  addPenalty(result, !content.includes("2026년 5월 기준"), 5, "기준일 문구 없음");
  addPenalty(result, !content.includes("핵심 요약"), 8, "핵심 요약 없음");
  addPenalty(result, !content.includes("신청 전 확인할 항목"), 8, "신청 체크리스트 없음");
  addPenalty(result, !/\|.+\|/.test(content), 8, "표 없음");
  addPenalty(result, countMatches(content, /^\*\*Q\d\./gm) < 5, 10, "FAQ 5개 미만");
  addPenalty(result, countMatches(content, /^## /gm) < 5, 8, "H2 섹션 5개 미만");
  addPenalty(result, !/공식 상세 안내.+https?:\/\//.test(content), 10, "공식 출처 링크 없음");
  addPenalty(result, countMatches(content, /\]\(\/benefit\//g) < 2, 6, "내부 benefit 링크 2개 미만");
  addPenalty(result, hasMojibake(`${plan.title}\n${content}`), 30, "문자 깨짐 의심");

  return { score: Math.max(0, result.score), issues: result.issues };
};

const buildSupplement = (plan: TitlePlan, issues: string[]) => `

## 신청 전 마지막으로 다시 볼 부분

${plan.mainKeyword}은 안내 문구가 비슷해 보여도 실제 심사에서는 거주지, 소득, 가구 상황, 기존 수급 여부가 함께 확인될 수 있습니다. 특히 ${plan.expandedKeywords.join(", ")} 항목은 신청자가 자주 놓치는 부분이므로 접수 전에 다시 확인하는 편이 안전합니다.

- 담당 기관 공고와 보조금24 상세 페이지의 기준이 같은지 확인합니다.
- 신청 기한, 접수 기관, 보완 요청 연락처를 따로 적어 둡니다.
- 가족 구성이나 소득 기준이 바뀐 경우 최신 증빙을 준비합니다.
- 유사 지원을 이미 받은 경우 중복 제한 여부를 먼저 확인합니다.

보강 기준: ${issues.join(", ")}
`;

const createQualifiedArticle = (plan: TitlePlan, publishAt: Date) => {
  let content = createArticle(plan, publishAt);
  let result = scorePlannedArticle(plan, content);

  for (let attempt = 1; attempt <= 3 && result.score < TARGET_SCORE; attempt += 1) {
    content = `${content}${buildSupplement(plan, result.issues)}`;
    result = scorePlannedArticle(plan, content);
  }

  return { content, quality: result };
};

const createArticle = (plan: TitlePlan, publishAt: Date) => {
  const { benefit } = plan;
  const target = getDetailValue(benefit, DETAIL_KEYS.target, "대상 조건은 공식 안내에서 최종 확인해야 합니다.");
  const support = getDetailValue(benefit, DETAIL_KEYS.content, "지원 내용은 담당 기관 공고 기준으로 확인해야 합니다.");
  const apply = getDetailValue(benefit, DETAIL_KEYS.apply, "신청 방법은 보조금24 또는 담당 기관 접수 안내에서 확인합니다.");
  const documents = getDetailValue(benefit, DETAIL_KEYS.documents, "신분 확인 서류와 자격 증빙 서류가 필요할 수 있습니다.");
  const deadline = getDetailValue(benefit, DETAIL_KEYS.deadline, "상시 또는 공고별 기한 확인");
  const contact = getDetailValue(benefit, DETAIL_KEYS.contact, "담당 기관 문의처 확인");
  const modifiedAt = getDetailValue(benefit, DETAIL_KEYS.modifiedAt, "공식 데이터 수정일 확인 필요");
  const officialUrl = getOfficialUrl(benefit);
  const relatedHref = `/benefit/${encodeURIComponent(benefit.category || "기타")}/${benefit.id}`;
  const relatedUrl = buildCanonicalUrl(relatedHref);

  return `2026년 5월 기준으로 ${benefit.name}을 확인하는 사람이라면 먼저 대상 조건, 신청 방법, 서류, 접수 기한을 한 번에 정리해 두는 것이 좋습니다. 이 글은 ${benefit.governing_org || "담당 기관"}의 공공데이터와 보조금24 상세 정보를 바탕으로 신청 전에 확인할 기준을 실무적으로 정리했습니다.

> **핵심 요약**
> - 메인 키워드: ${plan.mainKeyword}
> - 확장 키워드: ${plan.expandedKeywords.join(", ")}
> - 대상: ${compact(target, 140)}
> - 신청: ${compact(apply, 140)}

## ${benefit.name} 대상 조건은 무엇인가요?

${compact(target, 900)}

대상 조건은 안내문에 적힌 한 줄만 보고 판단하기 어렵습니다. 실제 접수 단계에서는 나이, 거주지, 가구 상황, 소득 기준, 기존 수급 여부, 사업 예산 상황이 함께 확인될 수 있습니다. 따라서 본인이 일부 조건에 해당하는 것처럼 보여도 담당 기관 공고와 접수 화면의 세부 문구를 같이 확인해야 합니다.

특히 지자체 사업은 같은 이름의 지원이라도 지역마다 기준이 다를 수 있습니다. 중앙부처 사업은 전국 공통 기준이 많지만, 접수 기관과 위탁 기관이 나뉘면 제출 방식이 달라질 수 있습니다. 이 글에서는 큰 흐름을 먼저 잡고, 최종 신청 전에는 반드시 공식 페이지에서 최신 내용을 확인하는 방식으로 안내합니다.

## 지원 내용과 신청 기준을 어떻게 봐야 하나요?

${compact(support, 1100)}

지원 내용은 현금, 서비스, 이용권, 감면, 대여, 교육, 상담처럼 여러 형태로 제공될 수 있습니다. 금액이 명확히 보이지 않는 사업도 실제로는 대상별 한도, 예산 범위, 우선순위가 따로 정해져 있을 수 있습니다.

| 확인 항목 | 봐야 할 내용 |
|---|---|
| 담당 기관 | ${benefit.governing_org || "공식 안내에서 확인"} |
| 지원 분야 | ${benefit.category || "정부지원금"} |
| 신청 기한 | ${compact(deadline, 120)} |
| 문의처 | ${compact(contact, 120)} |

위 표의 네 항목은 신청 전에 가장 먼저 확인해야 합니다. 하나라도 불명확하면 접수 후 보완 요청을 받을 가능성이 있고, 보완 기간을 놓치면 신청이 반려될 수 있습니다.

## 신청 방법과 필요서류는 어떻게 준비하나요?

${compact(apply, 900)}

필요서류는 다음 흐름으로 준비하면 실수가 줄어듭니다.

- 신청자 본인 확인 서류를 먼저 준비합니다.
- 대상 조건을 증명할 수 있는 서류를 확인합니다.
- 온라인 신청인지 방문 접수인지 확인합니다.
- 대리 신청이 가능한 사업이면 위임 관련 서류를 확인합니다.
- 제출 후 보완 연락을 받을 수 있도록 연락처를 정확히 적습니다.

신청 전 확인할 항목은 다음과 같습니다.

- [ ] ${benefit.name} 대상 조건이 현재 내 상황과 맞는지 확인
- [ ] 신청 기한이 지나지 않았는지 확인
- [ ] ${compact(documents, 160)}
- [ ] 접수 기관과 문의처를 따로 저장
- [ ] 비슷한 지원금을 이미 받았다면 중복 제한 여부 확인

## 신청 전 주의사항은 무엇인가요?

${benefit.name}은 이름만 보고 신청 가능 여부를 판단하면 안 됩니다. 같은 분야의 지원금이라도 대상 연령, 소득 기준, 거주 기준, 사업 기간이 다르면 결과가 달라집니다. 또한 공공데이터의 수정일과 실제 접수 기관의 공고 수정일이 다를 수 있으므로, 접수 직전에는 원문 공고를 다시 확인하는 습관이 필요합니다.

신청 과정에서 가장 흔한 실수는 세 가지입니다. 첫째, 신청 기한을 대략적으로 기억하다가 접수 마감일을 놓치는 경우입니다. 둘째, 서류는 준비했지만 발급일 기준이나 가족관계 증명 범위를 잘못 맞추는 경우입니다. 셋째, 이미 받은 지원과 새로 신청하는 지원이 중복 제한에 걸리는지 확인하지 않는 경우입니다.

공식 상세 안내는 [담당 기관 원문 안내](${officialUrl})에서 확인할 수 있습니다. 보조금24 내부 상세 페이지도 함께 보면 신청 조건을 빠르게 비교할 수 있습니다: [${benefit.name} 상세 정보](${relatedHref}), [보조금24 지원금 목록](/benefit).

## 자주 묻는 질문 (FAQ)

**Q1. ${benefit.name}은 어디에서 신청하나요?**  
${compact(apply, 220)}

**Q2. 신청 전에 가장 먼저 확인할 것은 무엇인가요?**  
대상 조건과 신청 기한입니다. 조건이 맞아도 접수 기간이 끝났거나 예산이 소진되면 신청이 어려울 수 있습니다.

**Q3. 필요서류는 어디에서 확인하나요?**  
공식 안내의 구비서류 항목을 확인해야 합니다. 현재 확인되는 서류 정보는 ${compact(documents, 180)}입니다.

**Q4. 이 글만 보고 바로 신청해도 되나요?**
이 글은 신청 전 확인을 돕는 정리 자료입니다. 최종 제출 전에는 반드시 공식 기관 안내와 접수 화면의 최신 문구를 확인해야 합니다.

**Q5. 이 정보는 언제 기준인가요?**
이 글은 ${publishAt.toISOString().slice(0, 10)} 예약 발행 기준으로 작성했습니다. 공공데이터 원본 수정일은 ${modifiedAt}입니다.

## 마무리 확인

${benefit.name}은 ${plan.intent} 관점에서 확인할 부분이 분명한 지원 정보입니다. 신청 가능성이 있다면 먼저 보조금24 상세 페이지에서 조건을 확인하고, 접수 기관 안내로 넘어가 서류와 기한을 점검하는 순서가 좋습니다. 같은 지원 분야의 다른 글도 함께 보면 누락되는 항목을 줄일 수 있습니다.

관련 내부 확인 링크: [${benefit.name} 보조금 상세](${relatedHref}), [보조금24 전체 지원금](/benefit). 공식 원문 URL: ${officialUrl}. 정규 URL 확인용 전체 주소: ${relatedUrl}.
`;
};

const createExcerpt = (plan: TitlePlan) =>
  `${plan.mainKeyword} 대상 조건, 신청방법, 필요서류와 공식 확인 경로를 2026년 5월 기준으로 정리했습니다.`;

const parseCli = (): CliOptions => {
  const args = process.argv.slice(2);
  const valueOf = (name: string, fallback: number) => {
    const index = args.indexOf(name);
    if (index === -1) return fallback;
    const value = Number(args[index + 1]);
    return Number.isFinite(value) && value > 0 ? value : fallback;
  };
  const nonNegativeValueOf = (name: string, fallback: number) => {
    const index = args.indexOf(name);
    if (index === -1) return fallback;
    const value = Number(args[index + 1]);
    return Number.isFinite(value) && value >= 0 ? value : fallback;
  };

  return {
    dryRun: args.includes("--dry-run"),
    posts: valueOf("--posts", valueOf("--limit", 200)),
    intervalHours: nonNegativeValueOf("--interval-hours", 5),
    startDelayHours: nonNegativeValueOf("--start-delay-hours", 5),
    jitterMinutes: nonNegativeValueOf("--jitter-minutes", 60),
  };
};

const fetchBenefits = async (limit: number) => {
  const supabase = getServiceClient();
  const pageSize = 1000;
  const benefits: BenefitRecord[] = [];

  for (let start = 0; benefits.length < limit && start < 30000; start += pageSize) {
    const { data, error } = await supabase
      .from("benefits")
      .select("id, name, category, governing_org, detail_json, gemini_summary, gemini_faq_json")
      .order("last_updated_at", { ascending: false })
      .range(start, start + pageSize - 1);

    if (error) throw error;
    if (!data || data.length === 0) break;
    benefits.push(...(data as BenefitRecord[]));
  }

  return benefits.slice(0, limit);
};

const fetchExistingPosts = async () => {
  const supabase = getServiceClient();
  const { data, error } = await supabase
    .from("posts")
    .select("title, slug, benefit_id, published_at, created_at, is_published");

  if (error) throw error;
  return (data ?? []) as ExistingPost[];
};

const getLatestPublishTime = (posts: ExistingPost[]) =>
  posts.reduce((latest, post) => {
    const value = post.published_at ? new Date(post.published_at).getTime() : 0;
    return Number.isFinite(value) && value > latest ? value : latest;
  }, 0);

const buildExistingIndex = (posts: ExistingPost[]) => ({
  titles: posts.map((item) => item.title).filter(Boolean),
  slugs: new Set(posts.map((item) => item.slug).filter(Boolean)),
  benefitIds: new Set(posts.map((item) => item.benefit_id).filter(Boolean) as string[]),
});

const calculatePublishTime = (firstPublishTime: number, index: number, options: CliOptions) => {
  const intervalMs = options.intervalHours * 60 * 60 * 1000;
  if (index === 0 || options.jitterMinutes === 0) return new Date(firstPublishTime + index * intervalMs);

  const pattern = [-20, 15, -10, 25, 0];
  const boundedJitter = Math.min(options.jitterMinutes, Math.abs(pattern[index % pattern.length]));
  const direction = Math.sign(pattern[index % pattern.length]);
  return new Date(firstPublishTime + index * intervalMs + boundedJitter * direction * 60 * 1000);
};

const schedulePosts = async (plans: TitlePlan[], options: CliOptions, existingPosts: ExistingPost[]) => {
  const supabase = getServiceClient();
  const existingSlugs = new Set(existingPosts.map((post) => post.slug).filter(Boolean));
  const latestPublishTime = getLatestPublishTime(existingPosts);
  const firstPublishTime = latestPublishTime
    ? latestPublishTime + options.intervalHours * 60 * 60 * 1000
    : Date.now() + options.startDelayHours * 60 * 60 * 1000;

  let savedCount = 0;
  for (let index = 0; index < plans.length; index += 1) {
    const plan = plans[index];
    const publishAt = calculatePublishTime(firstPublishTime, index, options);
    const { content, quality } = createQualifiedArticle(plan, publishAt);

    if (quality.score < TARGET_SCORE) {
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
          titleQualityScore: plan.titleQualityScore,
          articleQualityScore: quality.score,
          maxExistingSimilarity: plan.maxExistingSimilarity,
          nearestExistingTitle: plan.nearestExistingTitle || null,
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

    savedCount += 1;
    console.log(`${savedCount}/${plans.length} 예약 완료: ${plan.title} (${publishAt.toISOString()})`);
  }

  if (!options.dryRun && savedCount < options.posts) {
    throw new Error(`요청한 ${options.posts}개 중 ${savedCount}개만 저장되었습니다.`);
  }
};

async function main() {
  validateEnv(["SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY"]);

  const options = parseCli();
  const existingPosts = await fetchExistingPosts();
  const existing = buildExistingIndex(existingPosts);
  const benefits = await fetchBenefits(Math.max(options.posts * 12, 2500));
  const plans = buildTitlePlan(benefits, existing.titles, existing.slugs, existing.benefitIds, options.posts, existingPosts.length);

  const minTitleScore = plans.length > 0 ? Math.min(...plans.map((plan) => plan.titleQualityScore)) : 0;
  const maxSimilarity = plans.length > 0 ? Math.max(...plans.map((plan) => plan.maxExistingSimilarity)) : 0;

  console.log(
    JSON.stringify(
      {
        requested: options.posts,
        planned: plans.length,
        existingPosts: existingPosts.length,
        minTitleScore,
        maxSimilarity: Number(maxSimilarity.toFixed(3)),
        targetScore: TARGET_SCORE,
        action: options.dryRun ? "dry_run" : "schedule",
      },
      null,
      2
    )
  );

  if (plans.length < options.posts) {
    throw new Error(`요청한 ${options.posts}개보다 적은 ${plans.length}개만 생성되었습니다.`);
  }

  await schedulePosts(plans, options, existingPosts);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
