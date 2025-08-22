'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Eye, EyeOff, Phone, Mail } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { z } from 'zod';
import { loginWithEmail, sendPhoneVerificationCode, confirmPhoneVerificationCode, createRecaptchaVerifier } from '@/lib/auth';
import Link from 'next/link';
import type { ConfirmationResult, RecaptchaVerifier } from 'firebase/auth';

// 스키마 정의
const emailLoginSchema = z.object({
  email: z.string().email('올바른 이메일 형식이 아닙니다.'),
  password: z.string().min(1, '비밀번호를 입력해주세요.'),
});

const phoneLoginSchema = z.object({
  phoneNumber: z.string().regex(/^01[0-9]-\d{4}-\d{4}$/, '올바른 휴대폰 번호 형식이 아닙니다. (예: 010-1234-5678)'),
  verificationCode: z.string().length(6, '인증번호는 6자리여야 합니다.'),
});

interface LoginFormProps {
  showTitle?: boolean;
  containerId?: string;
}

export function LoginForm({ showTitle = false, containerId = 'login-recaptcha-container' }: LoginFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loginMethod, setLoginMethod] = useState<'email' | 'phone'>('email');
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // 이메일 로그인 폼 상태
  const [emailForm, setEmailForm] = useState({
    email: '',
    password: ''
  });
  
  // 휴대폰 로그인 폼 상태
  const [phoneForm, setPhoneForm] = useState({
    phoneNumber: '',
    verificationCode: ''
  });

  // 휴대폰 인증 관련 상태
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const [recaptchaVerifier, setRecaptchaVerifier] = useState<RecaptchaVerifier | null>(null);
  const [codeSent, setCodeSent] = useState(false);
  const recaptchaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // reCAPTCHA 컨테이너 설정
    if (loginMethod === 'phone' && !recaptchaVerifier) {
      // DOM이 렌더링된 후 reCAPTCHA 설정
      const timer = setTimeout(() => {
        try {
          const container = document.getElementById(containerId);
          if (container) {
            const verifier = createRecaptchaVerifier(containerId);
            setRecaptchaVerifier(verifier);
          } else {
            console.warn('reCAPTCHA 컨테이너를 찾을 수 없습니다');
          }
        } catch (error) {
          console.error('reCAPTCHA 설정 오류:', error);
          // Enterprise 설정 오류 시 사용자에게 알림
          if (error instanceof Error && error.message.includes('Enterprise')) {
            console.warn('reCAPTCHA Enterprise 설정 오류 - v2로 fallback');
          }
        }
      }, 100);

      return () => clearTimeout(timer);
    }

    // 정리 함수: 로그인 방식이 변경되면 기존 verifier 정리
    return () => {
      if (loginMethod !== 'phone' && recaptchaVerifier) {
        try {
          recaptchaVerifier.clear();
          setRecaptchaVerifier(null);
        } catch (error) {
          console.warn('reCAPTCHA verifier 정리 중 오류:', error);
        }
      }
    };
  }, [loginMethod, recaptchaVerifier, containerId]);

  // 휴대폰 번호 포맷팅
  const formatPhoneNumber = (value: string) => {
    const numbers = value.replace(/[^\d]/g, '');
    if (numbers.length <= 3) return numbers;
    if (numbers.length <= 7) return `${numbers.slice(0, 3)}-${numbers.slice(3)}`;
    return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7, 11)}`;
  };

  // 이메일 로그인
  const handleEmailLogin = async () => {
    try {
      const validated = emailLoginSchema.parse(emailForm);
      setIsLoading(true);
      
      await loginWithEmail(validated.email, validated.password);
      
      // 로그인 성공 후 리디렉션
      await new Promise(resolve => setTimeout(resolve, 1000));
      const redirectUrl = searchParams.get('redirect') || '/';
      router.push(redirectUrl);
    } catch (error) {
      if (error instanceof z.ZodError) {
        const firstError = error.errors[0];
        toast.error(firstError.message);
      } else {
        console.error('이메일 로그인 실패:', error);
        toast.error(error instanceof Error ? error.message : '로그인에 실패했습니다.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // 휴대폰 인증번호 발송
  const handleSendPhoneCode = async () => {
    try {
      if (!phoneForm.phoneNumber) {
        toast.error('휴대폰 번호를 입력해주세요.');
        return;
      }

      if (!recaptchaVerifier) {
        toast.error('reCAPTCHA 인증을 다시 시도해주세요.');
        return;
      }

      setIsLoading(true);
      
      const result = await sendPhoneVerificationCode(phoneForm.phoneNumber, recaptchaVerifier);
      setConfirmationResult(result);
      setCodeSent(true);
      toast.success('인증번호가 발송되었습니다.');
      
    } catch (error) {
      console.error('인증번호 발송 실패:', error);
      if (error instanceof Error) {
        // reCAPTCHA Enterprise fallback 오류 처리
        if (error.message === 'RECAPTCHA_ENTERPRISE_FALLBACK') {
          toast.warning('reCAPTCHA 설정이 v2로 전환되었습니다. 다시 시도해주세요.');
          // reCAPTCHA verifier 재설정
          try {
            if (recaptchaVerifier) {
              recaptchaVerifier.clear();
            }
            const newVerifier = createRecaptchaVerifier(containerId);
            setRecaptchaVerifier(newVerifier);
          } catch (resetError) {
            console.error('reCAPTCHA verifier 재설정 실패:', resetError);
            toast.error('보안 인증을 다시 설정 중입니다. 잠시 후 다시 시도해주세요.');
          }
        } else {
          toast.error(error.message);
        }
      } else {
        toast.error('인증번호 발송에 실패했습니다.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // 휴대폰 로그인 완료
  const handlePhoneLogin = async () => {
    try {
      const validated = phoneLoginSchema.parse(phoneForm);
      
      if (!confirmationResult) {
        toast.error('먼저 인증번호를 요청해주세요.');
        return;
      }

      setIsLoading(true);
      
      await confirmPhoneVerificationCode(confirmationResult, validated.verificationCode);
      
      // 로그인 성공 후 리디렉션
      await new Promise(resolve => setTimeout(resolve, 1000));
      const redirectUrl = searchParams.get('redirect') || '/';
      router.push(redirectUrl);
      
    } catch (error) {
      if (error instanceof z.ZodError) {
        const firstError = error.errors[0];
        toast.error(firstError.message);
      } else {
        console.error('휴대폰 로그인 실패:', error);
        toast.error(error instanceof Error ? error.message : '로그인에 실패했습니다.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // 키보드 엔터 핸들러
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isLoading) {
      e.preventDefault();
      if (loginMethod === 'email') {
        handleEmailLogin();
      } else if (codeSent) {
        handlePhoneLogin();
      } else {
        handleSendPhoneCode();
      }
    }
  };

  return (
    <div className="w-full space-y-6">
      {showTitle && (
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold text-gray-900">로그인</h1>
          <p className="text-gray-600">계정에 로그인하여 인스쿨즈를 시작하세요</p>
        </div>
      )}

      {/* 로그인 방법 선택 */}
      <div className="grid grid-cols-2 gap-3 p-1 bg-green-100 rounded-lg">
        <button
          onClick={() => {
            setLoginMethod('email');
            setCodeSent(false);
          }}
          className={`flex items-center justify-center gap-2 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            loginMethod === 'email'
              ? 'bg-white text-green-700 shadow-sm'
              : 'text-green-600 hover:text-green-700'
          }`}
        >
          <Mail className="h-4 w-4" />
          이메일
        </button>
        <button
          onClick={() => {
            setLoginMethod('phone');
            setCodeSent(false);
          }}
          className={`flex items-center justify-center gap-2 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            loginMethod === 'phone'
              ? 'bg-white text-green-700 shadow-sm'
              : 'text-green-600 hover:text-green-700'
          }`}
        >
          <Phone className="h-4 w-4" />
          휴대폰
        </button>
      </div>

      {/* 로그인 폼 */}
      <div className="space-y-4">
        {loginMethod === 'email' ? (
          <>
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                이메일
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="name@example.com"
                value={emailForm.email}
                onChange={(e) => setEmailForm(prev => ({ ...prev, email: e.target.value }))}
                onKeyDown={handleKeyDown}
                className="h-11"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                비밀번호
              </Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="비밀번호를 입력하세요"
                  value={emailForm.password}
                  onChange={(e) => setEmailForm(prev => ({ ...prev, password: e.target.value }))}
                  onKeyDown={handleKeyDown}
                  className="h-11 pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-11 px-3 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4 text-gray-400" /> : <Eye className="h-4 w-4 text-gray-400" />}
                </Button>
              </div>
            </div>

            <div className="flex items-center justify-end">
              <Link href="/auth/reset-password" className="text-sm text-green-600 hover:text-green-800">
                비밀번호를 잊으셨나요?
              </Link>
            </div>
            
            <Button 
              onClick={handleEmailLogin} 
              className="w-full h-11 bg-green-600 hover:bg-green-700" 
              disabled={isLoading}
            >
              {isLoading ? '로그인 중...' : '로그인'}
            </Button>
          </>
        ) : (
          <>
            <div className="space-y-2">
              <Label htmlFor="phoneNumber" className="text-sm font-medium text-gray-700">
                휴대폰 번호
              </Label>
              <Input
                id="phoneNumber"
                type="tel"
                placeholder="010-1234-5678"
                value={phoneForm.phoneNumber}
                onChange={(e) => {
                  const formatted = formatPhoneNumber(e.target.value);
                  setPhoneForm(prev => ({ ...prev, phoneNumber: formatted }));
                }}
                onKeyDown={handleKeyDown}
                maxLength={13}
                className="h-11"
              />
            </div>
            
            {!codeSent ? (
              <Button 
                onClick={handleSendPhoneCode} 
                className="w-full h-11 bg-green-600 hover:bg-green-700" 
                disabled={isLoading}
              >
                {isLoading ? '발송 중...' : '인증번호 발송'}
              </Button>
            ) : (
              <>
                <div className="space-y-2">
                  <Label htmlFor="verificationCode" className="text-sm font-medium text-gray-700">
                    인증번호
                  </Label>
                  <Input
                    id="verificationCode"
                    type="text"
                    placeholder="6자리 인증번호"
                    value={phoneForm.verificationCode}
                    onChange={(e) => {
                      const value = e.target.value.replace(/[^\d]/g, '').slice(0, 6);
                      setPhoneForm(prev => ({ ...prev, verificationCode: value }));
                    }}
                    onKeyDown={handleKeyDown}
                    maxLength={6}
                    className="h-11 text-center tracking-widest text-lg"
                  />
                </div>
                
                <Button 
                  onClick={handlePhoneLogin} 
                  className="w-full h-11 bg-green-600 hover:bg-green-700" 
                  disabled={isLoading}
                >
                  {isLoading ? '로그인 중...' : '로그인'}
                </Button>
              </>
            )}
          </>
        )}
      </div>

      {/* reCAPTCHA 컨테이너 */}
      <div id={containerId} ref={recaptchaRef}></div>
      
      {/* 구분선 */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-200"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="bg-white px-4 text-gray-500">또는</span>
        </div>
      </div>
      
      {/* Google 로그인 */}
      <Button variant="outline" className="w-full h-11 border-gray-300 hover:bg-gray-50">
        <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
        </svg>
        Google로 계속하기
      </Button>
    </div>
  );
}
