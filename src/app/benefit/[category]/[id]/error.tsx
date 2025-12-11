"use client";

export default function BenefitError({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="space-y-4">
      <h1 className="text-2xl font-bold">문제가 발생했습니다.</h1>
      <p className="text-slate-600">
        잠시 후 다시 시도해주세요. 계속되면 문의 바랍니다.
      </p>
      <pre className="rounded bg-slate-100 p-3 text-xs text-slate-500">
        {error.message}
      </pre>
      <div className="space-x-2">
        <button
          onClick={reset}
          className="rounded bg-blue-600 px-4 py-2 text-sm font-semibold text-white"
        >
          다시 시도
        </button>
        <a
          className="rounded border px-4 py-2 text-sm font-semibold text-slate-700"
          href="/"
        >
          홈으로
        </a>
      </div>
    </main>
  );
}

