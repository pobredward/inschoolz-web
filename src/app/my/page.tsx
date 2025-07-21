import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { getUserById } from '@/lib/api/users';
import MyPageClient from './MyPageClient';
import { serializeUserForClient } from '@/lib/utils';

export default async function MyPage() {
  // 쿠키에서 로그인된 사용자 정보 확인
  const cookieStore = await cookies();
  const authToken = cookieStore.get('authToken')?.value;
  
  // 로그인되지 않은 경우 로그인 페이지로 리디렉션
  if (!authToken) {
    return redirect('/auth?redirect=/my');
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
      return redirect('/auth?redirect=/my');
    }
    
    // 사용자 정보 조회
    const currentUser = await getUserById(currentUserId);
    
    if (!currentUser) {
      return redirect('/auth?redirect=/my');
    }

    // Firebase 타임스탬프를 포함한 객체를 직렬화
    const serializedCurrentUser = serializeUserForClient(currentUser);
    
    // MyPageClient 컴포넌트 렌더링
    return <MyPageClient userData={serializedCurrentUser} />;
  } catch (error) {
    console.error('마이페이지 사용자 정보 조회 오류:', error);
    return redirect('/auth?redirect=/my');
  }
} 