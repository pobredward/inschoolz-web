'use client';

import { useState, useEffect, useCallback } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { checkReferralExists } from '@/lib/api/schools';
import { checkUserNameAvailability, checkEmailAvailability } from '@/lib/api/users';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';

const basicInfoSchema = z.object({
  userName: z.string()
    .min(5, { message: '아이디는 최소 5자 이상이어야 합니다.' })
    .max(20, { message: '아이디는 최대 20자까지 가능합니다.' })
    .regex(/^[a-z0-9]+$/, { message: '아이디는 영문 소문자와 숫자만 사용 가능합니다.' }),
  email: z.string()
    .email({ message: '유효한 이메일 주소를 입력해주세요.' }),
  password: z.string()
    .min(8, { message: '비밀번호는 최소 8자 이상이어야 합니다.' }),
  passwordConfirm: z.string(),
  realName: z.string()
    .min(2, { message: '이름을 입력해주세요.' }),
  gender: z.string().optional(),
  birthYear: z.string().optional(),
  birthMonth: z.string().optional(), 
  birthDay: z.string().optional(),
  phoneNumber: z.string().optional(),
  referral: z.string().optional(),
}).refine((data) => data.password === data.passwordConfirm, {
  message: "비밀번호가 일치하지 않습니다.",
  path: ["passwordConfirm"],
});

type BasicInfoValues = z.infer<typeof basicInfoSchema>;

import { FormDataType } from '@/types';

interface BasicInfoStepProps {
  formData: FormDataType;
  updateFormData: (data: Partial<FormDataType>) => void;
}

