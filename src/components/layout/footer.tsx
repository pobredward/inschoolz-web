import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-gray-50 border-t border-gray-200 mt-auto">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 pb-20 sm:pb-6">
        
        {/* 상단: 브랜드 정보 */}
        <div className="text-center mb-4">
          <div className="text-sm font-bold text-pastel-green-600 font-jammin mb-1">
            InSchoolz
          </div>
          <div className="text-xs text-gray-500">
            초·중·고 학생 커뮤니티
          </div>
        </div>

        {/* 중단: 링크들 (한 줄로) */}
        <div className="flex flex-wrap justify-center items-center gap-1 text-xs mb-4">
          <Link 
            href="/about" 
            className="text-gray-600 hover:text-gray-900 transition-colors touch-manipulation min-h-touch px-3 py-1.5 rounded hover:bg-gray-100"
          >
            회사소개
          </Link>
          <span className="text-gray-300 mx-1">•</span>
          <Link 
            href="/terms" 
            className="text-gray-600 hover:text-gray-900 transition-colors touch-manipulation min-h-touch px-3 py-1.5 rounded hover:bg-gray-100"
          >
            이용약관
          </Link>
          <span className="text-gray-300 mx-1">•</span>
          <Link 
            href="/privacy" 
            className="text-gray-600 hover:text-gray-900 transition-colors font-semibold touch-manipulation min-h-touch px-3 py-1.5 rounded hover:bg-gray-100"
          >
            개인정보처리방침
          </Link>
          <span className="text-gray-300 mx-1">•</span>
          <Link 
            href="/youth-protection" 
            className="text-gray-600 hover:text-gray-900 transition-colors font-semibold touch-manipulation min-h-touch px-3 py-1.5 rounded hover:bg-gray-100"
          >
            청소년보호정책
          </Link>
          <span className="text-gray-300 mx-1">•</span>
          <Link 
            href="/help" 
            className="text-gray-600 hover:text-gray-900 transition-colors touch-manipulation min-h-touch px-3 py-1.5 rounded hover:bg-gray-100"
          >
            고객지원
          </Link>
        </div>

        {/* 하단: 저작권 + 연락처 */}
        <div className="text-center">
          <div className="text-xs text-gray-500 mb-1">
            © 2025 inschoolz. All rights reserved.
          </div>
          <Link 
            href="mailto:support@inschoolz.com" 
            className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
          >
            support@inschoolz.com
          </Link>
        </div>
      </div>
    </footer>
  );
} 