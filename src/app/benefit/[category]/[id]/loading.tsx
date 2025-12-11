import { Card } from "@components/ui";

export default function BenefitLoading() {
  return (
    <main className="mx-auto flex max-w-4xl flex-col gap-6 pb-24">
      {/* 네비게이션 스켈레톤 */}
      <div className="flex items-center gap-2 mb-2">
        <div className="h-4 w-12 bg-slate-200 rounded animate-pulse" />
        <div className="h-4 w-4 bg-slate-200 rounded animate-pulse" />
        <div className="h-4 w-20 bg-slate-200 rounded animate-pulse" />
      </div>

      {/* 헤더 카드 스켈레톤 */}
      <div className="rounded-2xl bg-white p-6 sm:p-8 shadow-sm ring-1 ring-slate-200 space-y-4">
        <div className="flex gap-2">
          <div className="h-6 w-16 bg-slate-200 rounded-full animate-pulse" />
          <div className="h-6 w-24 bg-slate-200 rounded-full animate-pulse" />
        </div>
        <div className="h-10 w-3/4 bg-slate-200 rounded animate-pulse" />
        <div className="h-20 w-full bg-slate-100 rounded-xl animate-pulse" />
      </div>

      {/* AI 요약 스켈레톤 */}
      <div className="space-y-4">
        <div className="h-6 w-32 bg-slate-200 rounded animate-pulse" />
        <Card className="bg-blue-50/50 border-blue-100 h-32 animate-pulse">
          <span />
        </Card>
      </div>

      {/* 그리드 스켈레톤 */}
      <div className="grid gap-6 sm:grid-cols-2">
        <div className="space-y-3">
          <div className="h-6 w-24 bg-slate-200 rounded animate-pulse" />
          <Card className="h-40 bg-slate-50 animate-pulse">
            <span />
          </Card>
        </div>
        <div className="space-y-3">
          <div className="h-6 w-24 bg-slate-200 rounded animate-pulse" />
          <Card className="h-40 bg-slate-50 animate-pulse">
            <span />
          </Card>
        </div>
      </div>
    </main>
  );
}
