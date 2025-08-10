import { Suspense } from 'react';
import AuthPageClient from './components/AuthPageClient';

export default function AuthPage() {
  return (
    <Suspense fallback={
      <div className="container mx-auto md:py-10 py-0">
        <div className="flex flex-col items-center justify-center min-h-[80vh]">
          <div className="w-full md:max-w-md max-w-full md:p-8 p-4 space-y-8 bg-white md:rounded-xl md:shadow-lg rounded-none shadow-none">
            <div className="text-center mb-6">
              <h1 className="text-2xl font-bold text-green-600">인스쿨즈</h1>
              <p className="mt-2 text-gray-600">로딩 중...</p>
            </div>
          </div>
        </div>
      </div>
    }>
      <AuthPageClient />
    </Suspense>
  );
} 