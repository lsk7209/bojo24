import { Card } from "@components/ui";

export default function Loading() {
    return (
        <main className="flex flex-col gap-8 pb-12">
            {/* 헤더 스켈레톤 */}
            <div className="flex flex-col gap-4 border-b border-slate-200 pb-6 mb-2">
                <div className="h-4 w-32 bg-slate-200 rounded animate-pulse" />
                <div className="h-10 w-48 bg-slate-200 rounded animate-pulse" />
                <div className="h-6 w-full max-w-2xl bg-slate-200 rounded animate-pulse" />
            </div>

            {/* 검색 바 스켈레톤 */}
            <Card className="h-32 bg-white animate-pulse" />

            {/* 리스트 스켈레톤 */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mt-4">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div
                        key={i}
                        className="h-64 rounded-xl border border-slate-200 bg-white p-5 shadow-sm animate-pulse"
                    >
                        <div className="flex justify-between mb-4">
                            <div className="h-6 w-16 bg-slate-200 rounded-full" />
                            <div className="h-4 w-24 bg-slate-100 rounded" />
                        </div>
                        <div className="h-6 w-full bg-slate-200 rounded mb-2" />
                        <div className="h-6 w-2/3 bg-slate-200 rounded mb-4" />
                        <div className="h-4 w-20 bg-slate-100 rounded" />
                    </div>
                ))}
            </div>
        </main>
    );
}
