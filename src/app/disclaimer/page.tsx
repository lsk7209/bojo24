import type { Metadata } from "next";
import Link from "next/link";
import { Card } from "@components/ui";
import { SectionHeader } from "@components/section-header";
import { buildCanonicalUrl, CONTACT_EMAIL } from "@lib/site";

const limits = [
  "보조24는 정부 기관이나 신청 대행 서비스가 아닙니다.",
  "사이트의 설명은 공공데이터 이해를 돕기 위한 참고 정보입니다.",
  "실제 신청 가능 여부, 지급 금액, 접수 기간은 담당 기관의 최종 안내가 우선합니다.",
] as const;

const userChecks = [
  "신청 전 공식 기관 페이지와 공고문을 다시 확인하세요.",
  "소득, 연령, 거주지, 중복 수급 제한은 개인 상황에 따라 달라질 수 있습니다.",
  "정정이 필요한 정보는 공식 근거 링크와 함께 문의 채널로 알려주세요.",
] as const;

export const metadata: Metadata = {
  title: "면책조항",
  description: "보조24 정보 제공 범위, 공식 확인 원칙, 책임 제한 기준을 안내합니다.",
  alternates: {
    canonical: buildCanonicalUrl("/disclaimer"),
  },
};

export default function DisclaimerPage() {
  return (
    <main className="mx-auto flex max-w-4xl flex-col gap-8 pb-16 pt-4">
      <header className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
        <p className="text-xs font-bold uppercase tracking-[0.25em] text-blue-600">
          Disclaimer
        </p>
        <h1 className="mt-3 text-4xl font-extrabold tracking-tight text-slate-900">
          면책조항
        </h1>
        <p className="mt-4 text-base leading-8 text-slate-600">
          보조24는 행정안전부 보조24 공공데이터를 바탕으로 정부 지원 정보를 쉽게 이해하도록
          돕는 안내형 사이트입니다. 최종 신청과 자격 판단은 반드시 담당 기관의 공식 안내를
          기준으로 확인해야 합니다.
        </p>
      </header>

      <section>
        <SectionHeader
          title="정보 제공 범위"
          description="사이트가 제공하는 정보와 제공하지 않는 서비스를 명확히 구분합니다."
        />
        <div className="grid gap-4 md:grid-cols-3">
          {limits.map((item) => (
            <Card key={item} className="h-full border-slate-200">
              <p className="text-sm leading-7 text-slate-700">{item}</p>
            </Card>
          ))}
        </div>
      </section>

      <section>
        <SectionHeader
          eyebrow="Official Check"
          title="신청 전 확인 원칙"
          description="지원금 정보는 개인 상황과 기관 공지에 따라 달라질 수 있습니다."
        />
        <Card className="border-slate-200 bg-slate-50">
          <ul className="space-y-3 text-sm leading-7 text-slate-700">
            {userChecks.map((item) => (
              <li key={item} className="flex gap-3">
                <span className="mt-2 h-1.5 w-1.5 flex-none rounded-full bg-blue-600" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </Card>
      </section>

      <Card className="border-slate-200">
        <h2 className="text-2xl font-bold text-slate-900">정정 요청</h2>
        <p className="mt-4 text-sm leading-7 text-slate-600">
          잘못된 정보나 오래된 안내를 발견했다면 정책명, 페이지 URL, 공식 근거 링크를 함께
          보내주세요. 확인 가능한 근거가 있을 때 우선 반영합니다.
        </p>
        <div className="mt-6 flex flex-wrap gap-3 text-sm font-semibold">
          <Link href="/contact" className="text-blue-600 hover:text-blue-700">
            문의하기 →
          </Link>
          <a href={`mailto:${CONTACT_EMAIL}`} className="text-slate-700 hover:text-slate-900">
            {CONTACT_EMAIL}
          </a>
        </div>
      </Card>
    </main>
  );
}
