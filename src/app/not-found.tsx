import Link from "next/link";
import { Button, Card } from "@components/ui";

export default function NotFoundPage() {
  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-6 pb-20 pt-10 text-center">
      <Card className="border-slate-200 bg-white p-8">
        <p className="text-sm font-bold uppercase tracking-[0.25em] text-blue-600">
          404
        </p>
        <h1 className="mt-4 text-3xl font-extrabold text-slate-900">
          페이지를 찾을 수 없습니다
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-slate-600">
          주소가 바뀌었거나 아직 준비되지 않은 페이지입니다. 지원금 목록에서 다시 검색하거나
          사이트 운영 원칙을 확인해 주세요.
        </p>
        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <Link href="/benefit">
            <Button className="w-full sm:w-auto">지원금 다시 찾기</Button>
          </Link>
          <Link href="/">
            <Button variant="outline" className="w-full sm:w-auto">
              홈으로 이동
            </Button>
          </Link>
        </div>
      </Card>
    </main>
  );
}
