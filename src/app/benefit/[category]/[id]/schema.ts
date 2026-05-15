import type { BenefitRecord } from "@/types/benefit";
import { resolveSiteUrl } from "@lib/site";

const BASE_URL = resolveSiteUrl();

/**
 * FAQ 구조화 데이터 생성
 */
export const buildFaqJsonLd = (benefit: BenefitRecord | null) => {
  const faqs = (benefit?.gemini_faq_json as { q: string; a: string }[] | null) || [];
  if (!faqs.length) return null;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.q,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.a
      }
    }))
  };
  return JSON.stringify(jsonLd);
};

/**
 * Article 구조화 데이터 생성 (고유 컨텐츠)
 */
export const buildArticleJsonLd = (benefit: BenefitRecord, category: string) => {
  const url = `${BASE_URL}/benefit/${category}/${benefit.id}`;
  const detail = benefit.detail_json as {
    list?: Record<string, string>;
    detail?: Record<string, string>;
  } | undefined;

  return JSON.stringify({
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": benefit.name,
    "description": benefit.gemini_summary || detail?.list?.["서비스목적요약"] || "",
    "url": url,
    "datePublished": benefit.last_updated_at || new Date().toISOString(),
    "dateModified": benefit.last_updated_at || new Date().toISOString(),
    "author": {
      "@type": "Organization",
      "name": "보조24",
      "url": BASE_URL
    },
    "publisher": {
      "@type": "Organization",
      "name": "보조24",
      "url": BASE_URL,
      "logo": {
        "@type": "ImageObject",
        "url": `${BASE_URL}/opengraph-image`
      }
    },
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": url
    },
    "about": {
      "@type": "Thing",
      "name": benefit.category || "정부 지원금"
    },
    "provider": {
      "@type": "Organization",
      "name": benefit.governing_org || "정부 기관"
    }
  });
};

/**
 * BreadcrumbList 구조화 데이터 생성
 */
export const buildBreadcrumbJsonLd = (category: string, benefitName: string, benefitId: string) => {
  return JSON.stringify({
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "홈",
        "item": BASE_URL
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": "지원금 목록",
        "item": `${BASE_URL}/benefit`
      },
      {
        "@type": "ListItem",
        "position": 3,
        "name": category,
        "item": `${BASE_URL}/benefit?category=${encodeURIComponent(category)}`
      },
      {
        "@type": "ListItem",
        "position": 4,
        "name": benefitName,
        "item": `${BASE_URL}/benefit/${encodeURIComponent(category)}/${encodeURIComponent(benefitId)}`
      }
    ]
  });
};

/**
 * Organization 구조화 데이터 생성
 */
export const buildOrganizationJsonLd = () => {
  return JSON.stringify({
    "@context": "https://schema.org",
    "@type": "Organization",
    "name": "보조24",
    "url": BASE_URL,
    "logo": `${BASE_URL}/opengraph-image`,
    "description": "행정안전부 보조24 정보를 AI로 요약하고 쉽게 찾을 수 있는 플랫폼",
    "sameAs": [
      // 소셜 미디어 링크 추가 가능
    ]
  });
};

/**
 * HowTo 구조화 데이터 생성 (AEO 최적화)
 * 신청 방법을 단계별로 구조화하여 AI 검색 엔진에 최적화
 */
export const buildHowToJsonLd = (benefit: BenefitRecord) => {
  const detail = benefit.detail_json as {
    list?: Record<string, string>;
    detail?: Record<string, string>;
  } | undefined;

  const applyMethod = detail?.detail?.["신청방법"] || detail?.list?.["신청방법"] || "";
  if (!applyMethod) return null;

  // 신청 방법을 단계로 분리
  const steps = applyMethod
    .split(/[\.\n]/)
    .map(s => s.trim())
    .filter(s => s.length > 0)
    .slice(0, 10) // 최대 10단계
    .map((step, index) => ({
      "@type": "HowToStep",
      "position": index + 1,
      "name": step.substring(0, 100),
      "text": step
    }));

  if (steps.length === 0) return null;

  return JSON.stringify({
    "@context": "https://schema.org",
    "@type": "HowTo",
    "name": `${benefit.name} 신청 방법`,
    "description": `${benefit.name}을 신청하는 단계별 가이드입니다.`,
    "step": steps,
    "totalTime": "PT30M", // 예상 소요 시간
    "estimatedCost": {
      "@type": "MonetaryAmount",
      "currency": "KRW",
      "value": "0"
    }
  });
};

