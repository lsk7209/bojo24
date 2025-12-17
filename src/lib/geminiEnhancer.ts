/**
 * Gemini API를 활용한 컨텐츠 보완 유틸리티
 * 공공데이터가 부족한 경우에만 Gemini로 보완하여 고유 컨텐츠 생성
 */

import { GoogleGenerativeAI } from "@google/generative-ai";

// Gemini API 초기화 (환경 변수 확인)
let genAI: GoogleGenerativeAI | null = null;
let model: ReturnType<typeof GoogleGenerativeAI.prototype.getGenerativeModel> | null = null;

/**
 * Gemini 보완 활성화 여부 확인
 * 환경 변수 GEMINI_ENHANCEMENT_ENABLED=true로 활성화
 * 또는 특정 보조금 ID 리스트에 포함된 경우만 활성화
 * 
 * 현재는 기본적으로 비활성화됨 (공공데이터만 사용)
 */
function isGeminiEnhancementEnabled(benefitId?: string): boolean {
  // 환경 변수로 전역 활성화/비활성화 제어
  const globalEnabled = process.env.GEMINI_ENHANCEMENT_ENABLED === "true";
  
  // 특정 보조금 ID 리스트 (환경 변수에서 읽기)
  const allowedIds = process.env.GEMINI_ENHANCEMENT_ALLOWED_IDS 
    ? process.env.GEMINI_ENHANCEMENT_ALLOWED_IDS.split(",").map(id => id.trim())
    : [];
  
  // 전역 활성화 또는 특정 ID에 포함된 경우만 활성화
  return Boolean(globalEnabled || (benefitId && allowedIds.includes(benefitId)));
}

function initGemini() {
  if (!process.env.GEMINI_API_KEY) {
    // 개발 환경에서만 로그 출력
    if (process.env.NODE_ENV === "development") {
      console.warn("⚠️ GEMINI_API_KEY가 설정되지 않았습니다. 공공데이터만 사용됩니다.");
    }
    return null;
  }
  if (!genAI) {
    genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    // Gemini API 모델: Gemini 2.5 Flash Lite (최신 모델)
    // 빠르고 효율적이며 비용이 저렴한 모델
    model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });
    // 개발 환경에서만 로그 출력
    if (process.env.NODE_ENV === "development") {
      console.log("✅ Gemini 모델 초기화 완료: gemini-2.5-flash-lite");
    }
  }
  return model;
}

/**
 * 공공데이터 품질 체크
 * 부족한 경우 true 반환
 */
export function needsEnhancement(
  content: string,
  minLength: number = 150
): boolean {
  if (!content || content === "정보 없음") return true;
  const cleanContent = content.replace(/\s+/g, " ").trim();
  return cleanContent.length < minLength;
}

/**
 * Gemini로 요약 보완
 */
export async function enhanceSummary(
  benefitName: string,
  category: string,
  governingOrg: string,
  publicDataSummary: string,
  detail: Record<string, string>,
  benefitId?: string
): Promise<string | null> {
  // Gemini 보완이 활성화되지 않았으면 null 반환
  if (!isGeminiEnhancementEnabled(benefitId)) {
    if (process.env.NODE_ENV === "development") {
      console.log(`⏸️ Gemini 보완 비활성화됨 (benefitId: ${benefitId || "unknown"})`);
    }
    return null;
  }
  
  const geminiModel = initGemini();
  if (!geminiModel) {
    return null; // Gemini API 키가 없으면 null 반환
  }

  try {
    const purpose = detail["서비스목적"] || detail["서비스목적요약"] || "";
    const target = detail["지원대상"] || detail["대상"] || "";
    const benefit = detail["지원내용"] || detail["지원 내용"] || "";
    const amount = detail["지원금액"] || detail["지원 금액"] || "";

    const prompt = `
당신은 대한민국 정부 보조금 정보를 시민들이 이해하기 쉽게 설명하는 전문가입니다.

[보조금 정보]
- 정책명: ${benefitName}
- 카테고리: ${category}
- 관할 기관: ${governingOrg}
- 서비스 목적: ${purpose || "정보 없음"}
- 지원 대상: ${target || "정보 없음"}
- 지원 내용: ${benefit || "정보 없음"}
- 지원 금액: ${amount || "정보 없음"}

[현재 공공데이터 요약]
${publicDataSummary}

[요구사항]
위 공공데이터를 기반으로, 일반 시민이 이해하기 쉬운 **상세하고 구체적인 요약**을 작성해주세요.

1. **사용자 관점**으로 재구성하세요 (행정 용어 최소화)
2. **구체적인 예시**를 포함하세요 (금액, 기간, 혜택 등)
3. **실용적인 정보**를 강조하세요 (누가, 무엇을, 얼마나, 언제)
4. **3-5문단**으로 구성하세요 (각 문단은 2-3문장)
5. 공공데이터에 없는 정보는 추가하지 마세요
6. 줄바꿈은 \\n을 사용하세요

[출력 형식]
순수 텍스트만 반환하세요. JSON이나 마크다운 형식은 사용하지 마세요.
`;

    const result = await geminiModel.generateContent(prompt);
    const enhanced = result.response.text().trim();
    
    // 공공데이터와 자연스럽게 병합
    return `${publicDataSummary}\n\n${enhanced}`;
  } catch (error) {
    console.error("Gemini 요약 보완 실패:", error);
    return null; // 실패 시 원본 반환
  }
}

