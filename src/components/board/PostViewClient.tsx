'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';

import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { 
  Heart, 
  MessageSquare, 
  Share2, 
  Bookmark, 
  ArrowLeft,
  Eye,
  Clock,
  Edit,
  Trash2,
  MoreVertical,
  Flag,
  BarChart3
} from 'lucide-react';
import { Post, Comment, Board } from '@/types';
import { ReportModal } from '@/components/ui/report-modal';
import { useAuth } from '@/providers/AuthProvider';
import { 
  togglePostScrap,
  checkLikeStatus,
  checkScrapStatus,
  incrementPostViewCount
} from '@/lib/api/board';
import {
  deletePost,
  toggleLikePost
} from '@/lib/api/boards';
import { getBoardsByType } from '@/lib/api/board';
import { toast } from 'react-hot-toast';
import CommentSection from './CommentSection';
import { formatAbsoluteTime } from '@/lib/utils';
import { HtmlContent } from '@/components/ui/html-content';
import { PollVoting } from '@/components/ui/poll-voting';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface PostViewClientProps {
  post: Post;
  initialComments: Comment[];
}

export const PostViewClient = ({ post, initialComments }: PostViewClientProps) => {
  const router = useRouter();
  const { user } = useAuth();
  const [isLiked, setIsLiked] = useState(false);
  const [isScrapped, setIsScrapped] = useState(false);
  const [likeCount, setLikeCount] = useState(post.stats.likeCount);
  const [scrapCount, setScrapCount] = useState(post.stats.scrapCount || 0);
  const [commentCount, setCommentCount] = useState(post.stats.commentCount);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [boardInfo, setBoardInfo] = useState<Board | null>(null);
  const [showReportModal, setShowReportModal] = useState(false);

  useEffect(() => {
    // 조회수 증가 (한 번만)
    incrementPostViewCount(post.id);
    
            // 좋아요/스크랩 상태 확인
        const checkStatuses = async () => {
          if (user) {
            try {
              const [likeStatus, scrapStatus] = await Promise.all([
                checkLikeStatus(post.id, user.uid),
                checkScrapStatus(post.id, user.uid)
              ]);
              setIsLiked(likeStatus);
              setIsScrapped(scrapStatus);
        } catch (error) {
          console.error('상태 확인 실패:', error);
        }
      }
    };
    
    // board 정보 가져오기
    const fetchBoardInfo = async () => {
      try {
        const boards = await getBoardsByType(post.type);
        const board = boards.find(b => b.code === post.boardCode);
        setBoardInfo(board || null);
      } catch (error) {
        console.error('Board 정보 가져오기 실패:', error);
      }
    };
    
    checkStatuses();
    fetchBoardInfo();
  }, [user, post.id, post.type, post.boardCode]);

  const handleLike = async () => {
    if (!user) {
      toast.error('로그인이 필요합니다.');
      return;
    }

    try {
      const result = await toggleLikePost(post.id, user.uid);
      setIsLiked(result.liked);
      setLikeCount(result.likeCount);
      
      toast.success(result.liked ? '좋아요를 눌렀습니다.' : '좋아요를 취소했습니다.');
    } catch (error) {
      console.error('좋아요 처리 실패:', error);
      toast.error('좋아요 처리에 실패했습니다.');
    }
  };

  const handleScrap = async () => {
    if (!user) {
      toast.error('로그인이 필요합니다.');
      return;
    }

    try {
      const result = await togglePostScrap(post.id, user.uid);
      setIsScrapped(result.scrapped);
      setScrapCount(result.scrapCount);
      toast.success(result.scrapped ? '스크랩에 추가했습니다.' : '스크랩을 해제했습니다.');
    } catch (error) {
      console.error('스크랩 처리 실패:', error);
      toast.error('스크랩 처리에 실패했습니다.');
    }
  };



  const handleShare = async () => {
    try {
      const shareText = post.content.replace(/<[^>]*>/g, '').substring(0, 100);
      const shareUrl = window.location.href;
      
      if (navigator.share) {
        await navigator.share({
          title: `${post.title} - Inschoolz`,
          text: shareText + '...',
          url: shareUrl,
        });
        toast.success('게시글이 공유되었습니다.');
      } else {
        // 클립보드에 복사
        await navigator.clipboard.writeText(shareUrl);
        toast.success('📋 게시글 링크가 복사되었습니다!\n다른 곳에 붙여넣기해서 공유해보세요.');
      }
    } catch (error) {
      console.error('공유 실패:', error);
      // 공유 API 실패 시 클립보드로 대체
      try {
        await navigator.clipboard.writeText(window.location.href);
        toast.success('📋 게시글 링크가 복사되었습니다!\n다른 곳에 붙여넣기해서 공유해보세요.');
      } catch (clipboardError) {
        console.error('클립보드 복사 실패:', clipboardError);
        // 최후의 수단으로 텍스트 선택 방식
        const textArea = document.createElement('textarea');
        textArea.value = window.location.href;
        document.body.appendChild(textArea);
        textArea.select();
        try {
          document.execCommand('copy');
          toast.success('📋 게시글 링크가 복사되었습니다!');
        } catch (execError) {
          toast.error('❌ 공유 기능이 지원되지 않는 브라우저입니다.\n링크를 수동으로 복사해주세요: ' + window.location.href);
        } finally {
          document.body.removeChild(textArea);
        }
      }
    }
  };

  const handleCommentCountChange = (count: number) => {
    setCommentCount(count);
  };

  const handleEdit = () => {
    if (!user || user.uid !== post.authorId) {
      toast.error('수정 권한이 없습니다.');
      return;
    }

    // 게시판 타입에 따라 적절한 community 수정 경로로 라우팅
    let editPath = '';
    switch (post.type) {
      case 'national':
        editPath = `/community/national/${post.boardCode}/edit/${post.id}`;
        break;
      case 'regional':
        // 지역 게시판의 경우 사용자의 지역 정보 필요
        if (user.regions) {
          editPath = `/community/region/${encodeURIComponent(user.regions.sido)}/${encodeURIComponent(user.regions.sigungu)}/${post.boardCode}/edit/${post.id}`;
        } else {
          toast.error('지역 정보가 없습니다.');
          return;
        }
        break;
      case 'school':
        // 학교 게시판의 경우 게시글에 저장된 schoolId 사용 (타입 단언 필요)
        const schoolPostId = (post as any)?.schoolId || user.school?.id;
        if (schoolPostId) {
          editPath = `/community/school/${schoolPostId}/${post.boardCode}/edit/${post.id}`;
        } else {
          toast.error('학교 정보가 없습니다.');
          return;
        }
        break;
      default:
        toast.error('잘못된 게시판 타입입니다.');
        return;
    }

    router.push(editPath);
  };

  // 게시글 삭제
  const handleDelete = async () => {
    if (!user || user.uid !== post.authorId) {
      toast.error('삭제 권한이 없습니다.');
      return;
    }

    setIsDeleting(true);
    try {
      await deletePost(post.id, user.uid);
      toast.success('게시글이 삭제되었습니다.');
      
      // 게시판 타입에 따라 적절한 community 경로로 라우팅
      let redirectPath = '';
      switch (post.type) {
        case 'national':
          redirectPath = `/community?tab=national`;
          break;
        case 'regional':
          redirectPath = `/community?tab=regional`;
          break;
        case 'school':
          redirectPath = `/community?tab=school`;
          break;
        default:
          redirectPath = `/community`;
      }
      
      router.push(redirectPath);
    } catch (error) {
      console.error('게시글 삭제 실패:', error);
      toast.error('게시글 삭제에 실패했습니다.');
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  // 작성자 확인
  const isAuthor = user && user.uid === post.authorId;

  // 게시판 타입에 따른 표시명 가져오기
  const getBoardTypeLabel = (type: string) => {
    switch (type) {
      case 'national':
        return '전국';
      case 'regional':
        return '지역';
      case 'school':
        return '학교';
      default:
        return '';
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-2 md:p-4 space-y-4 md:space-y-6">
      {/* 헤더 */}
      <div className="flex items-center gap-4 px-2 md:px-0">
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

      {/* 게시글 컨텐츠 - Card 제거하고 직접 렌더링 */}
      <div className="px-2 md:px-4 py-4 space-y-4">
        {/* 게시판 정보 배지 - 맨 위 왼쪽 */}
        <div className="flex items-center gap-1 mb-4">
          <Badge variant="outline" className="text-xs bg-green-50 text-green-700 border-green-200">
            {getBoardTypeLabel(post.type)}
          </Badge>
          <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
            {post.boardName || boardInfo?.name || post.boardCode}
          </Badge>
          {post.attachments && post.attachments.length > 0 && (
            <Badge variant="outline" className="flex items-center gap-1 px-2 py-0.5 h-5 text-xs bg-orange-50 text-orange-700 border-orange-200">
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
                <circle cx="9" cy="9" r="2" />
                <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
              </svg>
              사진 {post.attachments.filter(att => att.type === 'image').length}
            </Badge>
          )}
          {post.poll && (
            <Badge variant="outline" className="flex items-center gap-1 px-2 py-0.5 h-5 text-xs bg-purple-50 text-purple-700 border-purple-200">
              <BarChart3 className="h-3 w-3" />
              투표
            </Badge>
          )}
        </div>

        {/* 게시글 헤더 */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={post.authorInfo?.profileImageUrl} />
              <AvatarFallback>
                {post.authorInfo?.isAnonymous ? '익명' : post.authorInfo?.displayName?.substring(0, 2) || 'U'}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="font-medium">
                  {post.authorInfo?.isAnonymous ? '익명' : post.authorInfo?.displayName || '사용자'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-slate-500" />
                <span className="text-sm text-slate-500">{formatAbsoluteTime(post.createdAt, 'datetime')}</span>
              </div>
            </div>
          </div>
          
          {/* 게시글 메뉴 - 오른쪽 위 모서리 */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent 
              align="end" 
              side="bottom" 
              sideOffset={5}
              alignOffset={0}
              className="z-50 min-w-[120px]"
              avoidCollisions={true}
              collisionPadding={8}
              sticky="always"
            >
              {isAuthor ? (
                <>
                  <DropdownMenuItem onClick={handleEdit}>
                    <Edit className="h-4 w-4 mr-2" />
                    수정
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={() => setShowDeleteDialog(true)}
                    className="text-red-600"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    삭제
                  </DropdownMenuItem>
                </>
              ) : (
                <DropdownMenuItem 
                  onClick={() => setShowReportModal(true)}
                  className="text-red-600"
                >
                  <Flag className="h-4 w-4 mr-2" />
                  신고
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* 게시글 제목 */}
        <h1 className="text-xl md:text-2xl font-bold mb-4">{post.title}</h1>

        {/* 게시글 내용 */}
        <div className="mb-6">
          <HtmlContent content={post.content} />
        </div>

        {/* 투표 */}
        {post.poll && (
          <div className="mb-6">
            <PollVoting 
              postId={post.id} 
              poll={post.poll}
              onVoteUpdate={(updatedPoll) => {
                // 투표 업데이트 시 필요한 로직 (필요시 구현)
              }}
            />
          </div>
        )}

        {/* 태그 */}
        {post.tags && post.tags.length > 0 && (
          <div className="mb-6">
            <div className="flex flex-wrap gap-2">
              {post.tags.map((tag, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  #{tag}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* 조회수, 좋아요, 댓글 수와 액션 버튼들 */}
        <div className="flex items-center justify-between text-sm text-slate-500 mb-6">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <Eye className="h-4 w-4" />
              <span>{post.stats.viewCount || 0}</span>
            </div>
            <div className="flex items-center gap-1">
              <Heart className="h-4 w-4" />
              <span>{post.stats.likeCount || 0}</span>
            </div>
            <div className="flex items-center gap-1">
              <MessageSquare className="h-4 w-4" />
              <span>{commentCount}</span>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleScrap}
              className={`flex items-center gap-1 h-8 px-2 ${isScrapped ? 'text-blue-500' : 'text-slate-500'}`}
            >
              <Bookmark className={`h-4 w-4 ${isScrapped ? 'fill-current' : ''}`} />
              <span className="text-sm hidden sm:inline">스크랩</span>
            </Button>
            
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleShare}
              className="flex items-center gap-1 h-8 px-2 text-slate-500"
              title="게시글 공유하기"
            >
              <Share2 className="h-4 w-4" />
              <span className="text-sm hidden sm:inline">공유</span>
            </Button>
          </div>
        </div>

        <Separator />
      </div>

      {/* 댓글 섹션 */}
      <CommentSection 
        postId={post.id} 
        initialComments={initialComments}
        onCommentCountChange={handleCommentCountChange}
      />

      {/* 신고 모달 */}
      <ReportModal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        targetId={post.id}
        targetType="post"
        targetContent={JSON.stringify({ title: post.title, content: post.content })}
        onSuccess={() => {
          setShowReportModal(false);
          toast.success('신고가 접수되었습니다.');
        }}
        boardCode={post.boardCode}
        schoolId={post.schoolId}
        regions={post.regions}
      />

      {/* 삭제 확인 다이얼로그 */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>게시글 삭제</AlertDialogTitle>
            <AlertDialogDescription>
              정말로 이 게시글을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? '삭제 중...' : '삭제'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}; 