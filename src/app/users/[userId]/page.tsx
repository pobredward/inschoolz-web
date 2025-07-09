import React from 'react';
import { notFound } from 'next/navigation';
import UserProfileContainer from './components/UserProfileContainer';
import { getUserById } from '@/lib/api/users';

export default async function UserProfilePage({ params }: { params: Promise<{ userId: string }> }) {
  const { userId } = await params;
  
  try {
    const user = await getUserById(userId);
    
    if (!user) {
      return notFound();
    }
    
    return <UserProfileContainer user={user} />;
  } catch (error) {
    console.error('사용자 정보 조회 오류:', error);
    return notFound();
  }
} 