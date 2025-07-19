import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-gray-50 border-t border-gray-200 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
        <div className="flex flex-col md:flex-row justify-between items-center space-y-6 md:space-y-0">
          {/* 링크 섹션 */}
          <div className="flex flex-col sm:flex-row flex-wrap justify-center md:justify-start items-center gap-4 sm:gap-6 text-sm text-gray-600">
            <Link 
              href="/about" 
              className="hover:text-gray-900 transition-colors touch-manipulation min-h-touch px-2 py-1 rounded"
            >
              회사소개
            </Link>
            <span className="hidden sm:inline text-gray-300">|</span>
            <Link 
              href="/terms" 
              className="hover:text-gray-900 transition-colors touch-manipulation min-h-touch px-2 py-1 rounded"
            >
              이용약관
            </Link>
            <span className="hidden sm:inline text-gray-300">|</span>
            <Link 
              href="/privacy" 
              className="hover:text-gray-900 transition-colors font-semibold touch-manipulation min-h-touch px-2 py-1 rounded"
            >
              개인정보처리방침
            </Link>
            <span className="hidden sm:inline text-gray-300">|</span>
            <Link 
              href="/youth-protection" 
              className="hover:text-gray-900 transition-colors font-semibold touch-manipulation min-h-touch px-2 py-1 rounded"
            >
              청소년보호정책
            </Link>
          </div>
          
          {/* 저작권 정보 */}
          <div className="text-xs sm:text-sm text-gray-500 text-center md:text-right">
            Copyright © 2025 inschoolz. All rights reserved.
          </div>
        </div>
      </div>
    </footer>
  );
} 