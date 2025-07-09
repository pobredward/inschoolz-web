import { notFound } from "next/navigation";
import { Metadata } from "next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { School, ArrowLeft, Plus, TrendingUp, Clock, MessageSquare } from "lucide-react";
import Link from "next/link";
import SchoolAccessWrapper from "./SchoolAccessWrapper";

interface PageProps {
  params: {
    schoolId: string;
    boardCode: string;
  };
}

// 샘플 학교 정보
const getSchoolInfo = (schoolId: string) => {
  const schools: Record<string, { name: string; location: string }> = {
    '00001': { name: '가락고등학교', location: '서울 송파구' },
    '00002': { name: '잠실중학교', location: '서울 송파구' },
    // 추가 학교 정보...
  };
  
  return schools[schoolId] || { name: '알 수 없는 학교', location: '알 수 없는 지역' };
};

// 샘플 게시판 정보
const getBoardInfo = (boardCode: string) => {
  const boards: Record<string, { name: string; description: string; icon: string }> = {
    free: { name: '자유게시판', description: '자유롭게 이야기해요', icon: '💬' },
    qa: { name: '질문/답변', description: '궁금한 것들을 물어보세요', icon: '❓' },
    info: { name: '정보공유', description: '유용한 정보를 나눠요', icon: '📢' },
    club: { name: '동아리', description: '동아리 활동 이야기', icon: '🎭' },
    study: { name: '스터디', description: '함께 공부해요', icon: '📚' },
  };
  
  return boards[boardCode];
};

// 샘플 게시글 데이터
const getSamplePosts = () => {
  const posts = [
    {
      id: '1',
      title: '내일 체육대회 준비 어떻게 하나요?',
      content: '처음 참가하는데 준비물이나 유의사항 있으면 알려주세요!',
      author: '익명',
      likes: 23,
      comments: 12,
      views: 145,
      timeAgo: '2시간 전',
      isHot: true,
    },
    {
      id: '2',
      title: '중간고사 수학 공부법 공유',
      content: '수학 시험 준비하는 좋은 방법이 있으면 공유해주세요~',
      author: '익명',
      likes: 18,
      comments: 8,
      views: 98,
      timeAgo: '4시간 전',
      isHot: false,
    },
    {
      id: '3',
      title: '급식 메뉴 개선 건의사항',
      content: '급식 메뉴에 대한 의견이나 건의사항을 남겨주세요',
      author: '익명',
      likes: 15,
      comments: 6,
      views: 87,
      timeAgo: '6시간 전',
      isHot: false,
    },
    {
      id: '4',
      title: '동아리 신입 모집합니다!',
      content: '밴드 동아리에서 새로운 멤버를 모집하고 있어요~',
      author: '익명',
      likes: 12,
      comments: 9,
      views: 76,
      timeAgo: '8시간 전',
      isHot: false,
    },
    {
      id: '5',
      title: '학교 축제 준비 도와주실 분?',
      content: '다음 달 축제 준비에 도움을 주실 분들을 찾고 있어요',
      author: '익명',
      likes: 10,
      comments: 5,
      views: 54,
      timeAgo: '10시간 전',
      isHot: false,
    },
  ];
  
  return posts;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { boardCode, schoolId } = await params;
  const boardInfo = getBoardInfo(boardCode);
  const schoolInfo = getSchoolInfo(schoolId);
  
  if (!boardInfo) {
    return {
      title: '게시판을 찾을 수 없습니다 - Inschoolz',
    };
  }

  return {
    title: `${boardInfo.name} - ${schoolInfo.name} - Inschoolz`,
    description: `${schoolInfo.name} ${boardInfo.name}에서 학교 정보를 공유하고 소통해보세요. ${boardInfo.description}`,
    openGraph: {
      title: `${boardInfo.name} - ${schoolInfo.name}`,
      description: boardInfo.description,
      type: 'website',
    },
  };
}

export default async function SchoolBoardPage({ params }: PageProps) {
  const { boardCode, schoolId } = await params;
  const boardInfo = getBoardInfo(boardCode);
  const schoolInfo = getSchoolInfo(schoolId);
  
  if (!boardInfo) {
    notFound();
  }

  const posts = getSamplePosts();

  return (
    <SchoolAccessWrapper schoolId={schoolId}>
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
                      <School className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-2xl">{boardInfo.icon}</span>
                        <CardTitle className="text-2xl">{boardInfo.name}</CardTitle>
                        <Badge variant="secondary">{schoolInfo.name}</Badge>
                      </div>
                      <p className="text-muted-foreground">{boardInfo.description}</p>
                      <p className="text-sm text-muted-foreground">{schoolInfo.location}</p>
                    </div>
                  </div>
                  <Link href={`/board/school/${boardCode}/write`}>
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
              <Link key={post.id} href={`/community/school/${schoolId}/${boardCode}/${post.id}`}>
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
                    <div className="flex items-center gap-2 ml-4">
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <MessageSquare className="w-4 h-4" />
                        <span>{post.comments}</span>
                      </div>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <span>👍</span>
                        <span>{post.likes}</span>
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
    </SchoolAccessWrapper>
  );
} 