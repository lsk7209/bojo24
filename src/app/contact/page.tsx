import type { Metadata } from "next";
import { Card } from "@components/ui";
import { SectionHeader } from "@components/section-header";
import { CONTACT_EMAIL, buildCanonicalUrl } from "@lib/site";

const requestItems = [
  "정책명 또는 페이지 URL",
  "잘못 보인 정보와 수정이 필요한 이유",
  "가능하면 공식 근거 링크 또는 기관 공지",
] as const;

const responsePolicy = [
  "단순 문의와 정정 요청을 구분해 확인합니다.",
  "공식 근거가 확인되면 우선 순위를 높여 반영합니다.",
  "개인 신청 대행이나 자격 판정은 제공하지 않습니다.",
] as const;

export const metadata: Metadata = {
  title: "문의하기",
  description: "보조24의 정정 요청, 운영 문의, 광고 관련 문의 방법을 안내합니다.",
  alternates: {
    canonical: buildCanonicalUrl("/contact"),
  },
};

export default function ContactPage() {
  return (
    <main className="mx-auto flex max-w-4xl flex-col gap-8 pb-16 pt-4">
      <header className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
        <p className="text-xs font-bold uppercase tracking-[0.25em] text-blue-600">Contact</p>
        <h1 className="mt-3 text-4xl font-extrabold tracking-tight text-slate-900">문의하기</h1>
        <p className="mt-4 text-base leading-8 text-slate-600">
          정보 오류 제보, 운영 문의, 광고 관련 문의는 아래 채널로 받습니다. 공공데이터 기반 서비스 특성상
          공식 근거가 함께 있으면 더 빠르게 검토할 수 있습니다.
        </p>
      </header>

      <section>
        <SectionHeader
          title="연락 채널"
          description="애드센스 검수와 사용자 신뢰를 위해 운영 주체와 연락 경로를 공개합니다."
        />
        <Card className="border-slate-200">
          <p className="text-sm font-bold uppercase tracking-[0.25em] text-blue-600">이메일</p>
          <p className="mt-3 text-2xl font-bold text-slate-900">{CONTACT_EMAIL}</p>
          <p className="mt-3 text-sm leading-7 text-slate-600">
            정정 요청, 운영 문의, 광고 문의를 한 채널에서 받습니다. 개인정보나 민감한 신청 서류는 보내지
            말아주세요.
          </p>
        </Card>
      </section>

      <section>
        <SectionHeader
          eyebrow="Correction"
          title="정정 요청 시 함께 보내주시면 좋은 정보"
          description="빠른 확인을 위해 최소한의 맥락을 함께 보내주세요."
        />
        <div className="grid gap-4 md:grid-cols-3">
          {requestItems.map((item) => (
            <Card key={item} className="h-full border-slate-200">
              <p className="text-sm leading-7 text-slate-700">{item}</p>
            </Card>
          ))}
        </div>
      </section>

      <section>
        <SectionHeader
          eyebrow="Policy"
          title="응답 원칙"
          description="모든 문의를 같은 기준으로 처리하기 위해 내부 원칙을 공개합니다."
        />
        <div className="space-y-4">
          {responsePolicy.map((item) => (
            <Card key={item} className="border-slate-200">
              <p className="text-sm leading-7 text-slate-700">{item}</p>
            </Card>
          ))}
        </div>
      </section>
    </main>
  );
}
