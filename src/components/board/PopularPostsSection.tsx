import React from "react";
import Link from "next/link";
import { MessageSquare, ThumbsUp, Eye } from "lucide-react";
import { formatRelativeTime, now } from "@/lib/utils";
import { BoardType } from "@/types/board";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface PopularPostsSectionProps {
  type: BoardType;
}

export default async function PopularPostsSection({ type }: PopularPostsSectionProps) {
  // 인기 게시글 가져오기 (임시 데이터로 대체)
  // const popularPosts = await getPopularPosts(type);
  
  // 임시 데이터
  const popularPosts = [
    {
      id: "post1",
      title: "수능 영어 공부법 공유합니다",
      boardCode: "study",
      boardType: type,
      author: {
        displayName: "영어좋아하는학생",
        isAnonymous: false
      },
      stats: {
        viewCount: 2450,
        likeCount: 132,
        commentCount: 48
      },
      createdAt: now() - 1000 * 60 * 60 * 3 // 3시간 전
    },
    {
      id: "post2",
      title: "학교 급식 맛있게 먹는 방법.txt",
      boardCode: "free",
      boardType: type,
      author: {
        displayName: "급식러",
        isAnonymous: true
      },
      stats: {
        viewCount: 1823,
        likeCount: 215,
        commentCount: 63
      },
      createdAt: now() - 1000 * 60 * 60 * 8 // 8시간 전
    },
    {
      id: "post3",
      title: "수행평가 만점 받은 PPT 양식 공유",
      boardCode: "share",
      boardType: type,
      author: {
        displayName: "학생회장",
        isAnonymous: false
      },
      stats: {
        viewCount: 2156,
        likeCount: 184,
        commentCount: 32
      },
      createdAt: now() - 1000 * 60 * 60 * 24 // 1일 전
    },
    {
      id: "post4",
      title: "방학 때 봉사활동 추천 정보",
      boardCode: "info",
      boardType: type,
      author: {
        displayName: "선행이",
        isAnonymous: false
      },
      stats: {
        viewCount: 1450,
        likeCount: 96,
        commentCount: 28
      },
      createdAt: now() - 1000 * 60 * 60 * 36 // 1.5일 전
    },
    {
      id: "post5",
      title: "교복 세탁 꿀팁 (선생님도 모르는)",
      boardCode: "free",
      boardType: type,
      author: {
        displayName: "백의의천사",
        isAnonymous: false
      },
      stats: {
        viewCount: 1270,
        likeCount: 87,
        commentCount: 24
      },
      createdAt: now() - 1000 * 60 * 60 * 48 // 2일 전
    },
  ];

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">인기 게시글</h2>
        <Link href="/board/popular" className="text-sm text-primary hover:underline">
          더보기
        </Link>
      </div>
      
      <div className="space-y-3">
        {popularPosts.map((post) => (
          <Link key={post.id} href={`/board/${post.boardType}/${post.boardCode}/${post.id}`}>
            <Card className="hover:bg-muted/30 transition-colors">
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-base font-medium line-clamp-1">
                  {post.title}
                </CardTitle>
              </CardHeader>
              
              <CardContent className="p-4 pt-0">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <Avatar className="h-6 w-6">
                      <AvatarFallback className="text-xs">
                        {post.author.isAnonymous ? '익명' : post.author.displayName.substring(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm text-muted-foreground">
                      {post.author.isAnonymous ? '익명' : post.author.displayName} | {formatRelativeTime(post.createdAt)}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <div className="flex items-center">
                      <ThumbsUp className="h-3 w-3 mr-1" />
                      <span>{post.stats.likeCount}</span>
                    </div>
                    <div className="flex items-center">
                      <MessageSquare className="h-3 w-3 mr-1" />
                      <span>{post.stats.commentCount}</span>
                    </div>
                    <div className="flex items-center">
                      <Eye className="h-3 w-3 mr-1" />
                      <span>{post.stats.viewCount}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
      
      {popularPosts.length === 0 && (
        <div className="text-center py-8">
          <p className="text-muted-foreground">인기 게시글이 없습니다.</p>
        </div>
      )}
    </section>
  );
} 