/**
 * 지원 내용 보완을 위한 Gemini 프롬프트
 * 재사용 가능하도록 별도 파일로 관리
 */

import { COMMON_ENHANCEMENT_GUIDELINES, buildLengthGuidance } from "./baseEnhancement";

export const BENEFIT_ENHANCEMENT_PROMPT = `
당신은 대한민국 정부 보조금 정보를 시민들이 이해하기 쉽게 설명하는 전문가입니다.

${COMMON_ENHANCEMENT_GUIDELINES}

[보조금 정보]
- 정책명: {benefitName}
- 관할 기관: {governingOrg}
- 현재 지원 내용 정보: {publicDataBenefit}
- 지원 규모: {amount}
- 지원 형태: {benefitType}

{lengthGuidance}

[요구사항]
위 공공데이터를 기반으로, **지원 내용**을 가독성 있게 정리해주세요.

1. **{targetMin}~{targetMax}자**로 작성하세요 (정확히 {targetMin}~{targetMax}자 사이)
2. **다양한 형식**을 활용하세요:
   - 볼드(**텍스트**)를 활용하여 중요한 정보 강조
   - 목록(- 또는 •)을 활용하여 혜택을 명확히 나열
   - 문단을 나누어 가독성 향상
   - 금액, 기간, 규모 등 구체적 수치 강조
3. **지원 내용을 구체적으로** 설명하세요:
   - 지원 금액 또는 규모
   - 지원 형태 (현금, 바우처, 서비스 등)
   - 지원 기간 또는 횟수
   - 추가 혜택이나 서비스
4. **반드시 "예를 들어" 섹션을 포함**하세요 (필수):
   - "**예를 들어**" 또는 "**예시**" 제목을 사용
   - 구체적인 혜택 수령 예시 포함
   - 실제로 받을 수 있는 금액이나 서비스 예시
   - **이 섹션은 필수입니다. 반드시 포함해야 합니다.**
5. 공공데이터에 없는 정보는 추가하지 마세요
6. 문장은 자연스럽고 읽기 쉽게 작성하세요

[출력 형식]
**반드시 다음 형식과 순서를 정확히 따라주세요:**

1. **지원 내용** (제목, 볼드)
2. 개요 문단 (1~2문장으로 지원 내용에 대한 간단한 설명)
3. 목록 (- 로 시작하는 혜택 나열)
4. **예를 들어** (같은 줄에 예시 내용 포함, 볼드로 시작)

**정확한 형식 예시:**

**지원 내용**
본 지원은 국가유공자 인플루엔자 예방접종을 무료로 제공합니다.

- **무료 예방접종** 지원
- 관내 위탁의료기관에서 접종 가능
- 연 1회 지원

**예를 들어** 동대문구에 거주하는 국가유공자 본인은 지정된 의료기관에서 인플루엔자 백신을 무료로 접종받을 수 있습니다.

**중요 사항:**
1. "**예를 들어**"는 반드시 같은 줄에 예시 내용과 함께 작성해야 합니다.
2. 예시는 구체적인 혜택 수령 방법이나 금액을 포함해야 합니다.
3. 전체 내용은 {targetMin}~{targetMax}자 사이로 작성하세요.
4. 위 형식과 순서를 정확히 따라주세요.
5. 금액이나 규모가 있다면 반드시 포함하세요.
6. 현재 글자수가 적으므로, 더 상세하고 구체적으로 작성하여 목표 글자수에 도달하세요.
`;

/**
 * 프롬프트에 실제 값 치환
 */
export function buildBenefitEnhancementPrompt(
  benefitName: string,
  governingOrg: string,
  publicDataBenefit: string,
  amount: string | null,
  benefitType: string | null,
  currentLength: number,
  targetLength: { min: number; max: number }
): string {
  const lengthGuidance = buildLengthGuidance(currentLength, targetLength.min, targetLength.max);
  
  return BENEFIT_ENHANCEMENT_PROMPT
    .replace("{benefitName}", benefitName)
    .replace("{governingOrg}", governingOrg)
    .replace("{publicDataBenefit}", publicDataBenefit)
    .replace("{amount}", amount || "정보 없음")
    .replace("{benefitType}", benefitType || "정보 없음")
    .replace("{lengthGuidance}", lengthGuidance)
    .replace(/{targetMin}/g, targetLength.min.toString())
    .replace(/{targetMax}/g, targetLength.max.toString());
}

