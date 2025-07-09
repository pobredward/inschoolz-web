import { notFound } from "next/navigation";
import { Metadata } from "next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Globe, ArrowLeft, Plus, TrendingUp, MessageSquare } from "lucide-react";
import Link from "next/link";

interface PageProps {
  params: Promise<{
    boardCode: string;
  }>;
}

// 샘플 게시판 정보
const getBoardInfo = (boardCode: string) => {
  const boards: Record<string, { name: string; description: string; icon: string }> = {
    exam: { name: '입시정보', description: '입시 관련 정보를 나눠요', icon: '🎓' },
    career: { name: '진로상담', description: '진로에 대해 상담해요', icon: '💼' },
    university: { name: '대학생활', description: '대학생활 경험을 공유해요', icon: '🏛️' },
    hobby: { name: '취미생활', description: '취미 활동을 공유해요', icon: '🎨' },
    free: { name: '자유게시판', description: '자유롭게 이야기해요', icon: '💬' },
  };
  
  return boards[boardCode];
};

// 샘플 게시글 데이터
const getSamplePosts = () => {
  const posts = [
    {
      id: '1',
      title: '수능 D-100 함께 공부할 사람?',
      content: '안녕하세요! 수능까지 100일 남았는데 혼자 공부하기 힘들어서...',
      author: '익명',
      likes: 45,
      comments: 28,
      views: 234,
      timeAgo: '30분 전',
      isHot: true,
    },
    {
      id: '2',
      title: '정시 vs 수시 어떤게 나을까요?',
      content: '고3인데 정시와 수시 중에 어떤 걸 선택해야 할지 고민이에요...',
      author: '익명',
      likes: 39,
      comments: 22,
      views: 189,
      timeAgo: '2시간 전',
      isHot: false,
    },
    {
      id: '3',
      title: '대학생활 팁 정리해드려요',
      content: '대학교 1학년 때 알았으면 좋았을 것들을 정리해봤어요!',
      author: '익명',
      likes: 35,
      comments: 17,
      views: 156,
      timeAgo: '4시간 전',
      isHot: false,
    },
    {
      id: '4',
      title: '영어 공부법 추천해주세요',
      content: '토익 점수를 올리고 싶은데 좋은 공부법이 있을까요?',
      author: '익명',
      likes: 23,
      comments: 14,
      views: 98,
      timeAgo: '6시간 전',
      isHot: false,
    },
    {
      id: '5',
      title: '대학교 과 선택 고민이에요',
      content: '문과인데 어떤 과를 선택해야 할지 조언 부탁드려요',
      author: '익명',
      likes: 18,
      comments: 11,
      views: 87,
      timeAgo: '8시간 전',
      isHot: false,
    },
  ];
  
  return posts;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { boardCode } = await params;
  const boardInfo = getBoardInfo(boardCode);
  
  if (!boardInfo) {
    return {
      title: '게시판을 찾을 수 없습니다 - Inschoolz',
    };
  }

  return {
    title: `${boardInfo.name} - 전국 커뮤니티 - Inschoolz`,
    description: `전국 ${boardInfo.name}에서 다양한 정보를 공유하고 소통해보세요. ${boardInfo.description}`,
    openGraph: {
      title: `${boardInfo.name} - 전국 커뮤니티`,
      description: boardInfo.description,
      type: 'website',
    },
  };
}

export default async function NationalBoardPage({ params }: PageProps) {
  const { boardCode } = await params;
  const boardInfo = getBoardInfo(boardCode);
  
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
                  <div className="flex items-center justify-center w-12 h-12 rounded-full bg-amber-500 text-white">
                    <Globe className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-2xl">{boardInfo.icon}</span>
                      <CardTitle className="text-2xl">{boardInfo.name}</CardTitle>
                      <Badge variant="secondary">전국</Badge>
                    </div>
                    <p className="text-muted-foreground">{boardInfo.description}</p>
                  </div>
                </div>
                <Link href={`/board/national/${boardCode}/write`}>
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
            <Link key={post.id} href={`/community/national/${boardCode}/${post.id}`}>
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
                        <span>{post.author} | {post.timeAgo}</span>
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