'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Heart, MessageCircle, Eye, Bookmark } from 'lucide-react';
import { Board, BoardType } from '@/types/board';
import { Post } from '@/types';
import { getBoardsByType, getPostsByBoardType, getAllPostsByType } from '@/lib/api/board';
import BoardSelector from '@/components/board/BoardSelector';
import { formatSmartTime, generatePreviewContent } from '@/lib/utils';

interface CommunityPost extends Post {
  boardName: string;
  previewContent: string;
}

type SortOption = 'latest' | 'popular' | 'views' | 'comments';

const SORT_OPTIONS = [
  { value: 'latest', label: '최신순' },
  { value: 'popular', label: '인기순' },
  { value: 'views', label: '조회순' },
  { value: 'comments', label: '댓글순' }
];

export default function CommunityPage() {
  const router = useRouter();
  const [selectedTab, setSelectedTab] = useState<BoardType>('national');
  const [boards, setBoards] = useState<Board[]>([]);
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [selectedBoard, setSelectedBoard] = useState<string>('all');
  const [sortBy, setSortBy] = useState<SortOption>('latest');
  const [isLoading, setIsLoading] = useState(false);
  const [showBoardSelector, setShowBoardSelector] = useState(false);

  useEffect(() => {
    loadBoards();
  }, [selectedTab]);

  useEffect(() => {
    loadPosts();
  }, [selectedTab, selectedBoard, sortBy]);

  const loadBoards = async () => {
    try {
      const boardsData = await getBoardsByType(selectedTab);
      setBoards(boardsData);
      setSelectedBoard('all'); // 탭 변경 시 전체로 리셋
    } catch (error) {
      console.error('게시판 로드 실패:', error);
    }
  };

  const loadPosts = async () => {
    try {
      setIsLoading(true);
      let allPosts: CommunityPost[] = [];

      if (selectedBoard === 'all') {
        // 모든 게시판의 게시글 가져오기
        const boardPosts = await getAllPostsByType(selectedTab);
        const postsWithBoardName = boardPosts.map(post => {
          const board = boards.find(b => b.code === post.boardCode);
          return {
            ...post,
            attachments: post.attachments || [], // 기본값 설정
            boardName: board?.name || post.boardCode,
            previewContent: generatePreviewContent(post.content)
          };
        });
        allPosts = postsWithBoardName;
      } else {
        // 특정 게시판의 게시글만 가져오기
        const boardPosts = await getPostsByBoardType(selectedTab, selectedBoard);
        const board = boards.find(b => b.code === selectedBoard);
        allPosts = boardPosts.map(post => ({
          ...post,
          attachments: post.attachments || [], // 기본값 설정
          boardName: board?.name || '',
          previewContent: generatePreviewContent(post.content)
        }));
      }

      // 정렬
      allPosts.sort((a, b) => {
        switch (sortBy) {
          case 'latest':
            return b.createdAt - a.createdAt;
          case 'popular':
            return b.stats.likeCount - a.stats.likeCount;
          case 'views':
            return b.stats.viewCount - a.stats.viewCount;
          case 'comments':
            return b.stats.commentCount - a.stats.commentCount;
          default:
            return b.createdAt - a.createdAt;
        }
      });

      setPosts(allPosts);
    } catch (error) {
      console.error('게시글 로드 실패:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (timestamp: unknown) => {
    return formatSmartTime(timestamp);
  };

  const handlePostClick = (post: CommunityPost) => {
    router.push(`/community/${selectedTab}/${post.boardCode}/${post.id}`);
  };

  const handleWriteClick = () => {
    setShowBoardSelector(true);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold">커뮤니티</h1>
            <Button variant="ghost" size="icon">
              <Bookmark className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* 탭 */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4">
          <Tabs value={selectedTab} onValueChange={(value) => setSelectedTab(value as BoardType)}>
            <TabsList className="grid w-full grid-cols-3 bg-transparent h-12">
              <TabsTrigger 
                value="school" 
                className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-green-500 data-[state=active]:text-green-600 rounded-none"
              >
                학교
              </TabsTrigger>
              <TabsTrigger 
                value="regional" 
                className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-green-500 data-[state=active]:text-green-600 rounded-none"
              >
                지역
              </TabsTrigger>
              <TabsTrigger 
                value="national" 
                className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-green-500 data-[state=active]:text-green-600 rounded-none"
              >
                전국
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>

      {/* 카테고리 필터 */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center space-x-2 overflow-x-auto">
            <Button
              variant={selectedBoard === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedBoard('all')}
              className="whitespace-nowrap"
            >
              전체
            </Button>
            {boards.map((board) => (
              <Button
                key={board.code}
                variant={selectedBoard === board.code ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedBoard(board.code)}
                className="whitespace-nowrap"
              >
                {board.name}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* 정렬 옵션 */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">
              총 {posts.length}개
            </span>
            <Select value={sortBy} onValueChange={(value: SortOption) => setSortBy(value)}>
              <SelectTrigger className="w-24 h-8 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SORT_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* 게시글 리스트 */}
      <div className="container mx-auto px-4 py-4">
        {isLoading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-4">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-full mb-1"></div>
                  <div className="h-3 bg-gray-200 rounded w-2/3 mb-3"></div>
                  <div className="flex items-center space-x-4">
                    <div className="h-3 bg-gray-200 rounded w-16"></div>
                    <div className="h-3 bg-gray-200 rounded w-12"></div>
                    <div className="h-3 bg-gray-200 rounded w-12"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-2">📝</div>
            <p className="text-gray-500">게시글이 없습니다.</p>
            <p className="text-sm text-gray-400 mt-1">첫 번째 게시글을 작성해보세요!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {posts.map((post) => (
              <Card 
                key={post.id} 
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => handlePostClick(post)}
              >
                <CardContent className="p-4">
                  {/* 게시판 이름 */}
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant="secondary" className="text-xs">
                      {post.boardName}
                    </Badge>
                    {(post.attachments?.length || 0) > 0 && (
                      <Badge variant="outline" className="text-xs">
                        📷
                      </Badge>
                    )}
                  </div>

                  {/* 제목 */}
                  <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">
                    {post.title}
                  </h3>

                  {/* 내용 미리보기 */}
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                    {post.previewContent}
                  </p>

                  {/* 메타 정보 */}
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <div className="flex items-center space-x-1">
                      <span>{post.authorInfo?.isAnonymous ? '익명' : post.authorInfo?.displayName || '사용자'}</span>
                      <span>|</span>
                      <span>{formatDate(post.createdAt)}</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className="flex items-center space-x-1">
                        <MessageCircle className="h-3 w-3" />
                        <span>{post.stats.commentCount}</span>
                      </span>
                      <span className="flex items-center space-x-1">
                        <Heart className="h-3 w-3" />
                        <span>{post.stats.likeCount}</span>
                      </span>
                      <span className="flex items-center space-x-1">
                        <Eye className="h-3 w-3" />
                        <span>{post.stats.viewCount}</span>
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* 글쓰기 버튼 */}
      <div className="fixed bottom-20 right-4 z-10">
        <Button 
          size="lg" 
          className="rounded-full h-14 w-14 shadow-lg"
          onClick={handleWriteClick}
        >
          <span className="text-xl">+</span>
        </Button>
      </div>

      {/* 게시판 선택 모달 */}
      <BoardSelector
        isOpen={showBoardSelector}
        onClose={() => setShowBoardSelector(false)}
        type={selectedTab}
      />
    </div>
  );
} 