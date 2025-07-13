import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "개인정보처리방침",
  description: "인스쿨즈 개인정보처리방침 페이지입니다.",
};

export default function PrivacyPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-8 text-center">개인정보처리방침</h1>
      
      <div className="space-y-8 text-gray-700">
        <section>
          <h2 className="text-2xl font-semibold mb-4 text-black">제1조 (개인정보의 처리목적)</h2>
          <p className="leading-relaxed mb-4">
            인스쿨즈는 다음의 목적을 위하여 개인정보를 처리합니다. 처리하고 있는 개인정보는 다음의 목적 이외의 용도로는 이용되지 않으며, 이용 목적이 변경되는 경우에는 개인정보보호법 제18조에 따라 별도의 동의를 받는 등 필요한 조치를 이행할 예정입니다.
          </p>
          <ul className="space-y-2 ml-4">
            <li>• 회원 가입 및 관리</li>
            <li>• 서비스 제공 및 개선</li>
            <li>• 고객 상담 및 불만처리</li>
            <li>• 커뮤니티 서비스 제공</li>
            <li>• 경험치 및 랭킹 시스템 운영</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4 text-black">제2조 (개인정보의 처리 및 보유기간)</h2>
          <div className="space-y-4">
            <p>1. 인스쿨즈는 법령에 따른 개인정보 보유·이용기간 또는 정보주체로부터 개인정보를 수집 시에 동의받은 개인정보 보유·이용기간 내에서 개인정보를 처리·보유합니다.</p>
            <p>2. 각각의 개인정보 처리 및 보유 기간은 다음과 같습니다:</p>
            <ul className="ml-4 space-y-1">
              <li>• 회원 가입 및 관리: 회원 탈퇴 시까지</li>
              <li>• 서비스 이용 기록: 3년</li>
              <li>• 불만처리 기록: 3년</li>
              <li>• 게시글 및 댓글: 작성자 삭제 또는 회원 탈퇴 시까지</li>
            </ul>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4 text-black">제3조 (개인정보의 제3자 제공)</h2>
          <div className="space-y-2">
            <p>1. 인스쿨즈는 개인정보를 제1조(개인정보의 처리목적)에서 명시한 범위 내에서만 처리하며, 정보주체의 동의, 법률의 특별한 규정 등 개인정보보호법 제17조에 해당하는 경우에만 개인정보를 제3자에게 제공합니다.</p>
            <p>2. 현재 인스쿨즈는 개인정보를 제3자에게 제공하지 않습니다.</p>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4 text-black">제4조 (개인정보처리의 위탁)</h2>
          <div className="space-y-2">
            <p>1. 인스쿨즈는 원활한 개인정보 업무처리를 위하여 다음과 같이 개인정보 처리업무를 위탁하고 있습니다:</p>
            <ul className="ml-4 space-y-1">
              <li>• 위탁받는 자: Google (Firebase)</li>
              <li>• 위탁하는 업무의 내용: 데이터 저장 및 관리</li>
            </ul>
            <p>2. 인스쿨즈는 위탁계약 체결 시 개인정보보호법 제26조에 따라 위탁업무 수행목적 외 개인정보 처리금지, 기술적·관리적 보호조치, 재위탁 제한, 수탁자에 대한 관리·감독, 손해배상 등 책임에 관한 사항을 계약서 등 문서에 명시하고, 수탁자가 개인정보를 안전하게 처리하는지를 감독하고 있습니다.</p>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4 text-black">제5조 (정보주체의 권리·의무 및 행사방법)</h2>
          <div className="space-y-2">
            <p>1. 정보주체는 인스쿨즈에 대해 언제든지 다음 각 호의 개인정보 보호 관련 권리를 행사할 수 있습니다:</p>
            <ul className="ml-4 space-y-1">
              <li>• 개인정보 처리현황 통지요구</li>
              <li>• 개인정보 열람요구</li>
              <li>• 개인정보 정정·삭제요구</li>
              <li>• 개인정보 처리정지요구</li>
            </ul>
            <p>2. 제1항에 따른 권리 행사는 개인정보보호법 시행령 제41조제1항에 따라 서면, 전자우편, 모사전송(FAX) 등을 통하여 하실 수 있으며 인스쿨즈는 이에 대해 지체없이 조치하겠습니다.</p>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4 text-black">제6조 (개인정보의 안전성 확보조치)</h2>
          <div className="space-y-2">
            <p>인스쿨즈는 개인정보보호법 제29조에 따라 다음과 같이 안전성 확보에 필요한 기술적/관리적 및 물리적 조치를 하고 있습니다:</p>
            <ul className="ml-4 space-y-1">
              <li>• 개인정보 취급 직원의 최소화 및 교육</li>
              <li>• 개인정보에 대한 접근 제한</li>
              <li>• 개인정보를 안전하게 저장·전송할 수 있는 암호화 기법 사용</li>
              <li>• 해킹이나 컴퓨터 바이러스 등에 의한 개인정보 유출 및 훼손을 막기 위한 보안시스템 구축</li>
              <li>• 개인정보처리시스템 접속기록의 보관 및 위변조 방지</li>
            </ul>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4 text-black">제7조 (개인정보 자동 수집 장치의 설치·운영 및 거부)</h2>
          <div className="space-y-2">
            <p>1. 인스쿨즈는 이용자에게 개별적인 맞춤서비스를 제공하기 위해 이용정보를 저장하고 수시로 불러오는 '쿠키(cookie)'를 사용합니다.</p>
            <p>2. 쿠키는 웹사이트를 운영하는데 이용되는 서버(http)가 이용자의 컴퓨터 브라우저에게 보내는 소량의 정보이며 이용자들의 PC 컴퓨터내의 하드디스크에 저장되기도 합니다.</p>
            <p>3. 쿠키의 사용 목적: 이용자가 방문한 각 서비스와 웹 사이트들에 대한 방문 및 이용형태, 인기 검색어, 보안접속 여부, 등을 파악하여 이용자에게 최적화된 정보 제공을 위해 사용됩니다.</p>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4 text-black">제8조 (개인정보 보호책임자)</h2>
          <div className="space-y-2">
            <p>1. 인스쿨즈는 개인정보 처리에 관한 업무를 총괄해서 책임지고, 개인정보 처리와 관련한 정보주체의 불만처리 및 피해구제 등을 위하여 아래와 같이 개인정보 보호책임자를 지정하고 있습니다:</p>
            <div className="ml-4 space-y-1">
              <p>• 개인정보 보호책임자: 인스쿨즈 팀</p>
              <p>• 연락처: pobredward@gmail.com</p>
              <p>• 전화번호: 02-1234-5678</p>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4 text-black">제9조 (개인정보 처리방침 변경)</h2>
          <div className="space-y-2">
            <p>1. 이 개인정보처리방침은 시행일로부터 적용되며, 법령 및 방침에 따른 변경내용의 추가, 삭제 및 정정이 있는 경우에는 변경사항의 시행 7일 전부터 공지사항을 통하여 고지할 것입니다.</p>
          </div>
        </section>

        <div className="mt-12 pt-8 border-t border-gray-200">
          <p className="text-sm text-gray-500">
            본 개인정보처리방침은 2025년 1월 1일부터 시행됩니다.
          </p>
        </div>
      </div>
    </div>
  );
} 