'use client';

import Link from 'next/link';
import { SimpleSignupForm } from '@/app/signup/components/simple-signup-form';

export default function SignupPageClient() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-100">
      <div className="flex flex-col items-center justify-center min-h-screen py-12 px-4 sm:px-6 lg:px-8">
        {/* 로고 및 헤더 */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-green-700 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-xl">인</span>
            </div>
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-green-800 bg-clip-text text-transparent">
            인스쿨즈
          </h1>
          <p className="mt-2 text-gray-600">학생들을 위한 스마트한 커뮤니티</p>
        </div>

        {/* 메인 카드 */}
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
            {/* 헤더 */}
            <div className="border-b border-gray-100">
              <div className="py-4 px-6 text-center">
                <h2 className="text-lg font-semibold text-gray-900">회원가입</h2>
              </div>
            </div>

            {/* 회원가입 폼 */}
            <div className="p-6">
              <SimpleSignupForm />
            </div>
          </div>

          {/* 로그인 링크 */}
          <div className="text-center mt-6">
            <p className="text-sm text-gray-600">
              이미 계정이 있으신가요?{' '}
              <Link 
                href="/login" 
                className="font-medium text-green-600 hover:text-green-500 transition-colors"
              >
                로그인하기
              </Link>
            </p>
          </div>

          {/* 푸터 */}
          <div className="text-center mt-8 text-sm text-gray-500">
            <p>
              계속 진행하면{' '}
              <Link href="/terms" className="text-green-600 hover:underline">
                서비스 약관
              </Link>
              과{' '}
              <Link href="/privacy" className="text-green-600 hover:underline">
                개인정보 처리방침
              </Link>
              에 동의하는 것으로 간주됩니다.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
