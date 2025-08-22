'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Eye, EyeOff, Phone, Mail, Check, X, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { z } from 'zod';
import { registerWithEmail, registerWithPhoneNumber, confirmPhoneVerificationCode, createRecaptchaVerifier, checkUserNameAvailability, checkPhoneNumberExists, checkEmailExists, startKakaoLogin } from '@/lib/auth';
import Link from 'next/link';
import type { ConfirmationResult, RecaptchaVerifier } from 'firebase/auth';

// 스키마 정의
const emailSignupSchema = z.object({
  email: z.string().email('올바른 이메일 형식이 아닙니다.'),
  password: z.string().min(6, '비밀번호는 최소 6자 이상이어야 합니다.'),
  confirmPassword: z.string(),
  userName: z.string().min(2, '닉네임은 최소 2자 이상이어야 합니다.'),
  agreeTerms: z.boolean().refine(val => val === true, {
    message: '이용약관에 동의해주세요.',
  }),
  agreePrivacy: z.boolean().refine(val => val === true, {
    message: '개인정보처리방침에 동의해주세요.',
  }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "비밀번호가 일치하지 않습니다.",
  path: ["confirmPassword"],
});

const phoneSignupSchema = z.object({
  phoneNumber: z.string().regex(/^01[0-9]-\d{4}-\d{4}$/, '올바른 휴대폰 번호 형식이 아닙니다. (예: 010-1234-5678)'),
  userName: z.string().min(2, '닉네임은 최소 2자 이상이어야 합니다.'),
  verificationCode: z.string().length(6, '인증번호는 6자리여야 합니다.'),
  agreeTerms: z.boolean().refine(val => val === true, {
    message: '이용약관에 동의해주세요.',
  }),
  agreePrivacy: z.boolean().refine(val => val === true, {
    message: '개인정보처리방침에 동의해주세요.',
  }),
});

type EmailSignupFormData = z.infer<typeof emailSignupSchema>;
type PhoneSignupFormData = z.infer<typeof phoneSignupSchema>;

export function SimpleSignupForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [signupMethod, setSignupMethod] = useState<'email' | 'phone'>('email');
  const router = useRouter();

  // 이메일 회원가입 폼 데이터
  const [emailFormData, setEmailFormData] = useState<Partial<EmailSignupFormData>>({
    email: '',
    password: '',
    confirmPassword: '',
    userName: '',
    agreeTerms: false,
    agreePrivacy: false,
  });

  // 휴대폰 회원가입 폼 데이터
  const [phoneFormData, setPhoneFormData] = useState<Partial<PhoneSignupFormData>>({
    phoneNumber: '',
    userName: '',
    verificationCode: '',
    agreeTerms: false,
    agreePrivacy: false,
  });

  // 휴대폰 인증 관련 상태
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const [recaptchaVerifier, setRecaptchaVerifier] = useState<RecaptchaVerifier | null>(null);
  const [codeSent, setCodeSent] = useState(false);
  const recaptchaRef = useRef<HTMLDivElement>(null);

  // userName 중복 확인 상태
  const [emailUserNameStatus, setEmailUserNameStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle');
  const [phoneUserNameStatus, setPhoneUserNameStatus] = useState<'idle' | 'checking' | 'available' | 'taken'>('idle');
  
  // 휴대폰 번호 중복 확인 상태
  const [phoneNumberExists, setPhoneNumberExists] = useState<boolean>(false);

  useEffect(() => {
    // reCAPTCHA 컨테이너 설정
    if (signupMethod === 'phone' && !recaptchaVerifier) {
      // DOM이 렌더링된 후 reCAPTCHA 설정
      const timer = setTimeout(() => {
        try {
          const container = document.getElementById('recaptcha-container');
          if (container) {
            const verifier = createRecaptchaVerifier('recaptcha-container');
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

    // 정리 함수: 회원가입 방식이 변경되면 기존 verifier 정리
    return () => {
      if (signupMethod !== 'phone' && recaptchaVerifier) {
        try {
          recaptchaVerifier.clear();
          setRecaptchaVerifier(null);
        } catch (verifierError) {
          console.warn('reCAPTCHA verifier 정리 중 오류:', verifierError);
        }
      }
    };
  }, [signupMethod, recaptchaVerifier]);

  // 이메일 폼 데이터 업데이트
  const updateEmailFormData = (key: keyof EmailSignupFormData, value: EmailSignupFormData[keyof EmailSignupFormData]) => {
    setEmailFormData(prev => ({ ...prev, [key]: value }));
  };

  // 휴대폰 폼 데이터 업데이트
  const updatePhoneFormData = (key: keyof PhoneSignupFormData, value: PhoneSignupFormData[keyof PhoneSignupFormData]) => {
    setPhoneFormData(prev => ({ ...prev, [key]: value }));
  };

  // 이메일 userName 중복 확인
  const checkEmailUserName = async () => {
    const userName = emailFormData.userName?.trim();
    
    if (!userName || userName.length < 2) {
      toast.error('닉네임은 최소 2자 이상이어야 합니다.');
      return;
    }

    try {
      setEmailUserNameStatus('checking');
      const isAvailable = await checkUserNameAvailability(userName);
      setEmailUserNameStatus(isAvailable ? 'available' : 'taken');
      
      if (isAvailable) {
        toast.success('사용 가능한 닉네임입니다.');
      } else {
        toast.error('이미 사용 중인 닉네임입니다.');
      }
    } catch {
      setEmailUserNameStatus('idle');
      toast.error('중복 확인 중 오류가 발생했습니다.');
    }
  };

  // 휴대폰 userName 중복 확인
  const checkPhoneUserName = async () => {
    const userName = phoneFormData.userName?.trim();
    
    if (!userName || userName.length < 2) {
      toast.error('닉네임은 최소 2자 이상이어야 합니다.');
      return;
    }

    try {
      setPhoneUserNameStatus('checking');
      const isAvailable = await checkUserNameAvailability(userName);
      setPhoneUserNameStatus(isAvailable ? 'available' : 'taken');
      
      if (isAvailable) {
        toast.success('사용 가능한 닉네임입니다.');
      } else {
        toast.error('이미 사용 중인 닉네임입니다.');
      }
    } catch {
      setPhoneUserNameStatus('idle');
      toast.error('중복 확인 중 오류가 발생했습니다.');
    }
  };

  // 휴대폰 번호 포맷팅
  const formatPhoneNumber = (value: string) => {
    const numbers = value.replace(/[^\d]/g, '');
    if (numbers.length <= 3) return numbers;
    if (numbers.length <= 7) return `${numbers.slice(0, 3)}-${numbers.slice(3)}`;
    return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7, 11)}`;
  };

  // 이메일 회원가입
  const handleEmailSignup = async () => {
    try {
      const validated = emailSignupSchema.parse(emailFormData);
      
      // userName 중복 확인
      if (emailUserNameStatus === 'taken') {
        toast.error('이미 사용 중인 닉네임입니다.');
        return;
      }
      
      if (emailUserNameStatus !== 'available') {
        toast.error('닉네임 중복 확인을 해주세요.');
        return;
      }
      
      setIsLoading(true);
      
      // 이메일 중복 확인
      const emailExists = await checkEmailExists(validated.email);
      if (emailExists) {
        toast.error('이미 가입된 이메일입니다. 로그인 화면에서 로그인 바랍니다.');
        setIsLoading(false);
        return;
      }
      
      // 최종 userName 중복 확인 (동시 가입 방지)
      const isUserNameAvailable = await checkUserNameAvailability(validated.userName);
      if (!isUserNameAvailable) {
        toast.error('죄송합니다. 해당 닉네임이 방금 다른 사용자에 의해 사용되었습니다.');
        setEmailUserNameStatus('taken');
        setIsLoading(false);
        return;
      }
      
      await registerWithEmail(validated.email, validated.password, validated.userName);
      
      toast.success('회원가입이 완료되었습니다!');
      
      // 회원가입 성공 후 잠시 기다린 후 홈으로 이동
      await new Promise(resolve => setTimeout(resolve, 1000));
      router.push('/');
      
    } catch (error) {
      if (error instanceof z.ZodError) {
        const firstError = error.errors[0];
        toast.error(firstError.message);
      } else {
        console.error('이메일 회원가입 실패:', error);
        toast.error(error instanceof Error ? error.message : '회원가입에 실패했습니다.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // 휴대폰 인증번호 발송
  const handleSendPhoneCode = async () => {
    try {
      if (!phoneFormData.phoneNumber || !phoneFormData.userName) {
        toast.error('휴대폰 번호와 닉네임을 입력해주세요.');
        return;
      }

      if (!recaptchaVerifier) {
        toast.error('reCAPTCHA 인증을 다시 시도해주세요.');
        return;
      }

      setIsLoading(true);
      
      // 휴대폰 번호 중복 확인
      const phoneExists = await checkPhoneNumberExists(phoneFormData.phoneNumber);

      if (phoneExists) {
        setIsLoading(false);
        setPhoneNumberExists(true);
        toast.error('이미 가입된 번호입니다. 로그인 화면에서 로그인 바랍니다.');
        return;
      }
      
      const result = await registerWithPhoneNumber(
        phoneFormData.phoneNumber,
        phoneFormData.userName,
        recaptchaVerifier
      );
      
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
            const newVerifier = createRecaptchaVerifier('recaptcha-container');
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

  // 휴대폰 회원가입 완료
  const handlePhoneSignup = async () => {
    try {
      const validated = phoneSignupSchema.parse(phoneFormData);
      
      if (!confirmationResult) {
        toast.error('먼저 인증번호를 요청해주세요.');
        return;
      }

      // userName 중복 확인
      if (phoneUserNameStatus === 'taken') {
        toast.error('이미 사용 중인 닉네임입니다.');
        return;
      }
      
      if (phoneUserNameStatus !== 'available') {
        toast.error('닉네임 중복 확인을 해주세요.');
        return;
      }

      setIsLoading(true);
      
      // 최종 userName 중복 확인 (동시 가입 방지)
      const isUserNameAvailable = await checkUserNameAvailability(validated.userName);
      if (!isUserNameAvailable) {
        toast.error('죄송합니다. 해당 닉네임이 방금 다른 사용자에 의해 사용되었습니다.');
        setPhoneUserNameStatus('taken');
        setIsLoading(false);
        return;
      }
      
      await confirmPhoneVerificationCode(
        confirmationResult,
        validated.verificationCode,
        validated.userName
      );
      
      toast.success('회원가입이 완료되었습니다!');
      
      // 회원가입 성공 후 잠시 기다린 후 홈으로 이동
      await new Promise(resolve => setTimeout(resolve, 1000));
      router.push('/');
      
    } catch (error) {
      if (error instanceof z.ZodError) {
        const firstError = error.errors[0];
        toast.error(firstError.message);
      } else {
        console.error('휴대폰 회원가입 실패:', error);
        toast.error(error instanceof Error ? error.message : '회원가입에 실패했습니다.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto space-y-6">
      {/* 헤더 */}
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold text-gray-900">회원가입</h1>
        <p className="text-gray-600">인스쿨즈에 오신 것을 환영합니다</p>
      </div>

      {/* 회원가입 방법 선택 */}
      <div className="grid grid-cols-2 gap-3 p-1 bg-green-100 rounded-lg">
        <button
          onClick={() => {
            setSignupMethod('email');
            setCodeSent(false);
            setPhoneNumberExists(false);
          }}
          className={`flex items-center justify-center gap-2 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            signupMethod === 'email'
              ? 'bg-white text-green-700 shadow-sm'
              : 'text-green-600 hover:text-green-700'
          }`}
        >
          <Mail className="h-4 w-4" />
          이메일
        </button>
        <button
          onClick={() => {
            setSignupMethod('phone');
            setCodeSent(false);
            setPhoneNumberExists(false);
          }}
          className={`flex items-center justify-center gap-2 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
            signupMethod === 'phone'
              ? 'bg-white text-green-700 shadow-sm'
              : 'text-green-600 hover:text-green-700'
          }`}
        >
          <Phone className="h-4 w-4" />
          휴대폰
        </button>
      </div>

      {/* 회원가입 폼 */}
      <div className="space-y-4">
        {signupMethod === 'email' ? (
          <>
            {/* 이메일 */}
            <div className="space-y-2">
              <Label htmlFor="signup-email" className="text-sm font-medium text-gray-700">
                이메일
              </Label>
              <Input
                id="signup-email"
                type="email"
                placeholder="name@example.com"
                value={emailFormData.email || ''}
                onChange={(e) => updateEmailFormData('email', e.target.value)}
                className="h-11"
              />
            </div>

            {/* 닉네임 */}
            <div className="space-y-2">
              <Label htmlFor="signup-userName" className="text-sm font-medium text-gray-700">
                닉네임
              </Label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Input
                    id="signup-userName"
                    type="text"
                    placeholder="닉네임 (2자 이상)"
                    value={emailFormData.userName || ''}
                    onChange={(e) => {
                      const value = e.target.value;
                      updateEmailFormData('userName', value);
                      setEmailUserNameStatus('idle');
                    }}
                    className={`h-11 pr-10 ${
                      emailUserNameStatus === 'available' ? 'border-green-500' :
                      emailUserNameStatus === 'taken' ? 'border-red-500' : ''
                    }`}
                  />
                  {emailUserNameStatus === 'available' && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-green-600">
                      <Check className="h-4 w-4" />
                    </div>
                  )}
                  {emailUserNameStatus === 'taken' && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-red-600">
                      <X className="h-4 w-4" />
                    </div>
                  )}
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={checkEmailUserName}
                  disabled={emailUserNameStatus === 'checking' || !emailFormData.userName?.trim() || emailFormData.userName.trim().length < 2}
                  className="h-11 px-4 whitespace-nowrap"
                >
                  {emailUserNameStatus === 'checking' ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    '중복 확인'
                  )}
                </Button>
              </div>
              {emailUserNameStatus === 'available' && (
                <p className="text-sm text-green-600">사용 가능한 닉네임입니다.</p>
              )}
              {emailUserNameStatus === 'taken' && (
                <p className="text-sm text-red-600">이미 사용 중인 닉네임입니다.</p>
              )}
            </div>

            {/* 비밀번호 */}
            <div className="space-y-2">
              <Label htmlFor="signup-password" className="text-sm font-medium text-gray-700">
                비밀번호
              </Label>
              <div className="relative">
                <Input
                  id="signup-password"
                  type={showPassword ? "text" : "password"}
                  placeholder="비밀번호 (6자 이상)"
                  value={emailFormData.password || ''}
                  onChange={(e) => updateEmailFormData('password', e.target.value)}
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

            {/* 비밀번호 확인 */}
            <div className="space-y-2">
              <Label htmlFor="signup-confirmPassword" className="text-sm font-medium text-gray-700">
                비밀번호 확인
              </Label>
              <div className="relative">
                <Input
                  id="signup-confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="비밀번호를 다시 입력하세요"
                  value={emailFormData.confirmPassword || ''}
                  onChange={(e) => updateEmailFormData('confirmPassword', e.target.value)}
                  className="h-11 pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-11 px-3 hover:bg-transparent"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4 text-gray-400" /> : <Eye className="h-4 w-4 text-gray-400" />}
                </Button>
              </div>
            </div>

            {/* 약관 동의 */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="email-agreeTerms"
                  checked={emailFormData.agreeTerms || false}
                  onCheckedChange={(checked) => updateEmailFormData('agreeTerms', checked as boolean)}
                />
                <Label htmlFor="email-agreeTerms" className="text-sm text-gray-700">
                  <Link href="/terms" className="text-green-600 hover:underline">이용약관</Link>에 동의합니다
                </Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="email-agreePrivacy"
                  checked={emailFormData.agreePrivacy || false}
                  onCheckedChange={(checked) => updateEmailFormData('agreePrivacy', checked as boolean)}
                />
                <Label htmlFor="email-agreePrivacy" className="text-sm text-gray-700">
                  <Link href="/privacy" className="text-green-600 hover:underline">개인정보처리방침</Link>에 동의합니다
                </Label>
              </div>
            </div>

            <Button 
              onClick={handleEmailSignup} 
              className="w-full h-11 bg-green-600 hover:bg-green-700" 
              disabled={isLoading}
            >
              {isLoading ? '회원가입 중...' : '회원가입'}
            </Button>
          </>
        ) : (
          <>
            {/* 휴대폰 번호 */}
            <div className="space-y-2">
              <Label htmlFor="signup-phoneNumber" className="text-sm font-medium text-gray-700">
                휴대폰 번호
              </Label>
              <Input
                id="signup-phoneNumber"
                type="tel"
                placeholder="010-1234-5678"
                value={phoneFormData.phoneNumber || ''}
                onChange={(e) => {
                  const formatted = formatPhoneNumber(e.target.value);
                  updatePhoneFormData('phoneNumber', formatted);
                  setPhoneNumberExists(false);
                }}
                maxLength={13}
                className={`h-11 ${phoneNumberExists ? 'border-red-500' : ''}`}
              />
              {phoneNumberExists && (
                <p className="text-sm text-red-600">이미 가입된 번호입니다. 로그인 화면에서 로그인 바랍니다.</p>
              )}
            </div>

            {/* 닉네임 */}
            <div className="space-y-2">
              <Label htmlFor="signup-phone-userName" className="text-sm font-medium text-gray-700">
                닉네임
              </Label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Input
                    id="signup-phone-userName"
                    type="text"
                    placeholder="닉네임 (2자 이상)"
                    value={phoneFormData.userName || ''}
                    onChange={(e) => {
                      const value = e.target.value;
                      updatePhoneFormData('userName', value);
                      setPhoneUserNameStatus('idle');
                    }}
                    className={`h-11 pr-10 ${
                      phoneUserNameStatus === 'available' ? 'border-green-500' :
                      phoneUserNameStatus === 'taken' ? 'border-red-500' : ''
                    }`}
                  />
                  {phoneUserNameStatus === 'available' && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-green-600">
                      <Check className="h-4 w-4" />
                    </div>
                  )}
                  {phoneUserNameStatus === 'taken' && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-red-600">
                      <X className="h-4 w-4" />
                    </div>
                  )}
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={checkPhoneUserName}
                  disabled={phoneUserNameStatus === 'checking' || !phoneFormData.userName?.trim() || phoneFormData.userName.trim().length < 2}
                  className="h-11 px-4 whitespace-nowrap"
                >
                  {phoneUserNameStatus === 'checking' ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    '중복 확인'
                  )}
                </Button>
              </div>
              {phoneUserNameStatus === 'available' && (
                <p className="text-sm text-green-600">사용 가능한 닉네임입니다.</p>
              )}
              {phoneUserNameStatus === 'taken' && (
                <p className="text-sm text-red-600">이미 사용 중인 닉네임입니다.</p>
              )}
            </div>

            {!codeSent ? (
              <>
                {/* 약관 동의 */}
                <div className="space-y-3 pt-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="phone-agreeTerms"
                      checked={phoneFormData.agreeTerms || false}
                      onCheckedChange={(checked) => updatePhoneFormData('agreeTerms', checked as boolean)}
                    />
                    <Label htmlFor="phone-agreeTerms" className="text-sm text-gray-700">
                      <Link href="/terms" className="text-green-600 hover:underline">이용약관</Link>에 동의합니다
                    </Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="phone-agreePrivacy"
                      checked={phoneFormData.agreePrivacy || false}
                      onCheckedChange={(checked) => updatePhoneFormData('agreePrivacy', checked as boolean)}
                    />
                    <Label htmlFor="phone-agreePrivacy" className="text-sm text-gray-700">
                      <Link href="/privacy" className="text-green-600 hover:underline">개인정보처리방침</Link>에 동의합니다
                    </Label>
                  </div>
                </div>

                <Button 
                  onClick={handleSendPhoneCode} 
                  className="w-full h-11 bg-green-600 hover:bg-green-700" 
                  disabled={isLoading}
                >
                  {isLoading ? '발송 중...' : '인증번호 발송'}
                </Button>
              </>
            ) : (
              <>
                {/* 인증번호 */}
                <div className="space-y-2">
                  <Label htmlFor="signup-verificationCode" className="text-sm font-medium text-gray-700">
                    인증번호
                  </Label>
                  <Input
                    id="signup-verificationCode"
                    type="text"
                    placeholder="6자리 인증번호"
                    value={phoneFormData.verificationCode || ''}
                    onChange={(e) => {
                      const value = e.target.value.replace(/[^\d]/g, '').slice(0, 6);
                      updatePhoneFormData('verificationCode', value);
                    }}
                    maxLength={6}
                    className="h-11 text-center tracking-widest text-lg"
                  />
                </div>

                <Button 
                  onClick={handlePhoneSignup} 
                  className="w-full h-11 bg-green-600 hover:bg-green-700" 
                  disabled={isLoading}
                >
                  {isLoading ? '회원가입 중...' : '회원가입'}
                </Button>
              </>
            )}
          </>
        )}
      </div>

      {/* reCAPTCHA 컨테이너 */}
      <div id="recaptcha-container" ref={recaptchaRef}></div>
      
      {/* 구분선 */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-200"></div>
        </div>
        <div className="relative flex justify-center text-sm">
          <span className="bg-white px-4 text-gray-500">또는</span>
        </div>
      </div>
      
      {/* 소셜 회원가입 버튼들 */}
      <div className="space-y-3">
        {/* 카카오 회원가입 */}
        <Button 
          variant="outline" 
          className="w-full h-11 border-yellow-300 bg-yellow-400 hover:bg-yellow-500 text-black font-medium"
          onClick={() => {
            try {
              startKakaoLogin();
            } catch {
              toast.error('카카오 로그인을 시작할 수 없습니다.');
            }
          }}
        >
          <svg className="h-5 w-5 mr-2" viewBox="0 0 24 24" fill="none">
            <path 
              d="M12 3C6.48 3 2 6.58 2 11c0 2.89 1.93 5.46 4.89 6.86L6.5 21.5c-.12.35.18.65.53.53l3.64-1.39C11.09 21 11.54 21 12 21c5.52 0 10-3.58 10-8s-4.48-8-10-8z" 
              fill="currentColor"
            />
          </svg>
          카카오로 계속하기
        </Button>

        {/* Google 회원가입 */}
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
    </div>
  );
}