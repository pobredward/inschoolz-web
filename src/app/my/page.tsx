'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/providers/AuthProvider';
import MyPageClient from './MyPageClient';

export default function MyPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [redirectTimer, setRedirectTimer] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    console.log('🔍 MyPage: 인증 상태 확인', { 
      isLoading, 
      hasUser: !!user,
      userUid: user?.uid 
    });

    // 기존 타이머가 있으면 취소
    if (redirectTimer) {
      clearTimeout(redirectTimer);
      setRedirectTimer(null);
    }

    // 로딩이 완료되고 사용자가 없는 경우에만 리디렉션
    // 하지만 약간의 추가 대기 시간을 제공하여 AuthProvider 상태 업데이트를 기다림
    if (!isLoading && !user) {
      console.log('⚠️ MyPage: 사용자 인증되지 않음, 리다이렉트 타이머 시작');
      
      const timer = setTimeout(() => {
        console.log('🚪 MyPage: 로그인 페이지로 리다이렉트');
        router.push('/auth?tab=login&redirect=/my');
      }, 500); // 500ms 추가 대기

      setRedirectTimer(timer);
    } else if (user) {
      console.log('✅ MyPage: 사용자 인증 완료', { userName: user.profile?.userName });
    }

    return () => {
      if (redirectTimer) {
        clearTimeout(redirectTimer);
      }
    };
  }, [user, isLoading, router, redirectTimer]);

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