import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-gray-50 border-t border-gray-200 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
          {/* 링크 섹션 */}
          <div className="flex flex-wrap justify-center md:justify-start items-center space-x-6 text-sm text-gray-600">
            <Link 
              href="/about" 
              className="hover:text-gray-900 transition-colors"
            >
              회사소개
            </Link>
            <span className="text-gray-300">|</span>
            <Link 
              href="/terms" 
              className="hover:text-gray-900 transition-colors"
            >
              이용약관
            </Link>
            <span className="text-gray-300">|</span>
            <Link 
              href="/privacy" 
              className="hover:text-gray-900 transition-colors font-semibold"
            >
              개인정보처리방침
            </Link>
            <span className="text-gray-300">|</span>
            <Link 
              href="/youth-protection" 
              className="hover:text-gray-900 transition-colors font-semibold"
            >
              청소년보호정책
            </Link>
          </div>
          
          {/* 저작권 정보 */}
          <div className="text-sm text-gray-500">
            Copyright © 2025 inschoolz. All rights reserved.
          </div>
        </div>
      </div>
    </footer>
  );
} 