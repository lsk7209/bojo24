/**
 * 컨텐츠 템플릿 시스템
 * 구글 고유 컨텐츠 인정을 위한 템플릿 기반 고유 컨텐츠 생성
 */

import type { BenefitRecord } from "@/types/benefit";
import { getServiceClient } from "./supabaseClient";

export type ContentType = 'intro' | 'analysis' | 'guide' | 'tips' | 'comparison';
export type SectionType = 'target' | 'benefit' | 'apply' | 'documents' | 'timeline' | 'tips';

export interface TemplateVariable {
  name: string;
  type: 'text' | 'number' | 'date' | 'list' | 'json';
  source: string; // 데이터 소스 경로 (예: "benefit.name", "detail.detail.지원대상")
  defaultValue?: string;
}

export interface ContentSection {
  id?: string;
  sectionType: SectionType;
  order: number;
  title?: string;
  content: string;
}

export interface BenefitContent {
  id?: string;
  benefitId: string;
  contentType: ContentType;
  introText?: string;
  analysisText?: string;
  guideText?: string;
  tipsText?: string;
  comparisonText?: string;
  contentHash?: string;
  uniquenessScore?: number;
  sections?: ContentSection[];
}

/**
 * 템플릿 변수 추출
 * benefit 데이터에서 템플릿 변수 값 추출
 */
export function extractTemplateVariables(
  benefit: BenefitRecord,
  variables: Record<string, TemplateVariable>
): Record<string, string | number | string[]> {
  const detail = benefit.detail_json as {
    list?: Record<string, string>;
    detail?: Record<string, string>;
    supportConditions?: Record<string, string>;
  } | undefined;

  const extracted: Record<string, string | number | string[]> = {};

  for (const [key, variable] of Object.entries(variables)) {
    const source = variable.source.split('.');
    let value: any = null;

    // 데이터 소스 경로 따라가기
    if (source[0] === 'benefit') {
      value = (benefit as any)[source[1]];
    } else if (source[0] === 'detail') {
      if (source[1] === 'detail' && detail?.detail) {
        value = detail.detail[source[2]];
      } else if (source[1] === 'list' && detail?.list) {
        value = detail.list[source[2]];
      } else if (source[1] === 'supportConditions' && detail?.supportConditions) {
        value = detail.supportConditions[source[2]];
      }
    }

    // 기본값 처리
    if (!value && variable.defaultValue) {
      value = variable.defaultValue;
    }

    // 타입 변환
    if (variable.type === 'list' && typeof value === 'string') {
      extracted[key] = value.split(/[.,;]/).map(s => s.trim()).filter(Boolean);
    } else {
      extracted[key] = value || '';
    }
  }

  return extracted;
}

/**
 * 템플릿에 변수 주입
 */
export function renderTemplate(
  template: string,
  variables: Record<string, string | number | string[]>
): string {
  let rendered = template;

  // {{variable_name}} 형식의 변수 치환
  for (const [key, value] of Object.entries(variables)) {
    const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
    const stringValue = Array.isArray(value) ? value.join(', ') : String(value);
    rendered = rendered.replace(regex, stringValue);
  }

  return rendered;
}

/**
 * 보조금별 고유 컨텐츠 조회
 */
export async function getBenefitContent(
  benefitId: string,
  contentType: ContentType = 'intro'
): Promise<BenefitContent | null> {
  const supabase = getServiceClient();
  const { data } = await supabase
    .from('benefit_content')
    .select('*, content_sections(*)')
    .eq('benefit_id', benefitId)
    .eq('content_type', contentType)
    .maybeSingle();

  if (!data) return null;

  return {
    id: data.id,
    benefitId: data.benefit_id,
    contentType: data.content_type as ContentType,
    introText: data.intro_text,
    analysisText: data.analysis_text,
    guideText: data.guide_text,
    tipsText: data.tips_text,
    comparisonText: data.comparison_text,
    contentHash: data.content_hash,
    uniquenessScore: data.uniqueness_score,
    sections: data.content_sections?.map((s: any) => ({
      id: s.id,
      sectionType: s.section_type as SectionType,
      order: s.section_order,
      title: s.title,
      content: s.content
    }))
  };
}

/**
 * 고유 컨텐츠 저장
 */
export async function saveBenefitContent(
  content: BenefitContent
): Promise<void> {
  const supabase = getServiceClient();
  
  const { error } = await supabase
    .from('benefit_content')
    .upsert({
      benefit_id: content.benefitId,
      content_type: content.contentType,
      intro_text: content.introText,
      analysis_text: content.analysisText,
      guide_text: content.guideText,
      tips_text: content.tipsText,
      comparison_text: content.comparisonText,
      content_hash: content.contentHash,
      uniqueness_score: content.uniquenessScore,
      word_count: [
        content.introText,
        content.analysisText,
        content.guideText,
        content.tipsText,
        content.comparisonText
      ].filter(Boolean).join(' ').split(/\s+/).length
    }, {
      onConflict: 'benefit_id,content_type'
    });

  if (error) throw error;

  // 섹션 저장
  if (content.sections && content.sections.length > 0) {
    const benefitContentId = content.id || (await getBenefitContent(content.benefitId, content.contentType))?.id;
    
    if (benefitContentId) {
      const sections = content.sections.map(s => ({
        benefit_content_id: benefitContentId,
        section_type: s.sectionType,
        section_order: s.order,
        title: s.title,
        content: s.content
      }));

      await supabase.from('content_sections').upsert(sections);
    }
  }
}

/**
 * 고유성 점수 계산
 * 다른 보조금과의 유사도 기반 고유성 측정
 */
export async function calculateUniquenessScore(
  content: string,
  benefitId: string
): Promise<number> {
  const supabase = getServiceClient();
  
  // 유사한 컨텐츠 조회
  const { data: similarContents } = await supabase
    .from('benefit_content')
    .select('intro_text, analysis_text, guide_text, tips_text, comparison_text')
    .neq('benefit_id', benefitId)
    .limit(100);

  if (!similarContents || similarContents.length === 0) {
    return 1.0; // 첫 번째 컨텐츠는 완전 고유
  }

  // 간단한 유사도 계산 (실제로는 더 정교한 알고리즘 사용 가능)
  const contentWords = new Set(content.toLowerCase().split(/\s+/));
  let maxSimilarity = 0;

  for (const similar of similarContents) {
    const allText = [
      similar.intro_text,
      similar.analysis_text,
      similar.guide_text,
      similar.tips_text,
      similar.comparison_text
    ].filter(Boolean).join(' ');

    const similarWords = new Set(allText.toLowerCase().split(/\s+/));
    const intersection = new Set([...contentWords].filter(x => similarWords.has(x)));
    const union = new Set([...contentWords, ...similarWords]);
    const similarity = intersection.size / union.size;

    maxSimilarity = Math.max(maxSimilarity, similarity);
  }

  // 고유성 점수 = 1 - 최대 유사도
  return Math.max(0, 1 - maxSimilarity);
}

