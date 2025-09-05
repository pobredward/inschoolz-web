'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
// import { 
//   BookCheck, 
//   GraduationCap, 
// } from 'lucide-react';
import { User, School } from '@/types';
import { getUserById, getFollowersCount, getFollowingCount } from '@/lib/api/users';
import { useAuth } from "@/providers/AuthProvider";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { selectSchool, getUserFavoriteSchools, toggleFavoriteSchool, searchSchools } from '@/lib/api/schools';
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import AttendanceCalendar from '../[userName]/components/AttendanceCalendar';
import FollowersModal from '../users/[userId]/components/FollowersModal';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";

import { getDoc, doc } from 'firebase/firestore';
import { db, auth } from '@/lib/firebase';
import { deleteUserAccount } from '@/lib/api/auth';

// 경험치 포맷팅 함수
const formatExp = (exp: number): string => {
  return exp.toLocaleString();
};

// 휴대폰 번호 포맷팅 함수
const formatPhoneNumber = (value: string): string => {
  if (!value) return '미설정';
  
  // +82 형식 처리
  if (value.startsWith('+82')) {
    const numbers = value.replace(/\D/g, '');
    const koreanNumber = numbers.slice(2); // +82 제거
    // 첫 번째 0이 없으면 추가
    const normalizedNumber = koreanNumber.startsWith('1') ? `0${koreanNumber}` : koreanNumber;
    
    if (normalizedNumber.length === 11) {
      return `${normalizedNumber.slice(0, 3)}-${normalizedNumber.slice(3, 7)}-${normalizedNumber.slice(7)}`;
    }
  }
  
  // 일반적인 숫자만 포함된 경우
  const numbers = value.replace(/\D/g, '');
  
  if (numbers.length <= 3) {
    return numbers;
  } else if (numbers.length <= 7) {
    return numbers.replace(/(\d{3})(\d{1,4})/, '$1-$2');
  } else if (numbers.length === 11) {
    return numbers.replace(/(\d{3})(\d{4})(\d{4})/, '$1-$2-$3');
  } else {
    return numbers.replace(/(\d{3})(\d{4})(\d{1,4})/, '$1-$2-$3');
  }
};

// 레벨에 따른 필요 경험치 계산 (헤더와 동일한 로직)
const getRequiredExpForLevel = (level: number): number => {
  // PRD 요구사항: 1->2레벨 10exp, 2->3레벨 20exp, 오름차순
  return level * 10;
};

// 학교 정보 인터페이스 (사용하지 않음 - 제거됨)

interface MyPageClientProps {
  userData?: User | null;
}

