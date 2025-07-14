'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { 
  MessageSquare, 
  Heart, 
  MessageSquare as MessageIcon, 
  MoreVertical, 
  Edit2, 
  Trash2,
  Send,
  Flag
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/providers/AuthProvider';
import { Comment } from '@/types';
import { ReportModal } from '@/components/ui/report-modal';
import { formatRelativeTime } from '@/lib/utils';
import { 
  getCommentsByPost, 
  createComment as createCommentAPI, 
  updateComment, 
  deleteComment,
  toggleCommentLike
} from '@/lib/api/board';
import { toast } from 'react-hot-toast';
import { awardCommentExperience } from '@/lib/experience-service';
import { ExperienceModal } from '@/components/ui/experience-modal';

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
  parentId?: string;
  parentAuthor?: string;
  placeholder?: string;
  buttonText?: string;
  onSubmit: (content: string, isAnonymous: boolean) => void;
  onCancel?: () => void;
  isSubmitting?: boolean;
}

// 댓글 작성 폼 컴포넌트
function CommentForm({ 
  parentId, 
  parentAuthor,
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
    <div className={`space-y-3 ${parentId ? 'bg-slate-50 rounded-lg p-4' : ''}`}>
      {parentAuthor && (
        <div className="text-sm text-slate-600">
          <span className="font-medium text-blue-600">@{parentAuthor}</span>님에게 답글 작성
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-3">
        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={placeholder}
          disabled={isSubmitting}
          className="min-h-[80px] resize-none"
        />
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 text-sm text-slate-600">
            <input
              type="checkbox"
              checked={isAnonymous}
              onChange={(e) => setIsAnonymous(e.target.checked)}
              className="rounded"
            />
            익명으로 작성
          </label>
          <div className="flex gap-2">
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
              disabled={isSubmitting || !content.trim()}
            >
              <Send className="w-4 h-4 mr-1" />
              {buttonText}
            </Button>
          </div>
        </div>
      </form>
    </div>
  );
}

// 댓글 아이템 컴포넌트
function CommentItem({ 
  comment, 
  postId,
  onReply, 
  onEdit, 
  onDelete, 
  onLike,
  level = 0
}: {
  comment: CommentWithReplies;
  postId: string;
  onReply: (parentId: string, parentAuthor: string) => void;
  onEdit: (commentId: string, content: string) => void;
  onDelete: (commentId: string) => void;
  onLike: (commentId: string) => void;
  level?: number;
}) {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);
  const [isLiked, setIsLiked] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  
  const maxLevel = 1; // 최대 1단계 대댓글까지만 허용
  const isAuthor = user?.uid === comment.authorId;
  const isDeleted = comment.status.isDeleted;
  const isReply = level > 0;
  const authorName = comment.isAnonymous ? '익명' : comment.author?.displayName || '사용자';

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
    <div className={`flex gap-3 ${isReply ? 'ml-8 mt-3 p-3 bg-slate-50 rounded-lg' : ''}`}>
      <Avatar className="w-8 h-8 flex-shrink-0">
        <AvatarImage src={comment.author?.profileImageUrl} />
        <AvatarFallback className="text-xs bg-slate-100">
          {authorName.charAt(0)}
        </AvatarFallback>
      </Avatar>
      
      <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
            <span className="font-medium text-sm text-slate-900">
              {authorName}
            </span>
            <span className="text-xs text-slate-500">
              {formatTime(comment.createdAt)}
            </span>
          
          {/* 메뉴 버튼 */}
          {user && !isDeleted && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="w-6 h-6 p-0 ml-auto">
                  <MoreVertical className="w-3 h-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {isAuthor ? (
                  <>
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
                ) : (
                  <DropdownMenuItem 
                    onClick={() => setShowReportModal(true)}
                    className="text-red-600"
                  >
                    <Flag className="mr-2 h-3 w-3" />
                    신고
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
        
        {/* 댓글 내용 */}
        {isEditing && !isDeleted ? (
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
            <p className={`text-sm leading-relaxed whitespace-pre-wrap ${isDeleted ? 'text-slate-500 italic' : 'text-slate-700'}`}>
              {isDeleted ? '삭제된 댓글입니다.' : comment.content}
            </p>
            
            {/* 액션 버튼들 */}
            {!isDeleted && (
              <div className="flex items-center gap-3 mt-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className={`h-7 px-2 text-xs ${isLiked ? 'text-red-500' : 'text-slate-500 hover:text-slate-700'}`}
                  onClick={handleLike}
                >
                  <Heart className={`w-3 h-3 mr-1 ${isLiked ? 'fill-current' : ''}`} />
                  {comment.stats.likeCount}
                </Button>
                
                {level < maxLevel && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 px-2 text-xs text-slate-500 hover:text-slate-700"
                    onClick={() => onReply(comment.id, authorName)}
                  >
                    <MessageIcon className="w-3 h-3 mr-1" />
                    답글
                  </Button>
                )}
              </div>
            )}
          </>
        )}

        {/* 신고 모달 */}
        <ReportModal
          isOpen={showReportModal}
          onClose={() => setShowReportModal(false)}
          targetId={comment.id}
          targetType="comment"
          targetContent={comment.content}
          postId={postId}
          onSuccess={() => {
            setShowReportModal(false);
            toast.success('신고가 접수되었습니다.');
          }}
        />
      </div>
    </div>
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
  const [replyingTo, setReplyingTo] = useState<{ id: string; author: string } | null>(null);
  const [showExperienceModal, setShowExperienceModal] = useState(false);
  const [experienceData, setExperienceData] = useState<{
    expGained: number;
    activityType: 'post' | 'comment' | 'like';
    leveledUp: boolean;
    oldLevel?: number;
    newLevel?: number;
    currentExp: number;
    expToNextLevel: number;
    remainingCount: number;
    totalDailyLimit: number;
  } | null>(null);

  // 댓글 목록 새로고침
  const refreshComments = useCallback(async () => {
    if (!postId) return;
    
    setIsLoading(true);
    try {
      const fetchedComments = await getCommentsByPost(postId);
      setComments(fetchedComments);
      onCommentCountChange?.(fetchedComments.length);
    } catch (error) {
      console.error('댓글 조회 오류:', error);
      toast.error('댓글을 불러오는데 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  }, [postId, onCommentCountChange]);

  // 컴포넌트 마운트 시 댓글 로드
  useEffect(() => {
    if (postId && initialComments.length === 0) {
      refreshComments();
    }
  }, [postId, refreshComments, initialComments.length]);

  // 댓글 작성
  const handleCreateComment = async (content: string, isAnonymous: boolean, parentId?: string) => {
    if (!user) {
      toast.error('로그인이 필요합니다.');
      return;
    }

    setIsSubmitting(true);
    try {
      await createCommentAPI(postId, content, user.uid, isAnonymous, parentId);

      // 경험치 지급
      if (user) {
        try {
          const expResult = await awardCommentExperience(user.uid);
          if (expResult) {
            setExperienceData({
              ...expResult,
              activityType: 'comment'
            });
            setShowExperienceModal(true);
          }
        } catch (expError) {
          console.error('경험치 지급 오류:', expError);
        }
      }

      toast.success('댓글이 작성되었습니다.');
      setReplyingTo(null);
      refreshComments();
    } catch (error) {
      console.error('댓글 작성 오류:', error);
      toast.error('댓글 작성에 실패했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 댓글 수정
  const handleEditComment = async (commentId: string, content: string) => {
    try {
      await updateComment(postId, commentId, content, user?.uid || '');
      toast.success('댓글이 수정되었습니다.');
      refreshComments();
    } catch (error) {
      console.error('댓글 수정 오류:', error);
      toast.error('댓글 수정에 실패했습니다.');
    }
  };

  // 댓글 삭제
  const handleDeleteComment = async (commentId: string) => {
    if (!confirm('정말로 이 댓글을 삭제하시겠습니까?')) return;

    try {
      await deleteComment(postId, commentId, user?.uid || '');
      toast.success('댓글이 삭제되었습니다.');
      refreshComments();
    } catch (error) {
      console.error('댓글 삭제 오류:', error);
      toast.error('댓글 삭제에 실패했습니다.');
    }
  };

  // 댓글 좋아요
  const handleLikeComment = async (commentId: string) => {
    if (!user) {
      toast.error('로그인이 필요합니다.');
      return;
    }
    
    try {
      const isLiked = await toggleCommentLike(postId, commentId, user.uid);
      
      // 댓글 목록 새로고침
      await refreshComments();
      
      toast.success(isLiked ? '댓글에 좋아요를 눌렀습니다.' : '댓글 좋아요를 취소했습니다.');
    } catch (error) {
      console.error('댓글 좋아요 오류:', error);
      toast.error('댓글 좋아요 처리 중 오류가 발생했습니다.');
    }
  };

  // 답글 작성 모드 토글
  const handleReply = (parentId: string, parentAuthor: string) => {
    setReplyingTo(replyingTo?.id === parentId ? null : { id: parentId, author: parentAuthor });
  };

  // 경험치 모달 닫기 핸들러
  const handleExperienceModalClose = () => {
    setShowExperienceModal(false);
    setExperienceData(null);
  };

  // API에서 이미 계층 구조로 가져오므로 조직화 불필요

  return (
    <Card className="border-0 shadow-sm">
      <CardContent className="p-6">
        <div className="space-y-6">
          {/* 댓글 작성 폼 */}
          {user && (
            <CommentForm
              onSubmit={(content, isAnonymous) => 
                handleCreateComment(content, isAnonymous)
              }
              isSubmitting={isSubmitting}
            />
          )}

          {/* 댓글 목록 */}
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : comments.length === 0 ? (
            <div className="text-center py-8">
              <MessageSquare className="w-12 h-12 text-slate-400 mx-auto mb-2" />
              <p className="text-slate-500">아직 댓글이 없습니다.</p>
              <p className="text-sm text-slate-400">첫 번째 댓글을 작성해보세요!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {comments.map((comment: CommentWithReplies) => (
                <div key={comment.id} className="group">
                  <CommentItem
                    comment={comment}
                    postId={postId}
                    onReply={handleReply}
                    onEdit={handleEditComment}
                    onDelete={handleDeleteComment}
                    onLike={handleLikeComment}
                  />
                  
                  {/* 대댓글 렌더링 */}
                  {comment.replies && comment.replies.length > 0 && (
                    <div className="space-y-2">
                      {comment.replies.map((reply: CommentWithReplies) => (
                        <div key={reply.id} className="group">
                          <CommentItem
                            comment={reply}
                            postId={postId}
                            onReply={handleReply}
                            onEdit={handleEditComment}
                            onDelete={handleDeleteComment}
                            onLike={handleLikeComment}
                            level={1}
                          />
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {/* 답글 작성 폼 */}
                  {replyingTo && replyingTo.id === comment.id && user && (
                    <div className="mt-4 ml-8">
                      <CommentForm
                        parentId={comment.id}
                        parentAuthor={replyingTo.author}
                        placeholder="답글을 입력하세요..."
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

          {/* 경험치 획득 모달 */}
          {experienceData && (
            <ExperienceModal
              isOpen={showExperienceModal}
              onClose={handleExperienceModalClose}
              data={experienceData}
            />
          )}
        </div>
      </CardContent>
    </Card>
  );
} 