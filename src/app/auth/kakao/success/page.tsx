'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, CheckCircle, User, Mail } from 'lucide-react';
import { toast } from 'sonner';
import { processKakaoLogin } from '@/lib/auth';
import { useAuthStore } from '@/store/authStore';

interface KakaoUserData {
  id: number;
  email?: string;
  nickname?: string;
  profile_image?: string;
  access_token: string;
}

export default function KakaoSuccessPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [userData, setUserData] = useState<KakaoUserData | null>(null);
  const router = useRouter();
  const { setUser } = useAuthStore();

  useEffect(() => {
    const handleKakaoLogin = async () => {
      try {
        // 서버에서 카카오 사용자 데이터 가져오기
        const response = await fetch('/api/auth/kakao/user-data', {
          method: 'GET',
          credentials: 'include',
        });

        if (!response.ok) {
          throw new Error('사용자 데이터를 가져올 수 없습니다.');
        }

        const kakaoData = await response.json();
        setUserData(kakaoData);

        // 카카오 로그인 데이터로 사용자 생성/로그인 처리
        const user = await processKakaoLogin(kakaoData);
        
        // AuthContext에 사용자 정보 설정
        setUser(user);
        
        toast.success('카카오 로그인이 완료되었습니다!');
        
        // 3초 후 대시보드로 리다이렉트
        setTimeout(() => {
          router.push('/dashboard');
        }, 3000);

      } catch (error) {
        console.error('카카오 로그인 처리 오류:', error);
        toast.error('로그인 처리 중 오류가 발생했습니다.');
        
        setTimeout(() => {
          router.push('/auth?error=kakao_processing_failed');
        }, 2000);
      } finally {
        setIsLoading(false);
      }
    };

    handleKakaoLogin();
  }, [router, setUser]);

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
