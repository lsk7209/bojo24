/**
 * 보조금 상세페이지 컨텐츠 최적화 유틸리티
 * 공공데이터 기반으로 구글 검색 최적화된 구조 생성
 * 부족한 내용은 Gemini로 보완하여 고유 컨텐츠 생성
 */

import { enhanceSummary, enhanceTarget, enhanceBenefit, needsEnhancement } from "./geminiEnhancer";

export interface BenefitDetail {
  detail?: Record<string, string>;
  list?: Record<string, string>;
  supportConditions?: Record<string, string>;
}

export interface OptimizedContent {
  // 핵심 정보 (Zero-click 스니펫용)
  summary: string;
  
  // 구조화된 섹션
  sections: {
    target: {
      title: string;
      content: string;
      criteria?: string;
    };
    benefit: {
      title: string;
      content: string;
      amount?: string;
      type?: string;
    };
    apply: {
      title: string;
      steps: string[];
      documents?: string[];
      deadline?: string;
      method?: string;
    };
    contact: {
      title: string;
      phone?: string;
      email?: string;
      address?: string;
      website?: string;
    };
    // 고유 컨텐츠 섹션 (구글 인정을 위한)
    analysis?: {
      title: string;
      content: string;
      insights?: string[];
    };
    tips?: {
      title: string;
      items: string[];
    };
    timeline?: {
      title: string;
      content: string;
    };
  };
  
  // FAQ (공공데이터 기반 자동 생성)
  faqs: Array<{
    question: string;
    answer: string;
  }>;
  
  // 키워드 (SEO 최적화)
  keywords: string[];
}

/**
 * 공공데이터를 기반으로 최적화된 컨텐츠 구조 생성
 * 부족한 내용은 Gemini로 보완 (비동기)
 */
