import { Suspense } from 'react';
import CommunityPageClient from './components/CommunityPageClient';

export default function CommunityPage() {
  return (
    <Suspense fallback={
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">커뮤니티</h1>
          <p className="text-gray-600">로딩 중...</p>
        </div>
      </div>
    }>
      <CommunityPageClient />
    </Suspense>
  );
} 