export function BasicInfoStep({ formData, updateFormData }: BasicInfoStepProps) {
  const [verificationSent, setVerificationSent] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [referralStatus, setReferralStatus] = useState<{
    status: 'idle' | 'checking' | 'valid' | 'invalid';
    message?: string;
  }>({ status: 'idle' });
  const [userNameStatus, setUserNameStatus] = useState<{
    status: 'idle' | 'checking' | 'available' | 'unavailable';
    message?: string;
  }>({ status: 'idle' });
  const [emailStatus, setEmailStatus] = useState<{
    status: 'idle' | 'checking' | 'available' | 'unavailable';
    message?: string;
  }>({ status: 'idle' });

  const form = useForm<BasicInfoValues>({
    resolver: zodResolver(basicInfoSchema),
    defaultValues: {
      userName: formData.userName || '',
      email: formData.email || '',
      password: formData.password || '',
      passwordConfirm: formData.passwordConfirm || '',
      realName: formData.realName || '',
      gender: formData.gender || '',
      birthYear: formData.birthYear || new Date().getFullYear() - 15,
      birthMonth: formData.birthMonth || 1,
      birthDay: formData.birthDay || 1,
      phoneNumber: formData.phoneNumber || '',
      referral: formData.referral || '',
    },
  });

  const sendVerificationCode = () => {
    const phone = form.getValues('phoneNumber');
    if (!phone || phone.length < 10) {
      form.setError('phoneNumber', { message: '올바른 휴대폰 번호를 입력해주세요.' });
      return;
    }
    
    // 여기서 실제 인증번호 전송 API를 호출해야 함
    console.log('인증번호 전송:', phone);
    setVerificationSent(true);
  };

  const verifyCode = () => {
    // 여기서 실제 인증번호 확인 API를 호출해야 함
    console.log('인증번호 확인:', verificationCode);
    // 인증 성공 처리
  };

  const onSubmit = (values: BasicInfoValues) => {
    // 폼 제출 시 상위 컴포넌트로 데이터 전달
    updateFormData(values);
  };

  // 사용자명 중복 체크 함수
  const checkUserName = useCallback(async (userName: string) => {
    if (!userName || userName.trim() === '') {
      setUserNameStatus({ status: 'idle' });
      return;
    }

    setUserNameStatus({ status: 'checking' });

    try {
      const result = await checkUserNameAvailability(userName);
      if (result.isAvailable) {
        setUserNameStatus({ 
          status: 'available', 
          message: result.message 
        });
      } else {
        setUserNameStatus({ 
          status: 'unavailable', 
          message: result.message 
        });
      }
    } catch {
      setUserNameStatus({ 
        status: 'unavailable', 
        message: '검증 중 오류가 발생했습니다.' 
      });
    }
  }, []);

  // 사용자명 입력 디바운싱
  useEffect(() => {
    const userNameValue = form.watch('userName');
    if (!userNameValue) {
      setUserNameStatus({ status: 'idle' });
      return;
    }

    const timeoutId = setTimeout(() => {
      checkUserName(userNameValue);
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [form.watch('userName'), checkUserName]);

  // 추천 아이디 검증 함수
  const checkReferral = useCallback(async (userName: string) => {
    if (!userName || userName.trim() === '') {
      setReferralStatus({ status: 'idle' });
      return;
    }

    setReferralStatus({ status: 'checking' });

    try {
      const result = await checkReferralExists(userName);
      if (result.exists) {
        setReferralStatus({ 
          status: 'valid', 
          message: `${result.displayName}님을 추천합니다!` 
        });
      } else {
        setReferralStatus({ 
          status: 'invalid', 
          message: '존재하지 않는 사용자입니다.' 
        });
      }
    } catch {
      setReferralStatus({ 
        status: 'invalid', 
        message: '검증 중 오류가 발생했습니다.' 
      });
    }
  }, []);

  // 추천 아이디 입력 디바운싱
  useEffect(() => {
    const referralValue = form.watch('referral');
    if (!referralValue) {
      setReferralStatus({ status: 'idle' });
      return;
    }

    const timeoutId = setTimeout(() => {
      checkReferral(referralValue);
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [form.watch('referral'), checkReferral]);

  // 이메일 중복 체크 함수
  const checkEmail = useCallback(async (email: string) => {
    if (!email || email.trim() === '') {
      setEmailStatus({ status: 'idle' });
      return;
    }

    setEmailStatus({ status: 'checking' });

    try {
      const result = await checkEmailAvailability(email);
      if (result.isAvailable) {
        setEmailStatus({ 
          status: 'available', 
          message: result.message 
        });
      } else {
        setEmailStatus({ 
          status: 'unavailable', 
          message: result.message 
        });
      }
    } catch {
      setEmailStatus({ 
        status: 'unavailable', 
        message: '검증 중 오류가 발생했습니다.' 
      });
    }
  }, []);

  // 이메일 입력 디바운싱
  useEffect(() => {
    const emailValue = form.watch('email');
    if (!emailValue) {
      setEmailStatus({ status: 'idle' });
      return;
    }

    const timeoutId = setTimeout(() => {
      checkEmail(emailValue);
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [form.watch('email'), checkEmail]);

  // 필드 변경 시 실시간으로 상위 컴포넌트에 데이터 업데이트
  const handleFieldChange = (field: keyof BasicInfoValues, value: string) => {
    form.setValue(field, value);
    updateFormData({ [field]: value });
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">기본 정보 입력</h2>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="userName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>아이디</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input 
                      placeholder="영문, 숫자 조합 5-20자" 
                      {...field} 
                      onChange={(e) => {
                        field.onChange(e);
                        handleFieldChange('userName', e.target.value);
                      }}
                    />
                    {userNameStatus.status === 'checking' && (
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                        <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                      </div>
                    )}
                    {userNameStatus.status === 'available' && (
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      </div>
                    )}
                    {userNameStatus.status === 'unavailable' && (
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                        <XCircle className="h-4 w-4 text-red-500" />
                      </div>
                    )}
                  </div>
                </FormControl>
                {userNameStatus.message && (
                  <p className={`text-sm ${
                    userNameStatus.status === 'available' 
                      ? 'text-green-600' 
                      : userNameStatus.status === 'unavailable'
                      ? 'text-red-600'
                      : 'text-gray-600'
                  }`}>
                    {userNameStatus.message}
                  </p>
                )}
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>이메일</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input 
                      type="email"
                      placeholder="example@email.com" 
                      {...field} 
                      onChange={(e) => {
                        field.onChange(e);
                        handleFieldChange('email', e.target.value);
                      }}
                    />
                    {emailStatus.status === 'checking' && (
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                        <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                      </div>
                    )}
                    {emailStatus.status === 'available' && (
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      </div>
                    )}
                    {emailStatus.status === 'unavailable' && (
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                        <XCircle className="h-4 w-4 text-red-500" />
                      </div>
                    )}
                  </div>
                </FormControl>
                {emailStatus.message && (
                  <p className={`text-sm ${
                    emailStatus.status === 'available' 
                      ? 'text-green-600' 
                      : emailStatus.status === 'unavailable'
                      ? 'text-red-600'
                      : 'text-gray-600'
                  }`}>
                    {emailStatus.message}
                  </p>
                )}
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>비밀번호</FormLabel>
                  <FormControl>
                    <Input 
                      type="password"
                      placeholder="8자 이상 입력" 
                      {...field} 
                      onChange={(e) => {
                        field.onChange(e);
                        handleFieldChange('password', e.target.value);
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="passwordConfirm"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>비밀번호 확인</FormLabel>
                  <FormControl>
                    <Input 
                      type="password"
                      placeholder="비밀번호 재입력" 
                      {...field} 
                      onChange={(e) => {
                        field.onChange(e);
                        handleFieldChange('passwordConfirm', e.target.value);
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="realName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>실명</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="실명을 입력하세요" 
                    {...field} 
                    onChange={(e) => {
                      field.onChange(e);
                      handleFieldChange('realName', e.target.value);
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="gender"
            render={({ field }) => (
              <FormItem>
                <FormLabel>성별 (선택사항)</FormLabel>
                <Select
                  value={field.value}
                  onValueChange={(value) => {
                    field.onChange(value);
                    handleFieldChange('gender', value);
                  }}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="성별 선택" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="male">남성</SelectItem>
                    <SelectItem value="female">여성</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-3 gap-4">
            <FormField
              control={form.control}
              name="birthYear"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>출생년도 (선택사항)</FormLabel>
                  <FormControl>
                    <Input 
                      type="text"
                      inputMode="numeric"
                      placeholder="2000" 
                      maxLength={4}
                      value={field.value?.toString() || ''}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, ''); // 숫자만 허용
                        const numValue = parseInt(value) || 0;
                        e.target.value = value;
                        field.onChange(numValue);
                        handleFieldChange('birthYear', numValue);
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="birthMonth"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>월</FormLabel>
                  <FormControl>
                    <Input 
                      type="text"
                      inputMode="numeric"
                      placeholder="01" 
                      maxLength={2}
                      value={field.value || ''}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, ''); // 숫자만 허용
                        if (value.length <= 2) {
                          const numValue = parseInt(value);
                          if ((numValue >= 1 && numValue <= 12) || value === '') {
                            field.onChange(value);
                            handleFieldChange('birthMonth', value);
                          }
                        }
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="birthDay"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>일</FormLabel>
                  <FormControl>
                    <Input 
                      type="text"
                      inputMode="numeric"
                      placeholder="01" 
                      maxLength={2}
                      value={field.value?.toString() || ''}
                      onChange={(e) => {
                        const value = e.target.value.replace(/\D/g, ''); // 숫자만 허용
                        const numValue = parseInt(value) || 0;
                        field.onChange(numValue);
                        handleFieldChange('birthDay', numValue);
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="phoneNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel>휴대폰번호 (선택사항)</FormLabel>
                <div className="flex gap-2">
                  <FormControl>
                    <Input 
                      placeholder="01012345678" 
                      {...field} 
                      onChange={(e) => {
                        field.onChange(e);
                        handleFieldChange('phoneNumber', e.target.value);
                      }}
                    />
                  </FormControl>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={sendVerificationCode}
                    disabled={verificationSent}
                  >
                    {verificationSent ? '전송완료' : '인증번호 전송'}
                  </Button>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />

          {verificationSent && (
            <div className="flex gap-2">
              <Input
                placeholder="인증번호 입력"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
              />
              <Button type="button" variant="outline" onClick={verifyCode}>
                인증확인
              </Button>
            </div>
          )}

          <FormField
            control={form.control}
            name="referral"
            render={({ field }) => (
              <FormItem>
                <FormLabel>추천인 아이디 (선택)</FormLabel>
                <div className="relative">
                  <FormControl>
                    <Input 
                      placeholder="추천인 아이디 입력" 
                      {...field} 
                      onChange={(e) => {
                        field.onChange(e);
                        handleFieldChange('referral', e.target.value);
                      }}
                      className={`pr-10 ${
                        referralStatus.status === 'valid' 
                          ? 'border-green-400 focus:border-green-400' 
                          : referralStatus.status === 'invalid' 
                          ? 'border-red-400 focus:border-red-400' 
                          : ''
                      }`}
                    />
                  </FormControl>
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    {referralStatus.status === 'checking' && (
                      <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                    )}
                    {referralStatus.status === 'valid' && (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    )}
                    {referralStatus.status === 'invalid' && (
                      <XCircle className="h-4 w-4 text-red-500" />
                    )}
                  </div>
                </div>
                {referralStatus.message && (
                  <p className={`text-xs mt-1 ${
                    referralStatus.status === 'valid' 
                      ? 'text-green-600' 
                      : 'text-red-600'
                  }`}>
                    {referralStatus.message}
                  </p>
                )}
                <FormMessage />
              </FormItem>
            )}
          />
        </form>
      </Form>
    </div>
  );
} 