export async function optimizeBenefitContent(
  benefitName: string,
  category: string,
  governingOrg: string,
  detail: BenefitDetail
): Promise<OptimizedContent> {
  const detailData = detail.detail || detail.list || {};
  
  // 1. 요약 생성 (구글 스니펫 최적화)
  let summary = generateSummary(benefitName, category, governingOrg, detailData);
  
  // 공공데이터가 부족하면 Gemini로 보완
  if (needsEnhancement(summary, 200)) {
    const enhanced = await enhanceSummary(benefitName, category, governingOrg, summary, detailData);
    if (enhanced) {
      summary = enhanced;
    }
  }
  
  // 2. 지원 대상 섹션
  let targetContent = detailData["지원대상"] || detailData["대상"] || "정보 없음";
  const criteria = detailData["선정기준"] || detailData["선정 기준"] || "";
  
  // 공공데이터가 부족하면 Gemini로 보완
  if (needsEnhancement(targetContent, 100)) {
    if (process.env.NODE_ENV === "development") {
      console.log(`🔄 지원 대상 보완 필요 (${targetContent.length}자 < 100자). Gemini 호출 중...`);
    }
    const enhanced = await enhanceTarget(benefitName, governingOrg, targetContent, detailData);
    if (enhanced) {
      if (process.env.NODE_ENV === "development") {
        console.log(`✅ 지원 대상 보완 완료 (${enhanced.length}자)`);
      }
      targetContent = enhanced;
    } else {
      if (process.env.NODE_ENV === "development") {
        console.warn("⚠️ Gemini 지원 대상 보완 실패. 공공데이터만 사용합니다.");
      }
    }
  }
  
  // 3. 지원 내용 섹션
  let benefitContent = detailData["지원내용"] || detailData["지원 내용"] || "정보 없음";
  const amount = extractAmount(benefitContent);
  const benefitType = extractBenefitType(benefitContent);
  
  // 공공데이터가 부족하면 Gemini로 보완
  if (needsEnhancement(benefitContent, 150)) {
    if (process.env.NODE_ENV === "development") {
      console.log(`🔄 지원 내용 보완 필요 (${benefitContent.length}자 < 150자). Gemini 호출 중...`);
    }
    const enhanced = await enhanceBenefit(benefitName, governingOrg, benefitContent, detailData);
    if (enhanced) {
      if (process.env.NODE_ENV === "development") {
        console.log(`✅ 지원 내용 보완 완료 (${enhanced.length}자)`);
      }
      benefitContent = enhanced;
    } else {
      if (process.env.NODE_ENV === "development") {
        console.warn("⚠️ Gemini 지원 내용 보완 실패. 공공데이터만 사용합니다.");
      }
    }
  }
  
  // 4. 신청 방법 섹션
  const applyMethod = detailData["신청방법"] || detailData["신청 방법"] || "정보 없음";
  const steps = parseApplySteps(applyMethod);
  const documents = extractDocuments(detailData["구비서류"] || detailData["필요서류"] || "");
  const deadline = detailData["신청기간"] || detailData["접수기간"] || detailData["신청 기간"] || "";
  
  // 5. 문의처 섹션
  const contact = {
    phone: detailData["문의처"] || detailData["전화문의"] || detailData["연락처"] || "",
    email: detailData["이메일"] || detailData["이메일주소"] || "",
    address: detailData["주소"] || detailData["소재지"] || "",
    website: detailData["온라인신청사이트URL"] || detailData["상세조회URL"] || detailData["홈페이지"] || ""
  };
  
  // 6. FAQ 자동 생성 (공공데이터 기반, AEO 최적화)
  const faqs = generateFAQs(benefitName, category, targetContent, benefitContent, applyMethod, contact, detailData);
  
  // 7. 키워드 추출 (SEO 최적화)
  const keywords = extractKeywords(benefitName, category, governingOrg, targetContent, benefitContent);
  
  // 8. 고유 컨텐츠 생성 (구글 인정을 위한 분석 및 인사이트)
  const analysis = generateAnalysis(benefitName, category, governingOrg, detailData, targetContent, benefitContent, amount);
  const tips = generateTips(benefitName, applyMethod, documents, deadline, detailData);
  const timeline = generateTimeline(deadline, detailData);
  
  return {
    summary,
    sections: {
      target: {
        title: "지원 대상",
        content: targetContent,
        criteria: criteria || undefined
      },
      benefit: {
        title: "지원 내용",
        content: benefitContent,
        amount: amount || undefined,
        type: benefitType || undefined
      },
      apply: {
        title: "신청 방법",
        steps,
        documents: documents.length > 0 ? documents : undefined,
        deadline: deadline || undefined,
        method: applyMethod
      },
      contact: {
        title: "문의처",
        phone: contact.phone || undefined,
        email: contact.email || undefined,
        address: contact.address || undefined,
        website: contact.website || undefined
      },
      // 고유 컨텐츠 섹션
      analysis: analysis ? {
        title: "정책 분석",
        content: analysis.content,
        insights: analysis.insights
      } : undefined,
      tips: tips.items.length > 0 ? {
        title: "실전 팁",
        items: tips.items
      } : undefined,
      timeline: timeline ? {
        title: "신청 일정",
        content: timeline
      } : undefined
    },
    faqs,
    keywords
  };
}

/**
 * 요약 생성 (구글 스니펫 최적화, 고유 컨텐츠 강화)
 * 공공데이터를 분석하여 구글이 고유 컨텐츠로 인정할 수 있는 구조화된 요약 생성
 */
