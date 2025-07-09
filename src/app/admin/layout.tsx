import React from 'react';
import AdminSidebar from '@/components/admin/AdminSidebar';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: '관리자 페이지 | 인스쿨즈',
  description: '인스쿨즈 관리자 시스템',
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-background">
      {/* 사이드바 */}
      <AdminSidebar />
      
      {/* 메인 콘텐츠 */}
      <main className="flex-1 overflow-auto">
        <div className="container mx-auto py-6 max-w-6xl">
          {children}
        </div>
      </main>
    </div>
  );
} 