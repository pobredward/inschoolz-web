'use client';

import { useState, useEffect } from 'react';
import { Trophy, Medal, Crown, School, MapPin, Users, Star, TrendingUp, Search, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/providers/AuthProvider';
import { getRankings, RankingUser, RankingType } from '@/lib/api/ranking';
import { DocumentSnapshot } from 'firebase/firestore';

// 랭킹 상태 타입
interface RankingState {
  users: RankingUser[];
  hasMore: boolean;
  lastDoc?: DocumentSnapshot;
  isLoading: boolean;
  error?: string;
}

// 랭킹 아이템 컴포넌트
function RankingItem({ user, index, showSchool = true }: { 
  user: RankingUser; 
  index: number; 
  showSchool?: boolean;
}) {
  const rank = index + 1;
  
  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="h-5 w-5 sm:h-6 sm:w-6 text-yellow-500" />;
      case 2:
        return <Medal className="h-5 w-5 sm:h-6 sm:w-6 text-gray-400" />;
      case 3:
        return <Medal className="h-5 w-5 sm:h-6 sm:w-6 text-amber-600" />;
      default:
        return <span className="text-base sm:text-lg font-bold text-pastel-green-600">#{rank}</span>;
    }
  };

  const getRankBg = (rank: number) => {
    switch (rank) {
      case 1:
        return 'bg-gradient-to-r from-yellow-50 to-amber-50 border-yellow-200';
      case 2:
        return 'bg-gradient-to-r from-gray-50 to-slate-50 border-gray-200';
      case 3:
        return 'bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200';
      default:
        return 'bg-white border-pastel-green-100 hover:bg-pastel-green-50';
    }
  };

  return (
    <button 
      onClick={() => window.location.href = `/users/${user.id}`}
      className={`w-full flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-lg border transition-all hover:shadow-md ${getRankBg(rank)}`}
    >
      <div className="flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12">
        {getRankIcon(rank)}
      </div>
      
      <Avatar className="h-10 w-10 sm:h-12 sm:w-12">
        <AvatarImage src={user.profile?.avatar} alt={user.userName} />
        <AvatarFallback className="bg-pastel-green-100 text-pastel-green-700 text-xs sm:text-sm">
          {user.userName.slice(0, 2)}
        </AvatarFallback>
      </Avatar>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-gray-900 truncate text-sm sm:text-base hover:text-blue-600 transition-colors">{user.userName}</h3>
          <Badge variant="secondary" className="bg-pastel-green-100 text-pastel-green-700 text-xs px-1.5 py-0.5">
            Lv.{user.stats.level}
          </Badge>
        </div>
        {showSchool && user.school?.name && (
          <div className="flex items-center gap-1 mt-1">
            <School className="h-3 w-3 text-gray-500 flex-shrink-0" />
            <span className="text-xs sm:text-sm text-gray-600 truncate">{user.school.name}</span>
          </div>
        )}
        {user.regions && (
          <div className="flex items-center gap-1 mt-0.5">
            <MapPin className="h-3 w-3 text-gray-500 flex-shrink-0" />
            <span className="text-xs text-gray-600">{user.regions.sido} {user.regions.sigungu}</span>
          </div>
        )}
      </div>

      <div className="text-right flex-shrink-0">
        <div className="flex items-center gap-1">
          <Star className="h-3 w-3 sm:h-4 sm:w-4 text-pastel-green-500" />
          <span className="font-bold text-pastel-green-600 text-sm sm:text-base">
            {user.stats.totalExperience.toLocaleString()}
          </span>
        </div>
        <span className="text-xs text-gray-500">총 경험치</span>
      </div>
    </button>
  );
}

// 사용자 순위 표시 컴포넌트
function UserRankBadge({ rank, isCurrentUser }: { rank: number; isCurrentUser: boolean }) {
  if (!isCurrentUser || rank === 0) return null;
  
  return (
    <div className="mb-3 sm:mb-4 p-3 bg-gradient-to-r from-pastel-green-50 to-emerald-50 border border-pastel-green-200 rounded-lg">
      <div className="flex items-center gap-2">
        <TrendingUp className="h-4 w-4 text-pastel-green-600" />
        <span className="text-sm font-medium text-pastel-green-700">
          내 순위: <span className="font-bold">#{rank}</span>
        </span>
      </div>
    </div>
  );
}

