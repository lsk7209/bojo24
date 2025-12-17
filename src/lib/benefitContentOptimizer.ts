/**
 * 보조금 상세페이지 컨텐츠 최적화 유틸리티
 * 공공데이터 기반으로 구글 검색 최적화된 구조 생성
 */

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
 */
export function optimizeBenefitContent(
  benefitName: string,
  category: string,
  governingOrg: string,
  detail: BenefitDetail
): OptimizedContent {
  const detailData = detail.detail || detail.list || {};
  
  // 1. 요약 생성 (구글 스니펫 최적화)
  const summary = generateSummary(benefitName, category, governingOrg, detailData);
  
  // 2. 지원 대상 섹션
  const targetContent = detailData["지원대상"] || detailData["대상"] || "정보 없음";
  const criteria = detailData["선정기준"] || detailData["선정 기준"] || "";
  
  // 3. 지원 내용 섹션
  const benefitContent = detailData["지원내용"] || detailData["지원 내용"] || "정보 없음";
  const amount = extractAmount(benefitContent);
  const benefitType = extractBenefitType(benefitContent);
  
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
  
  // 6. FAQ 자동 생성 (공공데이터 기반)
  const faqs = generateFAQs(benefitName, category, targetContent, benefitContent, applyMethod, contact);
  
  // 7. 키워드 추출 (SEO 최적화)
  const keywords = extractKeywords(benefitName, category, governingOrg, targetContent, benefitContent);
  
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
      }
    },
    faqs,
    keywords
  };
}

/**
 * 요약 생성 (구글 스니펫 최적화)
 */
function generateSummary(
  name: string,
  category: string,
  org: string,
  detail: Record<string, string>
): string {
  const purpose = detail["서비스목적"] || detail["서비스목적요약"] || "";
  const target = detail["지원대상"] || "";
  const benefit = detail["지원내용"] || "";
  
  // 자연어 요약 생성
  let summary = `${name}은(는) ${org}에서 제공하는 ${category} 분야 지원금입니다.`;
  
  if (purpose) {
    summary += ` ${purpose}`;
  }
  
  if (target) {
    const targetShort = target.length > 50 ? target.substring(0, 50) + "..." : target;
    summary += ` 지원 대상은 ${targetShort}입니다.`;
  }
  
  if (benefit) {
    const benefitShort = benefit.length > 50 ? benefit.substring(0, 50) + "..." : benefit;
    summary += ` 지원 내용은 ${benefitShort}입니다.`;
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
 * FAQ 자동 생성 (공공데이터 기반)
 */
function generateFAQs(
  name: string,
  category: string,
  target: string,
  benefit: string,
  apply: string,
  contact: { phone?: string; website?: string }
): Array<{ question: string; answer: string }> {
  const faqs: Array<{ question: string; answer: string }> = [];
  
  // Q1: 누가 받을 수 있나요?
  if (target && target !== "정보 없음") {
    faqs.push({
      question: `${name}은 누가 받을 수 있나요?`,
      answer: `${name}의 지원 대상은 다음과 같습니다: ${target.substring(0, 200)}${target.length > 200 ? "..." : ""}`
    });
  }
  
  // Q2: 어떤 혜택을 받나요?
  if (benefit && benefit !== "정보 없음") {
    faqs.push({
      question: `${name}에서 어떤 혜택을 받을 수 있나요?`,
      answer: `${name}의 지원 내용은 다음과 같습니다: ${benefit.substring(0, 200)}${benefit.length > 200 ? "..." : ""}`
    });
  }
  
  // Q3: 어떻게 신청하나요?
  if (apply && apply !== "정보 없음") {
    faqs.push({
      question: `${name}은 어떻게 신청하나요?`,
      answer: `${name} 신청 방법: ${apply.substring(0, 200)}${apply.length > 200 ? "..." : ""}`
    });
  }
  
  // Q4: 문의는 어디로 하나요?
  if (contact.phone || contact.website) {
    const contactInfo = contact.phone 
      ? `전화: ${contact.phone}` 
      : contact.website 
        ? `온라인: ${contact.website}` 
        : "";
    
    if (contactInfo) {
      faqs.push({
        question: `${name} 신청 관련 문의는 어디로 하나요?`,
        answer: `${name} 신청 관련 문의는 ${contactInfo}로 연락하시면 됩니다.`
      });
    }
  }
  
  // Q5: 신청 기간이 있나요?
  faqs.push({
    question: `${name} 신청 기간이 정해져 있나요?`,
    answer: `${name}의 신청 기간은 상시 접수 또는 정해진 기간 내에 신청 가능합니다. 정확한 신청 기간은 공식 홈페이지 또는 문의처를 통해 확인하시기 바랍니다.`
  });
  
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

