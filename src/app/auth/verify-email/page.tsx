'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { auth } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Mail, RefreshCcw, CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { resendVerificationEmail } from '@/lib/api/auth';

export default function VerifyEmailPage() {
  const router = useRouter();
  const [isVerified, setIsVerified] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [countdown, setCountdown] = useState(0);

  // 사용자의 인증 상태 확인
  useEffect(() => {
    const checkVerification = async () => {
      if (!auth.currentUser) {
        // 로그인되지 않은 경우 로그인 페이지로 리디렉션
        router.push('/login');
        return;
      }

      setIsChecking(true);
      
      try {
        // 현재 사용자 정보 새로고침
        await auth.currentUser.reload();
        
        // 이메일 인증 상태 확인
        if (auth.currentUser.emailVerified) {
          setIsVerified(true);
          toast.success('이메일 인증이 완료되었습니다!');
          
          // 3초 후 메인 페이지로 리디렉션
          setTimeout(() => {
            router.push('/');
          }, 3000);
        }
      } catch (error) {
        console.error('이메일 인증 상태 확인 오류:', error);
        toast.error('인증 상태 확인 중 오류가 발생했습니다.');
      } finally {
        setIsChecking(false);
      }
    };

    // 사용자가 로그인했는지 확인
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        checkVerification();
      } else {
        router.push('/login');
      }
    });

    // 30초마다 인증 상태 확인
    const interval = setInterval(checkVerification, 30000);

    return () => {
      unsubscribe();
      clearInterval(interval);
    };
  }, [router]);

  // 인증 메일 재발송
  const handleResendEmail = async () => {
    if (countdown > 0) return;
    
    setIsResending(true);
    
    try {
      await resendVerificationEmail();
      toast.success('인증 이메일이 재발송되었습니다.');
      
      // 재발송 후 60초 카운트다운 시작
      setCountdown(60);
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (error) {
      console.error('이메일 재발송 오류:', error);
      toast.error('이메일 재발송 중 오류가 발생했습니다.');
    } finally {
      setIsResending(false);
    }
  };

  // 로그아웃 및 로그인 페이지로 이동
  const handleBackToLogin = async () => {
    try {
      await auth.signOut();
      router.push('/login');
    } catch (error) {
      console.error('로그아웃 오류:', error);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center justify-center text-xl">
            <Mail className="mr-2 h-6 w-6 text-green-500" />
            이메일 인증
          </CardTitle>
          <CardDescription className="text-center">
            {isVerified 
              ? '이메일 인증이 완료되었습니다.' 
              : '계정을 활성화하기 위해 이메일 인증이 필요합니다.'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isChecking ? (
            <div className="flex flex-col items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-green-500" />
              <p className="mt-4 text-sm text-gray-500">인증 상태 확인 중...</p>
            </div>
          ) : isVerified ? (
            <div className="flex flex-col items-center justify-center space-y-4 p-4">
              <CheckCircle2 className="h-16 w-16 text-green-500" />
              <p className="text-center text-lg font-medium">인증 완료!</p>
              <p className="text-center text-sm text-gray-500">
                잠시 후 메인 페이지로 이동합니다...
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="rounded-lg bg-green-50 p-4">
                <p className="text-sm text-green-800">
                  <strong>{auth.currentUser?.email}</strong> 주소로 인증 이메일을 발송했습니다.
                  이메일에 포함된 링크를 클릭하여 인증을 완료해주세요.
                </p>
              </div>
              
              <div className="mt-4 space-y-2">
                <p className="text-sm text-gray-500">
                  인증 이메일을 받지 못하셨나요?
                </p>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={handleResendEmail}
                  disabled={isResending || countdown > 0}
                >
                  {countdown > 0 ? (
                    `재발송 대기 (${countdown}초)`
                  ) : (
                    <>
                      <RefreshCcw className="mr-2 h-4 w-4" />
                      인증 이메일 재발송
                    </>
                  )}
                </Button>
              </div>
              
              <div className="mt-4">
                <p className="text-sm text-gray-500">
                  이메일 인증이 완료되면 자동으로 메인 페이지로 이동합니다.
                  페이지를 새로고침하지 않아도 됩니다.
                </p>
              </div>
            </div>
          )}
        </CardContent>
        <CardFooter>
          <Button
            variant="ghost"
            className="w-full"
            onClick={handleBackToLogin}
          >
            <XCircle className="mr-2 h-4 w-4" />
            로그인 페이지로 돌아가기
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
} 