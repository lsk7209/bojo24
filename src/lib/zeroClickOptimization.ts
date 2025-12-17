/**
 * Zero-click 스니펫 최적화 유틸리티
 * 구글 검색 결과에서 클릭 없이 답변을 제공하는 스니펫 최적화
 */

import type { BenefitRecord } from "@/types/benefit";

/**
 * Zero-click 답변 생성
 * 구글 스니펫에 표시될 간결한 답변
 */
export function generateZeroClickAnswer(benefit: BenefitRecord): string {
  const detail = benefit.detail_json as {
    list?: Record<string, string>;
    detail?: Record<string, string>;
  } | undefined;

  // 가장 중요한 정보를 한 문장으로 요약
  const target = detail?.detail?.["지원대상"] || detail?.list?.["지원대상"] || "";
  const content = detail?.detail?.["지원내용"] || detail?.list?.["지원내용"] || "";
  const org = benefit.governing_org || "정부 기관";

  if (benefit.gemini_summary) {
    // AI 요약의 첫 문장 사용
    return benefit.gemini_summary.split('\n')[0].substring(0, 150);
  }

  // 자동 생성 답변
  if (target && content) {
    return `${benefit.name}은 ${org}에서 ${target.substring(0, 30)}... 대상으로 ${content.substring(0, 50)}... 혜택을 제공합니다.`;
  }

  return `${benefit.name}은 ${org}에서 제공하는 ${benefit.category || "정부"} 지원금입니다.`;
}

/**
 * 자연어 질문에 대한 답변 생성
 * "어떻게 신청하나요?", "누가 받을 수 있나요?" 등
 */
export function generateNaturalLanguageAnswers(benefit: BenefitRecord): Record<string, string> {
  const detail = benefit.detail_json as {
    list?: Record<string, string>;
    detail?: Record<string, string>;
  } | undefined;

  const answers: Record<string, string> = {};

  // "누가 받을 수 있나요?"
  const target = detail?.detail?.["지원대상"] || detail?.list?.["지원대상"] || "";
  if (target) {
    answers["누가 받을 수 있나요?"] = target.substring(0, 200);
  }

  // "어떻게 신청하나요?"
  const apply = detail?.detail?.["신청방법"] || detail?.list?.["신청방법"] || "";
  if (apply) {
    answers["어떻게 신청하나요?"] = apply.substring(0, 200);
  }

  // "어떤 혜택을 받나요?"
  const content = detail?.detail?.["지원내용"] || detail?.list?.["지원내용"] || "";
  if (content) {
    answers["어떤 혜택을 받나요?"] = content.substring(0, 200);
  }

  // "언제까지 신청하나요?"
  const deadline = detail?.detail?.["신청기한"] || detail?.list?.["신청기한"] || "";
  if (deadline) {
    answers["언제까지 신청하나요?"] = deadline;
  }

  // "문의는 어디로 하나요?"
  const contact = detail?.detail?.["문의처"] || detail?.list?.["전화문의"] || "";
  if (contact) {
    answers["문의는 어디로 하나요?"] = contact;
  }

  return answers;
}

/**
 * FAQ를 자연어 질문 형식으로 변환
 */
export function convertFaqToNaturalLanguage(faqs: { q: string; a: string }[]): Array<{ question: string; answer: string }> {
  return faqs.map(faq => ({
    question: faq.q,
    answer: faq.a.substring(0, 300) // 스니펫에 적합한 길이
  }));
}

/**
 * 구조화된 답변 데이터 생성 (AEO 최적화)
 */
export function buildStructuredAnswers(benefit: BenefitRecord) {
  const zeroClickAnswer = generateZeroClickAnswer(benefit);
  const naturalAnswers = generateNaturalLanguageAnswers(benefit);
  const faqs = (benefit.gemini_faq_json as { q: string; a: string }[] | null) || [];

  return {
    zeroClickAnswer,
    naturalAnswers,
    faqs: convertFaqToNaturalLanguage(faqs),
    // 추가 메타데이터
    metadata: {
      lastUpdated: benefit.last_updated_at,
      source: benefit.governing_org,
      category: benefit.category
    }
  };
}

