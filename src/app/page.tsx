'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ArrowRightIcon,
  MessageCircleIcon,
  ShieldIcon,
  MapPin,
  School,
  Zap,
  Utensils
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/providers/AuthProvider';
import { getPopularPostsForHome } from '@/lib/api/board';
import { getRankingPreview } from '@/lib/api/ranking';
import { FirebaseTimestamp } from '@/types';

import PostListItem from '@/components/board/PostListItem';
import TodayMeals from '@/components/meals/TodayMeals';

interface PopularPost {
  id: string;
  title: string;
  content: string;
  boardName: string;
  boardCode: string;
  previewContent?: string;
  authorInfo: {
    displayName: string;
    isAnonymous: boolean;
  };
  stats: {
    viewCount: number;
    likeCount: number;
    commentCount: number;
  };
  createdAt: FirebaseTimestamp;
}

interface RankingPreview {
  national: Array<{
    id: string;
    userName: string;
    stats: {
      totalExperience: number;
      level: number;
    };
    school?: {
      name: string;
    };
  }>;
  regional: Array<{
    id: string;
    userName: string;
    stats: {
      totalExperience: number;
      level: number;
    };
    school?: {
      name: string;
    };
  }>;
  school: Array<{
    id: string;
    userName: string;
    stats: {
      totalExperience: number;
      level: number;
    };
  }>;
}

