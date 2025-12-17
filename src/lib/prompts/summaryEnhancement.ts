/**
 * 핵심 요약 보완을 위한 Gemini 프롬프트
 * 재사용 가능하도록 별도 파일로 관리
 */

import { COMMON_ENHANCEMENT_GUIDELINES, buildLengthGuidance } from "./baseEnhancement";

export const SUMMARY_ENHANCEMENT_PROMPT = `
당신은 대한민국 정부 보조금 정보를 시민들이 이해하기 쉽게 설명하는 전문가입니다.

${COMMON_ENHANCEMENT_GUIDELINES}

[보조금 정보]
- 정책명: {benefitName}
- 카테고리: {category}
- 관할 기관: {governingOrg}
- 지원 대상: {target}
- 지원 내용: {benefit}
- 지원 금액: {amount}
- 신청 방법: {apply}
- 신청 기간: {deadline}
- 현재 요약 내용: {currentSummary}

{lengthGuidance}

[요구사항]
위 공공데이터를 기반으로, **핵심 요약**을 명확하고 읽기 쉽게 작성해주세요.

1. **{targetMin}~{targetMax}자**로 작성하세요 (정확히 {targetMin}~{targetMax}자 사이)
2. **구조화된 형식**을 사용하세요:
   - 첫 문장: 보조금 이름과 핵심 정보 (1문장)
   - 본문: 지원 대상, 지원 내용, 지원 금액 등 핵심 정보 (2~3문장)
   - 마무리: 신청 방법 또는 신청 기간 등 실용적 정보 (1문장)
3. **가독성 높은 형식**을 사용하세요:
   - 문단을 나누어 가독성 향상
   - 필요 시 볼드(**텍스트**)로 중요한 정보 강조
   - 목록(- 또는 •)을 활용하여 여러 항목 나열 (필요한 경우)
4. **구체적인 정보**를 포함하세요:
   - 지원 대상 (누가 받을 수 있는지)
   - 지원 내용 (무엇을 받을 수 있는지)
   - 지원 금액 또는 규모 (있는 경우)
   - 신청 방법 또는 기간 (간단히)
5. **공공데이터에 없는 정보는 추가하지 마세요**
6. **전문적이면서도 친절한 톤**으로 작성하세요
7. **문장은 자연스럽고 읽기 쉽게** 작성하세요

[출력 형식]
**반드시 다음 형식을 따라주세요:**

1. 첫 문장: 보조금 이름과 핵심 정보
2. 본문: 지원 대상, 지원 내용, 지원 금액 등
3. 마무리: 신청 방법 또는 기간

**정확한 형식 예시:**

**인플루엔자 백신 지원**은 서울특별시 동대문구에서 제공하는 **보건·의료** 분야 지원금입니다.

본 지원은 **서울특별시 동대문구에 거주하는 국가유공자 본인**을 대상으로 하며, 관내 위탁의료기관에서 **무료 예방접종**을 받을 수 있습니다. 연 1회 지원되며, 나이, 소득 등 별도의 자격 요건은 없습니다.

신청 방법은 관내 위탁의료기관에 직접 방문하거나, 동대문구청 보훈과(02-2127-4000)로 문의하시면 됩니다.

**중요 사항:**
1. 전체 내용은 {targetMin}~{targetMax}자 사이로 작성하세요.
2. 첫 문장에 보조금 이름과 카테고리를 포함하세요.
3. 지원 대상, 지원 내용, 지원 금액 등 핵심 정보를 명확히 전달하세요.
4. 마지막 문장에 신청 방법 또는 기간을 포함하세요.
5. 공공데이터에 없는 정보는 추가하지 마세요.
6. 문장은 자연스럽고 읽기 쉽게 작성하세요.
7. 현재 글자수가 적으므로, 더 상세하고 구체적으로 작성하여 목표 글자수에 도달하세요.
`;

/**
 * 핵심 요약 프롬프트에 실제 값 치환
 */
export function buildSummaryEnhancementPrompt(
  benefitName: string,
  category: string,
  governingOrg: string,
  target: string,
  benefit: string,
  amount: string | null,
  apply: string,
  deadline: string | null,
  currentSummary: string,
  currentLength: number,
  targetLength: { min: number; max: number }
): string {
  const lengthGuidance = buildLengthGuidance(currentLength, targetLength.min, targetLength.max);
  
  return SUMMARY_ENHANCEMENT_PROMPT
    .replace("{benefitName}", benefitName)
    .replace("{category}", category)
    .replace("{governingOrg}", governingOrg)
    .replace("{target}", target || "정보 없음")
    .replace("{benefit}", benefit || "정보 없음")
    .replace("{amount}", amount || "정보 없음")
    .replace("{apply}", apply || "정보 없음")
    .replace("{deadline}", deadline || "정보 없음")
    .replace("{currentSummary}", currentSummary)
    .replace("{lengthGuidance}", lengthGuidance)
    .replace(/{targetMin}/g, targetLength.min.toString())
    .replace(/{targetMax}/g, targetLength.max.toString());
}

