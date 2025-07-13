"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { formatRelativeTime } from "@/lib/utils";
import { MessageSquare, ThumbsUp, Eye, Pin, PenSquare, Loader2 } from "lucide-react";
import { BoardType, BoardFilterOptions } from "@/types/board";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { 
  Pagination, 
  PaginationContent, 
  PaginationItem, 
  PaginationLink, 
  PaginationNext, 
  PaginationPrevious 
} from "@/components/ui/pagination";
import { Badge } from "@/components/ui/badge";
import { useRouter } from "next/navigation";
import { getPostsByBoard } from "@/lib/api/board";
import { toast } from "sonner";
import { Timestamp } from "firebase/firestore";

// Firebase 문서에서 가져온 게시글 타입 확장
interface PostWithOptionalFields {
  id: string;
  title: string;
  content: string;
  authorId: string;
  authorInfo?: {
    displayName?: string;
    isAnonymous?: boolean;
    profileImageUrl?: string; // 추가된 필드
  };
  createdAt: Date | Timestamp | number;
  status?: {
    isPinned?: boolean;
    isDeleted?: boolean;
    isHidden?: boolean;
  };
  stats?: {
    viewCount?: number;
    likeCount?: number;
    commentCount?: number;
  };
  attachments?: string[];
  tags?: string[];
  poll?: {
    isActive: boolean;
    question: string;
    options: Array<{
      text: string;
      voteCount: number;
    }>;
  };
  imageUrls?: string[];
}

interface PostListProps {
  boardCode: string;
  type: BoardType;
  page: number;
  sort: string;
  keyword: string;
  filter: string;
}

