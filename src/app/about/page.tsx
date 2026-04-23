import type { Metadata } from "next";
import Link from "next/link";
import { Card } from "@components/ui";
import { SectionHeader } from "@components/section-header";
import { SITE_NAME, buildCanonicalUrl } from "@lib/site";

const strengths = [
  "정책명만 보여주지 않고 신청 대상과 준비 사항을 본문 중심으로 다시 설명합니다.",
  "공공데이터 출처, 운영 원칙, 문의 채널을 공개해 정보 책임 범위를 명확히 합니다.",
  "공식 신청 링크와 확인 경로를 함께 안내해 실제 신청 단계까지 이어질 수 있게 설계합니다.",
] as const;

const workflow = [
  "행정안전부 보조24 공공데이터에서 기본 정책 정보를 수집합니다.",
  "사용자 관점에서 필요한 내용만 다시 분류해 요약, FAQ, 신청 체크포인트를 만듭니다.",
  "정확한 신청은 기관 공지를 우선하도록 공식 링크와 문의처를 함께 노출합니다.",
] as const;

export const metadata: Metadata = {
  title: "서비스 소개",
  description: "보조24가 어떤 기준으로 정부 지원금 정보를 정리하는지 소개합니다.",
  alternates: {
    canonical: buildCanonicalUrl("/about"),
  },
};

export default function AboutPage() {
  return (
    <main className="mx-auto flex max-w-4xl flex-col gap-8 pb-16 pt-4">
      <header className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-sm">
        <p className="text-xs font-bold uppercase tracking-[0.25em] text-blue-600">About</p>
        <h1 className="mt-3 text-4xl font-extrabold tracking-tight text-slate-900">{SITE_NAME} 소개</h1>
        <p className="mt-4 text-base leading-8 text-slate-600">
          보조24는 정부 지원금 정보를 찾는 사용자가 정책명만 보고 헤매지 않도록, 신청 전 꼭 필요한 정보를
          먼저 읽히게 만드는 안내형 서비스입니다.
        </p>
      </header>

      <section>
        <SectionHeader
          title="이 사이트가 하려는 일"
          description="검색 유입 직후에도 서비스 목적과 정보 제공 범위를 빠르게 이해할 수 있게 정리했습니다."
        />
        <div className="grid gap-4 md:grid-cols-3">
          {strengths.map((item) => (
            <Card key={item} className="h-full border-slate-200">
              <p className="text-sm leading-7 text-slate-700">{item}</p>
            </Card>
          ))}
        </div>
      </section>

      <section>
        <SectionHeader
          eyebrow="Workflow"
          title="정보 정리 방식"
          description="공식 데이터 수집부터 사용자 친화적 재구성까지의 흐름입니다."
        />
        <div className="space-y-4">
          {workflow.map((item, index) => (
            <Card key={item} className="border-slate-200">
              <p className="text-sm font-bold text-blue-600">{index + 1}단계</p>
              <p className="mt-3 text-sm leading-7 text-slate-700">{item}</p>
            </Card>
          ))}
        </div>
      </section>

      <Card className="border-slate-200 bg-slate-50">
        <h2 className="text-2xl font-bold text-slate-900">중요한 안내</h2>
        <p className="mt-4 text-sm leading-7 text-slate-600">
          보조24는 신청 대행 서비스가 아니며, 실제 신청 자격과 일정은 기관 공지에서 최종 확인해야 합니다.
          사이트 안의 요약은 이해를 돕기 위한 보조 정보입니다.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/editorial-policy" className="text-sm font-semibold text-blue-600 hover:text-blue-700">
            운영 원칙 보기 →
          </Link>
          <Link href="/contact" className="text-sm font-semibold text-blue-600 hover:text-blue-700">
            문의하기 →
          </Link>
        </div>
      </Card>
    </main>
  );
}
