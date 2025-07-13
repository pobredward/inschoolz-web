import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "이용약관",
  description: "인스쿨즈 이용약관 페이지입니다.",
};

export default function TermsPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-8 text-center">이용약관</h1>
      
      <div className="space-y-8 text-gray-700">
        <section>
          <h2 className="text-2xl font-semibold mb-4 text-black">제1조 (목적)</h2>
          <p className="leading-relaxed">
            이 약관은 인스쿨즈(이하 "회사")가 제공하는 온라인 서비스(이하 "서비스")의 이용과 관련하여 회사와 이용자 간의 권리, 의무 및 책임사항을 규정함을 목적으로 합니다.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4 text-black">제2조 (정의)</h2>
          <div className="space-y-2">
            <p>1. "서비스"란 회사가 제공하는 인스쿨즈 웹사이트 및 모바일 애플리케이션을 의미합니다.</p>
            <p>2. "이용자"란 회사의 서비스에 접속하여 이 약관에 따라 회사가 제공하는 서비스를 받는 회원 및 비회원을 의미합니다.</p>
            <p>3. "회원"이란 회사에 개인정보를 제공하여 회원등록을 한 자로서, 회사의 정보를 지속적으로 제공받으며, 회사가 제공하는 서비스를 계속적으로 이용할 수 있는 자를 의미합니다.</p>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4 text-black">제3조 (약관의 게시와 개정)</h2>
          <div className="space-y-2">
            <p>1. 회사는 이 약관의 내용을 이용자가 쉽게 알 수 있도록 서비스 초기 화면에 게시합니다.</p>
            <p>2. 회사는 필요하다고 인정되는 경우 이 약관을 개정할 수 있습니다.</p>
            <p>3. 개정된 약관은 제1항과 같은 방법으로 공지 또는 통지함으로써 효력이 발생합니다.</p>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4 text-black">제4조 (서비스의 제공 및 변경)</h2>
          <div className="space-y-2">
            <p>1. 회사는 다음과 같은 업무를 수행합니다:</p>
            <ul className="ml-4 space-y-1">
              <li>• 학교, 지역, 전국 커뮤니티 서비스 제공</li>
              <li>• 게시판 및 댓글 서비스</li>
              <li>• 미니게임 서비스</li>
              <li>• 랭킹 및 경험치 시스템</li>
              <li>• 기타 회사가 정하는 업무</li>
            </ul>
            <p>2. 회사는 서비스의 내용, 품질, 기능 등을 개선하기 위해 필요한 경우 서비스를 변경할 수 있습니다.</p>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4 text-black">제5조 (회원가입)</h2>
          <div className="space-y-2">
            <p>1. 이용자는 회사가 정한 가입 양식에 따라 회원정보를 기입한 후 이 약관에 동의한다는 의사표시를 함으로써 회원가입을 신청합니다.</p>
            <p>2. 회사는 제1항과 같이 회원으로 가입할 것을 신청한 이용자 중 다음 각 호에 해당하지 않는 한 회원으로 등록합니다:</p>
            <ul className="ml-4 space-y-1">
              <li>• 가입신청자가 이 약관에 의하여 이전에 회원자격을 상실한 적이 있는 경우</li>
              <li>• 등록 내용에 허위, 기재누락, 오기가 있는 경우</li>
              <li>• 기타 회원으로 등록하는 것이 회사의 기술상 현저히 지장이 있다고 판단되는 경우</li>
            </ul>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4 text-black">제6조 (이용자의 의무)</h2>
          <div className="space-y-2">
            <p>1. 이용자는 다음 행위를 하여서는 안 됩니다:</p>
            <ul className="ml-4 space-y-1">
              <li>• 신청 또는 변경 시 허위 내용의 등록</li>
              <li>• 타인의 정보 도용</li>
              <li>• 회사가 게시한 정보의 변경</li>
              <li>• 회사가 정한 정보 이외의 정보(컴퓨터 프로그램 등) 등의 송신 또는 게시</li>
              <li>• 회사 기타 제3자의 저작권 등 지적재산권에 대한 침해</li>
              <li>• 회사 기타 제3자의 명예를 손상시키거나 업무를 방해하는 행위</li>
              <li>• 외설 또는 폭력적인 메시지, 화상, 음성, 기타 공서양속에 반하는 정보를 회사에 공개 또는 게시하는 행위</li>
            </ul>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4 text-black">제7조 (서비스 이용의 제한)</h2>
          <div className="space-y-2">
            <p>1. 회사는 이용자가 이 약관의 의무를 위반하거나 서비스의 정상적인 운영을 방해한 경우, 경고, 일시정지, 영구이용정지 등으로 서비스 이용을 단계적으로 제한할 수 있습니다.</p>
            <p>2. 회사는 전항에도 불구하고, 주민등록법을 위반한 명의도용 및 결제도용, 전화번호 도용, 저작권법 및 컴퓨터프로그램보호법을 위반한 불법프로그램의 제공 및 운영방해, 정보통신망법을 위반한 불법통신 및 해킹, 악성프로그램의 배포, 접속권한 초과행위 등과 같이 관련법을 위반한 경우에는 즉시 영구이용정지를 할 수 있습니다.</p>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4 text-black">제8조 (면책조항)</h2>
          <div className="space-y-2">
            <p>1. 회사는 천재지변 또는 이에 준하는 불가항력으로 인하여 서비스를 제공할 수 없는 경우에는 서비스 제공에 관한 책임이 면제됩니다.</p>
            <p>2. 회사는 이용자의 귀책사유로 인한 서비스 이용의 장애에 대하여는 책임을 지지 않습니다.</p>
            <p>3. 회사는 이용자가 서비스를 이용하여 기대하는 수익을 상실한 것에 대하여 책임을 지지 않으며, 그 밖의 서비스를 통하여 얻은 자료로 인한 손해에 관하여 책임을 지지 않습니다.</p>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4 text-black">제9조 (관할법원)</h2>
          <p className="leading-relaxed">
            서비스 이용으로 발생한 분쟁에 대해 소송이 제기되는 경우 회사의 본사 소재지를 관할하는 법원을 전속 관할법원으로 합니다.
          </p>
        </section>

        <div className="mt-12 pt-8 border-t border-gray-200">
          <p className="text-sm text-gray-500">
            본 약관은 2025년 1월 1일부터 시행됩니다.
          </p>
        </div>
      </div>
    </div>
  );
} 