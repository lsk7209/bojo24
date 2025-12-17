import type { Metadata } from "next";
import { Card } from "@components/ui";
import Link from "next/link";

export const metadata: Metadata = {
  title: "이용약관",
  description: "보조24 이용약관입니다.",
  robots: {
    index: true,
    follow: true
  }
};

export default function TermsPage() {
  return (
    <main className="mx-auto max-w-4xl pb-16">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-4">이용약관</h1>
        <p className="text-slate-600">
          보조24 서비스를 이용해 주셔서 감사합니다. 본 약관은 보조24 서비스 이용과 관련된 권리, 의무 및 책임사항을 규정함을 목적으로 합니다.
        </p>
        <p className="text-sm text-slate-500 mt-2">
          최종 수정일: 2025년 1월 27일
        </p>
      </div>

      <div className="space-y-8">
        <Card>
          <h2 className="text-xl font-bold text-slate-900 mb-4">제1조 (목적)</h2>
          <div className="space-y-3 text-slate-700 leading-relaxed">
            <p>
              본 약관은 보조24(이하 &quot;회사&quot;)가 제공하는 보조금 정보 검색 및 제공 서비스(이하 &quot;서비스&quot;)의 이용과 관련하여 
              회사와 이용자 간의 권리, 의무 및 책임사항, 기타 필요한 사항을 규정함을 목적으로 합니다.
            </p>
          </div>
        </Card>

        <Card>
          <h2 className="text-xl font-bold text-slate-900 mb-4">제2조 (정의)</h2>
          <div className="space-y-3 text-slate-700 leading-relaxed">
            <p>본 약관에서 사용하는 용어의 정의는 다음과 같습니다:</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li><strong>&quot;서비스&quot;</strong>란 회사가 제공하는 보조금 정보 검색, 상세 정보 제공, AI 요약 서비스를 의미합니다.</li>
              <li><strong>&quot;이용자&quot;</strong>란 본 약관에 따라 회사가 제공하는 서비스를 받는 자를 의미합니다.</li>
              <li><strong>&quot;콘텐츠&quot;</strong>란 서비스를 통해 제공되는 정보, 데이터, 텍스트, 이미지 등을 의미합니다.</li>
            </ul>
          </div>
        </Card>

        <Card>
          <h2 className="text-xl font-bold text-slate-900 mb-4">제3조 (약관의 게시와 개정)</h2>
          <div className="space-y-3 text-slate-700 leading-relaxed">
            <p>
              회사는 본 약관의 내용을 이용자가 쉽게 알 수 있도록 서비스 초기 화면에 게시합니다. 
              회사는 필요한 경우 관련 법령을 위배하지 않는 범위에서 본 약관을 개정할 수 있습니다.
            </p>
            <p className="text-sm text-slate-600">
              약관이 개정되는 경우 회사는 개정된 약관의 내용과 시행일을 명시하여 현행약관과 함께 서비스의 초기 화면에 그 시행일 7일 이전부터 시행일 후 상당한 기간 동안 공지합니다.
            </p>
          </div>
        </Card>

        <Card>
          <h2 className="text-xl font-bold text-slate-900 mb-4">제4조 (서비스의 제공 및 변경)</h2>
          <div className="space-y-3 text-slate-700 leading-relaxed">
            <p>회사는 다음과 같은 서비스를 제공합니다:</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>행정안전부 보조24 공공데이터 기반 보조금 정보 검색 서비스</li>
              <li>보조금 상세 정보 제공 서비스</li>
              <li>AI 기반 보조금 요약 및 FAQ 제공 서비스</li>
              <li>기타 회사가 추가 개발하거나 제휴계약 등을 통해 제공하는 일체의 서비스</li>
            </ul>
            <p className="text-sm text-slate-600 mt-4">
              회사는 서비스의 내용을 변경할 수 있으며, 변경 시에는 사전에 공지합니다.
            </p>
          </div>
        </Card>

        <Card>
          <h2 className="text-xl font-bold text-slate-900 mb-4">제5조 (서비스의 중단)</h2>
          <div className="space-y-3 text-slate-700 leading-relaxed">
            <p>
              회사는 컴퓨터 등 정보통신설비의 보수점검, 교체 및 고장, 통신의 두절 등의 사유가 발생한 경우에는 
              서비스의 제공을 일시적으로 중단할 수 있습니다.
            </p>
            <p className="text-sm text-slate-600">
              회사는 제1항의 사유로 서비스의 제공이 일시적으로 중단됨으로 인하여 이용자 또는 제3자가 입은 손해에 대하여 배상합니다. 
              단, 회사가 고의 또는 과실이 없음을 입증하는 경우에는 그러하지 아니합니다.
            </p>
          </div>
        </Card>

        <Card>
          <h2 className="text-xl font-bold text-slate-900 mb-4">제6조 (이용자의 의무)</h2>
          <div className="space-y-3 text-slate-700 leading-relaxed">
            <p>이용자는 다음 행위를 하여서는 안 됩니다:</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>신청 또는 변경 시 허위내용의 등록</li>
              <li>타인의 정보 도용</li>
              <li>회사가 게시한 정보의 변경</li>
              <li>회사가 정한 정보 이외의 정보(컴퓨터 프로그램 등) 등의 송신 또는 게시</li>
              <li>회사와 기타 제3자의 저작권 등 지적재산권에 대한 침해</li>
              <li>회사 및 기타 제3자의 명예를 손상시키거나 업무를 방해하는 행위</li>
              <li>외설 또는 폭력적인 메시지, 화상, 음성, 기타 공서양속에 반하는 정보를 공개 또는 게시하는 행위</li>
            </ul>
          </div>
        </Card>

        <Card>
          <h2 className="text-xl font-bold text-slate-900 mb-4">제7조 (콘텐츠의 저작권)</h2>
          <div className="space-y-3 text-slate-700 leading-relaxed">
            <p>
              회사가 작성한 저작물에 대한 저작권 기타 지적재산권은 회사에 귀속합니다.
            </p>
            <p>
              이용자는 회사를 이용함으로써 얻은 정보 중 회사에게 지적재산권이 귀속된 정보를 회사의 사전 승낙 없이 
              복제, 송신, 출판, 배포, 방송 기타 방법에 의하여 영리목적으로 이용하거나 제3자에게 이용하게 하여서는 안됩니다.
            </p>
            <p className="text-sm text-slate-600">
              본 서비스에서 제공하는 보조금 정보는 행정안전부 보조24 공공데이터를 기반으로 하며, 
              정확한 정보는 해당 기관의 공식 웹사이트를 통해 확인하시기 바랍니다.
            </p>
          </div>
        </Card>

        <Card>
          <h2 className="text-xl font-bold text-slate-900 mb-4">제8조 (면책조항)</h2>
          <div className="space-y-3 text-slate-700 leading-relaxed">
            <p>
              회사는 천재지변 또는 이에 준하는 불가항력으로 인하여 서비스를 제공할 수 없는 경우에는 서비스 제공에 관한 책임이 면제됩니다.
            </p>
            <p>
              회사는 이용자의 귀책사유로 인한 서비스 이용의 장애에 대하여는 책임을 지지 않습니다.
            </p>
            <p>
              회사는 이용자가 서비스를 이용하여 기대하는 수익을 상실한 것에 대하여 책임을 지지 않으며, 
              그 밖의 서비스를 통하여 얻은 자료로 인한 손해에 관하여 책임을 지지 않습니다.
            </p>
            <p className="text-sm text-slate-600">
              회사는 이용자가 서비스에 게재한 정보, 자료, 사실의 신뢰도, 정확성 등의 내용에 관하여는 책임을 지지 않습니다.
            </p>
          </div>
        </Card>

        <Card>
          <h2 className="text-xl font-bold text-slate-900 mb-4">제9조 (준거법 및 관할법원)</h2>
          <div className="space-y-3 text-slate-700 leading-relaxed">
            <p>
              회사와 이용자 간에 발생한 전자상거래 분쟁에 관한 소송은 제소 당시의 이용자의 주소에 의하고, 
              주소가 없는 경우에는 거소를 관할하는 지방법원의 전속관할로 합니다.
            </p>
            <p>
              회사와 이용자 간에 발생한 전자상거래 분쟁에 관한 소송에는 대한민국 법을 적용합니다.
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

