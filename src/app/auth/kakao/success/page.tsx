'use client';

/**
 * 카카오 로그인 성공 처리 페이지
 * 액세스 토큰을 받아서 사용자 정보를 가져오고 로그인을 완료합니다.
 */

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { processKakaoLogin } from '@/lib/kakao-auth';
import { useAuthStore } from '@/store/authStore';
import { Loader2 } from 'lucide-react';

function KakaoSuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { setUser } = useAuthStore();
  const [status, setStatus] = useState<'processing' | 'success' | 'error'>('processing');
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const handleKakaoLogin = async () => {
      try {
        const accessToken = searchParams.get('access_token');
        const state = searchParams.get('state');

        console.log('[KAKAO SUCCESS] 처리 시작:', { 
          hasToken: !!accessToken, 
          state 
        });

        if (!accessToken) {
          throw new Error('액세스 토큰이 제공되지 않았습니다.');
        }

        // 카카오 로그인 처리
        setStatus('processing');
        const user = await processKakaoLogin(accessToken);
        
        console.log('[KAKAO SUCCESS] 로그인 성공:', user.profile.userName);
        
        // 인증 상태 업데이트
        setUser(user);
        setStatus('success');

        // 잠시 성공 메시지를 보여준 후 메인 페이지로 이동
        setTimeout(() => {
          router.push('/');
        }, 1500);

      } catch (error) {
        console.error('[KAKAO SUCCESS] 로그인 처리 실패:', error);
        setError(error instanceof Error ? error.message : '카카오 로그인 처리 중 오류가 발생했습니다.');
        setStatus('error');

        // 에러 발생 시 3초 후 로그인 페이지로 이동
        setTimeout(() => {
          router.push('/auth');
        }, 3000);
      }
    };

    handleKakaoLogin();
  }, [searchParams, router, setUser]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full mx-auto p-8">
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          {status === 'processing' && (
            <>
              <Loader2 className="w-12 h-12 mx-auto mb-4 animate-spin text-yellow-500" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                카카오 로그인 처리 중...
              </h2>
              <p className="text-gray-600">
                잠시만 기다려주세요.
              </p>
            </>
          )}

          {status === 'success' && (
            <>
              <div className="w-12 h-12 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                로그인 성공!
              </h2>
              <p className="text-gray-600">
                카카오 로그인이 완료되었습니다. 메인 페이지로 이동합니다.
              </p>
            </>
          )}

          {status === 'error' && (
            <>
              <div className="w-12 h-12 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
                <svg
                  className="w-6 h-6 text-red-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-red-900 mb-2">
                로그인 실패
              </h2>
              <p className="text-red-600 mb-4">
                {error}
              </p>
              <p className="text-sm text-gray-500">
                3초 후 로그인 페이지로 이동합니다.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function KakaoSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full mx-auto p-8">
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <Loader2 className="w-12 h-12 mx-auto mb-4 animate-spin text-yellow-500" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              로딩 중...
            </h2>
            <p className="text-gray-600">
              잠시만 기다려주세요.
            </p>
          </div>
        </div>
      </div>
    }>
      <KakaoSuccessContent />
    </Suspense>
  );
}
