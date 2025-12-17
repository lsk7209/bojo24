import type { Metadata } from "next";
import { Card } from "@components/ui";
import Link from "next/link";

export const metadata: Metadata = {
  title: "개인정보처리방침",
  description: "보조24 개인정보처리방침입니다.",
  robots: {
    index: true,
    follow: true
  }
};

export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-4xl pb-16">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-4">개인정보처리방침</h1>
        <p className="text-slate-600">
          보조24는 개인정보보호법에 따라 이용자의 개인정보 보호 및 권익을 보호하고자 다음과 같은 처리방침을 두고 있습니다.
        </p>
        <p className="text-sm text-slate-500 mt-2">
          최종 수정일: 2025년 1월 27일
        </p>
      </div>

      <div className="space-y-8">
        <Card>
          <h2 className="text-xl font-bold text-slate-900 mb-4">1. 개인정보의 처리 목적</h2>
          <div className="space-y-3 text-slate-700 leading-relaxed">
            <p>
              보조24는 다음의 목적을 위하여 개인정보를 처리합니다. 처리하고 있는 개인정보는 다음의 목적 이외의 용도로는 이용되지 않으며, 
              이용 목적이 변경되는 경우에는 개인정보보호법 제18조에 따라 별도의 동의를 받는 등 필요한 조치를 이행할 예정입니다.
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li><strong>서비스 제공:</strong> 보조금 정보 검색, 상세 정보 제공, AI 요약 서비스</li>
              <li><strong>서비스 개선:</strong> 사용자 경험 개선, 서비스 품질 향상</li>
              <li><strong>통계 및 분석:</strong> 서비스 이용 통계, 트래픽 분석 (익명화된 데이터)</li>
            </ul>
          </div>
        </Card>

        <Card>
          <h2 className="text-xl font-bold text-slate-900 mb-4">2. 개인정보의 처리 및 보유기간</h2>
          <div className="space-y-3 text-slate-700 leading-relaxed">
            <p>
              보조24는 법령에 따른 개인정보 보유·이용기간 또는 정보주체로부터 개인정보를 수집 시에 동의받은 개인정보 보유·이용기간 내에서 개인정보를 처리·보유합니다.
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li><strong>서비스 이용 기록:</strong> 3년 (통신비밀보호법)</li>
              <li><strong>방문자 로그:</strong> 1년 (익명화된 IP 주소)</li>
            </ul>
          </div>
        </Card>

        <Card>
          <h2 className="text-xl font-bold text-slate-900 mb-4">3. 처리하는 개인정보의 항목</h2>
          <div className="space-y-3 text-slate-700 leading-relaxed">
            <p>보조24는 다음의 개인정보 항목을 처리하고 있습니다:</p>
            <div className="bg-slate-50 p-4 rounded-lg">
              <h3 className="font-semibold mb-2">자동 수집 항목</h3>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li>IP 주소 (익명화 처리)</li>
                <li>접속 로그</li>
                <li>쿠키 (선택적)</li>
                <li>브라우저 정보</li>
                <li>기기 정보</li>
              </ul>
            </div>
            <p className="text-sm text-slate-600">
              ※ 보조24는 회원가입을 요구하지 않으며, 개인 식별이 가능한 정보는 수집하지 않습니다.
            </p>
          </div>
        </Card>

        <Card>
          <h2 className="text-xl font-bold text-slate-900 mb-4">4. 개인정보의 제3자 제공</h2>
          <div className="space-y-3 text-slate-700 leading-relaxed">
            <p>
              보조24는 원칙적으로 이용자의 개인정보를 외부에 제공하지 않습니다. 다만, 다음의 경우에는 예외로 합니다:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>이용자가 사전에 동의한 경우</li>
              <li>법령의 규정에 의거하거나, 수사 목적으로 법령에 정해진 절차와 방법에 따라 수사기관의 요구가 있는 경우</li>
            </ul>
          </div>
        </Card>

        <Card>
          <h2 className="text-xl font-bold text-slate-900 mb-4">5. 개인정보처리의 위탁</h2>
          <div className="space-y-3 text-slate-700 leading-relaxed">
            <p>보조24는 원활한 개인정보 업무처리를 위하여 다음과 같이 개인정보 처리업무를 위탁하고 있습니다:</p>
            <div className="bg-slate-50 p-4 rounded-lg">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">수탁업체</th>
                    <th className="text-left p-2">위탁업무 내용</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b">
                    <td className="p-2">Google (Google Analytics, AdSense)</td>
                    <td className="p-2">서비스 이용 통계, 광고 서비스</td>
                  </tr>
                  <tr className="border-b">
                    <td className="p-2">Vercel</td>
                    <td className="p-2">웹사이트 호스팅</td>
                  </tr>
                  <tr>
                    <td className="p-2">Supabase</td>
                    <td className="p-2">데이터베이스 서비스</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </Card>

        <Card>
          <h2 className="text-xl font-bold text-slate-900 mb-4">6. 정보주체의 권리·의무 및 행사방법</h2>
          <div className="space-y-3 text-slate-700 leading-relaxed">
            <p>이용자는 개인정보주체로서 다음과 같은 권리를 행사할 수 있습니다:</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>개인정보 열람 요구</li>
              <li>개인정보 정정·삭제 요구</li>
              <li>개인정보 처리정지 요구</li>
            </ul>
            <p className="text-sm text-slate-600 mt-4">
              권리 행사는 개인정보보호법 시행령 제41조 제1항에 따라 서면, 전자우편, 모사전송(FAX) 등을 통하여 하실 수 있으며, 
              보조24는 이에 대해 지체 없이 조치하겠습니다.
            </p>
          </div>
        </Card>

        <Card>
          <h2 className="text-xl font-bold text-slate-900 mb-4">7. 개인정보의 파기</h2>
          <div className="space-y-3 text-slate-700 leading-relaxed">
            <p>
              보조24는 개인정보 보유기간의 경과, 처리목적 달성 등 개인정보가 불필요하게 되었을 때에는 지체없이 해당 개인정보를 파기합니다.
            </p>
            <p className="text-sm text-slate-600">
              파기의 절차 및 방법은 다음과 같습니다:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li><strong>파기절차:</strong> 불필요한 개인정보는 내부 방침 및 기타 관련 법령에 따라 파기</li>
              <li><strong>파기방법:</strong> 전자적 파일 형태의 정보는 기록을 재생할 수 없는 기술적 방법을 사용하여 삭제</li>
            </ul>
          </div>
        </Card>

        <Card>
          <h2 className="text-xl font-bold text-slate-900 mb-4">8. 개인정보 보호책임자</h2>
          <div className="space-y-3 text-slate-700 leading-relaxed">
            <p>보조24는 개인정보 처리에 관한 업무를 총괄해서 책임지고, 개인정보 처리와 관련한 정보주체의 불만처리 및 피해구제 등을 위하여 아래와 같이 개인정보 보호책임자를 지정하고 있습니다.</p>
            <div className="bg-slate-50 p-4 rounded-lg">
              <p><strong>개인정보 보호책임자</strong></p>
              <p className="text-sm mt-2">이메일: contact@bojo24.kr</p>
            </div>
          </div>
        </Card>

        <Card>
          <h2 className="text-xl font-bold text-slate-900 mb-4">9. 개인정보 처리방침 변경</h2>
          <div className="space-y-3 text-slate-700 leading-relaxed">
            <p>
              이 개인정보처리방침은 2025년 1월 27일부터 적용되며, 법령 및 방침에 따른 변경내용의 추가, 삭제 및 정정이 있는 경우에는 
              변경사항의 시행 7일 전부터 공지사항을 통하여 고지할 것입니다.
            </p>
          </div>
        </Card>
      </div>

      <div className="mt-12 pt-8 border-t border-slate-200">
        <Link 
          href="/"
          className="text-blue-600 hover:text-blue-700 font-medium"
        >
          ← 홈으로 돌아가기
        </Link>
      </div>
    </main>
  );
}

