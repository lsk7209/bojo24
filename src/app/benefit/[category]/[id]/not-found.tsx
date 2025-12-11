export default function BenefitNotFound() {
  return (
    <main className="space-y-3">
      <h1 className="text-2xl font-bold">데이터를 찾을 수 없습니다.</h1>
      <p className="text-slate-600">
        잘못된 주소이거나 데이터가 아직 준비되지 않았습니다. 잠시 후 다시
        시도하거나 홈에서 다른 서비스를 찾아보세요.
      </p>
      <a
        className="inline-flex rounded bg-blue-600 px-4 py-2 text-sm font-semibold text-white"
        href="/"
      >
        홈으로 이동
      </a>
    </main>
  );
}

