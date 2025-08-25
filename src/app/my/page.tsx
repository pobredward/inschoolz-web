'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/providers/AuthProvider';
import MyPageClient from './MyPageClient';

export default function MyPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [redirectTimer, setRedirectTimer] = useState<NodeJS.Timeout | null>(null);
  const [initialAuthCheckComplete, setInitialAuthCheckComplete] = useState(false);

  useEffect(() => {
    console.log('🔍 MyPage: 인증 상태 확인', { 
      isLoading, 
      hasUser: !!user,
      userUid: user?.uid,
      initialAuthCheckComplete
    });

    // 기존 타이머가 있으면 취소
    if (redirectTimer) {
      clearTimeout(redirectTimer);
      setRedirectTimer(null);
    }

    // 로딩이 완료되고 사용자가 없는 경우에만 리디렉션
    // 이메일/카카오 로그인 후 AuthProvider 상태 업데이트를 위해 더 긴 대기 시간 제공
    if (!isLoading && !user) {
      console.log('⚠️ MyPage: 사용자 인증되지 않음, 쿠키 및 리다이렉트 확인');
      
      // 쿠키 확인 (이메일 로그인 후 AuthProvider보다 빠를 수 있음)
      const authCookie = document.cookie.split(';').find(cookie => cookie.trim().startsWith('authToken='));
      
      if (authCookie && !initialAuthCheckComplete) {
        console.log('🍪 MyPage: 인증 쿠키 발견, AuthProvider 업데이트 대기 (이메일/카카오 로그인 후 가능성)');
        // 인증 쿠키가 있고 초기 인증 확인이 완료되지 않았으면 더 오래 대기
        // 이메일 로그인 후 AuthProvider가 상태를 업데이트할 시간을 제공
        const timer = setTimeout(() => {
          console.log('🚪 MyPage: AuthProvider 대기 시간 초과, 로그인 페이지로 리다이렉트');
          setInitialAuthCheckComplete(true);
          router.push('/login?redirect=/my');
        }, 3000); // 3초 대기 (이메일 로그인 후 충분한 시간)

        setRedirectTimer(timer);
      } else if (!authCookie) {
        console.log('🍪 MyPage: 인증 쿠키 없음, 즉시 로그인 페이지로 리다이렉트');
        // 쿠키가 없으면 빠르게 리다이렉트
        const timer = setTimeout(() => {
          router.push('/login?redirect=/my');
        }, 500);

        setRedirectTimer(timer);
      } else if (initialAuthCheckComplete) {
        // 초기 인증 확인이 완료되었고 여전히 사용자가 없으면 즉시 리다이렉트
        console.log('🚪 MyPage: 초기 인증 확인 완료, 사용자 없음 - 즉시 리다이렉트');
        router.push('/login?redirect=/my');
      }
    } else if (user) {
      console.log('✅ MyPage: 사용자 인증 완료', { userName: user.profile?.userName });
      setInitialAuthCheckComplete(true);
    }

    // 첫 번째 로딩 완료 후 초기 인증 확인 완료로 표시
    if (!isLoading && !initialAuthCheckComplete) {
      setInitialAuthCheckComplete(true);
    }

    return () => {
      if (redirectTimer) {
        clearTimeout(redirectTimer);
      }
    };
  }, [user, isLoading, router, redirectTimer, initialAuthCheckComplete]);

  // 로딩 중인 경우 로딩 화면 표시
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">사용자 정보를 불러오는 중...</p>
        </div>
      </div>
    );
  }

  // 사용자가 없는 경우 (리다이렉트 대기 중)
  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">로그인 상태를 확인하는 중...</p>
        </div>
      </div>
    );
  }

  // MyPageClient 컴포넌트 렌더링 (user는 이미 AuthProvider에서 관리됨)
  return <MyPageClient userData={user} />;
} 