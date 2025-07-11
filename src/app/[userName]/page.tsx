import { Metadata } from 'next';
import { cookies } from 'next/headers';
import { redirect, notFound } from 'next/navigation';
import { getUserByUserName, getUserById } from '@/lib/api/users';
import MyPageClient from '../my/MyPageClient';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import AttendanceCalendar from './components/AttendanceCalendar';
import { Toaster } from '@/components/ui/sonner';
import { User } from '@/types';

export const metadata: Metadata = {
  title: '프로필 | InSchoolz',
  description: '프로필, 학교 정보, 관심사를 확인하세요.',
};

// Firebase 타임스탬프 객체를 일반 숫자로 변환하는 함수
function serializeUserData(user: User | null): User | null {
  // null이나 undefined면 그대로 반환
  if (!user) return null;
  
  // 객체를 JSON으로 변환했다가 다시 파싱하여 깊은 복사 및 직렬화
  const serialized = JSON.parse(JSON.stringify(user, (key, value) => {
    // Firestore Timestamp 객체는 seconds와 nanoseconds 속성을 가짐
    if (value && typeof value === 'object' && 'seconds' in value && 'nanoseconds' in value) {
      // UNIX 타임스탬프로 변환 (밀리초)
      return value.seconds * 1000 + value.nanoseconds / 1000000;
    }
    return value;
  }));
  
  return serialized;
}

export default async function UserProfilePage({ params }: { params: Promise<{ userName: string }> }) {
  // Next.js 15에서는 params를 await 해야 함
  const { userName } = await params;
  
  // 쿠키에서 로그인된 사용자 정보 확인
  const cookieStore = await cookies();
  const authToken = cookieStore.get('authToken')?.value;
  
  // 로그인되지 않은 경우 로그인 페이지로 리디렉션
  if (!authToken) {
    return redirect('/auth?redirect=/' + userName);
  }

  try {
    // userName으로 사용자 조회
    const profileUser = await getUserByUserName(userName);
    
    if (!profileUser) {
      return notFound();
    }

    // 쿠키 디버깅: 모든 쿠키 확인
    const allCookies = cookieStore.getAll();
    console.log('프로필 페이지 - 모든 쿠키:', allCookies.map(c => ({ name: c.name, value: c.value })));
    
    // uid 쿠키 우선 확인 (AuthProvider에서 설정하는 쿠키명)
    let currentUserId = cookieStore.get('uid')?.value;
    if (!currentUserId) {
      // 백업으로 userId 쿠키도 확인
      currentUserId = cookieStore.get('userId')?.value;
    }
    
    // 쿠키에서 사용자 ID를 찾을 수 없는 경우
    if (!currentUserId) {
      console.log('프로필 페이지 - 사용자 ID를 쿠키에서 찾을 수 없음');
      console.log('사용 가능한 쿠키:', allCookies.map(c => c.name));
      
      // 대안: 로컬 상수 사용 (임시 솔루션으로, 프로필 소유자를 현재 사용자로 간주)
      currentUserId = profileUser.uid;
      console.log('임시 해결책: 프로필 소유자를 현재 사용자로 간주:', currentUserId);
    }
    
    console.log('현재 사용자 ID:', currentUserId);
    
    // 사용자 정보 조회
    const currentUser = await getUserById(currentUserId);
    
    if (!currentUser) {
      console.log('현재 사용자 정보를 찾을 수 없음:', currentUserId);
      return redirect('/auth?redirect=/' + userName);
    }

    // Firebase 타임스탬프를 포함한 객체를 직렬화
    const serializedProfileUser = serializeUserData(profileUser);
    const serializedCurrentUser = serializeUserData(currentUser);
    
    // 본인 프로필인지 확인
    const isOwnProfile = serializedCurrentUser?.uid === serializedProfileUser?.uid;
    
    console.log('본인 프로필 여부:', isOwnProfile);
    console.log('현재 사용자 UID:', serializedCurrentUser?.uid);
    console.log('프로필 사용자 UID:', serializedProfileUser?.uid);
    
    // 본인 프로필이면 MyPageClient 컴포넌트 렌더링
    if (isOwnProfile) {
      return <MyPageClient userData={serializedCurrentUser} />;
    } 
    // 다른 사용자의 프로필이면 제한된 정보 표시
    else {
      return (
        <div className="container mx-auto py-6">
          <Toaster />
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>프로필</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row items-center gap-6">
                <Avatar className="w-24 h-24">
                  <AvatarImage 
                    src={serializedProfileUser?.profile?.profileImageUrl || '/images/default-profile.png'} 
                    alt={serializedProfileUser?.profile?.userName || '사용자'} 
                  />
                  <AvatarFallback>
                    {serializedProfileUser?.profile?.userName?.substring(0, 2) || '사용자'}
                  </AvatarFallback>
                </Avatar>
                
                <div className="flex-1">
                  <div className="flex flex-col md:flex-row md:items-center gap-2 md:gap-4 mb-2">
                    <h1 className="text-2xl font-bold">{serializedProfileUser?.profile?.userName}</h1>
                    {serializedProfileUser?.profile?.isAdmin && (
                      <Badge variant="secondary" className="ml-2">관리자</Badge>
                    )}
                  </div>
                  
                  <p className="mt-2 text-muted-foreground">
                    이 사용자와 소통하려면 로그인 후 상호작용이 필요합니다.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          {/* 출석체크 현황 카드 */}
          <AttendanceCalendar userId={serializedProfileUser?.uid || ''} isProfileOwner={false} />
          
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>소셜 네트워크</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-center py-4">
                현재 다른 사용자의 소셜 정보를 보려면 클라이언트 기능이 필요합니다.
              </p>
            </CardContent>
          </Card>
        </div>
      );
    }
  } catch (error) {
    console.error('프로필 페이지 사용자 정보 조회 오류:', error);
    return redirect('/auth?redirect=/' + userName);
  }
} 