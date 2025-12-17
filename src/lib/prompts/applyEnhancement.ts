/**
 * 신청 방법 보완을 위한 Gemini 프롬프트
 * 재사용 가능하도록 별도 파일로 관리
 */

import { COMMON_ENHANCEMENT_GUIDELINES, buildLengthGuidance } from "./baseEnhancement";

export const APPLY_ENHANCEMENT_PROMPT = `
당신은 대한민국 정부 보조금 정보를 시민들이 이해하기 쉽게 설명하는 전문가입니다.

${COMMON_ENHANCEMENT_GUIDELINES}

[보조금 정보]
- 정책명: {benefitName}
- 관할 기관: {governingOrg}
- 현재 신청 방법 정보: {publicDataApply}
- 필요 서류: {documents}
- 신청 기간: {deadline}

{lengthGuidance}

[요구사항]
위 공공데이터를 기반으로, **신청 방법**을 가독성 있게 정리해주세요.

1. **{targetMin}~{targetMax}자**로 작성하세요 (정확히 {targetMin}~{targetMax}자 사이)
2. **단계별 가이드 형식**으로 작성하세요:
   - 각 단계를 명확히 구분
   - 순서대로 나열 (1단계, 2단계 등)
   - 각 단계별로 구체적인 행동 지침 포함
3. **가독성 높은 형식**을 사용하세요:
   - 볼드(**텍스트**)를 활용하여 중요한 정보 강조
   - 목록(- 또는 •)을 활용하여 여러 항목 명확히 나열
   - 문단을 나누어 가독성 향상
4. **구체적인 정보**를 포함하세요:
   - 신청 장소 또는 방법 (온라인, 방문, 우편 등)
   - 신청 시 필요한 서류 (간단히 언급)
   - 신청 기간 또는 상시 접수 여부
   - 문의처 (있는 경우)
5. **공공데이터에 없는 정보는 추가하지 마세요**
6. **전문적이면서도 친절한 톤**으로 작성하세요
7. **문장은 자연스럽고 읽기 쉽게** 작성하세요

[출력 형식]
**반드시 다음 형식을 따라주세요:**

1. **신청 방법** (제목, 볼드)
2. 개요 문단 (1~2문장으로 신청 방법에 대한 간단한 설명)
3. 단계별 가이드 (1단계, 2단계 등으로 나열)
4. 추가 안내 (필요한 경우)

**정확한 형식 예시:**

**신청 방법**
본 지원은 관내 위탁의료기관에 직접 방문하거나 온라인으로 신청할 수 있습니다.

**1단계**: 관내 위탁의료기관 방문 또는 온라인 신청 사이트 접속
**2단계**: 신청서 작성 및 필요 서류 제출
**3단계**: 신청 완료 후 처리 결과 확인

자세한 신청 방법은 동대문구청 보훈과(02-2127-4000)로 문의하시기 바랍니다.

**중요 사항:**
1. 전체 내용은 {targetMin}~{targetMax}자 사이로 작성하세요.
2. 단계별로 명확히 구분하여 작성하세요.
3. 구체적인 신청 방법과 장소를 포함하세요.
4. 공공데이터에 없는 정보는 추가하지 마세요.
5. 문장은 자연스럽고 읽기 쉽게 작성하세요.
6. 현재 글자수가 적으므로, 더 상세하고 구체적으로 작성하여 목표 글자수에 도달하세요.
`;

/**
 * 신청 방법 프롬프트에 실제 값 치환
 */
export function buildApplyEnhancementPrompt(
  benefitName: string,
  governingOrg: string,
  publicDataApply: string,
  documents: string | null,
  deadline: string | null,
  currentLength: number,
  targetLength: { min: number; max: number }
): string {
  const lengthGuidance = buildLengthGuidance(currentLength, targetLength.min, targetLength.max);
  
  return APPLY_ENHANCEMENT_PROMPT
    .replace("{benefitName}", benefitName)
    .replace("{governingOrg}", governingOrg)
    .replace("{publicDataApply}", publicDataApply)
    .replace("{documents}", documents || "정보 없음")
    .replace("{deadline}", deadline || "정보 없음")
    .replace("{lengthGuidance}", lengthGuidance)
    .replace(/{targetMin}/g, targetLength.min.toString())
    .replace(/{targetMax}/g, targetLength.max.toString());
}