export default function MyPageClient({ userData: initialUserData }: MyPageClientProps) {
  const { user, refreshUser } = useAuth();
  const [loading, setLoading] = useState(!initialUserData);
  const [userData, setUserData] = useState<User | null>(initialUserData || null);
  const [isSchoolDialogOpen, setIsSchoolDialogOpen] = useState(false);
  const [selectedSchoolInfo, setSelectedSchoolInfo] = useState<{id: string, name: string} | null>(null);
  const [isGraduate, setIsGraduate] = useState(false);
  const [grade, setGrade] = useState('');
  const [classNumber, setClassNumber] = useState('');
  const [studentNumber, setStudentNumber] = useState('');
  const [favoriteSchools, setFavoriteSchools] = useState<School[]>([]);
  const [isSearchDialogOpen, setIsSearchDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<School[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [isFavoriteSchoolsModalOpen, setIsFavoriteSchoolsModalOpen] = useState(false);
  const [favoriteSchoolsTab, setFavoriteSchoolsTab] = useState<'manage' | 'search'>('manage');
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [isFollowersModalOpen, setIsFollowersModalOpen] = useState(false);
  const [followersModalType, setFollowersModalType] = useState<'followers' | 'following'>('followers');
  const [isAccountDeleteDialogOpen, setIsAccountDeleteDialogOpen] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  
  const router = useRouter();

  // 즐겨찾기 학교 목록 가져오기
  const fetchFavoriteSchools = useCallback(async () => {
    if (!user) return;
    
    try {
      const schools = await getUserFavoriteSchools(user.uid);
      setFavoriteSchools(schools);
    } catch (error) {
      console.error('즐겨찾기 학교 목록 조회 오류:', error);
      toast.error('즐겨찾기 학교 목록을 불러오는데 실패했습니다.');
    }
  }, [user]);



  // 학교 검색 함수
  const handleSearchSchool = async () => {
    if (!searchTerm.trim()) {
      toast.error('검색어를 입력해주세요.');
      return;
    }
    
    setSearchLoading(true);
    try {
      const results = await searchSchools(searchTerm);
      setSearchResults(results.schools);
      } catch (error) {
      console.error('학교 검색 오류:', error);
      toast.error('학교를 검색하는 중 오류가 발생했습니다.');
    } finally {
      setSearchLoading(false);
    }
  };

  // 학교 즐겨찾기 토글 함수
  const handleToggleFavorite = async (schoolId: string) => {
    if (!user) return;
    
    try {
      const result = await toggleFavoriteSchool(user.uid, schoolId);
      
      if (result.success) {
        // 즐겨찾기 목록 갱신
        await fetchFavoriteSchools();
        toast.success(result.message);
      } else {
        // 실패 시 에러 메시지 표시
        toast.error(result.message);
      }
    } catch (error) {
      console.error('즐겨찾기 토글 오류:', error);
      toast.error('즐겨찾기 상태를 변경하는 중 오류가 발생했습니다.');
    }
  };

  // 학교 선택 함수
  const handleSelectSchool = (school: School) => {
    setSelectedSchoolInfo({
      id: school.id,
      name: school.name
    });
    setIsSchoolDialogOpen(true);
    setIsSearchDialogOpen(false);
  };

  // 메인 학교 설정 함수
  const handleSetMainSchool = async (schoolId: string, schoolName: string) => {
    if (!user) return;
    
    try {
      // 여기서는 간단히 selectSchool 함수를 사용하여 메인 학교를 설정
      const result = await selectSchool(user.uid, schoolId, schoolName, {
        isGraduate: true // 기본값으로 졸업생 설정
      });
      
      if (result) {
        // 사용자 정보 새로고침
        const updatedUserData = await getUserById(user.uid);
        setUserData(updatedUserData);
        
        // AuthProvider의 글로벌 상태도 새로고침하여 실시간 반영
        await refreshUser();
        
        toast.success(`${schoolName}이(가) 메인 학교로 설정되었습니다.`);
      }
    } catch (error) {
      console.error('메인 학교 설정 오류:', error);
      toast.error('메인 학교 설정 중 오류가 발생했습니다.');
    }
  };

  // 계정 삭제 함수
  const handleDeleteAccount = async () => {
    if (!user || !auth.currentUser) {
      toast.error('로그인이 필요합니다.');
      return;
    }

    if (!deletePassword.trim()) {
      toast.error('현재 비밀번호를 입력해주세요.');
      return;
    }

    setIsDeleting(true);
    try {
      await deleteUserAccount(deletePassword);
      toast.success('계정이 완전히 삭제되었습니다.');
      
      // 계정 삭제 후 로그인 페이지로 리디렉션
      router.push('/login');
    } catch (error) {
      console.error('계정 삭제 오류:', error);
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error('계정 삭제 중 오류가 발생했습니다.');
      }
    } finally {
      setIsDeleting(false);
    }
  };

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true);
        
        if (!user) {
          console.log('사용자 인증 정보가 아직 로드되지 않았습니다.');
          return;
        }
        
        // 서버에서 최신 사용자 데이터 가져오기
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (!userDoc.exists()) {
          throw new Error('사용자 정보를 찾을 수 없습니다.');
        }
        
        const data = userDoc.data() as User;
        
        setUserData(data);
        
        // 즐겨찾기 학교 목록 가져오기
        await fetchFavoriteSchools();
        
        // 팔로워/팔로잉 수 가져오기
        try {
          const [followersNum, followingNum] = await Promise.all([
            getFollowersCount(user.uid),
            getFollowingCount(user.uid)
          ]);
          setFollowersCount(followersNum);
          setFollowingCount(followingNum);
        } catch (error) {
          console.error('팔로워/팔로잉 수 조회 오류:', error);
        }
      } catch (error) {
        console.error('사용자 정보를 가져오는 중 오류 발생:', error);
        if (error instanceof Error && error.message !== '사용자 인증 정보가 아직 로드되지 않았습니다.') {
          toast.error('사용자 정보를 불러오는데 실패했습니다.');
        }
      } finally {
        setLoading(false);
      }
    };

    // user가 존재할 때만 fetchUserData 실행
    if (user) {
      fetchUserData();
    } else if (user === null) {
      // user가 명시적으로 null인 경우 (로그아웃 상태)
      setLoading(false);
    }
    // user가 undefined인 경우는 아직 로딩 중이므로 아무것도 하지 않음
  }, [user, fetchFavoriteSchools]);

  if (loading) {
    return <div className="p-4 text-center">정보를 불러오는 중...</div>;
  }

  if (!user) {
    return <div className="p-4 text-center">로그인이 필요합니다.</div>;
  }

  if (!userData) {
    return <div className="p-4 text-center">사용자 정보를 불러오는 중...</div>;
  }

  return (
    <div className="px-3 sm:px-6 md:px-8 lg:px-12 py-6 max-w-7xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">마이페이지</h1>
      
      <div className="space-y-6">
        {/* 메인 컨텐츠 그리드 레이아웃 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 왼쪽 컬럼: 프로필 헤더 + 내 정보 + 활동 통계 + 설정 메뉴 */}
          <div className="lg:col-span-2 space-y-6">
            {/* 프로필 헤더 - 앱과 동일한 구조 */}
            <Card>
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row gap-6 items-center md:items-start">
                  <div className="flex flex-col items-center relative">
                    <Avatar className="w-20 h-20 mb-3">
                      <AvatarImage src={userData.profile?.profileImageUrl || ''} alt={userData.profile?.userName} />
                      <AvatarFallback>{userData.profile?.userName?.substring(0, 2) || 'ME'}</AvatarFallback>
                    </Avatar>
                    <Badge className="absolute -bottom-1 -right-1 bg-green-500 text-white text-xs px-2 py-1">
                      Lv.{userData.stats?.level || 1}
                    </Badge>
                  </div>
                  
                  <div className="flex-1 w-full">
                    <div className="space-y-4">
                      <div>
                        <h2 className="text-xl font-bold">{userData.profile?.userName}</h2>
                        <p className="text-sm text-muted-foreground">
                          {userData.school?.name || '학교 미설정'}
                          {userData.profile?.isAdmin && (
                            <Badge variant="secondary" className="ml-2">관리자</Badge>
                          )}
                        </p>
                      </div>
                      
                      {/* 팔로워/팔로잉 정보 */}
                      <div className="flex items-center gap-6">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setFollowersModalType('followers');
                            setIsFollowersModalOpen(true);
                          }}
                          className="p-0 h-auto hover:bg-transparent"
                        >
                          <div className="text-center">
                            <div className="text-lg font-bold text-gray-900">{followersCount}</div>
                            <div className="text-sm text-gray-500">팔로워</div>
                          </div>
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setFollowersModalType('following');
                            setIsFollowersModalOpen(true);
                          }}
                          className="p-0 h-auto hover:bg-transparent"
                        >
                          <div className="text-center">
                            <div className="text-lg font-bold text-gray-900">{followingCount}</div>
                            <div className="text-sm text-gray-500">팔로잉</div>
                          </div>
                        </Button>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">{formatExp(userData.stats?.currentExp || 0)} / {formatExp(getRequiredExpForLevel(userData.stats?.level || 1))} XP</span>
                          </div>
                        </div>
                        <div className="w-full bg-muted rounded-full h-2">
                          <div 
                            className="bg-green-500 h-2 rounded-full transition-all" 
                            style={{ width: `${Math.min(100, Math.floor(((userData.stats?.currentExp || 0) / getRequiredExpForLevel(userData.stats?.level || 1)) * 100))}%` }}
                          ></div>
                        </div>
                      </div>

                      {/* 모바일 앱 리워드 광고 안내 */}
                      <div className="mt-3 p-3 bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-lg">📱</span>
                          <h4 className="font-semibold text-gray-800 text-sm">모바일 앱에서 경험치 받기</h4>
                        </div>
                        
                        <div className="flex items-center gap-4 text-xs text-gray-600">
                          <div className="flex items-center gap-1">
                            <span className="text-amber-500">🎁</span>
                            <span>+50 XP</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="text-green-500">⏰</span>
                            <span>15분 간격</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="text-blue-500">🚀</span>
                            <span>하루 5회</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 내 정보 카드 - 앱과 동일한 구조 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  📋 내 정보
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">이름:</span>
                      <span className="text-sm font-medium">{userData.profile?.realName || '미설정'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">성별:</span>
                      <span className="text-sm font-medium">
                        {userData.profile?.gender === 'male' ? '남성' : 
                         userData.profile?.gender === 'female' ? '여성' :
                         userData.profile?.gender === 'other' ? '기타' : '미설정'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">생년월일:</span>
                      <span className="text-sm font-medium">
                        {userData.profile?.birthYear 
                          ? `${userData.profile.birthYear}년 ${userData.profile.birthMonth}월 ${userData.profile.birthDay}일` 
                          : '미설정'}
                      </span>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">이메일:</span>
                      <span className="text-sm font-medium">{userData.email || '미설정'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">연락처:</span>
                      <span className="text-sm font-medium">{formatPhoneNumber(userData.profile?.phoneNumber || '')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">주소:</span>
                      <span className="text-sm font-medium">
                        {(() => {
                          const parts = [
                            userData.regions?.sido,
                            userData.regions?.sigungu, 
                            userData.regions?.address
                          ].filter(Boolean);
                          return parts.length > 0 ? parts.join(' ') : '미설정';
                        })()}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 활동 통계 - 앱과 동일한 구조 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  📊 활동 통계
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4">
                  <div 
                    className="bg-muted/30 rounded-lg p-4 text-center cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => router.push('/my/posts')}
                  >
                    <div className="text-2xl mb-2">📝</div>
                    <div className="text-sm text-muted-foreground">내가 쓴 글</div>
                  </div>
                  <div 
                    className="bg-muted/30 rounded-lg p-4 text-center cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => router.push('/my/comments')}
                  >
                    <div className="text-2xl mb-2">💬</div>
                    <div className="text-sm text-muted-foreground">내 댓글</div>
                  </div>
                  <div 
                    className="bg-muted/30 rounded-lg p-4 text-center cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => router.push('/my/scraps')}
                  >
                    <div className="text-2xl mb-2">🔖</div>
                    <div className="text-sm text-muted-foreground">스크랩한 글</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 설정 메뉴 - 앱과 동일한 구조 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  ⚙️ 설정
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <Button 
                    variant="ghost" 
                    className="w-full justify-start bg-muted/30 hover:bg-muted/50"
                    onClick={() => router.push('/my/edit')}
                  >
                    <span className="mr-3">✏️</span>
                    프로필 수정
                    <span className="ml-auto">›</span>
                  </Button>
                  
                  <Button 
                    variant="ghost" 
                    className="w-full justify-start bg-muted/30 hover:bg-muted/50"
                    onClick={() => router.push('/my/settings/notifications')}
                  >
                    <span className="mr-3">🔔</span>
                    알림 설정
                    <span className="ml-auto">›</span>
                  </Button>
                  
                  <Button 
                    variant="ghost" 
                    className="w-full justify-start bg-muted/30 hover:bg-muted/50"
                    onClick={() => setIsFavoriteSchoolsModalOpen(true)}
                  >
                    <span className="mr-3">🏫</span>
                    즐겨찾기 학교 <span className="ml-2 text-xs text-muted-foreground">({favoriteSchools.length}/5)</span>
                    <span className="ml-auto">›</span>
                  </Button>
                  
                  <Button 
                    variant="ghost" 
                    className="w-full justify-start bg-muted/30 hover:bg-muted/50"
                    onClick={() => router.push('/my/reports')}
                  >
                    <span className="mr-3">🚨</span>
                    신고 기록
                    <span className="ml-auto">›</span>
                  </Button>
                  
                  <Button 
                    variant="ghost" 
                    className="w-full justify-start bg-muted/30 hover:bg-muted/50"
                    onClick={() => router.push('/my/blocked-users')}
                  >
                    <span className="mr-3">🚫</span>
                    차단된 사용자
                    <span className="ml-auto">›</span>
                  </Button>
                  
                  <Button 
                    variant="ghost" 
                    className="w-full justify-start bg-red-50 hover:bg-red-100 text-red-700"
                    onClick={() => setIsAccountDeleteDialogOpen(true)}
                  >
                    <span className="mr-3">🗑️</span>
                    계정 삭제
                    <span className="ml-auto">›</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* 오른쪽 컬럼: 출석체크 */}
          <div className="lg:col-span-1">
            {user?.uid ? (
              <AttendanceCalendar 
                userId={user.uid} 
                isProfileOwner={true} 
                onAttendanceComplete={async () => {
                  // 출석체크 완료 시 사용자 정보 새로고침
                  if (user) {
                    const refreshedUserData = await getUserById(user.uid);
                    setUserData(refreshedUserData);
                  }
                }}
              />
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle>출석체크</CardTitle>
                  <CardDescription>로그인 후 출석체크를 할 수 있습니다.</CardDescription>
                </CardHeader>
                <CardContent className="h-64 flex items-center justify-center">
                  <div className="text-center text-muted-foreground">
                    <p>로그인이 필요합니다</p>
                  </div>
                </CardContent>
              </Card>
            )}
            

          </div>
        </div>
      </div>
      
      {/* 학교 선택 다이얼로그 */}
      <Dialog open={isSchoolDialogOpen} onOpenChange={setIsSchoolDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>학교 정보 입력</DialogTitle>
            <DialogDescription>
              {selectedSchoolInfo?.name} 학교에 대한 추가 정보를 입력해주세요.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="flex items-center space-x-2">
              <Switch 
                id="graduate-mode"
                checked={isGraduate}
                onCheckedChange={(checked) => setIsGraduate(checked)}
              />
              <label
                htmlFor="graduate-mode"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                졸업생입니다
              </label>
            </div>
            
            {!isGraduate ? (
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label htmlFor="grade" className="text-sm font-medium">
                    학년
                  </label>
                  <Select 
                    value={grade} 
                    onValueChange={setGrade}
                  >
                    <SelectTrigger id="grade">
                      <SelectValue placeholder="학년 선택" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1학년</SelectItem>
                      <SelectItem value="2">2학년</SelectItem>
                      <SelectItem value="3">3학년</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="class" className="text-sm font-medium">
                    반
                  </label>
                  <Select 
                    value={classNumber} 
                    onValueChange={setClassNumber}
                  >
                    <SelectTrigger id="class">
                      <SelectValue placeholder="반 선택" />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 15 }, (_, i) => (
                        <SelectItem key={i + 1} value={String(i + 1)}>
                          {i + 1}반
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <label htmlFor="studentNumber" className="text-sm font-medium">
                    번호
                  </label>
                  <Select 
                    value={studentNumber} 
                    onValueChange={setStudentNumber}
                  >
                    <SelectTrigger id="studentNumber">
                      <SelectValue placeholder="번호 선택" />
                    </SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: 40 }, (_, i) => (
                        <SelectItem key={i + 1} value={String(i + 1)}>
                          {i + 1}번
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            ) : (
              <div className="bg-green-50 p-3 rounded-md text-green-700 text-sm">
                졸업생으로 설정되었습니다. 학년, 반, 번호 정보는 입력하지 않아도 됩니다.
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsSchoolDialogOpen(false)}
            >
              취소
            </Button>
            <Button 
              onClick={async () => {
                try {
                  if (!user || !selectedSchoolInfo) {
                    setIsSchoolDialogOpen(false);
                    return;
                  }
                  
                  // 학교 선택하기
                  const result = await selectSchool(user.uid, selectedSchoolInfo.id, selectedSchoolInfo.name, {
                    grade: isGraduate ? undefined : grade,
                    classNumber: isGraduate ? undefined : classNumber,
                    studentNumber: isGraduate ? undefined : studentNumber,
                    isGraduate
                  });
                  
                  if (result) {
                    // 사용자 정보 다시 가져오기
                    const updatedUserData = await getUserById(user.uid);
                    setUserData(updatedUserData);
                    
                    // 학교 상세 정보는 사용자 데이터에 포함되어 있음
                    
                    toast.success(`${selectedSchoolInfo.name}이(가) 내 학교로 설정되었습니다.`);
                  }
                  
                  setIsSchoolDialogOpen(false);
                } catch (error) {
                  console.error('학교 선택 오류:', error);
                  toast.error('학교 선택 중 오류가 발생했습니다.');
                }
              }}
              disabled={!isGraduate && (!grade || !classNumber || !studentNumber)}
            >
              저장하기
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 학교 검색 다이얼로그 */}
      <Dialog open={isSearchDialogOpen} onOpenChange={setIsSearchDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>학교 검색</DialogTitle>
            <DialogDescription>
              학교 이름의 앞자리에서 두 글자 이상 입력하세요.<br/>
              예시: 서울가곡초등학교인 경우 가곡(X) 서울가곡(O)
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="flex gap-2">
              <input
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="학교 이름 입력"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleSearchSchool();
                  }
                }}
              />
              <Button onClick={handleSearchSchool} disabled={searchLoading}>
                {searchLoading ? '검색 중...' : '검색'}
              </Button>
            </div>
            
            <div className="max-h-[250px] overflow-y-auto space-y-2">
              {searchResults.map((school) => (
                <div key={school.id} className="border rounded-md p-2">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="font-medium">{school.name}</p>
                      <p className="text-xs text-muted-foreground">가입 {school.memberCount || 0}명 · 즐겨찾기 {school.favoriteCount || 0}명</p>
                      <p className="text-xs text-muted-foreground mt-1">{school.address || '주소 정보 없음'}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSelectSchool(school)}
                      >
                        선택
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleFavorite(school.id)}
                      >
                        즐겨찾기
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
              
              {searchResults.length === 0 && searchTerm && !searchLoading && (
                <div className="text-center p-3">
                  <p className="text-muted-foreground">검색 결과가 없습니다.</p>
                </div>
              )}
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsSearchDialogOpen(false)}
            >
              닫기
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 즐겨찾기 학교 관리 모달 */}
      <Dialog open={isFavoriteSchoolsModalOpen} onOpenChange={setIsFavoriteSchoolsModalOpen}>
        <DialogContent className="sm:max-w-3xl max-h-[85vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              🏫 즐겨찾기 학교 관리
            </DialogTitle>
            <DialogDescription>
              즐겨찾기 학교를 관리하고 메인 학교를 설정하세요. (최대 5개)
            </DialogDescription>
          </DialogHeader>
          
          <Tabs value={favoriteSchoolsTab} onValueChange={(value) => setFavoriteSchoolsTab(value as 'manage' | 'search')} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="manage" className="flex items-center gap-2">
                📋 관리
              </TabsTrigger>
              <TabsTrigger value="search" className="flex items-center gap-2">
                🔍 학교 추가
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="manage" className="space-y-4 max-h-[55vh] overflow-y-auto">
              {favoriteSchools.length === 0 ? (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">🏫</div>
                  <h3 className="text-xl font-semibold mb-2">즐겨찾기 학교가 없습니다</h3>
                  <p className="text-muted-foreground mb-6">
                    학교를 추가하여 해당 학교 커뮤니티에 참여하세요
                  </p>
                  <Button 
                    onClick={() => setFavoriteSchoolsTab('search')}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    학교 추가하기
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <h3 className="font-semibold text-blue-900">즐겨찾기 학교 ({favoriteSchools.length}/5)</h3>
                    </div>
                    <p className="text-sm text-blue-700">
                      메인 학교는 커뮤니티와 랭킹에서 기본으로 표시됩니다
                    </p>
                  </div>
                  
                  <div className="grid gap-3">
                    {favoriteSchools.map((school) => (
                      <div key={school.id} className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                                <span className="text-blue-600 font-semibold text-sm">🏫</span>
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <h4 className="font-semibold text-gray-900">{school.name}</h4>
                                  {userData?.school?.id === school.id && (
                                    <Badge className="bg-green-500 text-white text-xs px-2 py-1">
                                      메인
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-sm text-gray-600 mt-1">
                                  {school.address}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-4 text-xs text-gray-500 ml-13">
                              <span className="flex items-center gap-1">
                                👥 멤버 {school.memberCount || 0}명
                              </span>
                              <span className="flex items-center gap-1">
                                ⭐ 즐겨찾기 {school.favoriteCount || 0}명
                              </span>
                            </div>
                          </div>
                          
                          <div className="flex flex-col gap-2">
                            {userData?.school?.id !== school.id && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleSetMainSchool(school.id, school.name)}
                                className="bg-blue-50 hover:bg-blue-100 border-blue-200 text-blue-700"
                              >
                                메인 설정
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleToggleFavorite(school.id)}
                              className="text-red-500 hover:text-red-700 hover:bg-red-50"
                            >
                              삭제
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {favoriteSchools.length < 5 && (
                    <div className="text-center pt-4">
                      <Button 
                        variant="outline" 
                        onClick={() => setFavoriteSchoolsTab('search')}
                        className="border-dashed border-2 border-gray-300 hover:border-blue-400 hover:bg-blue-50"
                      >
                        + 학교 추가하기
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="search" className="space-y-4 max-h-[55vh] overflow-y-auto">
              <div className="space-y-4">
                <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                    <h3 className="font-semibold text-yellow-900">학교 검색 안내</h3>
                  </div>
                  <p className="text-sm text-yellow-700">
                    학교 이름의 앞자리에서 두 글자 이상 입력하세요.<br/>
                    예시: 서울가곡초등학교인 경우 가곡(X) 서울가곡(O)
                  </p>
                </div>
                
                <div className="flex gap-2">
                  <Input
                    placeholder="학교 이름 입력"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleSearchSchool();
                      }
                    }}
                    className="flex-1"
                  />
                  <Button onClick={handleSearchSchool} disabled={searchLoading}>
                    {searchLoading ? '검색 중...' : '검색'}
                  </Button>
                </div>
                
                <div className="space-y-3">
                  {searchResults.map((school) => {
                    const isAlreadyAdded = favoriteSchools.some(fav => fav.id === school.id);
                    
                    return (
                      <div
                        key={school.id}
                        className={`bg-white border rounded-xl p-4 transition-all ${
                          isAlreadyAdded 
                            ? 'border-gray-200 bg-gray-50' 
                            : 'border-gray-200 hover:border-blue-300 hover:shadow-md'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                                <span className="text-gray-600 font-semibold text-sm">🏫</span>
                              </div>
                              <div>
                                <h4 className={`font-semibold ${isAlreadyAdded ? 'text-gray-500' : 'text-gray-900'}`}>
                                  {school.name}
                                </h4>
                                <p className="text-sm text-gray-600 mt-1">
                                  {school.address}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-4 text-xs text-gray-500 ml-13">
                              <span className="flex items-center gap-1">
                                👥 멤버 {school.memberCount || 0}명
                              </span>
                              <span className="flex items-center gap-1">
                                ⭐ 즐겨찾기 {school.favoriteCount || 0}명
                              </span>
                            </div>
                          </div>
                          
                          <div className="flex items-center">
                            {isAlreadyAdded ? (
                              <Badge variant="secondary" className="bg-gray-200 text-gray-600">
                                추가됨
                              </Badge>
                            ) : (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={async () => {
                                  await handleToggleFavorite(school.id);
                                  setFavoriteSchoolsTab('manage');
                                }}
                                disabled={favoriteSchools.length >= 5}
                                className="bg-blue-50 hover:bg-blue-100 border-blue-200 text-blue-700"
                              >
                                즐겨찾기 추가
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  
                  {searchTerm.length >= 2 && searchResults.length === 0 && !searchLoading && (
                    <div className="text-center py-8">
                      <div className="text-4xl mb-4">🔍</div>
                      <h3 className="text-lg font-semibold mb-2">검색 결과가 없습니다</h3>
                      <p className="text-muted-foreground">
                        다른 검색어로 시도해보세요
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>
          </Tabs>
          
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setIsFavoriteSchoolsModalOpen(false);
                setFavoriteSchoolsTab('manage');
                setSearchTerm('');
                setSearchResults([]);
              }}
            >
              닫기
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 계정 삭제 다이얼로그 */}
      <Dialog open={isAccountDeleteDialogOpen} onOpenChange={setIsAccountDeleteDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-red-600">⚠️ 계정 삭제</DialogTitle>
            <DialogDescription className="text-sm text-gray-600">
              이 작업은 되돌릴 수 없습니다. 계정을 삭제하면 모든 데이터가 완전히 제거됩니다.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <h4 className="font-semibold text-red-800 mb-2">삭제되는 데이터:</h4>
              <ul className="text-sm text-red-700 space-y-1">
                <li>• 프로필 정보 및 개인 데이터</li>
                <li>• 작성한 모든 게시글과 댓글</li>
                <li>• 즐겨찾기 및 설정 정보</li>
                <li>• 경험치 및 활동 기록</li>
              </ul>
            </div>
            
            <div>
              <label htmlFor="deletePassword" className="block text-sm font-medium text-gray-700 mb-2">
                현재 비밀번호 확인 *
              </label>
              <Input
                id="deletePassword"
                type="password"
                placeholder="현재 비밀번호를 입력하세요"
                value={deletePassword}
                onChange={(e) => setDeletePassword(e.target.value)}
                className="w-full"
              />
            </div>
          </div>
          
          <DialogFooter className="gap-2">
            <Button 
              variant="outline" 
              onClick={() => {
                setIsAccountDeleteDialogOpen(false);
                setDeletePassword('');
              }}
              disabled={isDeleting}
            >
              취소
            </Button>
            <Button 
              variant="destructive"
              onClick={handleDeleteAccount}
              disabled={isDeleting || !deletePassword.trim()}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? '삭제 중...' : '계정 삭제'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 팔로워/팔로잉 모달 */}
      <FollowersModal
        isOpen={isFollowersModalOpen}
        onClose={() => setIsFollowersModalOpen(false)}
        userId={user.uid}
        type={followersModalType}
        title={followersModalType === 'followers' ? '팔로워' : '팔로잉'}
      />
    </div>
  );
}