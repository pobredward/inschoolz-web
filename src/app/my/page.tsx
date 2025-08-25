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
    if (!isLoading && !user) {
      console.log('⚠️ MyPage: 사용자 인증되지 않음, 쿠키 및 리다이렉트 확인');
      
      // 쿠키 확인 (더 정확한 검증)
      const authCookie = document.cookie.split(';').find(cookie => cookie.trim().startsWith('authToken='));
      const uidCookie = document.cookie.split(';').find(cookie => cookie.trim().startsWith('uid='));
      
      console.log('🍪 MyPage: 쿠키 상태', { 
        authToken: !!authCookie, 
        uid: !!uidCookie 
      });
      
      if (authCookie && uidCookie) {
        console.log('🍪 MyPage: 인증 쿠키들 발견, AuthProvider 업데이트 대기');
        // 두 쿠키 모두 있으면 AuthProvider 상태 업데이트 대기 (프로덕션에서 더 오래)
        const isProduction = process.env.NODE_ENV === 'production';
        const waitTime = isProduction ? 5000 : 3000; // 프로덕션에서는 5초
        
        const timer = setTimeout(() => {
          if (!user) { // 아직도 user가 없으면
            console.log('🚪 MyPage: AuthProvider 대기 시간 초과, 로그인 페이지로 리다이렉트');
            router.push('/login?redirect=/my');
          }
        }, waitTime);

        setRedirectTimer(timer);
      } else {
        console.log('🍪 MyPage: 필수 인증 쿠키 없음, 즉시 로그인 페이지로 리다이렉트');
        // 필수 쿠키가 없으면 빠르게 리다이렉트
        const timer = setTimeout(() => {
          router.push('/login?redirect=/my');
        }, 300);

        setRedirectTimer(timer);
      }
    } else if (user) {
      console.log('✅ MyPage: 사용자 인증 완료', { userName: user.profile?.userName });
      // 인증 완료시 타이머 즉시 정리
      if (redirectTimer) {
        clearTimeout(redirectTimer);
        setRedirectTimer(null);
      }
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