/**
 * 보조금 상세페이지 섹션 컴포넌트
 * 템플릿 기반 고유 컨텐츠 표시
 */

import { Card } from "@components/ui";
import { SectionHeader } from "@components/section-header";
import type { ContentSection, SectionType } from "@lib/contentTemplate";

interface BenefitContentSectionsProps {
  sections: ContentSection[];
  detail: {
    detail?: Record<string, string>;
    list?: Record<string, string>;
  };
}

/**
 * 섹션 타입별 아이콘 및 제목
 */
const sectionConfig: Record<SectionType, { icon: string; title: string; defaultTitle?: string }> = {
  target: { icon: "🎯", title: "지원 대상", defaultTitle: "누가 받을 수 있나요?" },
  benefit: { icon: "🎁", title: "지원 내용", defaultTitle: "어떤 혜택을 받나요?" },
  apply: { icon: "📝", title: "신청 방법", defaultTitle: "어떻게 신청하나요?" },
  documents: { icon: "📄", title: "필요 서류", defaultTitle: "어떤 서류가 필요하나요?" },
  timeline: { icon: "📅", title: "신청 기간", defaultTitle: "언제까지 신청하나요?" },
  tips: { icon: "💡", title: "실전 팁", defaultTitle: "알아두면 좋은 팁" }
};

/**
 * 섹션 컴포넌트
 */
export function BenefitContentSection({ section }: { section: ContentSection }) {
  const config = sectionConfig[section.sectionType];
  const title = section.title || config.defaultTitle || config.title;

  return (
    <section aria-label={title} className="mb-6">
      <h3 className="text-lg font-bold text-slate-900 mb-3 flex items-center gap-2">
        <span className="text-xl">{config.icon}</span>
        {title}
      </h3>
      <Card className="bg-slate-50/50">
        <div 
          className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap"
          dangerouslySetInnerHTML={{ __html: section.content }}
        />
      </Card>
    </section>
  );
}

/**
 * 고유 컨텐츠 섹션 (AI 생성)
 */
export function UniqueContentSection({ 
  title, 
  content, 
  icon = "✨",
  uniquenessScore
}: { 
  title: string; 
  content: string; 
  icon?: string;
  uniquenessScore?: number;
}) {
  if (!content) return null;

  const scorePercent = uniquenessScore ? Math.round(uniquenessScore * 100) : null;

  return (
    <section aria-label={title} className="mb-6">
      <SectionHeader
        eyebrow="UNIQUE CONTENT"
        title={title}
        description="구글 고유 컨텐츠로 인정받은 전문 분석입니다."
      />
      <Card className="bg-gradient-to-br from-purple-50 to-white border-purple-100">
        <div className="text-base leading-relaxed text-slate-800 whitespace-pre-line">
          {content}
        </div>
        <div className="mt-4 flex items-center justify-between border-t border-purple-100 pt-4">
          <div className="flex items-center gap-2 text-xs text-purple-400 font-medium">
            <span>🤖 AI 생성 고유 컨텐츠</span>
            {scorePercent !== null && (
              <>
                <span>•</span>
                <span className="text-purple-500">
                  고유성: {scorePercent}%
                </span>
              </>
            )}
          </div>
          {scorePercent !== null && scorePercent >= 70 && (
            <div className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-semibold">
              ✓ 구글 인정 고유 컨텐츠
            </div>
          )}
        </div>
      </Card>
    </section>
  );
}

/**
 * 모든 섹션 렌더링
 */
export function BenefitContentSections({ sections, detail }: BenefitContentSectionsProps) {
  // 섹션을 order 순으로 정렬
  const sortedSections = [...sections].sort((a, b) => a.order - b.order);

  return (
    <div className="space-y-6">
      {sortedSections.map((section, index) => (
        <BenefitContentSection key={section.id || index} section={section} />
      ))}
    </div>
  );
}

/**
 * 기본 데이터 폴백 섹션 (고유 컨텐츠가 없을 때)
 */
import { formatDescription } from "@lib/formattext";

export function FallbackSection({ 
  type, 
  content 
}: { 
  type: SectionType; 
  content: string;
}) {
  const config = sectionConfig[type];
  
  return (
    <section aria-label={config.title} className="mb-6">
      <h3 className="text-lg font-bold text-slate-900 mb-3 flex items-center gap-2">
        <span className="text-xl">{config.icon}</span>
        {config.title}
      </h3>
      <Card className="bg-slate-50/50">
        <div className="text-sm text-slate-700 leading-relaxed">
          {content ? formatDescription(content) : <span className="text-slate-400">상세 정보 없음</span>}
        </div>
      </Card>
    </section>
  );
}

