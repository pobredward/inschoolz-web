'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { 
  MessageSquare, 
  Heart, 
  Reply, 
  MoreVertical, 
  Flag, 
  Edit2, 
  Trash2,
  Send
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { useAuth } from '@/providers/AuthProvider';
import { Comment } from '@/types';
import { formatRelativeTime } from '@/lib/utils';
import { 
  getCommentsByPost, 
  createComment as createCommentAPI, 
  updateComment, 
  deleteComment,
  reportComment 
} from '@/lib/api/board';
import { toast } from 'react-hot-toast';

interface CommentSectionProps {
  postId: string;
  initialComments?: Comment[];
  onCommentCountChange?: (count: number) => void;
}

interface CommentWithReplies extends Comment {
  replies?: Comment[];
  author?: {
    displayName: string;
    profileImageUrl?: string;
    isAnonymous: boolean;
  };
}

interface CommentFormProps {
  postId: string;
  parentId?: string;
  placeholder?: string;
  buttonText?: string;
  onSubmit: (content: string, isAnonymous: boolean) => void;
  onCancel?: () => void;
  isSubmitting?: boolean;
}

// 댓글 작성 폼 컴포넌트
function CommentForm({ 
  postId, 
  parentId, 
  placeholder = "댓글을 입력하세요...", 
  buttonText = "댓글 작성",
  onSubmit, 
  onCancel,
  isSubmitting = false 
}: CommentFormProps) {
  const [content, setContent] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!content.trim()) {
      toast.error('댓글 내용을 입력해주세요.');
      return;
    }

    onSubmit(content.trim(), isAnonymous);
    setContent('');
    setIsAnonymous(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <Textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder={placeholder}
        className="min-h-[80px] resize-none"
        disabled={isSubmitting}
      />
      
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Checkbox
            id={`anonymous-${postId}-${parentId || 'root'}`}
            checked={isAnonymous}
            onCheckedChange={(checked) => setIsAnonymous(checked as boolean)}
            disabled={isSubmitting}
          />
          <label 
            htmlFor={`anonymous-${postId}-${parentId || 'root'}`}
            className="text-sm text-muted-foreground cursor-pointer"
          >
            익명으로 작성
          </label>
        </div>
        
        <div className="flex items-center gap-2">
          {onCancel && (
            <Button 
              type="button" 
              variant="outline" 
              size="sm" 
              onClick={onCancel}
              disabled={isSubmitting}
            >
              취소
            </Button>
          )}
          <Button 
            type="submit" 
            size="sm" 
            disabled={!content.trim() || isSubmitting}
            className="min-w-[80px]"
          >
            {isSubmitting ? (
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" />
                <span>작성중...</span>
              </div>
            ) : (
              <>
                <Send className="w-3 h-3 mr-1" />
                {buttonText}
              </>
            )}
          </Button>
        </div>
      </div>
    </form>
  );
}

