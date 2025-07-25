'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/providers/AuthProvider';
import MyPageClient from './MyPageClient';

export default function MyPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // 로딩이 완료되고 사용자가 없는 경우 로그인 페이지로 리디렉션
    if (!isLoading && !user) {
      router.push('/auth?redirect=/my');
    }
  }, [user, isLoading, router]);

  // 로딩 중이거나 인증되지 않은 경우
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p>로딩 중...</p>
      </div>
    );
  }

  if (!user) {
    return null; // useEffect에서 리디렉션 처리
  }

  // MyPageClient 컴포넌트 렌더링 (user는 이미 AuthProvider에서 관리됨)
  return <MyPageClient userData={user} />;
} 