/**
 * QAPage 구조화 데이터 생성 (AEO 최적화)
 * 자연어 질문에 대한 답변 최적화
 */
export const buildQAPageJsonLd = (benefit: BenefitRecord) => {
  const faqs = (benefit.gemini_faq_json as { q: string; a: string }[] | null) || [];
  if (faqs.length === 0) return null;

  const mainEntity = faqs.map((faq) => ({
    "@type": "Question",
    "name": faq.q,
    "acceptedAnswer": {
      "@type": "Answer",
      "text": faq.a
    }
  }));

  return JSON.stringify({
    "@context": "https://schema.org",
    "@type": "QAPage",
    "mainEntity": mainEntity
  });
};

/**
 * GovernmentService Schema 생성 (GEO - Authoritativeness)
 * 정부 서비스 정보를 GovernmentService 타입으로 표현
 */
export const buildGovernmentServiceJsonLd = (benefit: BenefitRecord) => {
  const detail = benefit.detail_json as {
    list?: Record<string, string>;
    detail?: Record<string, string>;
  } | undefined;

  const d = detail?.detail || detail?.list || {};

  return JSON.stringify({
    "@context": "https://schema.org",
    "@type": "GovernmentService",
    "name": benefit.name,
    "description": benefit.gemini_summary || d["서비스목적요약"] || "",
    "provider": {
      "@type": "GovernmentOrganization",
      "name": benefit.governing_org || "정부 기관"
    },
    "serviceType": benefit.category || "정부 지원금",
    "areaServed": {
      "@type": "Country",
      "name": "대한민국"
    },
    ...(d["신청기간"] ? { "availabilityStarts": d["신청기간"] } : {}),
  });
};

/**
 * Dataset Schema 생성 (GEO - Authoritativeness)
 * 공식 데이터 출처 명시
 */
export const buildDatasetJsonLd = (benefit: BenefitRecord) => {
  return JSON.stringify({
    "@context": "https://schema.org",
    "@type": "Dataset",
    "name": `${benefit.name} 정보`,
    "description": "행정안전부 보조24 공공데이터 기반 정보",
    "creator": {
      "@type": "Organization",
      "name": "행정안전부",
      "url": "https://www.gov.kr"
    },
    "publisher": {
      "@type": "Organization",
      "name": "보조24",
      "url": BASE_URL
    },
    "datePublished": benefit.last_updated_at || new Date().toISOString(),
    "dateModified": benefit.last_updated_at || new Date().toISOString(),
    "license": "https://www.data.go.kr",
    "distribution": {
      "@type": "DataDownload",
      "contentUrl": `https://api.odcloud.kr/api/gov24/v3`
    }
  });
};

/**
 * FAQ 구조화 데이터 생성 (공공데이터 기반)
 */
export const buildOptimizedFaqJsonLd = (faqs: Array<{ question: string; answer: string }>) => {
  if (!faqs.length) return null;
  
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer
      }
    }))
  };
  return JSON.stringify(jsonLd);
};

/**
 * 모든 구조화 데이터 통합 (GEO + AEO 최적화)
 */
export const buildAllStructuredData = (
  benefit: BenefitRecord,
  category: string,
  optimizedFaqs?: Array<{ question: string; answer: string }>
) => {
  const data = [
    buildArticleJsonLd(benefit, category),
    buildBreadcrumbJsonLd(category, benefit.name, benefit.id),
    buildOrganizationJsonLd(),
    buildGovernmentServiceJsonLd(benefit), // GEO - Authoritativeness
    buildDatasetJsonLd(benefit),
  ];

  // 공공데이터 기반 FAQ 우선 (AEO 최적화)
  if (optimizedFaqs && optimizedFaqs.length > 0) {
    const optimizedFaqData = buildOptimizedFaqJsonLd(optimizedFaqs);
    if (optimizedFaqData) {
      data.push(optimizedFaqData);
    }
  } else {
    // Gemini 생성 FAQ (폴백)
    const faqData = buildFaqJsonLd(benefit);
    if (faqData) {
      data.push(faqData);
    }
  }

  // QAPage (AEO 최적화)
  const qaPageData = buildQAPageJsonLd(benefit);
  if (qaPageData) {
    data.push(qaPageData);
  }

  // HowTo (AEO 최적화)
  const howToData = buildHowToJsonLd(benefit);
  if (howToData) {
    data.push(howToData);
  }

  return data;
};