// 개별 댓글 컴포넌트
function CommentItem({ 
  comment, 
  postId, 
  onReply, 
  onEdit, 
  onDelete, 
  onLike,
  onReport,
  level = 0 
}: {
  comment: CommentWithReplies;
  postId: string;
  onReply: (parentId: string) => void;
  onEdit: (commentId: string, content: string) => void;
  onDelete: (commentId: string) => void;
  onLike: (commentId: string) => void;
  onReport: (commentId: string) => void;
  level?: number;
}) {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);
  const [isLiked, setIsLiked] = useState(false); // 실제로는 사용자의 좋아요 상태를 확인해야 함
  
  const isAuthor = user?.uid === comment.authorId;
  const maxLevel = 2; // 대댓글은 2단계까지만
  
  const formatTime = (timestamp: unknown) => {
    return formatRelativeTime(timestamp);
  };

  const handleEdit = () => {
    if (!editContent.trim()) {
      toast.error('댓글 내용을 입력해주세요.');
      return;
    }
    
    onEdit(comment.id, editContent.trim());
    setIsEditing(false);
  };

  const handleLike = () => {
    onLike(comment.id);
    setIsLiked(!isLiked);
  };

  return (
    <div className={`${level > 0 ? 'ml-8 mt-3' : 'mt-4'}`}>
      <div className="flex gap-3">
        <Avatar className="h-8 w-8 flex-shrink-0">
          <AvatarImage 
            src={comment.author?.profileImageUrl} 
            alt={comment.author?.displayName || '사용자'}
          />
          <AvatarFallback className="text-xs">
            {comment.isAnonymous 
              ? '익명' 
              : comment.author?.displayName?.substring(0, 2) || 'U'
            }
          </AvatarFallback>
        </Avatar>
        
        <div className="flex-1 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-medium text-sm">
                {comment.isAnonymous ? '익명' : comment.author?.displayName || '사용자'}
              </span>
              <span className="text-xs text-muted-foreground">
                {formatTime(comment.createdAt)}
              </span>
              {comment.updatedAt && comment.updatedAt !== comment.createdAt && (
                <span className="text-xs text-muted-foreground">(수정됨)</span>
              )}
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                  <MoreVertical className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {level < maxLevel && (
                  <DropdownMenuItem onClick={() => onReply(comment.id)}>
                    <Reply className="mr-2 h-3 w-3" />
                    답글 달기
                  </DropdownMenuItem>
                )}
                
                {isAuthor && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => setIsEditing(true)}>
                      <Edit2 className="mr-2 h-3 w-3" />
                      수정
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => onDelete(comment.id)}
                      className="text-red-600"
                    >
                      <Trash2 className="mr-2 h-3 w-3" />
                      삭제
                    </DropdownMenuItem>
                  </>
                )}
                
                {!isAuthor && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      onClick={() => onReport(comment.id)}
                      className="text-red-600"
                    >
                      <Flag className="mr-2 h-3 w-3" />
                      신고
                    </DropdownMenuItem>
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          
          {isEditing ? (
            <div className="space-y-2">
              <Textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                className="min-h-[60px] text-sm"
              />
              <div className="flex gap-2">
                <Button size="sm" onClick={handleEdit}>
                  수정 완료
                </Button>
                <Button 
                  size="sm" 
                  variant="outline" 
                  onClick={() => {
                    setIsEditing(false);
                    setEditContent(comment.content);
                  }}
                >
                  취소
                </Button>
              </div>
            </div>
          ) : (
            <>
              <p className="text-sm leading-relaxed whitespace-pre-wrap">
                {comment.content}
              </p>
              
              <div className="flex items-center gap-4">
                <Button
                  variant="ghost"
                  size="sm"
                  className={`h-6 px-2 ${isLiked ? 'text-red-500' : 'text-muted-foreground'}`}
                  onClick={handleLike}
                >
                  <Heart className={`h-3 w-3 mr-1 ${isLiked ? 'fill-current' : ''}`} />
                  <span className="text-xs">{comment.stats.likeCount}</span>
                </Button>
                
                {level < maxLevel && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 px-2 text-muted-foreground hover:text-foreground"
                    onClick={() => onReply(comment.id)}
                  >
                    <Reply className="h-3 w-3 mr-1" />
                    <span className="text-xs">답글</span>
                  </Button>
                )}
              </div>
            </>
          )}
        </div>
      </div>
      
      {/* 대댓글 표시 */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="mt-3">
          {comment.replies.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              postId={postId}
              onReply={onReply}
              onEdit={onEdit}
              onDelete={onDelete}
              onLike={onLike}
              onReport={onReport}
              level={level + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// 신고 다이얼로그 컴포넌트
function ReportDialog({ 
  isOpen, 
  onOpenChange, 
  commentId,
  onReport 
}: {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  commentId: string;
  onReport: (commentId: string, reason: string) => void;
}) {
  const [selectedReason, setSelectedReason] = useState('');
  const [customReason, setCustomReason] = useState('');

  const reportReasons = [
    '스팸/도배',
    '욕설/비방',
    '개인정보 노출',
    '불법/유해 정보',
    '성적 내용',
    '기타'
  ];

  const handleReport = () => {
    const reason = selectedReason === '기타' ? customReason : selectedReason;
    
    if (!reason.trim()) {
      toast.error('신고 사유를 선택해주세요.');
      return;
    }

    onReport(commentId, reason.trim());
    onOpenChange(false);
    setSelectedReason('');
    setCustomReason('');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>댓글 신고</DialogTitle>
          <DialogDescription>
            신고 사유를 선택해주세요. 신고된 댓글은 관리자가 검토 후 조치됩니다.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="grid gap-3">
            {reportReasons.map((reason) => (
              <div key={reason} className="flex items-center space-x-2">
                <Checkbox
                  id={`reason-${reason}`}
                  checked={selectedReason === reason}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      setSelectedReason(reason);
                    }
                  }}
                />
                <label 
                  htmlFor={`reason-${reason}`}
                  className="text-sm cursor-pointer"
                >
                  {reason}
                </label>
              </div>
            ))}
          </div>
          
          {selectedReason === '기타' && (
            <Textarea
              value={customReason}
              onChange={(e) => setCustomReason(e.target.value)}
              placeholder="구체적인 신고 사유를 입력해주세요..."
              className="min-h-[80px]"
            />
          )}
          
          <div className="flex justify-end gap-2">
            <Button 
              variant="outline" 
              onClick={() => onOpenChange(false)}
            >
              취소
            </Button>
            <Button 
              onClick={handleReport}
              disabled={!selectedReason || (selectedReason === '기타' && !customReason.trim())}
            >
              신고하기
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// 메인 댓글 섹션 컴포넌트
export default function CommentSection({ 
  postId, 
  initialComments = [], 
  onCommentCountChange 
}: CommentSectionProps) {
  const { user } = useAuth();
  const [comments, setComments] = useState<CommentWithReplies[]>(initialComments);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [reportingComment, setReportingComment] = useState<string | null>(null);

  // 댓글 목록 새로고침
  const refreshComments = useCallback(async () => {
    if (!postId) return;
    
    setIsLoading(true);
    try {
      const fetchedComments = await getCommentsByPost(postId);
      setComments(fetchedComments);
      onCommentCountChange?.(fetchedComments.length);
    } catch (error) {
      console.error('댓글 새로고침 오류:', error);
      toast.error('댓글을 불러오는 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  }, [postId, onCommentCountChange]);

  // 댓글 작성
  const handleCreateComment = async (content: string, isAnonymous: boolean, parentId?: string) => {
    if (!user) {
      toast.error('로그인이 필요합니다.');
      return;
    }

    setIsSubmitting(true);
    try {
      await createCommentAPI(postId, content, user.uid, isAnonymous, parentId);
      await refreshComments();
      setReplyingTo(null);
      toast.success('댓글이 작성되었습니다.');
    } catch (error) {
      console.error('댓글 작성 오류:', error);
      toast.error('댓글 작성 중 오류가 발생했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 댓글 수정
  const handleEditComment = async (commentId: string, content: string) => {
    if (!user) return;

    try {
      await updateComment(postId, commentId, user.uid, content);
      await refreshComments();
      toast.success('댓글이 수정되었습니다.');
    } catch (error) {
      console.error('댓글 수정 오류:', error);
      toast.error('댓글 수정 중 오류가 발생했습니다.');
    }
  };

  // 댓글 삭제
  const handleDeleteComment = async (commentId: string) => {
    if (!user) return;

    if (!confirm('댓글을 삭제하시겠습니까?')) return;

    try {
      await deleteComment(postId, commentId, user.uid);
      await refreshComments();
      toast.success('댓글이 삭제되었습니다.');
    } catch (error) {
      console.error('댓글 삭제 오류:', error);
      toast.error('댓글 삭제 중 오류가 발생했습니다.');
    }
  };

  // 댓글 좋아요 (향후 구현)
  const handleLikeComment = async (commentId: string) => {
    if (!user) {
      toast.error('로그인이 필요합니다.');
      return;
    }
    
    // TODO: 댓글 좋아요 API 구현
    toast.success('댓글 좋아요 기능은 준비 중입니다.');
  };

  // 댓글 신고
  const handleReportComment = async (commentId: string, reason: string) => {
    if (!user) {
      toast.error('로그인이 필요합니다.');
      return;
    }

    try {
      await reportComment(postId, commentId, user.uid, reason);
      toast.success('신고가 접수되었습니다.');
      setReportingComment(null);
    } catch (error) {
      console.error('댓글 신고 오류:', error);
      toast.error('신고 처리 중 오류가 발생했습니다.');
    }
  };

  // 답글 작성 모드 토글
  const handleReply = (parentId: string) => {
    setReplyingTo(replyingTo === parentId ? null : parentId);
  };

  // 초기 댓글 로드
  useEffect(() => {
    if (initialComments.length === 0) {
      refreshComments();
    }
  }, [initialComments.length, refreshComments]);

  return (
    <Card className="mt-6">
      <CardContent className="p-6">
        <div className="flex items-center gap-2 mb-6">
          <MessageSquare className="h-5 w-5" />
          <h3 className="text-lg font-semibold">
            댓글 {comments.length}개
          </h3>
        </div>

        {/* 댓글 작성 폼 */}
        {user ? (
          <div className="mb-6">
            <CommentForm
              postId={postId}
              onSubmit={(content, isAnonymous) => handleCreateComment(content, isAnonymous)}
              isSubmitting={isSubmitting}
            />
          </div>
        ) : (
          <div className="mb-6 p-4 bg-muted rounded-lg text-center">
            <p className="text-muted-foreground">
              댓글을 작성하려면 <span className="text-primary hover:underline cursor-pointer">로그인</span>이 필요합니다.
            </p>
          </div>
        )}

        {/* 댓글 목록 */}
        {isLoading ? (
          <div className="text-center py-8">
            <div className="inline-block w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <p className="text-muted-foreground mt-2">댓글을 불러오는 중...</p>
          </div>
        ) : comments.length === 0 ? (
          <div className="text-center py-8">
            <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
            <p className="text-muted-foreground">아직 댓글이 없습니다.</p>
            <p className="text-sm text-muted-foreground">첫 번째 댓글을 작성해보세요!</p>
          </div>
        ) : (
          <div className="space-y-1">
            {comments.map((comment) => (
              <div key={comment.id}>
                <CommentItem
                  comment={comment}
                  postId={postId}
                  onReply={handleReply}
                  onEdit={handleEditComment}
                  onDelete={handleDeleteComment}
                  onLike={handleLikeComment}
                  onReport={(commentId) => setReportingComment(commentId)}
                />
                
                {/* 답글 작성 폼 */}
                {replyingTo === comment.id && user && (
                  <div className="ml-11 mt-3">
                    <CommentForm
                      postId={postId}
                      parentId={comment.id}
                      placeholder={`${comment.isAnonymous ? '익명' : comment.author?.displayName || '사용자'}님에게 답글...`}
                      buttonText="답글 작성"
                      onSubmit={(content, isAnonymous) => 
                        handleCreateComment(content, isAnonymous, comment.id)
                      }
                      onCancel={() => setReplyingTo(null)}
                      isSubmitting={isSubmitting}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* 신고 다이얼로그 */}
        <ReportDialog
          isOpen={!!reportingComment}
          onOpenChange={(open) => !open && setReportingComment(null)}
          commentId={reportingComment || ''}
          onReport={handleReportComment}
        />
      </CardContent>
    </Card>
  );
} 