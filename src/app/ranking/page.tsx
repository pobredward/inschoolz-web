'use client';

import { useState, useEffect } from 'react';
import { Trophy, Medal, Crown, School, MapPin, Users, Star, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/providers/AuthProvider';
import { getRankingData } from '@/lib/experience';

// 타입 정의
interface RankingUser {
  userId: string;
  userName: string;
  level: number;
  totalExperience: number;
  schoolName?: string;
  schoolId?: string;
  region?: string;
  avatar?: string;
  rank: number;
}

interface RankingData {
  global: RankingUser[];
  regional: RankingUser[];
  school: RankingUser[];
  userRanks: {
    global: number;
    regional: number;
    school: number;
  };
}

// 랭킹 아이템 컴포넌트
function RankingItem({ user, index, showSchool = true }: { 
  user: RankingUser; 
  index: number; 
  showSchool?: boolean;
}) {
  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="h-6 w-6 text-yellow-500" />;
      case 2:
        return <Medal className="h-6 w-6 text-gray-400" />;
      case 3:
        return <Medal className="h-6 w-6 text-amber-600" />;
      default:
        return <span className="text-lg font-bold text-pastel-green-600">#{rank}</span>;
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
    <div className={`flex items-center gap-4 p-4 rounded-lg border transition-all ${getRankBg(user.rank)}`}>
      <div className="flex items-center justify-center w-12 h-12">
        {getRankIcon(user.rank)}
      </div>
      
      <Avatar className="h-12 w-12">
        <AvatarImage src={user.avatar} alt={user.userName} />
        <AvatarFallback className="bg-pastel-green-100 text-pastel-green-700">
          {user.userName.slice(0, 2)}
        </AvatarFallback>
      </Avatar>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold text-gray-900 truncate">{user.userName}</h3>
          <Badge variant="secondary" className="bg-pastel-green-100 text-pastel-green-700">
            Lv.{user.level}
          </Badge>
        </div>
        {showSchool && user.schoolName && (
          <div className="flex items-center gap-1 mt-1">
            <School className="h-3 w-3 text-gray-500" />
            <span className="text-sm text-gray-600 truncate">{user.schoolName}</span>
          </div>
        )}
        {user.region && (
          <div className="flex items-center gap-1 mt-1">
            <MapPin className="h-3 w-3 text-gray-500" />
            <span className="text-sm text-gray-600">{user.region}</span>
          </div>
        )}
      </div>

      <div className="text-right">
        <div className="flex items-center gap-1">
          <Star className="h-4 w-4 text-pastel-green-500" />
          <span className="font-bold text-pastel-green-600">
            {user.totalExperience.toLocaleString()}
          </span>
        </div>
        <span className="text-xs text-gray-500">총 경험치</span>
      </div>
    </div>
  );
}

