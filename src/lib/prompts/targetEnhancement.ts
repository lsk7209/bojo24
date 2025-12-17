/**
 * 지원 대상 보완을 위한 Gemini 프롬프트
 * 재사용 가능하도록 별도 파일로 관리
 */

export const TARGET_ENHANCEMENT_PROMPT = `
당신은 대한민국 정부 보조금 정보를 시민들이 이해하기 쉽게 설명하는 전문가입니다.

[보조금 정보]
- 정책명: {benefitName}
- 관할 기관: {governingOrg}
- 현재 지원 대상 정보: {publicDataTarget}
- 선정 기준: {criteria}

[요구사항]
위 공공데이터를 기반으로, **지원 대상**을 가독성 있게 정리해주세요.

1. **150~200자**로 작성하세요 (정확히 150~200자 사이)
2. **구조화된 형식**으로 작성하세요:
   - 볼드(**텍스트**)를 활용하여 중요한 키워드 강조
   - 목록(- 또는 •)을 활용하여 자격 요건을 명확히 나열
   - 문단을 나누어 가독성 향상
3. **자격 요건을 구체적으로** 설명하세요:
   - 거주지 요건 (예: 서울특별시 동대문구 거주)
   - 신분 요건 (예: 국가유공자 본인)
   - 나이, 소득 등 추가 요건이 있다면 포함
4. **실제 신청 가능한 사람들의 예시**를 포함하세요:
   - 구체적인 예시 (예: "60대 국가유공자 김철수 씨")
   - 다양한 케이스 제시
5. 공공데이터에 없는 정보는 추가하지 마세요
6. 문장은 자연스럽고 읽기 쉽게 작성하세요

[출력 형식]
마크다운 형식을 사용하세요:
- **볼드**: 중요한 키워드나 요건 강조
- 목록: - 또는 • 로 자격 요건 나열
- 문단 구분: 빈 줄로 문단 구분

예시:
**지원 대상**
- 서울특별시 동대문구에 거주하는 **국가유공자 본인**
- 나이, 소득 등 별도의 자격 요건은 없습니다

**예시**
예를 들어, 동대문구에 거주하시는 60대 국가유공자 김철수 씨는 이 지원을 신청하실 수 있습니다.

반드시 150~200자 사이로 작성하세요.
`;

/**
 * 프롬프트에 실제 값 치환
 */
export function buildTargetEnhancementPrompt(
  benefitName: string,
  governingOrg: string,
  publicDataTarget: string,
  criteria: string
): string {
  return TARGET_ENHANCEMENT_PROMPT
    .replace("{benefitName}", benefitName)
    .replace("{governingOrg}", governingOrg)
    .replace("{publicDataTarget}", publicDataTarget)
    .replace("{criteria}", criteria || "정보 없음");
}

