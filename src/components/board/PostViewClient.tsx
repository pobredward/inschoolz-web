'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { 
  Heart, 
  MessageSquare, 
  Share2, 
  Bookmark, 
  Flag, 
  ArrowLeft,
  Eye,
  Clock
} from 'lucide-react';
import { Post, Comment } from '@/types';
import { useAuth } from '@/providers/AuthProvider';
import { 
  togglePostLike
} from '@/lib/api/board';
import { toast } from 'react-hot-toast';
import CommentSection from './CommentSection';
import { formatSmartTime } from '@/lib/utils';
import { HtmlContent } from '@/components/ui/html-content';

interface PostViewClientProps {
  post: Post;
  initialComments: Comment[];
}

export const PostViewClient = ({ post, initialComments }: PostViewClientProps) => {
  const router = useRouter();
  const { user } = useAuth();
  const [isLiked, setIsLiked] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [likeCount, setLikeCount] = useState(post.stats.likeCount);
  const [commentCount, setCommentCount] = useState(post.stats.commentCount);

  useEffect(() => {
    // 좋아요 상태 확인 (실제로는 API 호출 필요)
    // checkLikeStatus();
    // checkBookmarkStatus();
  }, [user, post.id]);

  const handleLike = async () => {
    if (!user) {
      toast.error('로그인이 필요합니다.');
      return;
    }

    try {
      const newIsLiked = await togglePostLike(post.id, user.uid);
      setIsLiked(newIsLiked);
      setLikeCount(prev => newIsLiked ? prev + 1 : prev - 1);
      
      toast.success(newIsLiked ? '좋아요를 눌렀습니다.' : '좋아요를 취소했습니다.');
    } catch (error) {
      console.error('좋아요 처리 실패:', error);
      toast.error('좋아요 처리에 실패했습니다.');
    }
  };

  const handleBookmark = async () => {
    if (!user) {
      toast.error('로그인이 필요합니다.');
      return;
    }

    try {
      // TODO: togglePostBookmark API 구현 필요
      setIsBookmarked(!isBookmarked);
      toast.success(isBookmarked ? '북마크에서 제거했습니다.' : '북마크에 추가했습니다.');
    } catch (error) {
      console.error('북마크 처리 실패:', error);
      toast.error('북마크 처리에 실패했습니다.');
    }
  };

  const handleReport = async () => {
    if (!user) {
      toast.error('로그인이 필요합니다.');
      return;
    }

    const reason = prompt('신고 사유를 입력해주세요:');
    if (!reason) return;

    try {
      // TODO: reportPost API 구현 필요
      toast.success('신고가 접수되었습니다.');
    } catch (error) {
      console.error('신고 처리 실패:', error);
      toast.error('신고 처리에 실패했습니다.');
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: post.title,
          text: post.content,
          url: window.location.href,
        });
      } catch (error) {
        console.error('공유 실패:', error);
      }
    } else {
      // 클립보드에 복사
      navigator.clipboard.writeText(window.location.href);
      toast.success('링크가 클립보드에 복사되었습니다.');
    }
  };

  const formatDate = (timestamp: unknown) => {
    return formatSmartTime(timestamp);
  };



  const handleCommentCountChange = (count: number) => {
    setCommentCount(count);
  };

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      {/* 헤더 */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.back()}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          뒤로가기
        </Button>
      </div>

      {/* 게시글 카드 */}
      <Card>
        <CardContent className="p-6">
          {/* 게시글 헤더 */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src={post.authorInfo?.profileImageUrl} />
                <AvatarFallback>
                  {post.authorInfo?.isAnonymous ? '익명' : post.authorInfo?.displayName?.substring(0, 2) || 'U'}
                </AvatarFallback>
              </Avatar>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">
                    {post.authorInfo?.isAnonymous ? '익명' : post.authorInfo?.displayName || '사용자'}
                  </span>
                  <Badge variant="secondary" className="text-xs">
                    {post.boardCode}
                  </Badge>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  <span>{formatDate(post.createdAt)}</span>
                  <Eye className="h-3 w-3 ml-2" />
                  <span>조회 {post.stats.viewCount}</span>
                </div>
              </div>
            </div>
          </div>

          {/* 게시글 제목 */}
          <h1 className="text-2xl font-bold mb-4">{post.title}</h1>

          {/* 게시글 내용 */}
          <div className="mb-6">
            <HtmlContent 
              content={post.content}
              className="whitespace-pre-wrap leading-relaxed"
            />
          </div>

          {/* 게시글 이미지 */}
          {post.attachments && post.attachments.filter(att => att.type === 'image').length > 0 && (
            <div className="mb-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {post.attachments.filter(att => att.type === 'image').map((attachment, index) => (
                  <img
                    key={index}
                    src={attachment.url}
                    alt={`첨부 이미지 ${index + 1}`}
                    className="rounded-lg max-w-full h-auto"
                  />
                ))}
              </div>
            </div>
          )}

          <Separator className="my-4" />

          {/* 액션 버튼들 */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleLike}
                className={`flex items-center gap-2 ${isLiked ? 'text-red-500' : ''}`}
              >
                <Heart className={`h-4 w-4 ${isLiked ? 'fill-current' : ''}`} />
                <span>{likeCount}</span>
              </Button>

              <Button
                variant="ghost"
                size="sm"
                className="flex items-center gap-2"
              >
                <MessageSquare className="h-4 w-4" />
                <span>{commentCount}</span>
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={handleBookmark}
                className={`flex items-center gap-2 ${isBookmarked ? 'text-blue-500' : ''}`}
              >
                <Bookmark className={`h-4 w-4 ${isBookmarked ? 'fill-current' : ''}`} />
                <span>북마크</span>
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={handleShare}
                className="flex items-center gap-2"
              >
                <Share2 className="h-4 w-4" />
                <span>공유</span>
              </Button>
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={handleReport}
              className="flex items-center gap-2 text-muted-foreground hover:text-red-500"
            >
              <Flag className="h-4 w-4" />
              <span>신고</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 댓글 섹션 */}
      <CommentSection 
        postId={post.id}
        initialComments={initialComments}
        onCommentCountChange={handleCommentCountChange}
      />
    </div>
  );
}; 