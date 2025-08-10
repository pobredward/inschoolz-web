'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
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
import { useAuth } from '@/providers/AuthProvider';
import { Eye, EyeOff } from 'lucide-react';

const loginSchema = z.object({
  email: z
    .string()
    .min(1, { message: '이메일을 입력해주세요.' })
    .email({ message: '유효한 이메일 주소를 입력해주세요.' }),
  password: z
    .string()
    .min(6, { message: '비밀번호는 최소 6자 이상이어야 합니다.' }),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export function LoginForm() {
  const { signIn, signInWithGoogle, error, isLoading, resetError } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (values: LoginFormValues) => {
    try {
      resetError();
      console.log('🚀 LoginForm: 로그인 시작');
      await signIn(values.email, values.password);
      
      console.log('✅ LoginForm: signIn 완료, AuthProvider 상태 업데이트 대기 중...');
      
      // AuthProvider의 상태 업데이트를 충분히 기다림 (쿠키 설정 + 사용자 정보 로드)
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // 로그인 성공 후 리디렉션
      const redirectUrl = searchParams.get('redirect') || '/';
      console.log('🏠 LoginForm: 리다이렉트 시작', { redirectUrl });
      router.push(redirectUrl);
    } catch (error) {
      // 에러는 AuthProvider에서 이미 처리됨
      console.error('❌ LoginForm: 로그인 실패:', error);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      resetError();
      console.log('🚀 LoginForm: Google 로그인 시작');
      await signInWithGoogle();
      
      console.log('✅ LoginForm: Google signIn 완료, AuthProvider 상태 업데이트 대기 중...');
      
      // AuthProvider의 상태 업데이트를 충분히 기다림 (쿠키 설정 + 사용자 정보 로드)
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // 로그인 성공 후 리디렉션
      const redirectUrl = searchParams.get('redirect') || '/';
      console.log('🏠 LoginForm: Google 리다이렉트 시작', { redirectUrl });
      router.push(redirectUrl);
    } catch (error) {
      // 에러는 AuthProvider에서 이미 처리됨
      console.error('❌ LoginForm: Google 로그인 실패:', error);
    }
  };

  return (
    <div className="space-y-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>이메일</FormLabel>
                <FormControl>
                  <Input placeholder="이메일을 입력하세요" {...field} />
                </FormControl>
                <FormMessage />
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
                      placeholder="비밀번호를 입력하세요" 
                      {...field} 
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
          
          {error && (
            <div className="text-red-500 text-sm mt-2">{error}</div>
          )}
          
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? '로그인 중...' : '로그인'}
          </Button>
        </form>
      </Form>
      
      <div className="flex items-center justify-between text-sm">
        <Link href="/auth/reset-password" className="text-green-600 hover:underline">
          비밀번호 찾기
        </Link>
      </div>
      
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-300"></div>
        </div>
        <div className="relative flex justify-center text-xs">
          <span className="bg-white px-2 text-gray-500">또는</span>
        </div>
      </div>
      
      <div className="grid grid-cols-1 gap-3">
        <Button
          variant="outline"
          className="flex items-center justify-center gap-2"
          onClick={handleGoogleSignIn}
          disabled={isLoading}
        >
          <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12.545 10.239v3.821h5.445c-.712 2.315-2.647 3.972-5.445 3.972a6.033 6.033 0 1 1 0-12.064c1.498 0 2.866.549 3.921 1.453l2.814-2.814A9.969 9.969 0 0 0 12.545 2C7.021 2 2.543 6.477 2.543 12s4.478 10 10.002 10c8.396 0 10.249-7.85 9.426-11.748l-9.426-.013z" />
          </svg>
          구글로 로그인
        </Button>
      </div>
    </div>
  );
} 