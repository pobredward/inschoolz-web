"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, Search, Filter, Trash2, Play, Pause, Eye } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/providers/AuthProvider';

interface FakePost {
  id: string;
  title: string;
  content: string;
  schoolId: string;
  schoolName: string;
  boardCode: string;
  boardName: string;
  authorId: string;
  authorName: string;
  createdAt: string;
  updatedAt: string;
  likeCount: number;
  commentCount: number;
}

interface GenerationConfig {
  schoolLimit: number;
  postsPerSchool: number;
  delayBetweenPosts: number;
}

export default function FakePostsPage() {
  const { user } = useAuth();
  const [fakePosts, setFakePosts] = useState<FakePost[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0); // 실제 전체 개수
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBoard, setSelectedBoard] = useState('all');
  // 편집 관련 상태는 제거 (현재 사용하지 않음)

  const [config, setConfig] = useState<GenerationConfig>({
    schoolLimit: 10,
    postsPerSchool: 1,
    delayBetweenPosts: 3000
  });

  // AI 게시글 목록 가져오기
  const fetchFakePosts = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/admin/fake-posts');
      const result = await response.json();
      
      if (result.success) {
        setFakePosts(result.data || []);
        setTotalCount(result.total || result.data.length); // API에서 전체 개수 사용
        toast.success(`전체 ${result.total || result.data.length}개 중 ${result.data.length}개의 AI 게시글을 조회했습니다.`);
      } else {
        throw new Error(result.error || '알 수 없는 오류가 발생했습니다.');
      }
    } catch (error) {
      console.error('AI 게시글 조회 오류:', error);
      toast.error('AI 게시글을 불러오는데 실패했습니다.');
      setFakePosts([]);
      setTotalCount(0);
    } finally {
      setIsLoading(false);
    }
  };

  // AI 게시글 생성
  const generateFakePosts = async () => {
    try {
      setIsGenerating(true);
      const response = await fetch('/api/admin/fake-posts/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      });
      
      const result = await response.json();
      
      if (result.success) {
        toast.success('AI 게시글 생성이 시작되었습니다.');
        await fetchFakePosts();
      } else {
        throw new Error(result.error || 'AI 게시글 생성 실패');
      }
    } catch (error) {
      console.error('AI 게시글 생성 오류:', error);
      toast.error('AI 게시글 생성에 실패했습니다.');
    } finally {
      setIsGenerating(false);
    }
  };

  // 게시글 삭제
  const deleteFakePost = async (postId: string) => {
    if (!confirm('정말로 이 게시글을 삭제하시겠습니까?')) return;

    console.log(`🗑️ [DELETE-POST] 게시글 삭제 시작: ${postId}`);

    try {
      console.log(`📡 [DELETE-POST] API 호출: /api/admin/fake-posts/${postId}`);
      
      const response = await fetch(`/api/admin/fake-posts/${postId}`, {
        method: 'DELETE',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });

      console.log(`📊 [DELETE-POST] 응답 상태:`, response.status, response.statusText);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      console.log(`📋 [DELETE-POST] 응답 데이터:`, result);
      
      if (result.success) {
        console.log(`✅ [DELETE-POST] 성공: ${result.deletedPostId || postId}`);
        toast.success('게시글이 삭제되었습니다.');
        await fetchFakePosts();
      } else {
        console.error(`❌ [DELETE-POST] 실패:`, result.error);
        throw new Error(result.error || '게시글 삭제 실패');
      }
    } catch (error) {
      console.error(`💥 [DELETE-POST] 오류:`, error);
      toast.error(`게시글 삭제에 실패했습니다: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  useEffect(() => {
    fetchFakePosts();
  }, []);

  // 필터링된 게시글
  const filteredPosts = fakePosts.filter(post => {
    const matchesSearch = (post.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (post.content || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (post.schoolName || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesBoard = selectedBoard === 'all' || post.boardCode === selectedBoard;
    return matchesSearch && matchesBoard;
  });

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
            <span className="font-medium">AI 게시글 관리</span>
          </div>
          <h1 className="text-3xl font-bold">📝 AI 게시글 관리</h1>
          <p className="text-muted-foreground">AI로 생성된 게시글을 관리하고 모니터링하세요.</p>
        </div>
        <Button onClick={fetchFakePosts} disabled={isLoading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          새로고침
        </Button>
      </div>

      {/* AI 게시글 생성 설정 */}
      <Card>
        <CardHeader>
          <CardTitle>AI 게시글 생성</CardTitle>
          <CardDescription>
            설정을 조정하여 AI 게시글을 생성하세요.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium">학교 수 제한</label>
              <Input
                type="number"
                value={config.schoolLimit}
                onChange={(e) => setConfig({...config, schoolLimit: parseInt(e.target.value) || 10})}
                min="1"
                max="100"
              />
            </div>
            <div>
              <label className="text-sm font-medium">학교당 게시글 수</label>
              <Input
                type="number"
                value={config.postsPerSchool}
                onChange={(e) => setConfig({...config, postsPerSchool: parseInt(e.target.value) || 1})}
                min="1"
                max="10"
              />
            </div>
            <div>
              <label className="text-sm font-medium">게시글 간 지연시간 (ms)</label>
              <Input
                type="number"
                value={config.delayBetweenPosts}
                onChange={(e) => setConfig({...config, delayBetweenPosts: parseInt(e.target.value) || 3000})}
                min="1000"
                max="10000"
              />
            </div>
          </div>
          <Button 
            onClick={generateFakePosts} 
            disabled={isGenerating}
            className="w-full"
          >
            {isGenerating ? (
              <>
                <Pause className="h-4 w-4 mr-2" />
                생성 중...
              </>
            ) : (
              <>
                <Play className="h-4 w-4 mr-2" />
                AI 게시글 생성 시작
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* 검색 및 필터 */}
      <Card>
        <CardContent className="p-6">
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="게시글 제목, 내용, 학교명으로 검색..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={selectedBoard} onValueChange={setSelectedBoard}>
              <SelectTrigger className="w-48">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="게시판 선택" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">모든 게시판</SelectItem>
                <SelectItem value="free">자유게시판</SelectItem>
                <SelectItem value="question">질문게시판</SelectItem>
                <SelectItem value="info">정보게시판</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* 게시글 목록 */}
      <Card>
        <CardHeader>
          <CardTitle>
            AI 게시글 목록 (전체 {totalCount}개
            {fakePosts.length < totalCount && `, 최근 ${fakePosts.length}개 표시`}
            {filteredPosts.length !== fakePosts.length && `, 필터링된 ${filteredPosts.length}개`})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
              <p>게시글을 불러오는 중...</p>
            </div>
          ) : filteredPosts.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">게시글이 없습니다.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredPosts.map((post, index) => (
                <div key={post.id || `post-${index}`} className="border rounded-lg p-4 hover:bg-gray-50">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="secondary">{post.boardName}</Badge>
                        <Badge variant="outline">{post.schoolName}</Badge>
                        <span className="text-sm text-muted-foreground">
                          {new Date(post.createdAt).toLocaleString('ko-KR', {
                            year: 'numeric',
                            month: '2-digit',
                            day: '2-digit',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                      <h3 className="font-semibold mb-2">{post.title}</h3>
                      <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                        {post.content}
                      </p>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>작성자: {post.authorName}</span>
                        <span>좋아요: {post.likeCount}</span>
                        <span>댓글: {post.commentCount}</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Link href={post.schoolId ? `/community/school/${post.schoolId}/${post.boardCode}/${post.id}/fast` : `/community/national/${post.boardCode}/${post.id}`}>
                        <Button
                          variant="outline"
                          size="sm"
                          title="게시글 보기"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </Link>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deleteFakePost(post.id)}
                        title="게시글 삭제"
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