/**
 * Gemini로 지원 대상 보완
 */
export async function enhanceTarget(
  benefitName: string,
  governingOrg: string,
  publicDataTarget: string,
  detail: Record<string, string>,
  benefitId?: string
): Promise<string | null> {
  // Gemini 보완이 활성화되지 않았으면 null 반환
  const isEnabled = isGeminiEnhancementEnabled(benefitId);
  console.log(`[Gemini Debug] enhanceTarget - benefitId: ${benefitId}, isEnabled: ${isEnabled}`);
  
  if (!isEnabled) {
    console.log(`[Gemini Debug] enhanceTarget - 비활성화됨. GEMINI_ENHANCEMENT_ALLOWED_IDS: ${process.env.GEMINI_ENHANCEMENT_ALLOWED_IDS || "없음"}`);
    return null;
  }
  
  const geminiModel = initGemini();
  if (!geminiModel) {
    console.log(`[Gemini Debug] enhanceTarget - Gemini 모델 초기화 실패`);
    return null;
  }
  
  console.log(`[Gemini Debug] enhanceTarget - Gemini API 호출 시작`);

  try {
    const criteria = detail["선정기준"] || detail["선정 기준"] || "";
    const applyMethod = detail["신청방법"] || detail["신청 방법"] || "";

    const prompt = `
당신은 대한민국 정부 보조금 정보를 시민들이 이해하기 쉽게 설명하는 전문가입니다.

[보조금 정보]
- 정책명: ${benefitName}
- 관할 기관: ${governingOrg}
- 현재 지원 대상 정보: ${publicDataTarget}
- 선정 기준: ${criteria || "정보 없음"}

[요구사항]
위 공공데이터를 기반으로, **지원 대상**을 가독성 있게 정리해주세요.

1. **150~200자**로 작성하세요 (정확히 150~200자 사이)
2. **자격 요건을 구체적으로** 설명하세요 (나이, 소득, 거주지 등)
3. **실제 신청 가능한 사람들의 예시**를 포함하세요
4. 공공데이터에 없는 정보는 추가하지 마세요
5. 문장은 자연스럽고 읽기 쉽게 작성하세요
6. 불필요한 반복은 피하되, 필요한 정보는 모두 포함하세요

[출력 형식]
순수 텍스트만 반환하세요. JSON이나 마크다운 형식은 사용하지 마세요.
반드시 150~200자 사이로 작성하세요.
`;

    const result = await geminiModel.generateContent(prompt);
    let enhanced = result.response.text().trim();
    
    // 150~200자 범위로 조정 (문장이 자연스럽게 끝나도록 약간의 여유 허용)
    const TARGET_MIN = 150;
    const TARGET_MAX = 200;
    const ALLOWED_OVERFLOW = 20; // 200자를 최대 20자까지 넘어도 허용 (문장 완성용)
    
    if (enhanced.length > TARGET_MAX + ALLOWED_OVERFLOW) {
      // 220자를 넘으면 마지막 문장을 완성하여 자름
      const maxLength = TARGET_MAX + ALLOWED_OVERFLOW;
      const trimmed = enhanced.substring(0, maxLength);
      
      // 마지막 문장이 자연스럽게 끝나도록 마침표나 쉼표를 찾아서 자름
      const lastPeriod = trimmed.lastIndexOf(".");
      const lastComma = trimmed.lastIndexOf("，");
      const lastKoreanPeriod = trimmed.lastIndexOf("。");
      
      const cutPoint = Math.max(
        lastPeriod > TARGET_MIN ? lastPeriod + 1 : -1,
        lastComma > TARGET_MIN ? lastComma + 1 : -1,
        lastKoreanPeriod > TARGET_MIN ? lastKoreanPeriod + 1 : -1
      );
      
      if (cutPoint > TARGET_MIN) {
        enhanced = trimmed.substring(0, cutPoint);
      } else {
        // 자연스러운 끝점을 찾지 못하면 200자에서 자름
        enhanced = trimmed.substring(0, TARGET_MAX);
      }
    }
    
    // 최소 150자 이상이 되도록 보장 (공공데이터가 부족한 경우)
    if (enhanced.length < TARGET_MIN && publicDataTarget.length < TARGET_MIN) {
      // 공공데이터와 병합하여 150자 이상 만들기
      const merged = `${publicDataTarget}\n\n${enhanced}`;
      // 병합된 내용도 200자 + 20자 범위 내로 조정
      if (merged.length > TARGET_MAX + ALLOWED_OVERFLOW) {
        const trimmed = merged.substring(0, TARGET_MAX + ALLOWED_OVERFLOW);
        const lastPeriod = trimmed.lastIndexOf(".");
        if (lastPeriod > TARGET_MIN) {
          return trimmed.substring(0, lastPeriod + 1);
        }
        return trimmed.substring(0, TARGET_MAX);
      }
      return merged;
    }
    
    // 최소 150자 이상이 되도록 보장
    if (enhanced.length < TARGET_MIN) {
      // 공공데이터와 병합하여 최소 길이 확보
      const merged = `${publicDataTarget}\n\n${enhanced}`;
      if (merged.length > TARGET_MAX + ALLOWED_OVERFLOW) {
        const trimmed = merged.substring(0, TARGET_MAX + ALLOWED_OVERFLOW);
        const lastPeriod = trimmed.lastIndexOf(".");
        return lastPeriod > TARGET_MIN ? trimmed.substring(0, lastPeriod + 1) : trimmed.substring(0, TARGET_MAX);
      }
      return merged;
    }
    
    // Gemini가 생성한 내용 반환 (150~220자 범위)
    return enhanced;
  } catch (error: any) {
    // 개발 환경에서만 에러 로그 출력
    if (process.env.NODE_ENV === "development") {
      console.error("Gemini 지원 대상 보완 실패:", error?.message || error);
    }
    return null;
  }
}

