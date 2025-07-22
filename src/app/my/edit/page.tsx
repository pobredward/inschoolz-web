import { Metadata } from 'next';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { getUserById } from '@/lib/api/users';
import { Toaster } from '@/components/ui/sonner';
import ProfileEditClient from '../../[userName]/edit/ProfileEditClient';
import { serializeUserForClient } from '@/lib/utils';

export const metadata: Metadata = {
  title: '프로필 수정 | InSchoolz',
  description: '내 프로필, 학교 정보, 관심사를 수정하세요.',
};

export default async function MyEditPage() {
  // 쿠키에서 로그인된 사용자 정보 확인
  const cookieStore = await cookies();
  const authToken = cookieStore.get('authToken')?.value;
  
  // 로그인되지 않은 경우 로그인 페이지로 리디렉션
  if (!authToken) {
    return redirect('/auth?redirect=/my/edit');
  }

  try {
    // uid 쿠키 우선 확인
    let currentUserId = cookieStore.get('uid')?.value;
    if (!currentUserId) {
      // 백업으로 userId 쿠키도 확인
      currentUserId = cookieStore.get('userId')?.value;
    }
    
    // 쿠키에서 사용자 ID를 찾을 수 없는 경우 로그인 페이지로 리디렉션
    if (!currentUserId) {
      return redirect('/auth?redirect=/my/edit');
    }
    
    // 사용자 정보 조회
    const currentUser = await getUserById(currentUserId);
    
    if (!currentUser) {
      return redirect('/auth?redirect=/my/edit');
    }

    // Firebase 타임스탬프를 포함한 객체를 직렬화
    const serializedUserData = serializeUserForClient(currentUser);

    // 프로필 수정 컴포넌트 렌더링
    return (
      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 pb-20 sm:pb-6">
        <Toaster />
        <ProfileEditClient userData={serializedUserData} />
      </div>
    );
  } catch (error) {
    console.error('마이페이지 프로필 수정 사용자 정보 조회 오류:', error);
    return redirect('/auth?redirect=/my/edit');
  }
} 