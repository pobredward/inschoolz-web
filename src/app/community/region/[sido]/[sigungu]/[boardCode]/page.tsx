import { notFound } from "next/navigation";
import { Metadata } from "next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, ArrowLeft, Plus, TrendingUp, Clock, MessageSquare } from "lucide-react";
import Link from "next/link";

interface PageProps {
  params: Promise<{
    sido: string;
    sigungu: string;
    boardCode: string;
  }>;
}

// 샘플 게시판 정보
const getBoardInfo = (boardCode: string) => {
  const boards: Record<string, { name: string; description: string; icon: string }> = {
    restaurant: { name: '맛집추천', description: '우리 동네 맛집을 소개해요', icon: '🍕' },
    academy: { name: '학원정보', description: '학원 정보를 공유해요', icon: '📚' },
    local: { name: '동네소식', description: '우리 동네 소식을 알려요', icon: '🏠' },
    together: { name: '함께해요', description: '같이 할 일을 찾아요', icon: '🤝' },
    free: { name: '자유게시판', description: '자유롭게 이야기해요', icon: '💬' },
  };
  
  return boards[boardCode];
};

// 샘플 게시글 데이터
const getSamplePosts = () => {
  const posts = [
    {
      id: '1',
      title: '송파구 맛집 추천 좀 해주세요',
      content: '이사온 지 얼마 안 돼서 맛집을 잘 몰라요. 추천 부탁드려요!',
      author: '익명',
      likes: 31,
      comments: 19,
      views: 156,
      timeAgo: '1시간 전',
      isHot: true,
    },
    {
      id: '2',
      title: '잠실 근처 좋은 카페 있나요?',
      content: '공부하기 좋은 조용한 카페를 찾고 있어요. 추천해주세요!',
      author: '익명',
      likes: 24,
      comments: 14,
      views: 134,
      timeAgo: '3시간 전',
      isHot: false,
    },
    {
      id: '3',
      title: '석촌호수 벚꽃 언제 피나요?',
      content: '벚꽃 구경하고 싶은데 언제 피는지 아시는 분 계신가요?',
      author: '익명',
      likes: 20,
      comments: 11,
      views: 98,
      timeAgo: '5시간 전',
      isHot: false,
    },
    {
      id: '4',
      title: '송파구 학원 정보 공유해요',
      content: '좋은 수학 학원 아시는 분 계신가요? 정보 공유 부탁드려요.',
      author: '익명',
      likes: 15,
      comments: 8,
      views: 76,
      timeAgo: '7시간 전',
      isHot: false,
    },
    {
      id: '5',
      title: '동네 축제 정보 알려드려요',
      content: '이번 주말에 롯데월드타워에서 축제가 있다고 하네요!',
      author: '익명',
      likes: 12,
      comments: 6,
      views: 54,
      timeAgo: '9시간 전',
      isHot: false,
    },
  ];
  
  return posts;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { boardCode, sido, sigungu } = await params;
  const boardInfo = getBoardInfo(boardCode);
  const decodedSido = decodeURIComponent(sido);
  const decodedSigungu = decodeURIComponent(sigungu);
  
  if (!boardInfo) {
    return {
      title: '게시판을 찾을 수 없습니다 - Inschoolz',
    };
  }

  return {
    title: `${boardInfo.name} - ${decodedSido} ${decodedSigungu} - Inschoolz`,
    description: `${decodedSido} ${decodedSigungu} ${boardInfo.name}에서 지역 정보를 공유하고 소통해보세요. ${boardInfo.description}`,
    openGraph: {
      title: `${boardInfo.name} - ${decodedSido} ${decodedSigungu}`,
      description: boardInfo.description,
      type: 'website',
    },
  };
}

export default async function RegionalBoardPage({ params }: PageProps) {
  const { boardCode, sido, sigungu } = await params;
  const boardInfo = getBoardInfo(boardCode);
  const decodedSido = decodeURIComponent(sido);
  const decodedSigungu = decodeURIComponent(sigungu);
  
  if (!boardInfo) {
    notFound();
  }

  const posts = getSamplePosts();

  return (
    <div className="container mx-auto py-8 px-4 md:px-6">
      <div className="max-w-4xl mx-auto">
        {/* 헤더 */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Link href="/community">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                커뮤니티
              </Button>
            </Link>
          </div>
          
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex items-center justify-center w-12 h-12 rounded-full bg-green-500 text-white">
                    <Users className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-2xl">{boardInfo.icon}</span>
                      <CardTitle className="text-2xl">{boardInfo.name}</CardTitle>
                      <Badge variant="secondary">{decodedSido} {decodedSigungu}</Badge>
                    </div>
                    <p className="text-muted-foreground">{boardInfo.description}</p>
                  </div>
                </div>
                <Link href={`/board/regional/${boardCode}/write`}>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    글쓰기
                  </Button>
                </Link>
              </div>
            </CardHeader>
          </Card>
        </div>

        {/* 게시글 목록 */}
        <div className="space-y-4">
          {posts.map((post) => (
            <Link key={post.id} href={`/community/region/${sido}/${sigungu}/${boardCode}/${post.id}`}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      {post.isHot && (
                        <Badge variant="destructive" className="text-xs">
                          <TrendingUp className="w-3 h-3 mr-1" />
                          HOT
                        </Badge>
                      )}
                      <h3 className="font-semibold text-lg hover:text-primary transition-colors">
                        {post.title}
                      </h3>
                    </div>
                    <p className="text-muted-foreground text-sm mb-3 line-clamp-2">
                      {post.content}
                    </p>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span>{post.author}</span>
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>{post.timeAgo}</span>
                      </div>
                      <span>조회 {post.views}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 ml-4">
                    <div className="text-center">
                      <div className="flex items-center gap-1 text-sm">
                        <span>👍</span>
                        <span>{post.likes}</span>
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center gap-1 text-sm">
                        <MessageSquare className="w-4 h-4" />
                        <span>{post.comments}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            </Link>
          ))}
        </div>

        {/* 페이지네이션 */}
        <div className="mt-8 flex justify-center">
          <div className="flex items-center gap-2">
            <Button variant="outline" disabled>
              이전
            </Button>
            <Button variant="default" size="sm">1</Button>
            <Button variant="outline" size="sm">2</Button>
            <Button variant="outline" size="sm">3</Button>
            <Button variant="outline">
              다음
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
} 