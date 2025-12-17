import React from "react";

/**
 * 마크다운 형식의 텍스트를 React 컴포넌트로 변환
 * 볼드, 목록, 문단 구분 등을 지원
 */
export function formatMarkdown(text: string) {
  if (!text) return text;

  // 문단으로 분리 (빈 줄 기준)
  const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim());

  return (
    <div className="space-y-4">
      {paragraphs.map((paragraph, pIdx) => {
        const lines = paragraph.split("\n").filter(l => l.trim());
        
        return (
          <div key={pIdx} className="space-y-2">
            {lines.map((line, lIdx) => {
              const trimmed = line.trim();
              
              // 목록 항목 확인 (- 또는 • 로 시작)
              const isListItem = trimmed.match(/^[-•]\s+/);
              const isNumberedList = trimmed.match(/^\d+[.)]\s+/);
              
              if (isListItem || isNumberedList) {
                // 목록 항목 처리
                const content = trimmed.replace(/^[-•]\s+/, "").replace(/^\d+[.)]\s+/, "");
                return (
                  <div key={lIdx} className="flex items-start gap-2 pl-4">
                    <span className="text-blue-600 font-bold mt-1 flex-shrink-0">
                      {isNumberedList ? trimmed.match(/^\d+/)?.[0] + "." : "•"}
                    </span>
                    <div className="flex-1">
                      {formatInlineMarkdown(content)}
                    </div>
                  </div>
                );
              }
              
              // 일반 문단
              return (
                <div key={lIdx} className="text-slate-700 leading-relaxed">
                  {formatInlineMarkdown(trimmed)}
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}

/**
 * 인라인 마크다운 처리 (볼드 등)
 */
function formatInlineMarkdown(text: string): React.ReactNode {
  // 볼드 처리 (**텍스트**)
  const parts: (string | React.ReactNode)[] = [];
  let lastIndex = 0;
  const boldRegex = /\*\*([^*]+)\*\*/g;
  let match;

  while ((match = boldRegex.exec(text)) !== null) {
    // 볼드 앞의 일반 텍스트
    if (match.index > lastIndex) {
      parts.push(text.substring(lastIndex, match.index));
    }
    // 볼드 텍스트
    parts.push(
      <strong key={match.index} className="font-bold text-slate-900">
        {match[1]}
      </strong>
    );
    lastIndex = match.index + match[0].length;
  }

  // 남은 텍스트
  if (lastIndex < text.length) {
    parts.push(text.substring(lastIndex));
  }

  return parts.length > 0 ? <>{parts}</> : text;
}

