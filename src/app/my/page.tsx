'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/providers/AuthProvider';

export default function MyPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        // 로그인하지 않은 경우 인증 페이지로 리다이렉션
        router.push('/auth?redirect=/my');
      } else if (user.profile?.userName) {
        // 사용자의 userName으로 리다이렉트
        router.push(`/${user.profile.userName}`);
      } else {
        // userName이 없는 경우 인증 페이지로 리다이렉션
        router.push('/auth?redirect=/my');
      }
    }
  }, [user, isLoading, router]);

  // 로딩 중이거나 리다이렉션 중일 때 표시
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
        <p className="text-muted-foreground">마이페이지로 이동 중...</p>
      </div>
    </div>
  );
} 