export function generateSummary(
  name: string,
  category: string,
  org: string,
  detail: Record<string, string>
): string {
  const purpose = detail["서비스목적"] || detail["서비스목적요약"] || "";
  const target = detail["지원대상"] || detail["대상"] || "";
  const benefit = detail["지원내용"] || detail["지원 내용"] || "";
  const amount = extractAmount(benefit);
  const deadline = detail["신청기간"] || detail["접수기간"] || detail["신청 기간"] || "";
  
  // 고유 컨텐츠를 위한 구조화된 요약 생성
  let summary = `${name}은(는) ${org}에서 제공하는 ${category} 분야의 정부 지원금입니다.`;
  
  // 목적 정보 (전문성 강조)
  if (purpose) {
    summary += ` 이 지원금은 ${purpose}을(를) 목적으로 합니다.`;
  }
  
  // 지원 대상 (구체적 정보) - 전체 내용 표시
  if (target && target !== "정보 없음") {
    const targetClean = target.replace(/\s+/g, " ").trim();
    // 긴 내용도 전체 표시 (줄바꿈으로 가독성 확보)
    summary += `\n\n【지원 대상】\n${targetClean}`;
  }
  
  // 지원 내용 (구체적 금액/혜택 강조) - 전체 내용 표시
  if (benefit && benefit !== "정보 없음") {
    if (amount) {
      summary += `\n\n【지원 규모】\n${amount}`;
    }
    const benefitClean = benefit.replace(/\s+/g, " ").trim();
    // 긴 내용도 전체 표시 (줄바꿈으로 가독성 확보)
    summary += `\n\n【지원 내용】\n${benefitClean}`;
  }
  
  // 신청 기간 (실용적 정보)
  if (deadline) {
    summary += ` 신청 기간은 ${deadline}입니다.`;
  } else {
    summary += ` 신청은 상시 접수 또는 정해진 기간 내에 가능합니다.`;
  }
  
  return summary;
}

/**
 * 금액 추출
 */
function extractAmount(content: string): string | null {
  const patterns = [
    /(\d{1,3}(?:,\d{3})*(?:만|억)?원)/g,
    /월\s*(\d{1,3}(?:,\d{3})*(?:만|억)?원)/g,
    /(\d{1,3}(?:,\d{3})*(?:만|억)?원)\s*지원/g,
    /최대\s*(\d{1,3}(?:,\d{3})*(?:만|억)?원)/g
  ];
  
  for (const pattern of patterns) {
    const match = content.match(pattern);
    if (match) {
      return match[0];
    }
  }
  
  return null;
}

/**
 * 지원 형태 추출
 */
function extractBenefitType(content: string): string | null {
  const types = ["현금", "바우처", "서비스", "대출", "세제혜택", "교육", "의료", "주거"];
  
  for (const type of types) {
    if (content.includes(type)) {
      return type;
    }
  }
  
  return null;
}

/**
 * 신청 단계 파싱
 */
function parseApplySteps(method: string): string[] {
  if (!method) return [];
  
  // 번호로 시작하는 단계 추출
  const stepPattern = /[①-⑳1-9][\.\)]\s*([^①-⑳1-9\n]+)/g;
  const steps: string[] = [];
  let match;
  
  while ((match = stepPattern.exec(method)) !== null) {
    steps.push(match[1].trim());
  }
  
  // 번호가 없으면 줄바꿈으로 분리
  if (steps.length === 0) {
    const lines = method.split(/[\.\n]/).map(l => l.trim()).filter(l => l.length > 10);
    return lines.slice(0, 5); // 최대 5단계
  }
  
  return steps;
}

/**
 * 필요 서류 추출
 */
function extractDocuments(documents: string): string[] {
  if (!documents) return [];
  
  const docList = documents
    .split(/[,\n○•\-]/)
    .map(d => d.trim())
    .filter(d => d.length > 2 && d.length < 50);
  
  return docList;
}

/**
 * FAQ 자동 생성 (공공데이터 기반, AEO 최적화)
 * 구글이 고유 컨텐츠로 인정할 수 있도록 구조화된 질문-답변 생성
 */
