"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getPostDetailFast, getBoardsByType } from '@/lib/api/board';
import { PostViewClient } from '@/components/board/PostViewClient';
import { BoardType } from '@/types/board';
import { Post, Comment } from '@/types';
import { Loader2, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PostViewClientFastProps {
  params: Promise<{
    type: BoardType;
    boardCode: string;
    postId: string;
  }>;
}

export function PostViewClientFast({ params }: PostViewClientFastProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [resolvedParams, setResolvedParams] = useState<{
    type: BoardType;
    boardCode: string;
    postId: string;
  } | null>(null);
  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // URL params 해석
  useEffect(() => {
    params.then(setResolvedParams);
  }, [params]);

  // 게시글 데이터 로드
  const loadPostData = useCallback(async () => {
    if (!resolvedParams) return;

    try {
      setLoading(true);
      setError(null);

      const [{ post: postData, comments: commentsData }, boards] = await Promise.all([
        getPostDetailFast(resolvedParams.postId),
        getBoardsByType(resolvedParams.type)
      ]);

      const board = boards.find(b => b.code === resolvedParams.boardCode);
      if (!board) {
        throw new Error('게시판을 찾을 수 없습니다.');
      }

      if ((postData as Post).boardCode !== resolvedParams.boardCode) {
        throw new Error('게시글이 해당 게시판에 속하지 않습니다.');
      }

      setPost(postData as Post);
      setComments(commentsData as Comment[]);
    } catch (err) {
      console.error('게시글 로드 오류:', err);
      setError(err instanceof Error ? err.message : '게시글을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  }, [resolvedParams]);

  useEffect(() => {
    if (resolvedParams) {
      loadPostData();
    }
  }, [resolvedParams, loadPostData]);

  // 뒤로가기 핸들러
  const handleBack = useCallback(() => {
    if (resolvedParams) {
      router.push(`/community/${resolvedParams.type}/${resolvedParams.boardCode}`);
    } else {
      router.back();
    }
  }, [router, resolvedParams]);

  // SEO 우회 알림 (개발 모드에서만)
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('🚀 빠른 모드: SEO 메타데이터 생성을 우회하고 클라이언트에서 직접 로드합니다.');
    }
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        {/* 헤더 */}
        <div className="border-b bg-white sticky top-0 z-10">
          <div className="max-w-4xl mx-auto px-4 py-3">
            <div className="flex items-center gap-3">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleBack}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                뒤로가기
              </Button>
              <div className="text-sm text-gray-500">
                빠른 로딩 모드
              </div>
            </div>
          </div>
        </div>

        {/* 로딩 */}
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-gray-600">게시글을 불러오는 중...</p>
            <p className="text-sm text-gray-400 mt-2">빠른 로딩 모드로 실행 중</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col">
        {/* 헤더 */}
        <div className="border-b bg-white sticky top-0 z-10">
          <div className="max-w-4xl mx-auto px-4 py-3">
            <div className="flex items-center gap-3">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleBack}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                뒤로가기
              </Button>
            </div>
          </div>
        </div>

        {/* 에러 */}
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="text-red-500 text-xl mb-4">⚠️</div>
            <h2 className="text-lg font-semibold mb-2">게시글을 불러올 수 없습니다</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <Button onClick={loadPostData} variant="outline">
              다시 시도
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-lg font-semibold mb-2">게시글을 찾을 수 없습니다</h2>
          <Button onClick={handleBack} variant="outline">
            목록으로 돌아가기
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* 빠른 모드 헤더 */}
      <div className="border-b bg-white sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleBack}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              뒤로가기
            </Button>
            <div className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
              🚀 빠른 로딩 모드
            </div>
          </div>
        </div>
      </div>

      {/* 게시글 컨텐츠 */}
      <PostViewClient 
        post={post} 
        initialComments={comments}
      />
    </div>
  );
}