// 로딩 스켈레톤
function RankingListSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 10 }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 border rounded-lg">
          <Skeleton className="w-10 h-10 sm:w-12 sm:h-12 rounded-full" />
          <Skeleton className="w-10 h-10 sm:w-12 sm:h-12 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-24 sm:w-32" />
            <Skeleton className="h-3 w-16 sm:w-24" />
          </div>
          <Skeleton className="h-6 w-12 sm:w-16" />
        </div>
      ))}
    </div>
  );
}

// 랭킹 리스트 컴포넌트
function RankingList({ 
  type, 
  schoolId, 
  sido, 
  sigungu,
  searchQuery,
  onSearchChange,
  currentUserId 
}: { 
  type: RankingType;
  schoolId?: string;
  sido?: string;
  sigungu?: string;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  currentUserId?: string;
}) {
  const [state, setState] = useState<RankingState>({
    users: [],
    hasMore: false,
    isLoading: true,
    lastDoc: undefined,
  });

  const loadRankings = async (reset = false) => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: undefined }));
      
      const result = await getRankings({
        type,
        schoolId,
        sido,
        sigungu,
        limit: 10,
        lastDoc: reset ? undefined : state.lastDoc,
        searchQuery: searchQuery || undefined,
      });

      setState(prev => ({
        users: reset ? result.users : [...prev.users, ...result.users],
        hasMore: result.hasMore,
        lastDoc: result.lastDoc,
        isLoading: false,
      }));
    } catch (error) {
      console.error('랭킹 로드 오류:', error);
      setState(prev => ({ 
        ...prev, 
        isLoading: false, 
        error: '랭킹을 불러오는 중 오류가 발생했습니다.' 
      }));
    }
  };

  useEffect(() => {
    loadRankings(true);
  }, [type, schoolId, sido, sigungu, searchQuery]);

  const handleLoadMore = () => {
    if (!state.isLoading && state.hasMore) {
      loadRankings(false);
    }
  };

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* 검색 입력 */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder="사용자 이름으로 검색..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10 h-11 sm:h-10"
        />
      </div>

      {/* 랭킹 리스트 */}
      {state.isLoading && state.users.length === 0 ? (
        <RankingListSkeleton />
      ) : state.error ? (
        <div className="text-center py-8 text-red-500 text-sm">{state.error}</div>
      ) : state.users.length === 0 ? (
        <div className="text-center py-8 text-gray-500 text-sm">
          {searchQuery ? '검색 결과가 없습니다.' : '랭킹 데이터가 없습니다.'}
        </div>
      ) : (
        <>
          {/* 현재 사용자 순위 표시 */}
          {currentUserId && (
            <UserRankBadge 
              rank={state.users.findIndex(user => user.id === currentUserId) + 1} 
              isCurrentUser={state.users.some(user => user.id === currentUserId)}
            />
          )}

          <div className="space-y-2 sm:space-y-3">
            {state.users.map((user, index) => (
              <RankingItem
                key={user.id}
                user={user}
                index={index}
                showSchool={type !== 'school'}
              />
            ))}
          </div>

          {/* 더 보기 버튼 */}
          {state.hasMore && (
            <div className="flex justify-center mt-4 sm:mt-6">
              <Button
                onClick={handleLoadMore}
                disabled={state.isLoading}
                variant="outline"
                className="flex items-center gap-2 h-11 px-6"
              >
                {state.isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-gray-300 border-t-pastel-green-600 rounded-full animate-spin" />
                    로딩 중...
                  </>
                ) : (
                  <>
                    더 보기
                    <ChevronRight className="h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default function RankingPage() {
  const { user } = useAuth();
  const [searchQueries, setSearchQueries] = useState({
    national: '',
    regional: '',
    school: '',
  });
  const [activeTab, setActiveTab] = useState('national');

  const handleSearchChange = (tab: string, query: string) => {
    setSearchQueries(prev => ({
      ...prev,
      [tab]: query,
    }));
  };

  return (
    <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-8 pb-20 sm:pb-8">
      {/* 헤더 섹션 */}
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">랭킹</h1>
        <p className="text-sm sm:text-base text-gray-600 mb-3 sm:mb-4">경험치 기준 사용자 랭킹을 확인해보세요!</p>
        {!user && (
          <div className="p-3 sm:p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-blue-800 text-sm leading-relaxed">
              💡 전국 랭킹은 누구나 볼 수 있지만, 학교와 지역 랭킹은 로그인이 필요합니다.
            </p>
          </div>
        )}
      </div>

      {/* 랭킹 탭 */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3 h-11 sm:h-10">
          <TabsTrigger value="national" className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm px-2">
            <Users className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            <span className="hidden xs:inline">전국</span>
            <span className="xs:hidden">전국</span>
          </TabsTrigger>
          <TabsTrigger 
            value="regional" 
            className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm px-2"
            disabled={!user}
          >
            <MapPin className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            <span className="hidden xs:inline">지역</span>
            <span className="xs:hidden">지역</span>
          </TabsTrigger>
          <TabsTrigger 
            value="school" 
            className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm px-2"
            disabled={!user}
          >
            <School className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            <span className="hidden xs:inline">학교</span>
            <span className="xs:hidden">학교</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="national" className="mt-4 sm:mt-6">
          <Card className="border-0 sm:border shadow-none sm:shadow-sm">
            <CardHeader className="px-0 sm:px-6 pb-3 sm:pb-6">
              <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                <Trophy className="h-5 w-5 text-yellow-500" />
                전국 랭킹
              </CardTitle>
              <CardDescription className="text-sm">
                전체 사용자 경험치 순위
              </CardDescription>
            </CardHeader>
            <CardContent className="px-0 sm:px-6">
              <RankingList
                type="national"
                searchQuery={searchQueries.national}
                onSearchChange={(query) => handleSearchChange('national', query)}
                currentUserId={user?.uid}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="regional" className="mt-4 sm:mt-6">
          <Card className="border-0 sm:border shadow-none sm:shadow-sm">
            <CardHeader className="px-0 sm:px-6 pb-3 sm:pb-6">
              <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                <MapPin className="h-5 w-5 text-blue-500" />
                지역 랭킹
              </CardTitle>
              <CardDescription className="text-sm">
                {user?.regions?.sido && user?.regions?.sigungu 
                  ? `${user.regions.sido} ${user.regions.sigungu} 지역 순위`
                  : user ? '지역 정보가 없습니다' : '로그인이 필요합니다'
                }
              </CardDescription>
            </CardHeader>
            <CardContent className="px-0 sm:px-6">
              {!user ? (
                <div className="text-center py-8 text-gray-500">
                  <p className="mb-4 text-sm">지역 랭킹을 보려면 로그인이 필요합니다.</p>
                  <Button asChild size="sm">
                    <a href="/auth?tab=login">로그인하기</a>
                  </Button>
                </div>
              ) : user.regions?.sido && user.regions?.sigungu ? (
                <RankingList
                  type="regional"
                  sido={user.regions.sido}
                  sigungu={user.regions.sigungu}
                  searchQuery={searchQueries.regional}
                  onSearchChange={(query) => handleSearchChange('regional', query)}
                  currentUserId={user.uid}
                />
              ) : (
                <div className="text-center py-8 text-gray-500 text-sm">
                  지역 정보를 설정하면 지역 랭킹을 확인할 수 있습니다.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="school" className="mt-4 sm:mt-6">
          <Card className="border-0 sm:border shadow-none sm:shadow-sm">
            <CardHeader className="px-0 sm:px-6 pb-3 sm:pb-6">
              <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                <School className="h-5 w-5 text-green-500" />
                학교 랭킹
              </CardTitle>
              <CardDescription className="text-sm">
                {user?.school?.name 
                  ? `${user.school.name} 학교 순위`
                  : user ? '학교 정보가 없습니다' : '로그인이 필요합니다'
                }
              </CardDescription>
            </CardHeader>
            <CardContent className="px-0 sm:px-6">
              {!user ? (
                <div className="text-center py-8 text-gray-500">
                  <p className="mb-4 text-sm">학교 랭킹을 보려면 로그인이 필요합니다.</p>
                  <Button asChild size="sm">
                    <a href="/auth?tab=login">로그인하기</a>
                  </Button>
                </div>
              ) : user.school?.id ? (
                <RankingList
                  type="school"
                  schoolId={user.school.id}
                  searchQuery={searchQueries.school}
                  onSearchChange={(query) => handleSearchChange('school', query)}
                  currentUserId={user.uid}
                />
              ) : (
                <div className="text-center py-8 text-gray-500 text-sm">
                  학교 정보를 설정하면 학교 랭킹을 확인할 수 있습니다.
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