function generateFAQs(
  name: string,
  category: string,
  target: string,
  benefit: string,
  apply: string,
  contact: { phone?: string; website?: string; email?: string },
  detail?: Record<string, string>
): Array<{ question: string; answer: string }> {
  const faqs: Array<{ question: string; answer: string }> = [];
  const detailData = detail || {};
  
  // Q1: 누가 받을 수 있나요? (자연어 질문 최적화)
  if (target && target !== "정보 없음") {
    const targetClean = target.replace(/\s+/g, " ").trim();
    faqs.push({
      question: `${name}은 누가 받을 수 있나요?`,
      answer: `${name}의 지원 대상은 ${targetClean}입니다. ${detailData["선정기준"] ? `선정 기준은 ${detailData["선정기준"]}입니다.` : "자세한 자격 요건은 공식 홈페이지에서 확인하실 수 있습니다."}`
    });
  }
  
  // Q2: 어떤 혜택을 받나요? (구체적 정보 강조)
  if (benefit && benefit !== "정보 없음") {
    const amount = extractAmount(benefit);
    const benefitType = extractBenefitType(benefit);
    let answer = `${name}의 지원 내용은 ${benefit.replace(/\s+/g, " ").trim()}입니다.`;
    if (amount) {
      answer = `${name}은 ${amount}을(를) 지원합니다. ${benefit.replace(/\s+/g, " ").trim()} 등의 혜택을 받을 수 있습니다.`;
    }
    if (benefitType) {
      answer += ` 지원 형태는 ${benefitType}입니다.`;
    }
    faqs.push({
      question: `${name}에서 어떤 혜택을 받을 수 있나요?`,
      answer: answer.length > 300 ? answer.substring(0, 300) + "..." : answer
    });
  }
  
  // Q3: 어떻게 신청하나요? (단계별 가이드)
  if (apply && apply !== "정보 없음") {
    const steps = parseApplySteps(apply);
    let answer = `${name} 신청 방법은 다음과 같습니다: `;
    if (steps.length > 0) {
      answer += steps.map((step, idx) => `${idx + 1}단계: ${step}`).join(" ") + "입니다.";
    } else {
      answer += apply.replace(/\s+/g, " ").trim() + "입니다.";
    }
    faqs.push({
      question: `${name}은 어떻게 신청하나요?`,
      answer: answer.length > 300 ? answer.substring(0, 300) + "..." : answer
    });
  }
  
  // Q4: 필요 서류는 무엇인가요?
  const documents = extractDocuments(detailData["구비서류"] || detailData["필요서류"] || "");
  if (documents.length > 0) {
    faqs.push({
      question: `${name} 신청 시 필요한 서류는 무엇인가요?`,
      answer: `${name} 신청 시 필요한 서류는 다음과 같습니다: ${documents.join(", ")}입니다. 정확한 서류 목록은 공식 홈페이지에서 확인하시기 바랍니다.`
    });
  }
  
  // Q5: 문의는 어디로 하나요?
  if (contact.phone || contact.website) {
    const contactInfo = contact.phone 
      ? `전화 ${contact.phone}` 
      : contact.website 
        ? `온라인 ${contact.website}` 
        : "";
    
    if (contactInfo) {
      faqs.push({
        question: `${name} 신청 관련 문의는 어디로 하나요?`,
        answer: `${name} 신청 관련 문의는 ${contactInfo}로 연락하시면 됩니다. ${contact.email ? `이메일 문의도 가능합니다: ${contact.email}` : ""}`
      });
    }
  }
  
  // Q6: 신청 기간이 있나요?
  const deadline = detailData["신청기간"] || detailData["접수기간"] || detailData["신청 기간"] || "";
  faqs.push({
    question: `${name} 신청 기간이 정해져 있나요?`,
    answer: deadline 
      ? `${name}의 신청 기간은 ${deadline}입니다. 기간 내에 신청하시기 바랍니다.`
      : `${name}은 상시 접수 또는 정해진 기간 내에 신청 가능합니다. 정확한 신청 기간은 공식 홈페이지(${contact.website || "해당 기관 홈페이지"}) 또는 문의처(${contact.phone || "해당 기관"})를 통해 확인하시기 바랍니다.`
  });
  
  // Q7: 언제 지급되나요? (추가 가치 제공)
  const paymentInfo = detailData["지급시기"] || detailData["지급 시기"] || "";
  if (paymentInfo) {
    faqs.push({
      question: `${name}은 언제 지급되나요?`,
      answer: `${name}은 ${paymentInfo}에 지급됩니다. 정확한 지급 일정은 신청 승인 후 안내받으실 수 있습니다.`
    });
  }
  
  return faqs;
}

