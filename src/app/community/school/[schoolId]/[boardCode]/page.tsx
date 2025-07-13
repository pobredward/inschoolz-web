import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Plus, TrendingUp, MessageSquare, School } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { stripHtmlTags } from '@/lib/utils';
import { getBoardsByType } from '@/lib/api/board';
import SchoolAccessWrapper from './SchoolAccessWrapper';
import { Metadata } from 'next';

interface PageProps {
  params: Promise<{
    schoolId: string;
    boardCode: string;
  }>;
}

// 샘플 학교 정보
const getSchoolInfo = (schoolId: string) => {
  const schools: Record<string, { name: string; location: string }> = {
    '00001': { name: '서울고등학교', location: '서울특별시 강남구' },
    '00002': { name: '부산중학교', location: '부산광역시 해운대구' },
    '00003': { name: '대구초등학교', location: '대구광역시 중구' },
  };
  
  return schools[schoolId] || { name: '알 수 없는 학교', location: '위치 정보 없음' };
};

// 샘플 게시글 데이터
const getSamplePosts = () => [
  {
    id: '1',
    title: '내일 체육대회 있어요!',
    content: '내일 체육대회가 있다고 하네요. 모두 참여해서 즐거운 시간 보내요!',
    author: '체육부장',
    timeAgo: '30분 전',
    views: 234,
    likes: 18,
    comments: 12,
    isHot: true,
  },
  {
    id: '2',
    title: '수학 시험 범위 공유해요',
    content: '다음 주 수학 시험 범위를 정리해봤습니다. 모두 화이팅!',
    author: '수학대표',
    timeAgo: '2시간 전',
    views: 456,
    likes: 25,
    comments: 15,
    isHot: false,
  },
  {
    id: '3',
    title: '동아리 신입생 모집',
    content: '우리 동아리에서 신입생을 모집합니다. 관심 있으신 분들 연락주세요!',
    author: '동아리장',
    timeAgo: '4시간 전',
    views: 189,
    likes: 12,
    comments: 8,
    isHot: false,
  },
];

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { schoolId, boardCode } = await params;
  const schoolInfo = getSchoolInfo(schoolId);
  
  try {
    const boards = await getBoardsByType('school');
    const boardInfo = boards.find(board => board.code === boardCode);
    
    if (!boardInfo) {
      return {
        title: '게시판을 찾을 수 없습니다 - Inschoolz',
        description: '요청하신 게시판을 찾을 수 없습니다.',
      };
    }

    return {
      title: `${boardInfo.name} - ${schoolInfo.name} - Inschoolz`,
      description: `${schoolInfo.name} ${boardInfo.name}에서 학교 소식을 공유하고 소통해보세요. ${boardInfo.description}`,
      openGraph: {
        title: `${boardInfo.name} - ${schoolInfo.name}`,
        description: boardInfo.description,
        type: 'website',
        siteName: 'Inschoolz',
      },
    };
  } catch (error) {
    console.error('메타데이터 생성 오류:', error);
    return {
      title: '게시판을 찾을 수 없습니다 - Inschoolz',
      description: '요청하신 게시판을 찾을 수 없습니다.',
    };
  }
}

export default async function SchoolBoardPage({ params }: PageProps) {
  const { boardCode, schoolId } = await params;
  const schoolInfo = getSchoolInfo(schoolId);
  
  try {
    const boards = await getBoardsByType('school');
    const boardInfo = boards.find(board => board.code === boardCode);
    
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
                          <span className="text-2xl">{boardInfo.icon || '💬'}</span>
                          <CardTitle className="text-2xl">{boardInfo.name}</CardTitle>
                          <Badge variant="secondary">{schoolInfo.name}</Badge>
                        </div>
                        <p className="text-muted-foreground">{boardInfo.description}</p>
                        <p className="text-sm text-muted-foreground">{schoolInfo.location}</p>
                      </div>
                    </div>
                    <Link href={`/community/school/${schoolId}/${boardCode}/write`}>
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
                        <p className="text-muted-foreground text-sm mb-3 line-clamp-2 whitespace-pre-wrap">
                          {stripHtmlTags(post.content)}
                        </p>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span>{post.author} | {post.timeAgo}</span>
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
  } catch (error) {
    console.error('School board page 오류:', error);
    notFound();
  }
}; 