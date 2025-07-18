'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/providers/AuthProvider';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, Heart, Calendar, ExternalLink } from 'lucide-react';
import { getUserComments } from '@/lib/api/users';
import { Comment } from '@/types';
import { formatSmartTime } from '@/lib/utils';
import { toast } from 'react-hot-toast';
import Link from 'next/link';

export default function MyCommentsPage() {
  const { user } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [hasMore, setHasMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    if (!user) return;

    const loadComments = async () => {
      try {
        setIsLoading(true);
        const result = await getUserComments(user.uid, 1, 20);
        setComments(result.comments);
        setHasMore(result.hasMore);
      } catch (error) {
        console.error('내 댓글 목록 로딩 오류:', error);
        toast.error('댓글 목록을 불러오는데 실패했습니다.');
      } finally {
        setIsLoading(false);
      }
    };

    loadComments();
  }, [user]);

  const loadMoreComments = async () => {
    if (!user || !hasMore || isLoading) return;

    try {
      setIsLoading(true);
      const nextPage = currentPage + 1;
      const result = await getUserComments(user.uid, nextPage, 20);
      setComments(prev => [...prev, ...result.comments]);
      setHasMore(result.hasMore);
      setCurrentPage(nextPage);
    } catch (error) {
      console.error('추가 댓글 로딩 오류:', error);
      toast.error('댓글을 더 불러오는데 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-gray-500">로그인이 필요합니다.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <MessageSquare className="h-6 w-6 text-green-600" />
            <h1 className="text-2xl font-bold">내 댓글</h1>
          </div>
          <p className="text-gray-600">작성한 댓글을 확인하세요.</p>
        </div>

        {isLoading && comments.length === 0 ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : comments.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-600 mb-2">
                작성한 댓글이 없습니다
              </h3>
              <p className="text-gray-500 mb-4">
                게시글에 댓글을 작성해보세요.
              </p>
              <Link href="/community">
                <Button variant="outline">커뮤니티 둘러보기</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {comments.map((comment) => {
              const getBoardTypeLabel = (type: string) => {
                switch (type) {
                  case 'national': return '전국';
                  case 'regional': return '지역';
                  case 'school': return '학교';
                  default: return type;
                }
              };

              const getBoardName = (postData: any) => {
                return postData?.boardName || '게시판';
              };

              return (
                <Card key={comment.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        {comment.postData && (
                          <>
                            <Badge variant="secondary" className="bg-green-100 text-green-800 text-xs">
                              {getBoardTypeLabel(comment.postData.type)}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {getBoardName(comment.postData)}
                            </Badge>
                          </>
                        )}
                        <div className="flex items-center gap-1 text-sm text-gray-500">
                          <Calendar className="h-3 w-3" />
                          <span>{formatSmartTime(comment.createdAt)}</span>
                        </div>
                      </div>
                      {comment.postData && (
                        <Link href={
                          comment.postData.type === 'national' 
                            ? `/community/national/${comment.postData.boardCode}/${comment.postId}`
                            : comment.postData.type === 'regional' && comment.postData.regions
                            ? `/community/region/${comment.postData.regions.sido}/${comment.postData.regions.sigungu}/${comment.postData.boardCode}/${comment.postId}`
                            : comment.postData.type === 'school' && comment.postData.schoolId
                            ? `/community/school/${comment.postData.schoolId}/${comment.postData.boardCode}/${comment.postId}`
                            : '#'
                        }>
                          <Button variant="ghost" size="sm" className="text-green-600 hover:text-green-700">
                            <ExternalLink className="h-4 w-4 mr-1" />
                            원글 보기
                          </Button>
                        </Link>
                      )}
                    </div>

                    <div className="mb-3">
                      <p className="text-gray-800 leading-relaxed">
                        {comment.content}
                      </p>
                    </div>

                    {comment.postData?.title && (
                      <div className="mb-3 p-3 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-600 font-medium">
                          "{comment.postData.title}"
                        </p>
                      </div>
                    )}

                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <Heart className="h-4 w-4" />
                        <span>{comment.stats.likeCount || 0}</span>
                      </div>
                      {comment.isAnonymous && (
                        <Badge variant="outline" className="text-xs">
                          익명
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}

            {hasMore && (
              <div className="text-center py-4">
                <Button 
                  onClick={loadMoreComments} 
                  disabled={isLoading}
                  variant="outline"
                >
                  {isLoading ? '로딩 중...' : '더 보기'}
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
} 