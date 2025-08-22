'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, CheckCircle, User, Mail } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/providers/AuthProvider';

interface KakaoUserData {
  id: number;
  email?: string;
  nickname?: string;
  profile_image?: string;
  access_token: string;
  userId?: string; // DB에 저장된 사용자 ID
}

function KakaoSuccessContent() {
  const [isLoading, setIsLoading] = useState(true);
  const [userData, setUserData] = useState<KakaoUserData | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const { signInWithKakao } = useAuth();

  useEffect(() => {
    const handleKakaoLogin = async () => {
      try {
        console.log('🚀 카카오 로그인 성공 페이지: AuthProvider 방식으로 로그인 처리 시작');
        
        // AuthProvider의 signInWithKakao 호출 (이메일 로그인과 동일한 방식)
        await signInWithKakao();
        
        console.log('✅ 카카오 로그인 완료, 리다이렉트 준비');
        
        // 이메일 로그인과 동일한 방식으로 리다이렉트
        await new Promise(resolve => setTimeout(resolve, 1000));
        const redirectUrl = searchParams.get('redirect') || '/';
        
        console.log('🔄 리다이렉트:', redirectUrl);
        router.push(redirectUrl);

      } catch (error) {
        console.error('❌ 카카오 로그인 처리 오류:', error);
        toast.error('로그인 처리 중 오류가 발생했습니다.');
        
        setTimeout(() => {
          router.push('/auth?error=kakao_processing_failed');
        }, 2000);
      } finally {
        setIsLoading(false);
      }
    };

    handleKakaoLogin();
  }, [router, searchParams, signInWithKakao]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-100 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex items-center justify-center mb-4">
              <Loader2 className="h-12 w-12 text-green-500 animate-spin" />
            </div>
            <CardTitle className="text-2xl font-bold text-green-800">
              카카오 로그인 처리 중
            </CardTitle>
            <CardDescription>
              잠시만 기다려주세요...
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-100 flex items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center mb-4">
            <CheckCircle className="h-12 w-12 text-green-500" />
          </div>
          <CardTitle className="text-2xl font-bold text-green-800">
            로그인 성공!
          </CardTitle>
          <CardDescription>
            카카오 계정으로 성공적으로 로그인되었습니다.
          </CardDescription>
        </CardHeader>
        
        {userData && (
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
              <User className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-sm font-medium text-green-800">닉네임</p>
                <p className="text-sm text-green-600">{userData.nickname || '사용자'}</p>
              </div>
            </div>
            
            {userData.email && (
              <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
                <Mail className="h-5 w-5 text-green-600" />
                <div>
                  <p className="text-sm font-medium text-green-800">이메일</p>
                  <p className="text-sm text-green-600">{userData.email}</p>
                </div>
              </div>
            )}
            
            <div className="text-center pt-4">
              <p className="text-sm text-gray-600">
                곧 대시보드로 이동합니다...
              </p>
              <Button 
                onClick={() => router.push('/dashboard')}
                className="mt-3 w-full bg-green-600 hover:bg-green-700"
              >
                지금 이동하기
              </Button>
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  );
}

export default function KakaoSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-100 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex items-center justify-center mb-4">
              <Loader2 className="h-12 w-12 text-green-500 animate-spin" />
            </div>
            <CardTitle className="text-2xl font-bold text-green-800">
              카카오 로그인 처리 중
            </CardTitle>
            <CardDescription>
              잠시만 기다려주세요...
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    }>
      <KakaoSuccessContent />
    </Suspense>
  );
}
