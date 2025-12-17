/**
 * 마크다운 기호를 제거하고 일반 텍스트로 변환
 * FAQ 등에서 마크다운 기호가 그대로 표시되는 것을 방지
 */

export function cleanMarkdown(text: string): string {
  if (!text) return text;

  return text
    // 볼드 제거 (**텍스트** -> 텍스트)
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    // 이탤릭 제거 (_텍스트_ -> 텍스트)
    .replace(/_([^_]+)_/g, "$1")
    // 목록 기호 제거 (선행 - 또는 • 제거)
    .replace(/^[-•]\s+/gm, "")
    // 번호 목록 제거 (1. 2. 등)
    .replace(/^\d+[.)]\s+/gm, "")
    // 코드 블록 제거 (```코드``` -> 코드)
    .replace(/```[\s\S]*?```/g, "")
    .replace(/`([^`]+)`/g, "$1")
    // 링크 제거 ([텍스트](url) -> 텍스트)
    .replace(/\[([^\]]+)\]\([^\)]+\)/g, "$1")
    // 이미지 제거 (![alt](url) -> alt)
    .replace(/!\[([^\]]*)\]\([^\)]+\)/g, "$1")
    // HTML 태그 제거
    .replace(/<[^>]+>/g, "")
    // 연속된 공백 정리
    .replace(/\s+/g, " ")
    .trim();
}