export default function PostList({ 
  boardCode, 
  type, 
  page, 
  sort, 
  keyword, 
  filter 
}: PostListProps) {
  const router = useRouter();
  const [posts, setPosts] = useState<PostWithOptionalFields[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  
  // 데이터 가져오기
  useEffect(() => {
    const fetchPosts = async () => {
      try {
        setLoading(true);
        
        // 필터 옵션 설정
        const filterOptions: BoardFilterOptions = {
          keyword: keyword || undefined,
          sortBy: (sort === 'popular' || sort === 'comments' || sort === 'views') 
            ? sort 
            : 'latest',
          searchTarget: 'title', // 기본값 설정
          hasImage: filter === 'image' ? true : undefined,
          hasPoll: filter === 'poll' ? true : undefined,
          timeFilter: (filter === 'today' || filter === 'week' || filter === 'month') 
            ? filter as 'today' | 'week' | 'month'
            : undefined
        };
        
        // API 호출하여 게시글 가져오기
        const postsData = await getPostsByBoard(boardCode, 20, undefined, filterOptions);
        
        if (postsData) {
          // 받아온 데이터를 PostWithOptionalFields 형식으로 매핑
          const formattedPosts = postsData.items.map(post => ({
            id: post.id,
            title: post.title,
            content: post.content,
            authorId: post.authorId,
            authorInfo: post.authorInfo,
            createdAt: post.createdAt,
            status: post.status,
            stats: post.stats,
            tags: post.tags,
            poll: post.poll,
            imageUrls: Array.isArray(post.attachments) ? 
              post.attachments
                .filter(att => att.type === 'image')
                .map(att => att.url) 
              : []
          }));
          
          setPosts(formattedPosts);
          // 페이지네이션을 위한 totalCount 계산 (실제로는 API에서 가져오는 것이 좋음)
          setTotalPages(Math.max(1, Math.ceil(postsData.items.length / 20))); 
        }
      } catch (error) {
        console.error("게시글 목록 로드 실패:", error);
        toast.error("게시글 목록을 불러오는데 실패했습니다.");
        setPosts([]);
      } finally {
        setLoading(false);
      }
    };
    
    fetchPosts();
  }, [boardCode, page, sort, keyword, filter]);

  // 게시글 작성 페이지로 이동
  const handleWritePost = () => {
    router.push(`/community/${type}/${boardCode}/write`);
  };
  
  // 날짜 포맷팅 함수
  const formatDate = (timestamp: unknown) => {
    return formatRelativeTime(timestamp);
  };
  
  // 실제 환경에서 페이지 URL 생성에 검색어, 정렬 등을 포함해야 함
  const createPageUrl = (pageNum: number) => {
    const params = new URLSearchParams();
    
    if (pageNum !== 1) {
      params.set("page", pageNum.toString());
    }
    
    if (sort !== "latest") {
      params.set("sort", sort);
    }
    
    if (keyword) {
      params.set("keyword", keyword);
    }
    
    if (filter !== "all") {
      params.set("filter", filter);
    }
    
    const queryString = params.toString();
    return `/board/${type}/${boardCode}${queryString ? `?${queryString}` : ""}`;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">게시글 불러오는 중...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">게시글 목록</h2>
        <Button onClick={handleWritePost} className="flex items-center gap-2">
          <PenSquare className="h-4 w-4" />
          글쓰기
        </Button>
      </div>

      <div className="space-y-3">
        {posts.map((post) => (
          <Card key={post.id} className="overflow-hidden hover:bg-muted/30 transition-colors">
            <Link href={`/community/${type}/${boardCode}/${post.id}`} className="block p-4">
              <div className="flex items-start gap-2">
                {post.status?.isPinned && (
                  <div className="mt-1">
                    <Badge variant="secondary" className="flex items-center gap-1 px-1.5 py-0 h-5">
                      <Pin className="h-3 w-3" />
                      <span className="text-xs">공지</span>
                    </Badge>
                  </div>
                )}
                
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-medium line-clamp-1 group-hover:text-primary">
                    {post.title}
                  </h3>
                  
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1 min-w-0">
                      <Avatar className="h-5 w-5">
                        <AvatarImage 
                          src={post.authorInfo?.profileImageUrl} 
                          alt={post.authorInfo?.displayName || '사용자'} 
                        />
                        <AvatarFallback className="text-xs">
                          {post.authorInfo?.isAnonymous ? '익명' : post.authorInfo?.displayName?.substring(0, 2) || 'NA'}
                        </AvatarFallback>
                      </Avatar>
                      <span className="truncate">
                        {post.authorInfo?.isAnonymous ? '익명' : post.authorInfo?.displayName || '알 수 없음'}
                      </span>
                      <span className="text-xs">|</span>
                      <span className="text-xs">
                        {formatDate(post.createdAt)}
                      </span>
                    </div>
                    
                    {post.tags && post.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {post.tags.map((tag: string) => (
                          <Badge key={tag} variant="outline" className="px-1.5 py-0 h-5 text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center gap-3 text-sm">
                  {post.imageUrls && post.imageUrls.length > 0 && (
                    <span className="flex items-center text-muted-foreground">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
                        <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
                        <circle cx="9" cy="9" r="2" />
                        <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
                      </svg>
                      {post.imageUrls.length}
                    </span>
                  )}
                  
                  {post.poll && (
                    <span className="flex items-center text-muted-foreground">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
                        <path d="M12 22V8" />
                        <path d="M20 22V4" />
                        <path d="M4 22v-8" />
                      </svg>
                    </span>
                  )}
                  
                  <div className="flex items-center gap-0.5">
                    <Eye className="h-4 w-4 text-muted-foreground" />
                    <span>{post.stats?.viewCount || 0}</span>
                  </div>
                  
                  <div className="flex items-center gap-0.5">
                    <ThumbsUp className="h-4 w-4 text-muted-foreground" />
                    <span>{post.stats?.likeCount || 0}</span>
                  </div>
                  
                  <div className="flex items-center gap-0.5">
                    <MessageSquare className="h-4 w-4 text-muted-foreground" />
                    <span>{post.stats?.commentCount || 0}</span>
                  </div>
                </div>
              </div>
            </Link>
          </Card>
        ))}
      </div>
      
      {posts.length === 0 && (
        <div className="py-20 text-center">
          <h3 className="text-lg font-medium">게시글이 없습니다</h3>
          <p className="text-muted-foreground mt-2">첫 번째 게시글을 작성해보세요!</p>
          <div className="mt-4">
            <Button asChild>
              <Link href={`/board/${type}/${boardCode}/write`}>
                글쓰기
              </Link>
            </Button>
          </div>
        </div>
      )}
      
      {posts.length > 0 && (
        <Pagination className="mt-8">
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious href={createPageUrl(page > 1 ? page - 1 : 1)} />
            </PaginationItem>
            
            {[...Array(totalPages)].map((_, i) => (
              <PaginationItem key={i}>
                <PaginationLink 
                  href={createPageUrl(i + 1)}
                  isActive={page === i + 1}
                >
                  {i + 1}
                </PaginationLink>
              </PaginationItem>
            ))}
            
            <PaginationItem>
              <PaginationNext href={createPageUrl(page < totalPages ? page + 1 : totalPages)} />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </div>
  );
} 