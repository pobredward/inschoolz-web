'use client';

import React, { useEffect, useState, useCallback } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { School, User } from "@/types";
import { useAuth } from "@/providers/AuthProvider";
import { 
  GraduationCap, 
  BookCheck, 
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { getUserById } from '@/lib/api/users';
import { getSchoolById, selectSchool, getUserFavoriteSchools, toggleFavoriteSchool, searchSchools } from '@/lib/api/schools';
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
import { useRouter } from 'next/navigation';
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { getDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

// 경험치 포맷팅 함수
const formatExp = (exp: number): string => {
  return exp.toLocaleString();
};

// 레벨에 따른 필요 경험치 계산 (헤더와 동일한 로직)
const getRequiredExpForLevel = (level: number): number => {
  // PRD 요구사항: 1->2레벨 10exp, 2->3레벨 20exp, 오름차순
  return level * 10;
};

// 학교 정보 인터페이스
interface SchoolDetail {
  id: string;
  name: string;
  address?: string;
  memberCount?: number;
  favoriteCount?: number;
  // 필요한 다른 속성들...
}

interface MyPageClientProps {
  userData?: User | null;
}

export default function MyPageClient({ userData: initialUserData }: MyPageClientProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(!initialUserData);
  const [userData, setUserData] = useState<User | null>(initialUserData || null);
  const [mySchoolDetails, setMySchoolDetails] = useState<SchoolDetail | null>(null);
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
        if (data.school?.id) {
          const schoolDoc = await getDoc(doc(db, 'schools', data.school.id));
          setMySchoolDetails(schoolDoc.exists() ? 
            { ...schoolDoc.data() as SchoolDetail } : null);
        }
        
        setUserData(data);
        
        // 즐겨찾기 학교 목록 가져오기
        await fetchFavoriteSchools();
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
  }, [user, initialUserData, fetchFavoriteSchools]);

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
          {/* 왼쪽 컬럼: 내 프로필 + 학교 관리 */}
          <div className="lg:col-span-2 space-y-6">
            {/* 프로필 카드 */}
        <Card>
          <CardHeader>
            <CardTitle>내 프로필</CardTitle>
            <CardDescription>나의 개인 정보와 통계</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col md:flex-row gap-6 items-center md:items-start">
              <div className="flex flex-col items-center">
                <Avatar className="w-28 h-28 mb-3">
                  <AvatarImage src={userData.profile?.profileImageUrl || ''} alt={userData.profile?.userName} />
                  <AvatarFallback>{userData.profile?.userName?.substring(0, 2) || 'ME'}</AvatarFallback>
                </Avatar>
                
                  <Button 
                    variant="outline" 
                    className="mt-2 w-full"
                      onClick={() => router.push(`/${userData.profile?.userName}/edit`)}
                  >
                    프로필 수정
                  </Button>
              </div>
              
              <div className="flex-1 w-full">
                    <div className="space-y-4">
                      <div>
                        <h2 className="text-xl font-bold">{userData.profile?.userName}</h2>
                        <p className="text-sm text-muted-foreground">
                          
                          {userData.profile?.isAdmin && (
                            <Badge variant="secondary" className="ml-2">관리자</Badge>
                          )}
                        </p>
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                        <div className="space-y-1">
                          <div className="text-sm">
                            <p><span className="font-medium">이름: </span>{userData.profile?.realName || '미설정'}</p>
                            <p><span className="font-medium">성별: </span>
                              {userData.profile?.gender === 'male' ? '남성' : 
                               userData.profile?.gender === 'female' ? '여성' :
                               userData.profile?.gender === 'other' ? '기타' : '미설정'}
                            </p>
                            <p><span className="font-medium">학교: </span>{userData.school?.name || '미설정'}</p>

                            <p><span className="font-medium">생년월일: </span>
                              {userData.profile?.birthYear 
                                ? `${userData.profile.birthYear}년 ${userData.profile.birthMonth}월 ${userData.profile.birthDay}일` 
                                : '미설정'}
                            </p>
                          </div>
                        </div>
                        
                        <div className="space-y-1">
                          <div className="text-sm">
                          <p><span className="font-medium">연락처: </span>{userData.profile?.phoneNumber || '미설정'}</p>
                          <p><span className="font-medium">이메일: </span>{userData.email || '미설정'}</p>
                          <p><span className="font-medium">주소: </span>
                            {(() => {
                              const parts = [
                                userData.regions?.sido,
                                userData.regions?.sigungu, 
                                userData.regions?.address
                              ].filter(Boolean);
                              return parts.length > 0 ? parts.join(' ') : '미설정';
                            })()}
                          </p>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-6">
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <Badge className="bg-primary/15 text-primary hover:bg-primary/20 border-none">LV. {userData.stats?.level || 1}</Badge>
                          <span className="text-sm font-medium">{formatExp(userData.stats?.experience || 0)} / {formatExp(getRequiredExpForLevel(userData.stats?.level || 1))} exp</span>
                        </div>
                        <span className="text-xs text-muted-foreground">누적 {formatExp(userData.stats?.totalExperience || 0)} exp</span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2.5">
                        <div 
                          className="bg-primary h-2.5 rounded-full transition-all" 
                          style={{ width: `${Math.min(100, Math.floor(((userData.stats?.experience || 0) / getRequiredExpForLevel(userData.stats?.level || 1)) * 100))}%` }}
                        ></div>
                      </div>
                    </div>
              </div>
            </div>
            
            <div className="pt-4 border-t">
              <h3 className="font-medium mb-2">활동 통계</h3>
                  <div className="grid grid-cols-2 gap-2">
                <div className="p-2 bg-muted rounded-md text-center">
                  <p className="text-xs text-muted-foreground">게시글</p>
                  <p className="font-bold">{userData.stats?.postCount || 0}</p>
                </div>
                <div className="p-2 bg-muted rounded-md text-center">
                  <p className="text-xs text-muted-foreground">댓글</p>
                  <p className="font-bold">{userData.stats?.commentCount || 0}</p>
                </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 mt-2">
                <div className="p-2 bg-muted rounded-md text-center">
                      <p className="text-xs text-muted-foreground">팔로워</p>
                      <p className="font-bold">{userData.social?.followers || 0}</p>
                </div>
                <div className="p-2 bg-muted rounded-md text-center">
                      <p className="text-xs text-muted-foreground">팔로잉</p>
                      <p className="font-bold">{userData.social?.following || 0}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
            {/* 학교 관리 카드 */}
        <Card>
          <CardHeader>
            <CardTitle>학교 관리</CardTitle>
            <CardDescription>내 학교 및 즐겨찾기 학교 관리</CardDescription>
          </CardHeader>
              <CardContent className="space-y-6">
            {/* 내 학교 섹션 */}
                <div>
                  <h3 className="text-sm font-medium mb-3 flex items-center">
                <BookCheck className="h-4 w-4 text-primary mr-1" />
                내 학교
              </h3>
              {userData?.school ? (
                <div className="border rounded-md p-3 bg-muted/30">
                  <div className="flex justify-between items-center mb-2">
                    <div>
                      <p className="font-medium">{userData.school.name}</p>
                      <p className="text-sm text-muted-foreground">가입 {mySchoolDetails?.memberCount || 0}명 · 즐겨찾기 {mySchoolDetails?.favoriteCount || 0}명</p>
                      <p className="text-xs text-muted-foreground mt-1">{mySchoolDetails?.address || '주소 정보 없음'}</p>
                    </div>
                    <p className="text-xs text-muted-foreground px-2 py-1 bg-primary/10 rounded-full">
                      메인 학교
                    </p>
                  </div>
                  <div className="mt-2 pt-2 border-t border-muted">
                    <div className="flex flex-wrap gap-2 text-sm">
                      <Badge variant="outline" className="bg-blue-50">
                        <GraduationCap className="h-3 w-3 mr-1" />
                        재학생
                      </Badge>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center p-3 border rounded-md bg-muted/50">
                  <p className="text-muted-foreground">아직 학교를 선택하지 않았습니다. 아래에서 학교를 검색하여 선택해보세요.</p>
                      <Button
                        className="mt-3 bg-primary hover:bg-primary/90 text-white"
                        onClick={() => setIsSearchDialogOpen(true)}
                      >
                        학교 검색
                      </Button>
                </div>
              )}
            </div>

                {/* 즐겨찾기 학교 섹션 */}
                <div>
                  <h3 className="text-sm font-medium mb-3 flex items-center justify-between">
                    <span className="flex items-center">
                      <BookCheck className="h-4 w-4 text-primary mr-1" />
                      즐겨찾기 학교 <span className="ml-2 text-xs text-muted-foreground">({favoriteSchools.length}/5)</span>
                    </span>
                    <Button 
                      variant="secondary"
                      size="sm"
                      onClick={() => setIsSearchDialogOpen(true)}
                      className="bg-primary hover:bg-primary/90 text-white"
                    >
                      <span className="text-xs font-medium">학교 검색</span>
                    </Button>
                  </h3>
                  
                  {favoriteSchools.length > 0 ? (
                    <div className="space-y-2">
                      {favoriteSchools.map((school) => (
                        <div key={school.id} className="border rounded-md p-2 bg-muted/30">
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
                                삭제
                        </Button>
              </div>
              </div>
                  </div>
                      ))}
                </div>
              ) : (
                    <div className="text-center p-3 border rounded-md bg-muted/50">
                      <p className="text-muted-foreground">즐겨찾기한 학교가 없습니다.</p>
                </div>
              )}
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
            
            {/* 알림 섹션 추가 */}
            <Card className="mt-6">
          <CardHeader>
            <CardTitle>알림 설정</CardTitle>
                <CardDescription>알림 및 커뮤니케이션 설정을 관리합니다.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <div className="flex-1">
                      <label htmlFor="notification-sounds" className="text-sm font-medium">알림 소리</label>
                      <p className="text-xs text-muted-foreground">웹사이트 알림 소리를 활성화/비활성화합니다.</p>
                </div>
                <Switch 
                      id="notification-sounds" 
                      checked={userData.preferences?.notificationSounds || false}
                      disabled={true}
                />
              </div>
              
                  <div className="flex justify-between items-center">
                    <div className="flex-1">
                      <label htmlFor="chat-alerts" className="text-sm font-medium">채팅 알림</label>
                      <p className="text-xs text-muted-foreground">채팅 메시지가 오면 알림을 받습니다.</p>
                </div>
                <Switch 
                      id="chat-alerts" 
                      checked={userData.preferences?.chatAlerts || false}
                      disabled={true}
                />
                  </div>
              </div>
              
                <div className="pt-2 border-t">
                  <h4 className="text-sm font-medium mb-2">이메일 알림</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <label htmlFor="email-posts" className="text-sm">게시글 작성 알림</label>
                    <Switch 
                      id="email-posts" 
                        checked={userData.preferences?.emailNotifications?.posts || false}
                        disabled={true}
                    />
                  </div>
                  
                    <div className="flex justify-between items-center">
                      <label htmlFor="email-comments" className="text-sm">댓글 알림</label>
                    <Switch 
                      id="email-comments" 
                        checked={userData.preferences?.emailNotifications?.comments || false}
                        disabled={true}
                    />
                  </div>
                  
                    <div className="flex justify-between items-center">
                      <label htmlFor="email-messages" className="text-sm">메시지 알림</label>
                      <Switch 
                        id="email-messages" 
                        checked={userData.preferences?.emailNotifications?.messages || false}
                        disabled={true}
                      />
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <label htmlFor="email-system" className="text-sm">시스템 알림</label>
                    <Switch 
                      id="email-system" 
                        checked={userData.preferences?.emailNotifications?.system || false}
                        disabled={true}
                    />
                </div>
              </div>
            </div>
            
                <div className="pt-2 border-t text-center">
                  <Button size="sm" variant="outline" disabled>설정 저장</Button>
                  <p className="text-xs text-muted-foreground mt-2">알림 설정 기능은 곧 활성화됩니다.</p>
            </div>
          </CardContent>
        </Card>
        
            {/* 게임 섹션 추가 */}
            <Card className="mt-6">
          <CardHeader>
                <CardTitle>게임 현황</CardTitle>
                <CardDescription>미니게임 점수와 통계를 확인하세요.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-3">
                  <div className="flex justify-between items-center p-3 bg-muted rounded-md">
                <div>
                      <h4 className="font-medium">Flappy Bird</h4>
                      <p className="text-xs text-muted-foreground">최고 점수: {userData.gameStats?.flappyBird?.totalScore || 0}</p>
                  </div>
                    <Button size="sm" variant="outline" onClick={() => router.push('/games/flappy-bird')}>
                      플레이
                    </Button>
                  </div>
                  
                  <div className="flex justify-between items-center p-3 bg-muted rounded-md">
                    <div>
                      <h4 className="font-medium">반응 속도 게임</h4>
                      <p className="text-xs text-muted-foreground">최고 점수: {userData.gameStats?.reactionGame?.totalScore || 0}</p>
                    </div>
                    <Button size="sm" variant="outline" onClick={() => router.push('/games/reaction')}>
                      플레이
                    </Button>
                </div>
                
                  <div className="flex justify-between items-center p-3 bg-muted rounded-md">
                <div>
                      <h4 className="font-medium">타일 맞추기</h4>
                      <p className="text-xs text-muted-foreground">최고 점수: {userData.gameStats?.tileGame?.totalScore || 0}</p>
                  </div>
                    <Button size="sm" variant="outline" onClick={() => router.push('/games/tile')}>
                      플레이
                    </Button>
                  </div>
                </div>
                
                <div className="pt-3 border-t">
                  <h4 className="text-sm font-medium mb-2">일일 게임 제한</h4>
                  <div className="grid grid-cols-3 gap-2 text-center">
                <div>
                      <p className="text-xs text-muted-foreground">Flappy Bird</p>
                      <p className="font-bold">{userData.activityLimits?.dailyCounts?.games?.flappyBird || 0}/5</p>
                  </div>
                    <div>
                      <p className="text-xs text-muted-foreground">반응 속도</p>
                      <p className="font-bold">{userData.activityLimits?.dailyCounts?.games?.reactionGame || 0}/5</p>
                  </div>
                    <div>
                      <p className="text-xs text-muted-foreground">타일 맞추기</p>
                      <p className="font-bold">{userData.activityLimits?.dailyCounts?.games?.tileGame || 0}/5</p>
                </div>
              </div>
            </div>
            
                <div className="pt-3 border-t text-center">
                  <p className="text-xs text-muted-foreground">
                    게임에서 얻은 경험치는 레벨 업에 사용됩니다.<br />
                    더 많은 게임이 추가될 예정입니다.
                  </p>
            </div>
          </CardContent>
        </Card>
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
                    
                    // 학교 상세 정보도 가져오기
                    if (selectedSchoolInfo.id) {
                      const schoolDetails = await getSchoolById(selectedSchoolInfo.id);
                      setMySchoolDetails(schoolDetails);
                    }
                    
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
    </div>
  );
}