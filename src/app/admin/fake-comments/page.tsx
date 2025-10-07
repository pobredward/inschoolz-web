"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { MessageCircle, RefreshCw, Search, CheckCircle, XCircle, Eye, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/providers/AuthProvider';

interface FakeComment {
  id: string;
  content: string;
  postId: string;
  postTitle: string;
  authorId: string;
  authorName: string;
  schoolId: string;
  schoolName: string;
  createdAt: string;
  isApproved: boolean;
  isPending: boolean;
  likeCount: number;
}

export default function FakeCommentsPage() {
  const { user } = useAuth();
  const [comments, setComments] = useState<FakeComment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');

  // 댓글 목록 가져오기
  const fetchComments = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/admin/fake-comments');
      const result = await response.json();
      
      if (result.success) {
        setComments(result.data || []);
        toast.success(`${result.data.length}개의 AI 댓글을 조회했습니다.`);
      } else {
        throw new Error(result.error || '알 수 없는 오류가 발생했습니다.');
      }
    } catch (error) {
      console.error('AI 댓글 조회 오류:', error);
      toast.error('AI 댓글을 불러오는데 실패했습니다.');
      setComments([]);
    } finally {
      setIsLoading(false);
    }
  };

  // 댓글 승인
  const approveComment = async (commentId: string) => {
    try {
      const response = await fetch(`/api/admin/fake-comments/${commentId}/approve`, {
        method: 'POST'
      });
      
      const result = await response.json();
      
      if (result.success) {
        toast.success('댓글이 승인되었습니다.');
        await fetchComments();
      } else {
        throw new Error(result.error || '댓글 승인 실패');
      }
    } catch (error) {
      console.error('댓글 승인 오류:', error);
      toast.error('댓글 승인에 실패했습니다.');
    }
  };

  // 댓글 거부
  const rejectComment = async (commentId: string) => {
    try {
      const response = await fetch(`/api/admin/fake-comments/${commentId}/reject`, {
        method: 'POST'
      });
      
      const result = await response.json();
      
      if (result.success) {
        toast.success('댓글이 거부되었습니다.');
        await fetchComments();
      } else {
        throw new Error(result.error || '댓글 거부 실패');
      }
    } catch (error) {
      console.error('댓글 거부 오류:', error);
      toast.error('댓글 거부에 실패했습니다.');
    }
  };

  // 댓글 삭제
  const deleteComment = async (commentId: string) => {
    if (!confirm('정말로 이 댓글을 삭제하시겠습니까?')) return;

    try {
      const response = await fetch(`/api/admin/fake-comments/${commentId}`, {
        method: 'DELETE'
      });
      
      const result = await response.json();
      
      if (result.success) {
        toast.success('댓글이 삭제되었습니다.');
        await fetchComments();
      } else {
        throw new Error(result.error || '댓글 삭제 실패');
      }
    } catch (error) {
      console.error('댓글 삭제 오류:', error);
      toast.error('댓글 삭제에 실패했습니다.');
    }
  };

  useEffect(() => {
    fetchComments();
  }, []);

  // 필터링된 댓글
  const filteredComments = comments.filter(comment => {
    const matchesSearch = (comment.content || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (comment.postTitle || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (comment.authorName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (comment.schoolName || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    let matchesStatus = true;
    if (statusFilter === 'pending') matchesStatus = comment.isPending;
    else if (statusFilter === 'approved') matchesStatus = comment.isApproved;
    else if (statusFilter === 'rejected') matchesStatus = !comment.isApproved && !comment.isPending;
    
    return matchesSearch && matchesStatus;
  });

  const pendingCount = comments.filter(c => c.isPending).length;
  const approvedCount = comments.filter(c => c.isApproved).length;
  const rejectedCount = comments.filter(c => !c.isApproved && !c.isPending).length;

  if (!user?.profile?.isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">접근 권한이 없습니다</h1>
          <p className="text-muted-foreground">관리자만 접근할 수 있는 페이지입니다.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Link href="/admin" className="text-muted-foreground hover:text-foreground">
              관리자
            </Link>
            <span className="text-muted-foreground">/</span>
            <span className="font-medium">AI 댓글 관리</span>
          </div>
          <h1 className="text-3xl font-bold">💬 AI 댓글 관리</h1>
          <p className="text-muted-foreground">AI로 생성된 댓글을 검토하고 승인하세요.</p>
        </div>
        <Button onClick={fetchComments} disabled={isLoading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          새로고침
        </Button>
      </div>

      {/* 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">총 댓글</p>
                <p className="text-2xl font-bold">{comments.length}</p>
              </div>
              <MessageCircle className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">검토 대기</p>
                <p className="text-2xl font-bold">{pendingCount}</p>
              </div>
              <Eye className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">승인됨</p>
                <p className="text-2xl font-bold">{approvedCount}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">거부됨</p>
                <p className="text-2xl font-bold">{rejectedCount}</p>
              </div>
              <XCircle className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 검색 및 필터 */}
      <Card>
        <CardContent className="p-6">
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="댓글 내용, 게시글 제목, 작성자, 학교명으로 검색..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant={statusFilter === 'all' ? 'default' : 'outline'}
                onClick={() => setStatusFilter('all')}
                size="sm"
              >
                전체
              </Button>
              <Button
                variant={statusFilter === 'pending' ? 'default' : 'outline'}
                onClick={() => setStatusFilter('pending')}
                size="sm"
              >
                검토 대기 ({pendingCount})
              </Button>
              <Button
                variant={statusFilter === 'approved' ? 'default' : 'outline'}
                onClick={() => setStatusFilter('approved')}
                size="sm"
              >
                승인됨 ({approvedCount})
              </Button>
              <Button
                variant={statusFilter === 'rejected' ? 'default' : 'outline'}
                onClick={() => setStatusFilter('rejected')}
                size="sm"
              >
                거부됨 ({rejectedCount})
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 댓글 목록 */}
      <Card>
        <CardHeader>
          <CardTitle>AI 댓글 목록 ({filteredComments.length}개)</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
              <p>댓글을 불러오는 중...</p>
            </div>
          ) : filteredComments.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">댓글이 없습니다.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredComments.map((comment, index) => (
                <div key={comment.id || `comment-${index}`} className="border rounded-lg p-4 hover:bg-gray-50">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge 
                          variant={
                            comment.isPending ? "secondary" : 
                            comment.isApproved ? "default" : "destructive"
                          }
                        >
                          {comment.isPending ? '검토 대기' : comment.isApproved ? '승인됨' : '거부됨'}
                        </Badge>
                        <Badge variant="outline">{comment.schoolName}</Badge>
                        <span className="text-sm text-muted-foreground">
                          {new Date(comment.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="font-medium mb-1">게시글: {comment.postTitle}</p>
                      <p className="text-sm mb-2">{comment.content}</p>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>작성자: {comment.authorName}</span>
                        <span>좋아요: {comment.likeCount}</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {comment.isPending && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => approveComment(comment.id)}
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            승인
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => rejectComment(comment.id)}
                          >
                            <XCircle className="h-4 w-4 mr-1" />
                            거부
                          </Button>
                        </>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deleteComment(comment.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
