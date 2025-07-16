import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Plus, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
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
        robots: 'noindex, nofollow',
      };
    }

    const description = `전국 ${boardInfo.name}에서 다양한 정보를 공유하고 소통해보세요. ${boardInfo.description || '학생들을 위한 커뮤니티 공간입니다.'}`;

    return {
      title: `${boardInfo.name} - 전국 - Inschoolz`,
      description,
      keywords: [boardInfo.name, '전국', '커뮤니티', '학생', '인스쿨즈', '게시판'],
      alternates: {
        canonical: `https://inschoolz.com/community/national/${boardCode}`,
      },
      openGraph: {
        title: `${boardInfo.name} - 전국`,
        description,
        type: 'website',
        siteName: 'Inschoolz',
        url: `https://inschoolz.com/community/national/${boardCode}`,
      },
      twitter: {
        card: 'summary',
        title: `${boardInfo.name} - 전국`,
        description,
      },
    };
  } catch (error) {
    console.error('메타데이터 생성 오류:', error);
    return {
      title: '게시판을 찾을 수 없습니다 - Inschoolz',
      description: '요청하신 게시판을 찾을 수 없습니다.',
      robots: 'noindex, nofollow',
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
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="space-y-3">
              {posts.map((post) => (
                <Link key={post.id} href={`/community/national/${boardCode}/${post.id}`} className="block group">
                  <div className="bg-white p-4 rounded-lg border border-gray-100 hover:shadow-md transition-all duration-200">
                    {/* 상단 뱃지들 */}
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-xs font-bold text-gray-700 bg-blue-100 px-2 py-1 rounded">
                        전국
                      </span>
                                             <span className="text-xs font-bold text-gray-700 bg-green-100 px-2 py-1 rounded">
                         {boardCode}
                       </span>
                      {post.isHot && (
                        <span className="text-xs font-bold text-white bg-red-500 px-2 py-1 rounded">
                          🔥 HOT
                        </span>
                      )}
                    </div>
                    
                    {/* 제목 */}
                    <h3 className="font-semibold text-gray-900 group-hover:text-green-600 line-clamp-2 leading-relaxed mb-2">
                      {post.title}
                    </h3>
                    
                    {/* 내용 미리보기 */}
                    <div className="text-sm text-gray-600 mb-3 line-clamp-2">
                      {stripHtmlTags(post.content)}
                    </div>
                    
                    {/* 하단 정보 */}
                    <div className="flex items-center justify-between">
                      {/* 작성자 | 날짜 */}
                      <div className="text-sm text-gray-500">
                        <span>{post.author}</span>
                        <span className="mx-1">|</span>
                        <span>{post.timeAgo}</span>
                      </div>
                      
                      {/* 통계 (조회수, 좋아요, 댓글) */}
                      <div className="flex items-center gap-3 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <span>👁</span>
                          {post.views || 0}
                        </span>
                        <span className="flex items-center gap-1">
                          <span>👍</span>
                          {post.likes || 0}
                        </span>
                        <span className="flex items-center gap-1">
                          <span>💬</span>
                          {post.comments || 0}
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
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