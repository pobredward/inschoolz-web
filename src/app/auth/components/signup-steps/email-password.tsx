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
import { Eye, EyeOff, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { checkEmailAvailability } from '@/lib/api/users';
import { FormDataType } from '@/types';

const emailPasswordSchema = z.object({
  email: z.string().email({ message: '유효한 이메일 주소를 입력해주세요.' }),
  password: z.string().min(8, { message: '비밀번호는 최소 8자 이상이어야 합니다.' }),
  passwordConfirm: z.string(),
}).refine((data) => data.password === data.passwordConfirm, {
  message: "비밀번호가 일치하지 않습니다.",
  path: ["passwordConfirm"],
});

type EmailPasswordValues = z.infer<typeof emailPasswordSchema>;

interface EmailPasswordStepProps {
  formData: FormDataType;
  updateFormData: (data: Partial<FormDataType>) => void;
  onNext: () => void;
  onValidationChange?: (isValid: boolean) => void;
}

export function EmailPasswordStep({ formData, updateFormData, onNext, onValidationChange }: EmailPasswordStepProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);
  const [emailStatus, setEmailStatus] = useState<{
    status: 'idle' | 'checking' | 'available' | 'unavailable';
    message?: string;
  }>({ status: 'idle' });

  const form = useForm<EmailPasswordValues>({
    resolver: zodResolver(emailPasswordSchema),
    defaultValues: {
      email: formData.email || '',
      password: formData.password || '',
      passwordConfirm: formData.passwordConfirm || '',
    },
  });

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
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [form.watch('email'), checkEmail]);

  // 이메일 필드에서 포커스가 벗어날 때 즉시 검증
  const handleEmailBlur = () => {
    const emailValue = form.getValues('email');
    if (emailValue && emailValue.trim() !== '') {
      checkEmail(emailValue);
    }
  };

  // 검증 상태가 변경될 때마다 부모에게 알림
  useEffect(() => {
    if (onValidationChange) {
      const isEmailValid = emailStatus.status === 'available';
      const hasRequiredFields = !!(formData.email && formData.password && formData.passwordConfirm);
      const passwordsMatch = formData.password === formData.passwordConfirm;
      
      // 필수 필드가 모두 있고, 비밀번호가 일치하며, 이메일 중복 체크를 통과한 경우 유효
      const isValid = hasRequiredFields && passwordsMatch && 
        (emailStatus.status === 'idle' || isEmailValid);
      
      onValidationChange(isValid);
    }
  }, [emailStatus.status, formData.email, formData.password, formData.passwordConfirm, onValidationChange]);

  // 필드 변경 시 실시간으로 상위 컴포넌트에 데이터 업데이트
  const handleFieldChange = (field: keyof EmailPasswordValues, value: string) => {
    form.setValue(field, value);
    updateFormData({ [field]: value });
  };

  const onSubmit = (values: EmailPasswordValues) => {
    updateFormData(values);
    onNext();
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold">기본 정보 입력</h2>
      <p className="text-sm text-gray-600">이메일과 비밀번호를 입력해주세요.</p>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>이메일</FormLabel>
                <FormControl>
                  <Input 
                    type="email"
                    placeholder="example@email.com" 
                    {...field} 
                    onChange={(e) => {
                      field.onChange(e);
                      handleFieldChange('email', e.target.value);
                    }}
                    onBlur={handleEmailBlur}
                  />
                </FormControl>
                <FormMessage />
                {emailStatus.status === 'checking' && (
                  <p className="text-sm text-gray-500 mt-1">
                    <Loader2 className="mr-1 h-4 w-4 animate-spin" /> 이메일 검증 중...
                  </p>
                )}
                {emailStatus.status === 'available' && (
                  <p className="text-sm text-green-600 mt-1">
                    <CheckCircle className="mr-1 h-4 w-4" /> 사용 가능한 이메일입니다.
                  </p>
                )}
                {emailStatus.status === 'unavailable' && (
                  <p className="text-sm text-red-600 mt-1">
                    <XCircle className="mr-1 h-4 w-4" /> 이미 사용 중인 이메일입니다.
                  </p>
                )}
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>비밀번호</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input 
                      type={showPassword ? "text" : "password"}
                      placeholder="8자 이상 입력" 
                      {...field} 
                      onChange={(e) => {
                        field.onChange(e);
                        handleFieldChange('password', e.target.value);
                      }}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
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
                  <div className="relative">
                    <Input 
                      type={showPasswordConfirm ? "text" : "password"}
                      placeholder="비밀번호 재입력" 
                      {...field} 
                      onChange={(e) => {
                        field.onChange(e);
                        handleFieldChange('passwordConfirm', e.target.value);
                      }}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                      onClick={() => setShowPasswordConfirm(!showPasswordConfirm)}
                    >
                      {showPasswordConfirm ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </form>
      </Form>
    </div>
  );
} 