import { Metadata } from 'next';

export const metadata: Metadata = {
  title: '이용약관 - 인스쿨즈',
  description: '인스쿨즈 서비스 이용약관을 확인하세요.',
};

export default function TermsPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="prose prose-gray max-w-none">
        <h1 className="text-3xl font-bold mb-8 text-center">인스쿨즈 서비스 이용약관</h1>
        
        <div className="bg-blue-50 p-6 rounded-lg mb-8">
          <p className="text-sm text-gray-600 mb-2">
            <strong>시행일자:</strong> 2025년 7월 21일
          </p>
          <p className="text-sm text-gray-600">
            <strong>최종 수정일:</strong> 2024년 12월 13일
          </p>
        </div>

        <div className="space-y-8">
          <section>
            <h2 className="text-2xl font-bold mb-4">제1조 (목적)</h2>
            <div className="bg-gray-50 p-6 rounded-lg">
              <p>이 약관은 온마인드랩(사업자등록번호: 166-22-02407)이 운영하는 인스쿨즈(이하 "서비스")의 이용과 관련하여 회사와 이용자간의 권리, 의무 및 책임사항, 기타 필요한 사항을 규정함을 목적으로 합니다.</p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">제2조 (정의)</h2>
            <div className="bg-gray-50 p-6 rounded-lg">
              <p className="mb-4">이 약관에서 사용하는 용어의 정의는 다음과 같습니다.</p>
              <ol className="list-decimal ml-6 space-y-3">
                <li><strong>"서비스"</strong>란 온마인드랩이 제공하는 학교 커뮤니티 플랫폼 "인스쿨즈"를 의미합니다.</li>
                <li><strong>"이용자"</strong>란 이 약관에 따라 회사가 제공하는 서비스를 받는 회원 및 비회원을 말합니다.</li>
                <li><strong>"회원"</strong>이란 서비스에 개인정보를 제공하여 회원등록을 한 자로서, 서비스의 정보를 지속적으로 제공받으며, 서비스를 계속적으로 이용할 수 있는 자를 의미합니다.</li>
                <li><strong>"비회원"</strong>이란 회원에 가입하지 않고 서비스를 이용하는 자를 의미합니다.</li>
                <li><strong>"게시물"</strong>이란 회원이 서비스를 이용함에 있어 게시한 글, 사진, 동영상 및 각종 파일과 링크 등을 의미합니다.</li>
              </ol>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">제3조 (약관의 효력 및 변경)</h2>
            <div className="bg-gray-50 p-6 rounded-lg">
              <ol className="list-decimal ml-6 space-y-3">
                <li>이 약관은 서비스를 이용하고자 하는 모든 이용자에 대하여 그 효력을 발생합니다.</li>
                <li>회사는 필요하다고 인정되는 경우 이 약관을 변경할 수 있으며, 회사가 약관을 변경할 경우에는 적용일자 및 변경사유를 명시하여 현행약관과 함께 그 적용일자 7일 이전부터 적용일자 전일까지 공지합니다.</li>
                <li>이용자가 변경된 약관에 동의하지 않을 경우, 이용자는 본인의 회원등록을 취소(회원탈퇴)할 수 있으며, 계속 사용하시는 경우에는 약관 변경에 대한 동의로 간주됩니다.</li>
              </ol>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">제4조 (회원가입)</h2>
            <div className="bg-gray-50 p-6 rounded-lg">
              <ol className="list-decimal ml-6 space-y-3">
                <li>이용자가 회원가입을 하고자 하는 경우 다음 각 호의 사항을 회사에서 정한 가입양식에 따라 기재하여 가입을 신청합니다.
                  <ul className="list-disc ml-6 mt-2 space-y-1">
                    <li>이메일 주소</li>
                    <li>비밀번호</li>
                    <li>사용자명(아이디)</li>
                    <li>실명</li>
                    <li>성별</li>
                    <li>생년월일 (선택사항)</li>
                    <li>휴대폰 번호</li>
                    <li>학교 정보</li>
                    <li>지역 정보</li>
                  </ul>
                </li>
                <li>회사는 다음 각 호에 해당하는 가입신청에 대하여는 가입을 거절하거나 사후에 이용계약을 해지할 수 있습니다.
                  <ul className="list-disc ml-6 mt-2 space-y-1">
                    <li>가입신청자가 이 약관에 의하여 이전에 회원자격을 상실한 적이 있는 경우</li>
                    <li>실명이 아니거나 타인의 명의를 이용한 경우</li>
                    <li>허위의 정보를 기재하거나, 회사가 제시하는 내용을 기재하지 않은 경우</li>
                    <li>만 14세 미만의 아동이 법정대리인의 동의를 얻지 아니한 경우</li>
                    <li>이용자의 귀책사유로 인하여 승인이 불가능하거나 기타 규정한 제반 사항을 위반하며 신청하는 경우</li>
                  </ul>
                </li>
              </ol>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">제5조 (서비스의 제공 및 변경)</h2>
            <div className="bg-gray-50 p-6 rounded-lg">
              <ol className="list-decimal ml-6 space-y-3">
                <li>회사는 회원에게 아래와 같은 서비스를 제공합니다.
                  <ul className="list-disc ml-6 mt-2 space-y-1">
                    <li>학교별 커뮤니티 서비스</li>
                    <li>지역별 커뮤니티 서비스</li>
                    <li>게시판 및 댓글 서비스</li>
                    <li>학교 인증 서비스</li>
                    <li>경험치 및 랭킹 시스템</li>
                    <li>게임 서비스</li>
                    <li>기타 회사가 추가 개발하거나 다른 회사와의 제휴계약 등을 통해 회원에게 제공하는 일체의 서비스</li>
                  </ul>
                </li>
                <li>회사는 운영상, 기술상의 필요에 따라 제공하고 있는 전부 또는 일부 서비스를 변경할 수 있습니다.</li>
                <li>회사는 무료로 제공되는 서비스의 일부 또는 전부를 회사의 정책 및 운영의 필요상 수정, 중단, 변경할 수 있으며, 이에 대하여 관련법에 특별한 규정이 없는 한 회원에게 별도의 보상을 하지 않습니다.</li>
              </ol>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">제6조 (서비스의 중단)</h2>
            <div className="bg-gray-50 p-6 rounded-lg">
              <ol className="list-decimal ml-6 space-y-3">
                <li>회사는 컴퓨터 등 정보통신설비의 보수점검·교체 및 고장, 통신의 두절 등의 사유가 발생한 경우에는 서비스의 제공을 일시적으로 중단할 수 있습니다.</li>
                <li>회사는 제1항의 사유로 서비스의 제공이 일시적으로 중단됨으로 인하여 이용자 또는 제3자가 입은 손해에 대하여 배상합니다. 단, 회사가 고의 또는 과실이 없음을 입증하는 경우에는 그러하지 아니합니다.</li>
                <li>사업종목의 전환, 사업의 포기, 업체 간의 통합 등의 이유로 서비스를 제공할 수 없게 되는 경우에는 회사는 제8조에 정한 방법으로 이용자에게 통지하고 당초 회사에서 제시한 조건에 따라 소비자에게 보상합니다.</li>
              </ol>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">제7조 (회원탈퇴 및 자격 상실 등)</h2>
            <div className="bg-gray-50 p-6 rounded-lg">
              <ol className="list-decimal ml-6 space-y-3">
                <li>회원은 언제든지 서비스 내 계정 설정을 통하여 이용계약 해지 신청을 할 수 있으며, 회사는 관련법 등이 정하는 바에 따라 이를 즉시 처리하여야 합니다.</li>
                <li>회원이 다음 각 호의 사유에 해당하는 경우, 회사는 회원자격을 제한 및 정지시킬 수 있습니다.
                  <ul className="list-disc ml-6 mt-2 space-y-1">
                    <li>가입 신청 시에 허위 내용을 등록한 경우</li>
                    <li>다른 사람의 서비스 이용을 방해하거나 그 정보를 도용하는 등 전자상거래 질서를 위협하는 경우</li>
                    <li>서비스를 이용하여 법령 또는 이 약관이 금지하거나 공서양속에 반하는 행위를 하는 경우</li>
                  </ul>
                </li>
                <li>회사가 회원 자격을 제한·정지 시킨 후, 동일한 행위가 2회 이상 반복되거나 30일 이내에 그 사유가 시정되지 아니하는 경우 회사는 회원자격을 상실시킬 수 있습니다.</li>
                <li>회사가 회원자격을 상실시키는 경우에는 회원등록을 말소합니다. 이 경우 회원에게 이를 통지하고, 회원등록 말소 전에 최소한 30일 이상의 기간을 정하여 소명할 기회를 부여합니다.</li>
              </ol>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">제8조 (회원에 대한 통지)</h2>
            <div className="bg-gray-50 p-6 rounded-lg">
              <ol className="list-decimal ml-6 space-y-3">
                <li>회사가 회원에 대한 통지를 하는 경우, 회원이 회사와 미리 약정하여 지정한 전자우편 주소로 할 수 있습니다.</li>
                <li>회사는 불특정다수 회원에 대한 통지의 경우 1주일이상 서비스 공지사항에 게시함으로써 개별 통지에 갈음할 수 있습니다. 다만, 회원 본인의 거래와 관련하여 중대한 영향을 미치는 사항에 대하여는 개별통지를 합니다.</li>
              </ol>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">제9조 (개인정보보호)</h2>
            <div className="bg-gray-50 p-6 rounded-lg">
              <ol className="list-decimal ml-6 space-y-3">
                <li>회사는 이용자의 개인정보 수집시 서비스제공을 위하여 필요한 범위에서 최소한의 개인정보를 수집합니다.</li>
                <li>회사는 회원가입시 구매계약이행에 필요한 정보를 미리 수집하지 않습니다. 다만, 관련 법령상 의무이행을 위하여 구매계약 이전에 본인확인이 필요한 경우로서 최소한의 특정 개인정보를 수집하는 경우에는 그러하지 아니합니다.</li>
                <li>회사는 이용자의 개인정보를 수집·이용하는 때에는 당해 이용자에게 그 목적을 고지하고 동의를 받습니다.</li>
                <li>회사는 수집된 개인정보를 목적외의 용도로 이용할 수 없으며, 새로운 이용목적이 발생한 경우 또는 제3자에게 제공하는 경우에는 이용·제공단계에서 당해 이용자에게 그 목적을 고지하고 동의를 받습니다.</li>
                <li>회사가 제2항과 제3항에 의해 이용자의 동의를 받아야 하는 경우에는 개인정보관리 책임자의 신원, 정보의 수집목적 및 이용목적, 제3자에 대한 정보제공 관련사항 등 「정보통신망 이용촉진 및 정보보호 등에 관한 법률」 제22조제2항이 규정한 사항을 미리 명시하거나 고지해야 하며 이용자는 언제든지 이 동의를 철회할 수 있습니다.</li>
                <li>이용자는 언제든지 회사가 가지고 있는 자신의 개인정보에 대해 열람 및 오류정정을 요구할 수 있으며 회사는 이에 대해 지체 없이 필요한 조치를 취할 의무를 집니다.</li>
              </ol>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">제10조 (회사의 의무)</h2>
            <div className="bg-gray-50 p-6 rounded-lg">
              <ol className="list-decimal ml-6 space-y-3">
                <li>회사는 법령과 이 약관이 금지하거나 공서양속에 반하는 행위를 하지 않으며 이 약관이 정하는 바에 따라 지속적이고, 안정적으로 서비스를 제공하는데 최선을 다하여야 합니다.</li>
                <li>회사는 이용자가 안전하게 인터넷 서비스를 이용할 수 있도록 이용자의 개인정보보호를 위한 보안 시스템을 구축하여야 합니다.</li>
                <li>회사는 서비스이용과 관련하여 이용자로부터 제기된 의견이나 불만이 정당하다고 객관적으로 인정될 경우에는 적절한 절차를 거쳐 즉시 처리하여야 합니다.</li>
              </ol>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">제11조 (회원의 의무)</h2>
            <div className="bg-gray-50 p-6 rounded-lg">
              <ol className="list-decimal ml-6 space-y-3">
                <li>이용자는 다음 행위를 하여서는 안 됩니다.
                  <ul className="list-disc ml-6 mt-2 space-y-1">
                    <li>신청 또는 변경시 허위 내용의 등록</li>
                    <li>타인의 정보 도용</li>
                    <li>회사가 게시한 정보의 변경</li>
                    <li>회사가 정한 정보 이외의 정보(컴퓨터 프로그램 등) 등의 송신 또는 게시</li>
                    <li>회사 기타 제3자의 저작권 등 지적재산권에 대한 침해</li>
                    <li>회사 기타 제3자의 명예를 손상시키거나 업무를 방해하는 행위</li>
                    <li>외설 또는 폭력적인 메시지, 화상, 음성, 기타 공서양속에 반하는 정보를 서비스에 공개 또는 게시하는 행위</li>
                    <li>회사의 동의 없이 영리를 목적으로 서비스를 사용하는 행위</li>
                    <li>기타 불법적이거나 부당한 행위</li>
                  </ul>
                </li>
                <li>회원은 관계법령, 이 약관의 규정, 이용안내 및 서비스상에 공지한 주의사항, 회사가 통지하는 사항 등을 준수하여야 하며, 기타 회사의 업무에 방해되는 행위를 하여서는 아니 됩니다.</li>
              </ol>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">제12조 (저작권의 귀속 및 이용제한)</h2>
            <div className="bg-gray-50 p-6 rounded-lg">
              <ol className="list-decimal ml-6 space-y-3">
                <li>회사가 작성한 저작물에 대한 저작권 기타 지적재산권은 회사에 귀속합니다.</li>
                <li>이용자는 서비스를 이용함으로써 얻은 정보 중 회사에게 지적재산권이 귀속된 정보를 회사의 사전 승낙 없이 복제, 송신, 출판, 배포, 방송 기타 방법에 의하여 영리목적으로 이용하거나 제3자에게 이용하게 하여서는 안됩니다.</li>
                <li>회사는 약정에 따라 이용자에게 귀속된 저작권을 사용하는 경우 당해 이용자에게 통보하여야 합니다.</li>
              </ol>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">제13조 (분쟁해결)</h2>
            <div className="bg-gray-50 p-6 rounded-lg">
              <ol className="list-decimal ml-6 space-y-3">
                <li>회사는 이용자가 제기하는 정당한 의견이나 불만을 반영하고 그 피해를 보상처리하기 위하여 피해보상처리기구를 설치·운영합니다.</li>
                <li>회사는 이용자로부터 제출되는 불만사항 및 의견은 우선적으로 그 사항을 처리합니다. 다만, 신속한 처리가 곤란한 경우에는 이용자에게 그 사유와 처리일정을 즉시 통보해 드립니다.</li>
                <li>회사와 이용자 간에 발생한 전자상거래 분쟁과 관련하여 이용자의 피해구제신청이 있는 경우에는 공정거래위원회 또는 시·도지사가 의뢰하는 분쟁조정기관의 조정에 따를 수 있습니다.</li>
              </ol>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">제14조 (재판권 및 준거법)</h2>
            <div className="bg-gray-50 p-6 rounded-lg">
              <ol className="list-decimal ml-6 space-y-3">
                <li>회사와 이용자 간에 발생한 전자상거래 분쟁에 관한 소송은 제소 당시의 이용자의 주소에 의하고, 주소가 없는 경우에는 거소를 관할하는 지방법원의 전속관할로 합니다. 다만, 제소 당시 이용자의 주소 또는 거소가 분명하지 않거나 외국 거주자의 경우에는 민사소송법상의 관할법원에 제기합니다.</li>
                <li>회사와 이용자 간에 제기된 전자상거래 소송에는 한국법을 적용합니다.</li>
              </ol>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4">부칙</h2>
            <div className="bg-gray-50 p-6 rounded-lg">
              <p>이 약관은 2025년 7월 21일부터 시행됩니다.</p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
} 