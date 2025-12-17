/**
 * 컨텐츠 중복 방지를 위한 해시 생성 유틸리티
 */

import crypto from 'crypto';

/**
 * 컨텐츠의 해시값 생성 (중복 검사용)
 */
export function generateContentHash(content: string): string {
  return crypto.createHash('sha256').update(content).digest('hex');
}

/**
 * 보조금 데이터에서 고유 컨텐츠 해시 생성
 */
export function generateBenefitContentHash(benefit: {
  id: string;
  name: string;
  detail_json: Record<string, unknown>;
  gemini_summary?: string | null;
}): string {
  // 핵심 컨텐츠만 추출하여 해시 생성
  const coreContent = JSON.stringify({
    id: benefit.id,
    name: benefit.name,
    summary: benefit.gemini_summary,
    // detail_json의 핵심 필드만 포함
    target: (benefit.detail_json as any)?.detail?.["지원대상"] || (benefit.detail_json as any)?.list?.["지원대상"],
    content: (benefit.detail_json as any)?.detail?.["지원내용"] || (benefit.detail_json as any)?.list?.["지원내용"],
  });
  
  return generateContentHash(coreContent);
}

/**
 * 블로그 포스트 컨텐츠 해시 생성
 */
export function generatePostContentHash(post: {
  title: string;
  content: string;
  benefit_id: string;
}): string {
  const coreContent = JSON.stringify({
    title: post.title,
    content: post.content.substring(0, 1000), // 처음 1000자만 사용
    benefit_id: post.benefit_id
  });
  
  return generateContentHash(coreContent);
}

