import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Plus, TrendingUp, MessageSquare, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { stripHtmlTags } from '@/lib/utils';
import { getBoardsByType } from '@/lib/api/board';
import { Metadata } from 'next';

interface PageProps {
  params: Promise<{
    boardCode: string;
  }>;
}

// 샘플 게시글 데이터
const getSamplePosts = () => [
  {
    id: '1',
    title: '2024년 대학 입시 정보 공유',
    content: '올해 대학 입시에 대한 정보를 정리해봤습니다. 수시와 정시 모두 변화가 있으니 참고하세요.',
    author: '입시전문가',
    timeAgo: '2시간 전',
    views: 1234,
    likes: 45,
    comments: 23,
    isHot: true,
  },
  {
    id: '2',
    title: '고3 스트레스 관리법',
    content: '고3 생활하면서 스트레스를 효과적으로 관리하는 방법들을 공유합니다.',
    author: '선배언니',
    timeAgo: '4시간 전',
    views: 856,
    likes: 32,
    comments: 18,
    isHot: false,
  },
  {
    id: '3',
    title: '전국 모의고사 결과 분석',
    content: '이번 모의고사 결과를 바탕으로 앞으로의 학습 방향을 제시해드립니다.',
    author: '학습코치',
    timeAgo: '6시간 전',
    views: 2341,
    likes: 78,
    comments: 34,
    isHot: true,
  },
];

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { boardCode } = await params;
  
  try {
    const boards = await getBoardsByType('national');
    const boardInfo = boards.find(board => board.code === boardCode);
    
    if (!boardInfo) {
      return {
        title: '게시판을 찾을 수 없습니다 - Inschoolz',
        description: '요청하신 게시판을 찾을 수 없습니다.',
      };
    }

    return {
      title: `${boardInfo.name} - 전국 - Inschoolz`,
      description: `전국 ${boardInfo.name}에서 다양한 정보를 공유하고 소통해보세요. ${boardInfo.description}`,
      openGraph: {
        title: `${boardInfo.name} - 전국`,
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

export default async function NationalBoardPage({ params }: PageProps) {
  const { boardCode } = await params;
  
  try {
    const boards = await getBoardsByType('national');
    const boardInfo = boards.find(board => board.code === boardCode);
    
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
                        <span className="text-2xl">{boardInfo.icon || '💬'}</span>
                        <CardTitle className="text-2xl">{boardInfo.name}</CardTitle>
                        <Badge variant="secondary">전국</Badge>
                      </div>
                      <p className="text-muted-foreground">{boardInfo.description}</p>
                    </div>
                  </div>
                  <Link href={`/community/national/${boardCode}/write`}>
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
                        <p className="text-muted-foreground text-sm mb-3 line-clamp-2 whitespace-pre-wrap">
                          {stripHtmlTags(post.content)}
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
  } catch (error) {
    console.error('National board page 오류:', error);
    notFound();
  }
}; 