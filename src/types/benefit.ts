export interface ServiceListItem {
  서비스ID: string;
  서비스명: string;
  서비스목적요약?: string;
  지원유형?: string;
  지원대상?: string;
  선정기준?: string;
  지원내용?: string;
  신청방법?: string;
  신청기한?: string;
  상세조회URL?: string;
  소관기관코드?: string;
  소관기관명?: string;
  부서명?: string;
  조회수?: number;
  소관기관유형?: string;
  사용자구분?: string;
  서비스분야?: string;
  접수기관?: string;
  전화문의?: string;
  등록일시?: string;
  수정일시?: string;
}

export interface ServiceDetailItem {
  서비스ID: string;
  서비스명: string;
  서비스목적?: string;
  신청기한?: string;
  지원대상?: string;
  선정기준?: string;
  지원내용?: string;
  신청방법?: string;
  구비서류?: string;
  접수기관명?: string;
  문의처?: string;
  온라인신청사이트URL?: string;
  수정일시?: string;
  소관기관명?: string;
  행정규칙?: string;
  자치법규?: string;
  법령?: string;
  공무원확인구비서류?: string;
  본인확인필요구비서류?: string;
}

export interface SupportConditionsItem {
  서비스ID: string;
  [key: string]: string | number | undefined;
}

export interface ApiEnvelope<T> {
  page: number;
  perPage: number;
  totalCount: number;
  currentCount: number;
  matchCount: number;
  data: T[];
}

export interface BenefitRecord {
  id: string;
  name: string;
  category: string;
  governing_org: string;
  detail_json: Record<string, unknown>;
  last_updated_at: string;
  gemini_summary?: string | null;
  gemini_faq_json?: unknown[] | null;
}

