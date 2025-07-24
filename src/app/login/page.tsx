import { Suspense } from 'react';
import LoginPageClient from './components/LoginPageClient';

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="container mx-auto py-10">
        <div className="flex flex-col items-center justify-center min-h-[80vh]">
          <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-xl shadow-lg">
            <div className="text-center mb-6">
              <h1 className="text-2xl font-bold text-green-600">인스쿨즈</h1>
              <p className="mt-2 text-gray-600">로딩 중...</p>
            </div>
          </div>
        </div>
      </div>
    }>
      <LoginPageClient />
    </Suspense>
  );
} 