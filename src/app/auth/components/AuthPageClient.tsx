'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { LoginForm } from './login-form';
import { SignupForm } from './signup-form';

export default function AuthPageClient() {
  const searchParams = useSearchParams();
  const tabParam = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState<string>(tabParam === 'signup' ? 'signup' : 'login');

  // URL 쿼리 파라미터가 변경되면 탭 업데이트
  useEffect(() => {
    if (tabParam) {
      setActiveTab(tabParam === 'signup' ? 'signup' : 'login');
    }
  }, [tabParam]);

  return (
    <div className="md:container md:mx-auto md:py-10 py-0 px-0">
      <div className="flex flex-col items-center justify-center min-h-[80vh]">
        <div className="w-full md:max-w-md max-w-full md:p-8 p-2 md:space-y-8 space-y-6 bg-white md:rounded-xl md:shadow-lg rounded-none shadow-none">
          <div className="text-center md:mb-6 mb-4">
            <Link href="/" className="inline-block">
              <h1 className="text-2xl font-bold text-green-600">인스쿨즈</h1>
            </Link>
            <p className="mt-2 text-gray-600">학교 커뮤니티에 오신 것을 환영합니다</p>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 md:mb-8 mb-6">
              <TabsTrigger value="login">로그인</TabsTrigger>
              <TabsTrigger value="signup">회원가입</TabsTrigger>
            </TabsList>
            <TabsContent value="login">
              <LoginForm />
            </TabsContent>
            <TabsContent value="signup">
              <SignupForm />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
} 