// 내 랭킹 요약 컴포넌트
function MyRankingSummary({ userRanks, currentUser }: { 
  userRanks: RankingData['userRanks']; 
  currentUser: any;
}) {
  if (!currentUser) return null;

  return (
    <Card className="mb-6 bg-gradient-to-r from-pastel-green-50 to-emerald-50 border-pastel-green-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-pastel-green-600" />
          내 랭킹 현황
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-4 bg-white rounded-lg border border-pastel-green-100">
            <div className="text-2xl font-bold text-pastel-green-600">#{userRanks.global}</div>
            <div className="text-sm text-gray-600">전국 랭킹</div>
          </div>
          <div className="text-center p-4 bg-white rounded-lg border border-pastel-green-100">
            <div className="text-2xl font-bold text-pastel-green-600">#{userRanks.regional}</div>
            <div className="text-sm text-gray-600">지역 랭킹</div>
          </div>
          <div className="text-center p-4 bg-white rounded-lg border border-pastel-green-100">
            <div className="text-2xl font-bold text-pastel-green-600">#{userRanks.school}</div>
            <div className="text-sm text-gray-600">학교 랭킹</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// 로딩 스켈레톤
function RankingListSkeleton() {
  return (
    <div className="space-y-4">
      {Array.from({ length: 10 }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 p-4 border rounded-lg">
          <Skeleton className="w-12 h-12 rounded-full" />
          <Skeleton className="w-12 h-12 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-24" />
          </div>
          <Skeleton className="h-6 w-16" />
        </div>
      ))}
    </div>
  );
}

export default function RankingPage() {
  const { user } = useAuth();
  const [rankingData, setRankingData] = useState<RankingData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('global');

  useEffect(() => {
    loadRankingData();
  }, [user]);

  const loadRankingData = async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      setError(null);
      
      // 전국 랭킹 데이터 가져오기
      const globalRanking = await getRankingData('global');
      
      // 지역 랭킹 데이터 가져오기 (사용자의 지역 정보가 있는 경우)
      let regionalRanking: any[] = [];
      if (user.regions?.sido) {
        regionalRanking = await getRankingData('region', undefined, user.regions.sido, user.regions.sigungu);
      }
      
      // 학교 랭킹 데이터 가져오기 (사용자의 학교 정보가 있는 경우)
      let schoolRanking: any[] = [];
      if (user.school?.id) {
        schoolRanking = await getRankingData('school', user.school.id);
      }
      
      // RankingData 형태로 변환
      const data: RankingData = {
        global: globalRanking.map(item => ({
          userId: item.userId,
          userName: item.displayName,
          level: item.level,
          totalExperience: item.experience,
          schoolName: item.schoolName,
          rank: item.rank
        })),
        regional: regionalRanking.map(item => ({
          userId: item.userId,
          userName: item.displayName,
          level: item.level,
          totalExperience: item.experience,
          schoolName: item.schoolName,
          rank: item.rank
        })),
        school: schoolRanking.map(item => ({
          userId: item.userId,
          userName: item.displayName,
          level: item.level,
          totalExperience: item.experience,
          schoolName: item.schoolName,
          rank: item.rank
        })),
        userRanks: {
          global: globalRanking.findIndex(item => item.userId === user.uid) + 1 || 0,
          regional: regionalRanking.findIndex(item => item.userId === user.uid) + 1 || 0,
          school: schoolRanking.findIndex(item => item.userId === user.uid) + 1 || 0
        }
      };
      
      setRankingData(data);
    } catch (err) {
      console.error('랭킹 데이터 로딩 실패:', err);
      setError('랭킹 데이터를 불러올 수 없습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="text-center p-8">
          <CardHeader>
            <CardTitle>로그인이 필요합니다</CardTitle>
            <CardDescription>
              랭킹을 확인하려면 먼저 로그인해주세요.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <a href="/auth?tab=login">로그인하기</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center gap-3">
          <Trophy className="h-8 w-8 text-pastel-green-600" />
          랭킹 보드
        </h1>
        <p className="text-gray-600">
          학교별, 지역별, 전국 랭킹을 확인하고 친구들과 경쟁해보세요!
        </p>
      </div>

      {rankingData && (
        <MyRankingSummary userRanks={rankingData.userRanks} currentUser={user} />
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="global" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            전국 랭킹
          </TabsTrigger>
          <TabsTrigger value="regional" className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            지역 랭킹
          </TabsTrigger>
          <TabsTrigger value="school" className="flex items-center gap-2">
            <School className="h-4 w-4" />
            학교 랭킹
          </TabsTrigger>
        </TabsList>

        <TabsContent value="global">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-pastel-green-600" />
                전국 랭킹
              </CardTitle>
              <CardDescription>
                전국 모든 사용자들의 경험치 랭킹입니다.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <RankingListSkeleton />
              ) : error ? (
                <div className="text-center py-8">
                  <p className="text-red-600">{error}</p>
                  <Button onClick={loadRankingData} className="mt-4">
                    다시 시도
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {rankingData?.global.map((user, index) => (
                    <RankingItem key={user.userId} user={user} index={index} showSchool={true} />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="regional">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-pastel-green-600" />
                지역 랭킹
              </CardTitle>
              <CardDescription>
                같은 지역 사용자들의 경험치 랭킹입니다.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <RankingListSkeleton />
              ) : error ? (
                <div className="text-center py-8">
                  <p className="text-red-600">{error}</p>
                  <Button onClick={loadRankingData} className="mt-4">
                    다시 시도
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {rankingData?.regional.map((user, index) => (
                    <RankingItem key={user.userId} user={user} index={index} showSchool={true} />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="school">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <School className="h-5 w-5 text-pastel-green-600" />
                학교 랭킹
              </CardTitle>
              <CardDescription>
                같은 학교 사용자들의 경험치 랭킹입니다.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <RankingListSkeleton />
              ) : error ? (
                <div className="text-center py-8">
                  <p className="text-red-600">{error}</p>
                  <Button onClick={loadRankingData} className="mt-4">
                    다시 시도
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {rankingData?.school.map((user, index) => (
                    <RankingItem key={user.userId} user={user} index={index} showSchool={false} />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
