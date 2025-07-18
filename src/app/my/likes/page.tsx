'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, Heart } from 'lucide-react';
import { useAuth } from '@/providers/AuthProvider';
import { getUserLikedPosts } from '@/lib/api/users';
import { Post } from '@/types';
import PostListItem from '@/components/board/PostListItem';

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

  const getBoardName = (post: Post) => {
    // boardName이 있으면 직접 사용
    if (post.boardName) {
      return post.boardName;
    }
    
    // fallback for existing posts without boardName
    switch (post.boardCode) {
      case 'free': return '자유게시판';
      case 'qa': return '질문/답변';
      case 'study': return '스터디';
      case 'club': return '동아리';
      case 'notice': return '공지사항';
      case 'graduate': return '졸업생';
      case 'academy': return '학원정보';
      case 'restaurant': return '맛집추천';
      case 'local': return '동네소식';
      case 'together': return '함께해요';
      case 'job': return '구인구직';
      case 'exam': return '입시정보';
      case 'career': return '진로상담';
      case 'university': return '대학생활';
      case 'hobby': return '취미생활';
      default: return post.boardCode || '게시판';
    }
  };

  const getPostUrl = (post: Post) => {
    if (post.type === 'national') {
      return `/community/national/${post.boardCode}/${post.id}`;
    } else if (post.type === 'regional') {
      return `/community/region/${post.regions?.sido}/${post.regions?.sigungu}/${post.boardCode}/${post.id}`;
    } else if (post.type === 'school') {
      return `/community/school/${post.schoolId}/${post.boardCode}/${post.id}`;
    }
    return '#';
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
                <PostListItem
                  key={post.id}
                  post={{
                    ...post,
                    authorInfo: post.authorInfo || { displayName: '익명', isAnonymous: true },
                    boardName: getBoardName(post),
                  }}
                  href={getPostUrl(post)}
                  showBadges={true}
                  typeBadgeText={getBoardTypeLabel(post.type)}
                  boardBadgeText={getBoardName(post)}
                  variant="profile"
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
} 