'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, Heart, MessageCircle, Eye, Calendar } from 'lucide-react';
import { useAuth } from '@/providers/AuthProvider';
import { getUserLikedPosts } from '@/lib/api/users';
import { Post } from '@/types';
import { formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';

export default function LikedPostsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchLikedPosts = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const likedPosts = await getUserLikedPosts(user.uid);
        setPosts(likedPosts);
      } catch (err) {
        console.error('좋아요한 글 목록 조회 오류:', err);
        setError('좋아요한 글 목록을 불러오는데 실패했습니다.');
      } finally {
        setLoading(false);
      }
    };

    fetchLikedPosts();
  }, [user]);

  const handlePostClick = (post: Post) => {
    // 게시글 타입에 따라 적절한 URL로 이동
    if (post.boardCode) {
      let path = '';
      if (post.type === 'national') {
        path = `/community/national/${post.boardCode}/${post.id}`;
      } else if (post.type === 'regional') {
        path = `/community/region/${post.regions?.sido}/${post.regions?.sigungu}/${post.boardCode}/${post.id}`;
      } else if (post.type === 'school') {
        path = `/community/school/${post.schoolId}/${post.boardCode}/${post.id}`;
      }
      
      if (path) {
        router.push(path);
      }
    }
  };

  const getBoardTypeLabel = (type: string) => {
    switch (type) {
      case 'national':
        return '전국';
      case 'regional':
        return '지역';
      case 'school':
        return '학교';
      default:
        return type;
    }
  };

  if (!user) {
    return (
      <div className="px-3 sm:px-6 md:px-8 lg:px-12 py-6 max-w-4xl mx-auto">
        <div className="text-center py-12">
          <p className="text-muted-foreground">로그인이 필요합니다.</p>
          <Button onClick={() => router.push('/auth')} className="mt-4">
            로그인하기
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="px-3 sm:px-6 md:px-8 lg:px-12 py-6 max-w-4xl mx-auto">
      {/* 헤더 */}
      <div className="flex items-center gap-4 mb-6">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.back()}
          className="shrink-0"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">좋아요한 글</h1>
          <p className="text-sm text-muted-foreground">
            내가 좋아요를 누른 게시글 목록입니다
          </p>
        </div>
      </div>

      {/* 로딩 상태 */}
      {loading && (
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="space-y-3">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                  <div className="flex gap-2">
                    <Skeleton className="h-6 w-16" />
                    <Skeleton className="h-6 w-20" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* 에러 상태 */}
      {error && (
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-red-500 mb-4">{error}</p>
            <Button onClick={() => window.location.reload()}>
              다시 시도
            </Button>
          </CardContent>
        </Card>
      )}

      {/* 게시글 목록 */}
      {!loading && !error && (
        <>
          {posts.length === 0 ? (
            <Card>
              <CardContent className="p-6 text-center">
                <Heart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground mb-4">
                  아직 좋아요를 누른 게시글이 없습니다.
                </p>
                <Button onClick={() => router.push('/community')}>
                  커뮤니티 둘러보기
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {posts.map((post) => (
                <Card 
                  key={post.id} 
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => handlePostClick(post)}
                >
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      {/* 게시글 제목 */}
                      <h3 className="font-medium line-clamp-2 hover:text-primary transition-colors">
                        {post.title}
                      </h3>

                      {/* 게시글 정보 */}
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Badge variant="outline" className="text-xs">
                          {getBoardTypeLabel(post.type || '')}
                        </Badge>
                        <Badge variant="secondary" className="text-xs">
                          {post.boardCode}
                        </Badge>
                        {post.schoolId && (
                          <span className="text-xs">학교 커뮤니티</span>
                        )}
                        {post.regions?.sido && post.regions?.sigungu && (
                          <span className="text-xs">{post.regions.sido} {post.regions.sigungu}</span>
                        )}
                      </div>

                      {/* 작성자 및 날짜 */}
                      <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <span>{post.authorInfo?.isAnonymous ? '익명' : post.authorInfo?.displayName}</span>
                          <Calendar className="h-3 w-3" />
                          <span>
                            {post.createdAt && formatDistanceToNow(
                              new Date(typeof post.createdAt === 'number' ? post.createdAt : post.createdAt * 1000),
                              { addSuffix: true, locale: ko }
                            )}
                          </span>
                        </div>
                      </div>

                      {/* 통계 정보 */}
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Heart className="h-3 w-3 fill-red-500 text-red-500" />
                          <span>{post.stats?.likeCount || 0}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <MessageCircle className="h-3 w-3" />
                          <span>{post.stats?.commentCount || 0}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Eye className="h-3 w-3" />
                          <span>{post.stats?.viewCount || 0}</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
} 