/**
 * SEO 키워드 추출
 */
function extractKeywords(
  name: string,
  category: string,
  org: string,
  target: string,
  benefit: string
): string[] {
  const keywords = new Set<string>();
  
  // 기본 키워드
  keywords.add(name);
  keywords.add(category);
  keywords.add(org);
  keywords.add("보조금");
  keywords.add("정부 지원금");
  keywords.add(`${name} 신청`);
  keywords.add(`${name} 자격`);
  keywords.add(`${name} 받는 방법`);
  keywords.add(`${category} 보조금`);
  
  // 지원 대상에서 키워드 추출
  if (target) {
    const targetKeywords = target.match(/[가-힣]{2,5}/g) || [];
    targetKeywords.slice(0, 3).forEach(k => keywords.add(k));
  }
  
  // 지원 내용에서 키워드 추출
  if (benefit) {
    const benefitKeywords = benefit.match(/[가-힣]{2,5}/g) || [];
    benefitKeywords.slice(0, 3).forEach(k => keywords.add(k));
  }
  
  return Array.from(keywords);
}

/**
 * 정책 분석 생성 (고유 컨텐츠 - 전문성 강조)
 * 공공데이터를 분석하여 구글이 고유 컨텐츠로 인정할 수 있는 인사이트 제공
 */
function generateAnalysis(
  name: string,
  category: string,
  org: string,
  detail: Record<string, string>,
  target: string,
  benefit: string,
  amount: string | null
): { content: string; insights?: string[] } | null {
  const insights: string[] = [];
  let analysis = `${name}은(는) ${org}에서 운영하는 ${category} 분야의 정부 지원금입니다.`;
  
  // 금액 분석
  if (amount) {
    analysis += ` 지원 규모는 ${amount}로,`;
    const amountNum = parseInt(amount.replace(/[^0-9]/g, ""));
    if (amountNum >= 1000000) {
      insights.push(`대규모 지원금으로 가구당 상당한 경제적 도움을 제공합니다.`);
    } else if (amountNum >= 100000) {
      insights.push(`중규모 지원금으로 생활비 보조에 실질적인 도움이 됩니다.`);
    }
  }
  
  // 지원 대상 분석
  if (target && target !== "정보 없음") {
    const targetKeywords = ["청년", "노인", "장애인", "저소득", "다자녀", "임신", "출산"];
    const matchedKeywords = targetKeywords.filter(k => target.includes(k));
    if (matchedKeywords.length > 0) {
      insights.push(`주요 지원 대상은 ${matchedKeywords.join(", ")} 등입니다.`);
    }
  }
  
  // 지원 형태 분석
  const benefitType = extractBenefitType(benefit);
  if (benefitType) {
    analysis += ` 지원 형태는 ${benefitType}이며,`;
    if (benefitType === "현금") {
      insights.push(`현금 지원으로 사용자가 필요에 따라 자유롭게 활용할 수 있습니다.`);
    } else if (benefitType === "바우처") {
      insights.push(`바우처 형태로 지정된 서비스나 상품에 한해 사용 가능합니다.`);
    }
  }
  
  // 목적 분석
  const purpose = detail["서비스목적"] || detail["서비스목적요약"] || "";
  if (purpose) {
    analysis += ` 이 정책의 목적은 ${purpose}입니다.`;
  }
  
  // 카테고리별 특성 분석
  const categoryInsights: Record<string, string> = {
    "육아/교육": "육아 및 교육 분야 지원금은 자녀 양육 부담을 완화하고 교육 기회를 확대하는 데 중점을 둡니다.",
    "일자리": "일자리 분야 지원금은 취업 지원, 창업 지원, 직업 훈련 등을 통해 경제 활동을 촉진합니다.",
    "주거": "주거 분야 지원금은 주거 안정과 주거비 부담 완화를 목적으로 합니다.",
    "생활안정": "생활안정 분야 지원금은 저소득층의 기본 생활을 보장하고 경제적 안정을 도모합니다.",
    "창업/경영": "창업/경영 분야 지원금은 신규 창업자와 소상공인을 지원하여 경제 활성화를 도모합니다."
  };
  
  if (categoryInsights[category]) {
    insights.push(categoryInsights[category]);
  }
  
  if (insights.length === 0) {
    return null; // 인사이트가 없으면 섹션 생성 안 함
  }
  
  analysis += ` 이 정책은 ${category} 분야의 특성을 반영하여 설계되었습니다.`;
  
  return {
    content: analysis,
    insights: insights.length > 0 ? insights : undefined
  };
}

