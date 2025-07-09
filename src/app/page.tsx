'use client';

import Link from 'next/link';
import {
  ArrowRightIcon,
  TrendingUpIcon,
  GamepadIcon,
  MessageCircleIcon,
  StarIcon,
  ShieldIcon
} from 'lucide-react';
import { useAuth } from '@/providers/AuthProvider';

export default function Home() {
  const { isAdmin } = useAuth();

  return (
    <main className="flex min-h-screen flex-col">
      {/* 헤더는 layout.tsx에서 전역적으로 제공됨 */}
      
      <div className="container mx-auto mt-6">
        {/* 관리자 대시보드 바로가기 버튼 */}
        {isAdmin && (
          <div className="mb-4">
            <Link 
              href="/admin" 
              className="w-full bg-amber-500 hover:bg-amber-600 text-white py-3 px-4 rounded-md flex items-center justify-center gap-2 font-medium transition-colors"
            >
              <ShieldIcon className="h-5 w-5" />
              관리자 대시보드 바로가기
            </Link>
          </div>
        )}

        {/* 히어로 섹션 */}
        <section className="bg-gradient-to-r from-green-400 to-emerald-500 rounded-lg p-8 text-white mb-8">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="mb-6 md:mb-0">
              <h1 className="text-3xl font-bold mb-2">학생들을 위한 소통 공간, 인스쿨즈</h1>
              <p className="text-white/90">
                실시간 접속자 수: <span className="font-bold">1,234</span> • 
                오늘 작성된 게시글: <span className="font-bold">587</span>
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link 
                href="/attendance" 
                className="bg-white text-green-600 px-4 py-2 rounded-md font-medium flex items-center gap-2 hover:bg-green-50 transition-colors"
              >
                <TrendingUpIcon className="h-4 w-4" />
                출석체크
              </Link>
              <Link 
                href="/games" 
                className="bg-white text-green-600 px-4 py-2 rounded-md font-medium flex items-center gap-2 hover:bg-green-50 transition-colors"
              >
                <GamepadIcon className="h-4 w-4" />
                게임하기
              </Link>
              <Link 
                href="/schools/myschool/chat" 
                className="bg-white text-green-600 px-4 py-2 rounded-md font-medium flex items-center gap-2 hover:bg-green-50 transition-colors"
              >
                <MessageCircleIcon className="h-4 w-4" />
                내 학교 채팅
              </Link>
            </div>
          </div>
        </section>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-2 space-y-8">
            {/* 실시간 인기글 섹션 */}
            <section className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">실시간 인기글</h2>
                <div className="flex gap-2">
                  <button className="px-3 py-1 text-sm rounded-full bg-green-50 text-green-600">전체</button>
                  <button className="px-3 py-1 text-sm rounded-full hover:bg-gray-100">전국</button>
                  <button className="px-3 py-1 text-sm rounded-full hover:bg-gray-100">지역</button>
                  <button className="px-3 py-1 text-sm rounded-full hover:bg-gray-100">내 학교</button>
                </div>
              </div>
              <div className="space-y-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="p-4 border rounded-md hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-500">전국게시판</span>
                      <div className="flex items-center text-sm text-gray-500">
                        <span>좋아요 {i + 15}</span>
                        <span className="mx-2">•</span>
                        <span>댓글 {i + 8}</span>
                      </div>
                    </div>
                    <h3 className="font-medium mb-1">실시간 인기 게시글 제목 {i + 1}</h3>
                    <p className="text-sm text-gray-700 line-clamp-2">
                      게시글 내용이 여기에 표시됩니다. 최대 2줄까지 표시되며 그 이상은 말줄임표로 처리됩니다.
                    </p>
                  </div>
                ))}
                <div className="text-center mt-4">
                  <Link 
                    href="/boards/popular" 
                    className="text-green-600 text-sm hover:underline flex items-center justify-center gap-1"
                  >
                    더 많은 인기글 보기
                    <ArrowRightIcon className="h-3 w-3" />
                  </Link>
                </div>
              </div>
            </section>

            {/* 커뮤니티 하이라이트 섹션 */}
            <section className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">커뮤니티 하이라이트</h2>
                <div className="flex gap-2">
                  <button className="px-3 py-1 text-sm rounded-full bg-green-50 text-green-600">최신 게시판</button>
                  <button className="px-3 py-1 text-sm rounded-full hover:bg-gray-100">인기 토픽</button>
                  <button className="px-3 py-1 text-sm rounded-full hover:bg-gray-100">이벤트</button>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="p-4 border rounded-md hover:bg-gray-50 transition-colors">
                    <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full mb-2 inline-block">
                      {['자유', '정보', '질문', '일상'][i % 4]}
                    </span>
                    <h3 className="font-medium mb-1 line-clamp-1">최신 게시판 글 제목 {i + 1}</h3>
                    <p className="text-xs text-gray-500 mb-2">
                      {['서울고등학교', '부산중학교', '대전고등학교', '인천중학교'][i % 4]} • 3시간 전
                    </p>
                    <p className="text-sm text-gray-700 line-clamp-2">
                      게시글 내용이 여기에 표시됩니다. 최대 2줄까지 표시됩니다.
                    </p>
                  </div>
                ))}
              </div>
            </section>
          </div>

          <div className="space-y-8">
            {/* 학교 순위 섹션 */}
            <section className="bg-white p-6 rounded-lg shadow-sm border">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold">학교 순위</h2>
                <div className="flex gap-2">
                  <button className="px-3 py-1 text-sm rounded-full bg-green-50 text-green-600">플래피버드</button>
                  <button className="px-3 py-1 text-sm rounded-full hover:bg-gray-100">반응속도</button>
                </div>
              </div>
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center p-2 hover:bg-gray-50 rounded-md transition-colors">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center mr-3 ${
                      i === 0 ? 'bg-yellow-400' : 
                      i === 1 ? 'bg-gray-300' : 
                      i === 2 ? 'bg-amber-600' : 'bg-gray-100'
                    }`}>
                      <span className={`text-xs font-bold ${i < 3 ? 'text-white' : 'text-gray-600'}`}>{i + 1}</span>
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{['서울고등학교', '부산중학교', '대전고등학교', '인천중학교', '광주고등학교'][i]}</p>
                      <p className="text-xs text-gray-500">평균 점수: {120 - i * 5}</p>
                    </div>
                    <StarIcon className="h-4 w-4 text-gray-400 hover:text-yellow-400 cursor-pointer" />
                  </div>
                ))}
                <div className="text-center mt-4">
                  <Link 
                    href="/rankings/schools" 
                    className="text-green-600 text-sm hover:underline flex items-center justify-center gap-1"
                  >
                    전체 순위 보기
                    <ArrowRightIcon className="h-3 w-3" />
                  </Link>
                </div>
              </div>
            </section>

            {/* 출석체크 섹션 */}
            <section className="bg-white p-6 rounded-lg shadow-sm border">
              <h2 className="text-xl font-bold mb-4">출석체크</h2>
              <div className="text-center py-4">
                <p className="text-gray-500 mb-4">아직 오늘 출석체크를 하지 않았습니다</p>
                <button className="w-full py-3 bg-green-600 text-white rounded-md font-medium hover:bg-green-700 transition-colors">
                  출석체크 하기
                </button>
                <p className="mt-4 text-sm text-gray-500">
                  연속 출석 <span className="font-bold">3일째</span> • 
                  7일 연속 출석 시 <span className="text-green-600">100 경험치</span> 추가 지급
                </p>
              </div>
            </section>

            {/* 공지사항 섹션 */}
            <section className="bg-white p-6 rounded-lg shadow-sm border">
              <h2 className="text-xl font-bold mb-4">공지사항</h2>
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Link 
                    key={i}
                    href={`/notices/${i + 1}`}
                    className="block p-2 hover:bg-gray-50 rounded-md transition-colors"
                  >
                    <h3 className="font-medium mb-1 line-clamp-1">
                      {['5월 시스템 업데이트 안내', '커뮤니티 이용 규칙 변경', '사용자 계정 보안 강화 안내'][i]}
                    </h3>
                    <p className="text-xs text-gray-500">
                      {['2일 전', '1주일 전', '2주일 전'][i]}
                    </p>
                  </Link>
                ))}
              </div>
            </section>

            {/* 레벨 랭킹 섹션 */}
            <section className="bg-white p-6 rounded-lg shadow-sm border">
              <h2 className="text-xl font-bold mb-4">레벨 랭킹</h2>
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-center p-2 hover:bg-gray-50 rounded-md transition-colors">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center mr-3 ${
                      i === 0 ? 'bg-yellow-400' : 
                      i === 1 ? 'bg-gray-300' : 
                      i === 2 ? 'bg-amber-600' : 'bg-gray-100'
                    }`}>
                      <span className={`text-xs font-bold ${i < 3 ? 'text-white' : 'text-gray-600'}`}>{i + 1}</span>
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{['행복한학생', '열공맨', '꿈나무123', '퀴즈왕', '학교짱'][i]}</p>
                      <p className="text-xs text-gray-500">Lv.{30 - i * 2} • 경험치: {15000 - i * 1000}</p>
                    </div>
                  </div>
                ))}
                <div className="text-center mt-4">
                  <Link 
                    href="/rankings/users" 
                    className="text-green-600 text-sm hover:underline flex items-center justify-center gap-1"
                  >
                    전체 랭킹 보기
                    <ArrowRightIcon className="h-3 w-3" />
                  </Link>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>

      <footer className="mt-16 border-t py-8 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between">
            <div className="mb-6 md:mb-0">
              <h3 className="font-bold text-lg mb-4">인스쿨즈</h3>
              <p className="text-gray-500 text-sm">© 2025 인스쿨즈</p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
              <Link href="/terms" className="text-sm text-gray-500 hover:text-gray-700">이용약관</Link>
              <Link href="/privacy" className="text-sm text-gray-500 hover:text-gray-700">개인정보처리방침</Link>
              <Link href="/contact" className="text-sm text-gray-500 hover:text-gray-700">문의하기</Link>
              <Link href="/about" className="text-sm text-gray-500 hover:text-gray-700">회사 소개</Link>
              <Link href="/faq" className="text-sm text-gray-500 hover:text-gray-700">FAQ</Link>
            </div>
            <div className="mt-6 md:mt-0">
              <div className="flex space-x-4">
                <Link href="https://instagram.com" className="text-gray-400 hover:text-gray-500">
                  <span className="sr-only">인스타그램</span>
                  <svg fill="currentColor" viewBox="0 0 24 24" className="h-6 w-6">
                    <path fillRule="evenodd" d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z" clipRule="evenodd" />
                  </svg>
                </Link>
                <Link href="https://twitter.com" className="text-gray-400 hover:text-gray-500">
                  <span className="sr-only">트위터</span>
                  <svg fill="currentColor" viewBox="0 0 24 24" className="h-6 w-6">
                    <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                  </svg>
                </Link>
                <Link href="https://facebook.com" className="text-gray-400 hover:text-gray-500">
                  <span className="sr-only">페이스북</span>
                  <svg fill="currentColor" viewBox="0 0 24 24" className="h-6 w-6">
                    <path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd" />
                  </svg>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}
