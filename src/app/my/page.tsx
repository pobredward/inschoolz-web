import { Metadata } from 'next';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { getUserById } from '@/lib/api/users';

export const metadata: Metadata = {
  title: '마이페이지 | InSchoolz',
  description: '내 프로필, 학교 정보, 관심사를 관리하세요.',
};

export default async function MyPage() {
  // 쿠키에서 인증 토큰과 사용자 ID 가져오기
  const cookieStore = await cookies();
  const authToken = cookieStore.get('authToken')?.value;
  
  // 로그인하지 않은 경우
  if (!authToken) {
    return redirect('/auth?redirect=/my');
  }
  
  try {
    // 쿠키 디버깅: 모든 쿠키 확인
    const allCookies = cookieStore.getAll();
    console.log('모든 쿠키:', allCookies.map(c => c.name));
    
    // userId 또는 uid 쿠키 찾기
    let userId = cookieStore.get('userId')?.value;
    if (!userId) {
      userId = cookieStore.get('uid')?.value;
    }

    // 쿠키에서 사용자 ID를 찾을 수 없는 경우, 로그인 페이지로 리디렉션
    if (!userId) {
      console.log('사용자 ID를 쿠키에서 찾을 수 없음');
      return redirect('/auth?redirect=/my');
    }
    
    // 사용자 정보 조회
    const user = await getUserById(userId);
    
    if (!user || !user.profile?.userName) {
      return redirect('/auth?redirect=/my');
    }
    
    // 사용자의 userName으로 리다이렉트
    return redirect(`/${user.profile.userName}`);
  } catch (error) {
    console.error('인증 오류:', error);
    // 오류 시 다시 로그인 페이지로
    return redirect('/auth?redirect=/my');
  }
} 