/**
 * 실전 팁 생성 (고유 컨텐츠 - 경험 기반)
 * 공공데이터에서 추출한 정보를 바탕으로 실용적인 팁 제공
 */
function generateTips(
  name: string,
  apply: string,
  documents: string[],
  deadline: string,
  detail: Record<string, string>
): { items: string[] } {
  const tips: string[] = [];
  
  // 서류 준비 팁
  if (documents.length > 0) {
    tips.push(`신청 전 필요한 서류(${documents.slice(0, 3).join(", ")}${documents.length > 3 ? " 등" : ""})를 미리 준비하시면 신청이 원활합니다.`);
  }
  
  // 신청 기간 팁
  if (deadline) {
    tips.push(`신청 기간(${deadline})을 놓치지 않도록 미리 일정을 확인하시기 바랍니다.`);
  } else {
    tips.push(`상시 접수 가능한 경우라도 조기 신청을 권장합니다.`);
  }
  
  // 신청 방법 팁
  if (apply && apply.includes("온라인")) {
    tips.push(`온라인 신청이 가능한 경우, 인터넷 환경이 안정적인 곳에서 신청하시는 것을 권장합니다.`);
  }
  if (apply && apply.includes("방문")) {
    tips.push(`방문 신청의 경우, 사전에 문의하여 필요한 서류를 확인하시면 시간을 절약할 수 있습니다.`);
  }
  
  // 문의처 활용 팁
  const contact = detail["문의처"] || detail["전화문의"] || "";
  if (contact) {
    tips.push(`신청 전 문의처(${contact})로 자격 요건과 신청 절차를 확인하시면 실수를 방지할 수 있습니다.`);
  }
  
  // 일반 팁
  tips.push(`신청서 작성 시 오기입이나 누락이 없도록 신중하게 작성하시기 바랍니다.`);
  tips.push(`신청 후 처리 결과는 공식 홈페이지나 문자 알림을 통해 확인할 수 있습니다.`);
  
  return { items: tips };
}

/**
 * 신청 일정 생성 (고유 컨텐츠)
 */
function generateTimeline(
  deadline: string,
  detail: Record<string, string>
): string | null {
  if (!deadline && !detail["지급시기"]) {
    return null;
  }
  
  let timeline = "";
  
  if (deadline) {
    timeline += `신청 기간: ${deadline}. `;
  }
  
  const paymentTime = detail["지급시기"] || detail["지급 시기"] || "";
  if (paymentTime) {
    timeline += `지급 시기: ${paymentTime}. `;
  }
  
  const reviewTime = detail["심사기간"] || detail["심사 기간"] || "";
  if (reviewTime) {
    timeline += `심사 기간: ${reviewTime}. `;
  }
  
  return timeline.trim() || null;
}