export default function Home() {
  const { user, isAdmin } = useAuth();
  const [popularPosts, setPopularPosts] = useState<PopularPost[]>([]);
  const [rankingPreview, setRankingPreview] = useState<RankingPreview | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadHomeData = async () => {
      try {
        setLoading(true);
        
        // 인기 게시글 로드
        const posts = await getPopularPostsForHome(3);
        setPopularPosts(posts);
        
        // 랭킹 미리보기 로드
        const rankings = await getRankingPreview(
          user?.uid,
          user?.school?.id,
          user?.regions?.sido,
          user?.regions?.sigungu
        );
        setRankingPreview(rankings);
        
      } catch (error) {
        console.error('홈 데이터 로드 실패:', error);
      } finally {
        setLoading(false);
      }
    };

    loadHomeData();
  }, [user]);

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1: return <span className="text-lg">🥇</span>;
      case 2: return <span className="text-lg">🥈</span>;
      case 3: return <span className="text-lg">🥉</span>;
      default: return <span className="text-sm font-medium text-gray-500">#{rank}</span>;
    }
  };

  return (
    <main className="flex min-h-screen flex-col">
      <div className="container mx-auto px-4 py-6">
        {/* 관리자 대시보드 바로가기 */}
        {isAdmin && (
          <div className="mb-6">
            <Link 
              href="/admin" 
              className="w-full bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-white py-3 px-4 rounded-lg flex items-center justify-center gap-2 font-medium transition-all duration-200 touch-manipulation active:scale-95 min-h-touch"
            >
              <ShieldIcon className="h-5 w-5" />
              관리자 대시보드 바로가기
            </Link>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          {/* 메인 컨텐츠 */}
          <div className="lg:col-span-2 space-y-6 lg:space-y-8">
            {/* 인기 게시글 섹션 */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl lg:text-2xl font-bold text-gray-900">🔥 실시간 인기 글</h2>
                <Link 
                  href="/community?tab=national" 
                  className="text-sm text-green-600 hover:text-green-700 active:text-green-800 flex items-center gap-1 transition-colors touch-manipulation min-h-touch"
                >
                  더보기
                  <span className="text-xs">→</span>
                </Link>
              </div>
              {loading ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="space-y-2">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                  ))}
                </div>
              ) : popularPosts.length > 0 ? (
                <div className="space-y-3">
                  {popularPosts.map((post) => (
                    <PostListItem
                      key={post.id}
                      post={post}
                      href={`/community/national/${post.boardCode}/${post.id}`}
                      typeBadgeText="전국"
                      boardBadgeText={post.boardName || post.boardCode}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <MessageCircleIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>아직 인기 게시글이 없습니다.</p>
                </div>
              )}
            </div>

            {/* 커뮤니티 바로가기 */}
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-gray-900">
                💬 커뮤니티 바로가기
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Link href="/community?tab=national">
                  <Card className="hover:shadow-md transition-shadow cursor-pointer">
                    <CardContent className="p-4 text-center">
                      <div className="text-3xl mb-2">🌍</div>
                      <h3 className="font-medium mb-1">전국 커뮤니티</h3>
                      <p className="text-xs text-gray-500">모든 학생들과 소통</p>
                    </CardContent>
                  </Card>
                </Link>
                <Link href="/community?tab=regional">
                  <Card className="hover:shadow-md transition-shadow cursor-pointer">
                    <CardContent className="p-4 text-center">
                      <div className="text-3xl mb-2">🏘️</div>
                      <h3 className="font-medium mb-1">지역 커뮤니티</h3>
                      <p className="text-xs text-gray-500">우리 지역 친구들과</p>
                    </CardContent>
                  </Card>
                </Link>
                <Link href="/community?tab=school">
                  <Card className="hover:shadow-md transition-shadow cursor-pointer">
                    <CardContent className="p-4 text-center">
                      <div className="text-3xl mb-2">🏫</div>
                      <h3 className="font-medium mb-1">학교 커뮤니티</h3>
                      <p className="text-xs text-gray-500">우리 학교만의 공간</p>
                    </CardContent>
                  </Card>
                </Link>
              </div>
            </div>

            {/* 미니게임 바로가기 */}
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-gray-900">
                🎮 미니게임
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Link href="/games/reaction">
                  <Card className="hover:shadow-md transition-shadow cursor-pointer">
                    <CardContent className="p-4 text-center">
                      <Zap className="h-8 w-8 mx-auto mb-2 text-yellow-500" />
                      <h4 className="font-medium text-sm mb-1">반응속도</h4>
                      <p className="text-xs text-gray-500">+15 XP</p>
                    </CardContent>
                  </Card>
                </Link>
                <Card className="opacity-60 cursor-not-allowed">
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl mb-2">🧩</div>
                    <h4 className="font-medium text-sm mb-1">타일 맞추기</h4>
                    <p className="text-xs text-gray-500">곧 출시</p>
                  </CardContent>
                </Card>
                <Card className="opacity-60 cursor-not-allowed">
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl mb-2">🧮</div>
                    <h4 className="font-medium text-sm mb-1">빠른 계산</h4>
                    <p className="text-xs text-gray-500">곧 출시</p>
                  </CardContent>
                </Card>
                <Card className="opacity-60 cursor-not-allowed">
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl mb-2">📝</div>
                    <h4 className="font-medium text-sm mb-1">단어 맞추기</h4>
                    <p className="text-xs text-gray-500">곧 출시</p>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* 급식 정보 */}
            {user?.school?.id && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-gray-900">
                    🍽️ 오늘의 급식
                  </h2>
                  <Link 
                    href="/meals" 
                    className="text-sm text-green-600 hover:underline flex items-center gap-1"
                  >
                    전체보기 <ArrowRightIcon className="h-3 w-3" />
                  </Link>
                </div>
                <TodayMeals 
                  schoolId={user.school.id} 
                  schoolName={user.school.name}
                  showHeader={false}
                />
              </div>
            )}
          </div>

          {/* 사이드바 */}
          <div className="space-y-6">
            {/* 랭킹 미리보기 */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">
                  🏆 랭킹
                </h2>
                <Link 
                  href="/ranking" 
                  className="text-sm text-green-600 hover:underline"
                >
                  전체보기
                </Link>
              </div>
              
              {loading ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                      <Skeleton className="h-4 w-16 mb-2" />
                      <div className="space-y-2">
                        {[...Array(3)].map((_, j) => (
                          <div key={j} className="flex items-center gap-2">
                            <Skeleton className="h-6 w-6 rounded-full" />
                            <Skeleton className="h-4 w-20" />
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  {/* 전국 랭킹 */}
                  <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                    <h4 className="font-medium text-sm mb-3 flex items-center gap-1">
                      <span>🌍</span> 전국 랭킹
                    </h4>
                    <div className="space-y-2">
                      {rankingPreview?.national.slice(0, 3).map((user, index) => (
                        <div key={user.id} className="flex items-center gap-2 text-sm">
                          <div className="w-6 flex justify-center">
                            {getRankIcon(index + 1)}
                          </div>
                          <span className="flex-1 truncate">{user.userName}</span>
                          <span className="text-xs text-gray-500">Lv.{user.stats.level}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 지역 랭킹 */}
                  {rankingPreview?.regional && rankingPreview.regional.length > 0 && (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                      <h4 className="font-medium text-sm mb-3 flex items-center gap-1">
                        <MapPin className="h-4 w-4" /> 지역 랭킹
                      </h4>
                      <div className="space-y-2">
                        {rankingPreview.regional.slice(0, 3).map((user, index) => (
                          <div key={user.id} className="flex items-center gap-2 text-sm">
                            <div className="w-6 flex justify-center">
                              {getRankIcon(index + 1)}
                            </div>
                            <span className="flex-1 truncate">{user.userName}</span>
                            <span className="text-xs text-gray-500">Lv.{user.stats.level}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 학교 랭킹 */}
                  {rankingPreview?.school && rankingPreview.school.length > 0 && (
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                      <h4 className="font-medium text-sm mb-3 flex items-center gap-1">
                        <School className="h-4 w-4" /> 학교 랭킹
                      </h4>
                      <div className="space-y-2">
                        {rankingPreview.school.slice(0, 3).map((user, index) => (
                          <div key={user.id} className="flex items-center gap-2 text-sm">
                            <div className="w-6 flex justify-center">
                              {getRankIcon(index + 1)}
                            </div>
                            <span className="flex-1 truncate">{user.userName}</span>
                            <span className="text-xs text-gray-500">Lv.{user.stats.level}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
