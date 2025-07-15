'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  ArrowRightIcon,
  MessageCircleIcon,
  ShieldIcon,
  MapPin,
  School,
  Zap
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/providers/AuthProvider';
import { getPopularPostsForHome } from '@/lib/api/board';
import { getRankingPreview } from '@/lib/api/ranking';
import { formatRelativeTime } from '@/lib/utils';

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
  createdAt: number;
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
              className="w-full bg-amber-500 hover:bg-amber-600 text-white py-3 px-4 rounded-lg flex items-center justify-center gap-2 font-medium transition-colors"
            >
              <ShieldIcon className="h-5 w-5" />
              관리자 대시보드 바로가기
            </Link>
          </div>
        )}



        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 메인 컨텐츠 */}
          <div className="lg:col-span-2 space-y-8">
            {/* 인기 게시글 섹션 */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">🔥 실시간 인기 글</h2>
                <Link 
                  href="/community?tab=national" 
                  className="text-sm text-green-600 hover:text-green-700 flex items-center gap-1"
                >
                  더보기 <ArrowRightIcon className="h-3 w-3" />
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
                  {popularPosts.map((post, index) => (
                    <Link
                      key={post.id}
                      href={`/community/national/${post.boardCode}/${post.id}`}
                      className="block group"
                    >
                      <div className="bg-white p-4 rounded-lg border border-gray-100 hover:shadow-md transition-all duration-200">
                        {/* 상단 뱃지들 */}
                        <div className="flex items-center gap-2 mb-3">
                          <span className="text-xs font-bold text-gray-700 bg-blue-100 px-2 py-1 rounded">
                            전국
                          </span>
                          <span className="text-xs font-bold text-gray-700 bg-green-100 px-2 py-1 rounded">
                            {post.boardName || post.boardCode}
                          </span>
                        </div>
                        
                        {/* 제목 */}
                        <h3 className="font-semibold text-gray-900 group-hover:text-green-600 line-clamp-2 leading-relaxed mb-2">
                          {post.title}
                        </h3>
                        
                        {/* 내용 미리보기 */}
                        {(post.previewContent || post.content) && (
                          <div className="text-sm text-gray-600 mb-3 line-clamp-2">
                            {post.previewContent || post.content?.replace(/<[^>]*>/g, '').slice(0, 150) || ''}
                          </div>
                        )}
                        
                        {/* 하단 정보 */}
                        <div className="flex items-center justify-between">
                          {/* 작성자 | 날짜 */}
                          <div className="text-sm text-gray-500">
                            <span>{post.authorInfo.isAnonymous ? '익명' : post.authorInfo.displayName}</span>
                            <span className="mx-1">|</span>
                            <span>{formatRelativeTime(post.createdAt)}</span>
                          </div>
                          
                          {/* 통계 (조회수, 좋아요, 댓글) */}
                          <div className="flex items-center gap-3 text-sm text-gray-500">
                            <span className="flex items-center gap-1">
                              <span>👁</span>
                              {post.stats.viewCount}
                            </span>
                            <span className="flex items-center gap-1">
                              <span>👍</span>
                              {post.stats.likeCount}
                            </span>
                            <span className="flex items-center gap-1">
                              <span>💬</span>
                              {post.stats.commentCount}
                            </span>
                          </div>
                        </div>
                      </div>
                    </Link>
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
