/**
 * 필요서류 보완을 위한 Gemini 프롬프트
 * 재사용 가능하도록 별도 파일로 관리
 */

import { COMMON_ENHANCEMENT_GUIDELINES } from "./baseEnhancement";

export const DOCUMENTS_ENHANCEMENT_PROMPT = `
당신은 대한민국 정부 보조금 정보를 시민들이 이해하기 쉽게 설명하는 전문가입니다.

${COMMON_ENHANCEMENT_GUIDELINES}

[보조금 정보]
- 정책명: {benefitName}
- 관할 기관: {governingOrg}
- 현재 필요서류 정보: {rawDocuments}

[요구사항]
위 공공데이터를 기반으로, **필요서류**를 가독성 있게 정리해주세요.

1. **줄바꿈 오류 수정**: 잘못된 줄바꿈으로 분리된 항목을 하나로 병합하세요.
   - 예: "1. 신청서\n✓\n서약서 및 동의서 각 1부" → "1. 신청서 서약서 및 동의서 각 1부"
   - 예: "2. 가족관계증명서 (신청인\n✓\n배우자) 각 1부" → "2. 가족관계증명서 (신청인 배우자) 각 1부"
2. **목록 형식으로 구조화**: 각 서류를 번호와 함께 명확히 나열하세요.
3. **가독성 향상**: 
   - 불필요한 체크마크(✓)나 불릿(•) 제거
   - 각 항목을 하나의 완전한 문장으로 작성
   - 관련 정보는 괄호로 묶어 명확히 표시
4. **공공데이터 기반**: 제공된 정보만을 사용하고 추가 정보는 포함하지 마세요.

[출력 형식]
**반드시 다음 형식을 따라주세요:**

각 서류를 번호와 함께 한 줄로 작성하세요. 줄바꿈은 각 항목 사이에만 사용하세요.

**정확한 형식 예시:**

1. 신청서 서약서 및 동의서 각 1부
2. 가족관계증명서 (신청인 배우자) 각 1부
3. 임대차계약서 사본 1부
4. 금융거래확인서 1부
5. 지방세 세목별 과세증명서 재산세(주택) (신청인 배우자 자녀들) 각 1부
6. 신청인 신분증
7. 그 밖의 증명서류(해당자에 한정)

**중요 사항:**
1. 줄바꿈 오류를 수정하여 각 항목을 하나의 완전한 문장으로 작성하세요.
2. 불필요한 체크마크나 불릿은 제거하세요.
3. 각 서류를 명확하고 읽기 쉽게 정리하세요.
4. 공공데이터에 없는 정보는 추가하지 마세요.
5. 번호는 1., 2., 3. 형식으로 작성하세요.
`;

/**
 * 필요서류 프롬프트에 실제 값 치환
 */
export function buildDocumentsEnhancementPrompt(
  benefitName: string,
  governingOrg: string,
  rawDocuments: string
): string {
  return DOCUMENTS_ENHANCEMENT_PROMPT
    .replace("{benefitName}", benefitName)
    .replace("{governingOrg}", governingOrg)
    .replace("{rawDocuments}", rawDocuments);
}

