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
  Flag,
  UserX
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
import AnonymousCommentForm from '@/components/ui/anonymous-comment-form';
import AnonymousPasswordModal from '@/components/ui/anonymous-password-modal';
import { formatRelativeTime } from '@/lib/utils';
import { 
  getCommentsByPost, 
  createComment as createCommentAPI, 
  updateComment, 
  deleteComment,
  toggleCommentLike
} from '@/lib/api/board';
import {
  createAnonymousComment,
  updateAnonymousComment,
  deleteAnonymousComment,
  getClientIP,
  verifyAnonymousCommentPassword
} from '@/lib/api/comments';
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
  onAnonymousEdit,
  onAnonymousDelete,
  editingComment,
  onEditingCommentChange,
  onEditingCommentSave,
  onEditingCommentCancel,
  level = 0
}: {
  comment: CommentWithReplies;
  postId: string;
  onReply: (parentId: string, parentAuthor: string) => void;
  onEdit: (commentId: string, content: string) => void;
  onDelete: (commentId: string) => void;
  onLike: (commentId: string) => void;
  onAnonymousEdit: (commentId: string) => void;
  onAnonymousDelete: (commentId: string) => void;
  editingComment: { id: string; content: string; password?: string } | null;
  onEditingCommentChange: (content: string) => void;
  onEditingCommentSave: () => void;
  onEditingCommentCancel: () => void;
  level?: number;
}) {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);
  const [isLiked, setIsLiked] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  
  const maxLevel = 1; // 최대 1단계 대댓글까지만 허용
  const isAuthor = user?.uid === comment.authorId;
  const isAnonymous = comment.isAnonymous && !comment.authorId;
  const isDeleted = comment.status.isDeleted;
  const isReply = level > 0;
  
  // 작성자 표시 로직
  const getAuthorName = () => {
    if (isAnonymous && comment.anonymousAuthor) {
      return comment.anonymousAuthor.nickname;
    }
    if (comment.isAnonymous && comment.authorId) {
      return '익명';
    }
    return comment.author?.displayName || '사용자';
  };

  const authorName = getAuthorName();

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
        <AvatarImage src={!isAnonymous ? comment.author?.profileImageUrl : undefined} />
        <AvatarFallback className="text-xs bg-slate-100">
          {isAnonymous ? <UserX className="w-4 h-4" /> : authorName.charAt(0)}
        </AvatarFallback>
      </Avatar>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-medium text-sm text-slate-900">
            {authorName}
            {isAnonymous && <span className="text-xs text-slate-500 ml-1">(비회원)</span>}
          </span>
          <span className="text-xs text-slate-500">
            {formatTime(comment.createdAt)}
          </span>
          
          {/* 메뉴 버튼 */}
          {!isDeleted && (
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
                ) : isAnonymous && comment.anonymousAuthor ? (
                  <>
                    <DropdownMenuItem onClick={() => onAnonymousEdit(comment.id)}>
                      <Edit2 className="mr-2 h-3 w-3" />
                      수정 (비밀번호 필요)
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => onAnonymousDelete(comment.id)}
                      className="text-red-600"
                    >
                      <Trash2 className="mr-2 h-3 w-3" />
                      삭제 (비밀번호 필요)
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
        ) : editingComment && editingComment.id === comment.id ? (
          <div className="space-y-2">
            <Textarea
              value={editingComment.content}
              onChange={(e) => onEditingCommentChange(e.target.value)}
              className="min-h-[60px] text-sm"
              placeholder="댓글 내용을 입력하세요..."
            />
            <div className="flex gap-2">
              <Button 
                size="sm" 
                onClick={onEditingCommentSave}
              >
                수정 완료
              </Button>
              <Button 
                size="sm" 
                variant="outline" 
                onClick={onEditingCommentCancel}
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
  const [showAnonymousForm, setShowAnonymousForm] = useState(false);
  const [passwordModal, setPasswordModal] = useState<{
    isOpen: boolean;
    commentId: string;
    action: 'edit' | 'delete';
  }>({ isOpen: false, commentId: '', action: 'edit' });
  const [editingComment, setEditingComment] = useState<{ id: string; content: string; password?: string } | null>(null);
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

  // 일반 댓글 작성 (로그인 사용자)
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

  // 익명 댓글 작성 (비로그인 사용자)
  const handleCreateAnonymousComment = async (data: {
    nickname: string;
    password: string;
    content: string;
  }) => {
    setIsSubmitting(true);
    try {
      const ipAddress = await getClientIP();
      
      await createAnonymousComment({
        postId,
        content: data.content,
        nickname: data.nickname,
        password: data.password,
        parentId: replyingTo?.id || null,
        ipAddress: ipAddress || undefined,
      });

      toast.success('익명 댓글이 작성되었습니다.');
      setShowAnonymousForm(false);
      setReplyingTo(null);
      refreshComments();
    } catch (error) {
      console.error('익명 댓글 작성 오류:', error);
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

  // 익명 댓글 수정
  const handleAnonymousEdit = (commentId: string) => {
    const comment = comments.find(c => c.id === commentId);
    if (comment) {
      setEditingComment({ id: commentId, content: comment.content });
      setPasswordModal({ isOpen: true, commentId, action: 'edit' });
    }
  };

  // 익명 댓글 삭제
  const handleAnonymousDelete = (commentId: string) => {
    setPasswordModal({ isOpen: true, commentId, action: 'delete' });
  };

  // 비밀번호 확인 후 익명 댓글 수정/삭제
  const handlePasswordConfirm = async (password: string): Promise<boolean> => {
    try {
      const { commentId, action } = passwordModal;
      
      if (action === 'edit') {
        // 비밀번호 검증만 하고 실제 수정은 나중에
        const isValidPassword = await verifyAnonymousCommentPassword(postId, commentId, password);
        if (!isValidPassword) {
          return false;
        }
        
        // 수정 모드 활성화 (비밀번호도 함께 저장)
        const comment = comments.find(c => c.id === commentId);
        if (comment) {
          setEditingComment({ id: commentId, content: comment.content, password });
        }
        return true;
      } else if (action === 'delete') {
        await deleteAnonymousComment(postId, commentId, password);
        toast.success('댓글이 삭제되었습니다.');
        refreshComments();
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('익명 댓글 작업 오류:', error);
      if (error instanceof Error && error.message.includes('비밀번호')) {
        return false; // 비밀번호 오류는 모달에서 처리
      }
      toast.error('작업에 실패했습니다.');
      return false;
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

  // 익명 댓글 수정 내용 변경
  const handleEditingCommentChange = (content: string) => {
    setEditingComment(prev => prev ? { ...prev, content } : null);
  };

  // 익명 댓글 수정 저장
  const handleEditingCommentSave = async () => {
    if (!editingComment?.password) return;
    
    try {
      await updateAnonymousComment(postId, editingComment.id, editingComment.content, editingComment.password);
      toast.success('댓글이 수정되었습니다.');
      setEditingComment(null);
      refreshComments();
    } catch (error) {
      console.error('익명 댓글 수정 오류:', error);
      toast.error('댓글 수정에 실패했습니다.');
    }
  };

  // 익명 댓글 수정 취소
  const handleEditingCommentCancel = () => {
    setEditingComment(null);
  };

  return (
    <Card className="border-0 shadow-sm">
      <CardContent className="p-6">
        <div className="space-y-6">
          {/* 댓글 작성 폼 */}
          {user ? (
            <CommentForm
              onSubmit={(content, isAnonymous) => 
                handleCreateComment(content, isAnonymous)
              }
              isSubmitting={isSubmitting}
            />
          ) : !showAnonymousForm ? (
            <div className="space-y-3">
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600 mb-3">
                  로그인하지 않아도 익명으로 댓글을 작성할 수 있습니다.
                </p>
                <Button
                  onClick={() => setShowAnonymousForm(true)}
                  className="bg-green-500 hover:bg-green-600"
                >
                  <MessageSquare className="w-4 h-4 mr-2" />
                  익명 댓글 작성
                </Button>
              </div>
            </div>
          ) : (
            <AnonymousCommentForm
              onSubmit={handleCreateAnonymousComment}
              onCancel={() => setShowAnonymousForm(false)}
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
                    onAnonymousEdit={handleAnonymousEdit}
                    onAnonymousDelete={handleAnonymousDelete}
                    editingComment={editingComment}
                    onEditingCommentChange={handleEditingCommentChange}
                    onEditingCommentSave={handleEditingCommentSave}
                    onEditingCommentCancel={handleEditingCommentCancel}
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
                            onAnonymousEdit={handleAnonymousEdit}
                            onAnonymousDelete={handleAnonymousDelete}
                            editingComment={editingComment}
                            onEditingCommentChange={handleEditingCommentChange}
                            onEditingCommentSave={handleEditingCommentSave}
                            onEditingCommentCancel={handleEditingCommentCancel}
                            level={1}
                          />
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {/* 답글 작성 폼 */}
                  {replyingTo && replyingTo.id === comment.id && (
                    <div className="mt-4 ml-8">
                      {user ? (
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
                      ) : (
                        <AnonymousCommentForm
                          onSubmit={handleCreateAnonymousComment}
                          onCancel={() => setReplyingTo(null)}
                          isSubmitting={isSubmitting}
                          placeholder={`@${replyingTo.author}님에게 답글을 입력하세요...`}
                        />
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* 익명 댓글 비밀번호 확인 모달 */}
          <AnonymousPasswordModal
            isOpen={passwordModal.isOpen}
            onClose={() => {
              setPasswordModal({ isOpen: false, commentId: '', action: 'edit' });
              setEditingComment(null);
            }}
            onConfirm={handlePasswordConfirm}
            title={passwordModal.action === 'edit' ? '댓글 수정' : '댓글 삭제'}
            description={
              passwordModal.action === 'edit' 
                ? '댓글을 수정하려면 작성 시 입력한 비밀번호를 입력해주세요.'
                : '댓글을 삭제하려면 작성 시 입력한 비밀번호를 입력해주세요.'
            }
            isLoading={isSubmitting}
          />

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