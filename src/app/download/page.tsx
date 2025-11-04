'use client';

import { useEffect } from 'react';

export default function DownloadPage() {
  useEffect(() => {
    const userAgent = navigator.userAgent || navigator.vendor;
    
    // iOS 감지 (iPhone, iPad, iPod)
    if (/iPad|iPhone|iPod/.test(userAgent)) {
      window.location.href = 'https://apps.apple.com/kr/app/%EC%9D%B8%EC%8A%A4%EC%BF%A8%EC%A6%88-inschoolz/id6748880507?l=en-GB';
    } 
    // Android 감지
    else if (/android/i.test(userAgent)) {
      window.location.href = 'https://play.google.com/store/apps/details?id=com.onmindlab.inschoolz';
    }
    // 데스크톱 또는 기타 디바이스
    else {
      // Android가 기본값 (모바일 사용자가 대부분일 것으로 예상)
      window.location.href = 'https://play.google.com/store/apps/details?id=com.onmindlab.inschoolz';
    }
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600">
      <div className="bg-white rounded-2xl shadow-2xl p-8 md:p-12 max-w-md w-full mx-4">
        <div className="flex flex-col items-center space-y-6">
          {/* 로딩 애니메이션 */}
          <div className="relative w-20 h-20">
            <div className="absolute inset-0 border-4 border-blue-200 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-t-blue-600 rounded-full animate-spin"></div>
          </div>

          {/* 텍스트 */}
          <div className="text-center space-y-3">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
              인스쿨즈
            </h1>
            <p className="text-gray-600 text-sm md:text-base">
              앱 스토어로 이동 중입니다...
            </p>
            <p className="text-gray-400 text-xs">
              자동으로 이동되지 않으면 아래 버튼을 눌러주세요
            </p>
          </div>

          {/* 수동 링크 버튼 */}
          <div className="flex flex-col gap-3 w-full pt-4">
            <a
              href="https://apps.apple.com/kr/app/%EC%9D%B8%EC%8A%A4%EC%BF%A8%EC%A6%88-inschoolz/id6748880507?l=en-GB"
              className="flex items-center justify-center gap-2 bg-black text-white px-6 py-3 rounded-lg font-medium hover:bg-gray-800 transition-colors"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
              </svg>
              App Store
            </a>
            
            <a
              href="https://play.google.com/store/apps/details?id=com.onmindlab.inschoolz"
              className="flex items-center justify-center gap-2 bg-green-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-green-700 transition-colors"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M3,20.5V3.5C3,2.91 3.34,2.39 3.84,2.15L13.69,12L3.84,21.85C3.34,21.6 3,21.09 3,20.5M16.81,15.12L6.05,21.34L14.54,12.85L16.81,15.12M20.16,10.81C20.5,11.08 20.75,11.5 20.75,12C20.75,12.5 20.5,12.92 20.16,13.19L17.89,14.5L15.39,12L17.89,9.5L20.16,10.81M6.05,2.66L16.81,8.88L14.54,11.15L6.05,2.66Z"/>
              </svg>
              Google Play
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

