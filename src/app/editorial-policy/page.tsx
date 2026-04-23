import type { Metadata } from "next";
import { Card } from "@components/ui";
import { SectionHeader } from "@components/section-header";
import { buildCanonicalUrl } from "@lib/site";

const writingRules = [
  "공공데이터 출처와 공식 링크를 우선합니다.",
  "신청 자격을 단정하지 않고 확인 포인트 중심으로 설명합니다.",
  "자동 생성 문구라도 사용자에게 필요한 맥락이 부족하면 추가 설명을 붙입니다.",
] as const;

const adRules = [
  "광고는 본문과 구분된 위치에만 배치합니다.",
  "실제 슬롯이 준비되지 않은 경우 빈 광고 상자를 노출하지 않습니다.",
  "광고 표기를 유지해 탐색 요소와 혼동되지 않게 합니다.",
] as const;

export const metadata: Metadata = {
  title: "운영 원칙",
  description: "보조24의 콘텐츠 작성 기준, 정정 원칙, 광고 구분 기준을 공개합니다.",
  alternates: {
    canonical: buildCanonicalUrl("/editorial-policy"),
  },
};

export default function EditorialPolicyPage() {
  return (
    <main className="mx-auto flex max-w-4xl flex-col gap-8 pb-16 pt-4">
      <header className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
        <p className="text-xs font-bold uppercase tracking-[0.25em] text-blue-600">Editorial Policy</p>
        <h1 className="mt-3 text-4xl font-extrabold tracking-tight text-slate-900">콘텐츠 운영 원칙</h1>
        <p className="mt-4 text-base leading-8 text-slate-600">
          보조24는 검색 유입용 얇은 페이지가 아니라 실제 신청 전에 참고할 수 있는 안내 페이지를 만드는 것을
          목표로 합니다. 그래서 작성 기준과 광고 구분 기준을 별도 문서로 공개합니다.
        </p>
      </header>

      <section>
        <SectionHeader
          title="콘텐츠 작성 기준"
          description="정확성, 이해 가능성, 원문 확인 가능성을 동시에 확보하기 위한 기준입니다."
        />
        <div className="space-y-4">
          {writingRules.map((item) => (
            <Card key={item} className="border-slate-200">
              <p className="text-sm leading-7 text-slate-700">{item}</p>
            </Card>
          ))}
        </div>
      </section>

      <section>
        <SectionHeader
          eyebrow="Ads"
          title="광고 구분 원칙"
          description="광고가 정보 탐색을 방해하지 않도록 배치와 표기를 분리합니다."
        />
        <div className="grid gap-4 md:grid-cols-3">
          {adRules.map((item) => (
            <Card key={item} className="h-full border-slate-200">
              <p className="text-sm leading-7 text-slate-700">{item}</p>
            </Card>
          ))}
        </div>
      </section>

      <Card className="border-slate-200 bg-slate-50">
        <h2 className="text-2xl font-bold text-slate-900">정정과 갱신</h2>
        <p className="mt-4 text-sm leading-7 text-slate-600">
          제보나 공식 공지 변경이 확인되면 해당 내용을 우선 반영합니다. 다만 신청 가능 여부의 최종 판단은
          항상 기관 공지와 담당 부서 확인을 기준으로 해야 합니다.
        </p>
      </Card>
    </main>
  );
}
