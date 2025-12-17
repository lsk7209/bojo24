/**
 * 고유 컨텐츠 생성 유틸리티
 * 중복 방지 및 고유성 보장
 */

import { getServiceClient } from "./supabaseClient";
import { generateContentHash, generateBenefitContentHash, generatePostContentHash } from "./contentHash";

/**
 * 컨텐츠 중복 여부 확인
 */
export async function checkContentDuplicate(
  contentHash: string,
  contentType: 'benefit' | 'post'
): Promise<boolean> {
  const supabase = getServiceClient();
  const { data } = await supabase
    .from('content_duplicates')
    .select('id')
    .eq('content_hash', contentHash)
    .eq('content_type', contentType)
    .maybeSingle();

  return !!data;
}

/**
 * 컨텐츠 해시 저장 (중복 방지용)
 */
export async function saveContentHash(
  contentHash: string,
  contentType: 'benefit' | 'post',
  contentId: string
): Promise<void> {
  const supabase = getServiceClient();
  const { error } = await supabase
    .from('content_duplicates')
    .insert({
      content_hash: contentHash,
      content_type: contentType,
      content_id: contentId
    });

  if (error && !error.message.includes('duplicate')) {
    throw error;
  }
}

/**
 * 보조금 컨텐츠 중복 확인 및 저장
 */
export async function checkAndSaveBenefitHash(benefit: {
  id: string;
  name: string;
  detail_json: Record<string, unknown>;
  gemini_summary?: string | null;
}): Promise<{ isDuplicate: boolean; hash: string }> {
  const hash = generateBenefitContentHash(benefit);
  const isDuplicate = await checkContentDuplicate(hash, 'benefit');
  
  if (!isDuplicate) {
    await saveContentHash(hash, 'benefit', benefit.id);
  }
  
  return { isDuplicate, hash };
}

/**
 * 블로그 포스트 중복 확인 및 저장
 */
export async function checkAndSavePostHash(post: {
  title: string;
  content: string;
  benefit_id: string;
  slug: string;
}): Promise<{ isDuplicate: boolean; hash: string }> {
  const hash = generatePostContentHash(post);
  const isDuplicate = await checkContentDuplicate(hash, 'post');
  
  if (!isDuplicate) {
    await saveContentHash(hash, 'post', post.slug);
  }
  
  return { isDuplicate, hash };
}

/**
 * 고유한 블로그 포스트 제목 생성
 * 같은 보조금에 대해 여러 각도로 포스트 생성 가능
 */
export function generateUniquePostTitle(
  benefitName: string,
  angle: 'guide' | 'tips' | 'comparison' | 'news' | 'analysis'
): string {
  const templates = {
    guide: `2025년 ${benefitName} 신청 가이드: 자격 요건 및 서류 완벽 정리`,
    tips: `[꿀팁] ${benefitName} 신청 시 이것만은 꼭 확인하세요!`,
    comparison: `${benefitName} vs 유사 정책 비교 분석`,
    news: `[최신] ${benefitName} 신청 기간 및 변경 사항 안내`,
    analysis: `${benefitName} 심층 분석: 받을 수 있는 최대 금액은?`
  };

  return templates[angle];
}