/**
 * Gemini로 지원 내용 보완
 */
export async function enhanceBenefit(
  benefitName: string,
  governingOrg: string,
  publicDataBenefit: string,
  detail: Record<string, string>,
  benefitId?: string
): Promise<string | null> {
  // Gemini 보완이 활성화되지 않았으면 null 반환
  if (!isGeminiEnhancementEnabled(benefitId)) {
    return null;
  }
  
  const geminiModel = initGemini();
  if (!geminiModel) {
    return null;
  }

  try {
    const amount = detail["지원금액"] || detail["지원 금액"] || "";
    const deadline = detail["신청기간"] || detail["접수기간"] || detail["신청 기간"] || "";

    const prompt = `
당신은 대한민국 정부 보조금 정보를 시민들이 이해하기 쉽게 설명하는 전문가입니다.

[보조금 정보]
- 정책명: ${benefitName}
- 관할 기관: ${governingOrg}
- 현재 지원 내용 정보: ${publicDataBenefit}
- 지원 금액: ${amount || "정보 없음"}
- 신청 기간: ${deadline || "정보 없음"}

[요구사항]
위 공공데이터를 기반으로, **지원 내용**을 더 구체적이고 이해하기 쉽게 설명해주세요.

1. **구체적인 금액/혜택 범위**를 명시하세요
2. **사용 방법 및 제한 사항**을 설명하세요
3. **실제 받을 수 있는 혜택의 예시**를 제공하세요
4. "이렇게 활용하실 수 있습니다" 형태로 실용적으로 설명하세요
5. 공공데이터에 없는 정보는 추가하지 마세요
6. 2-3문단으로 구성하세요

[출력 형식]
순수 텍스트만 반환하세요. JSON이나 마크다운 형식은 사용하지 마세요.
`;

    const result = await geminiModel.generateContent(prompt);
    const enhanced = result.response.text().trim();
    
    // 공공데이터와 자연스럽게 병합
    return `${publicDataBenefit}\n\n${enhanced}`;
  } catch (error: any) {
    // 개발 환경에서만 에러 로그 출력
    if (process.env.NODE_ENV === "development") {
      console.error("Gemini 지원 내용 보완 실패:", error?.message || error);
    }
    return null;
  }
}

