import { notFound } from 'next/navigation';
import { getPostDetail, getPostBasicInfo } from '@/lib/api/board';
import { getBoardsByType } from '@/lib/api/board';
import { PostViewClient } from '@/components/board/PostViewClient';
import type { BoardType } from '@/types/board';
import { Post, Comment } from '@/types';
import { stripHtmlTags, serializeTimestamp } from '@/lib/utils';

interface PostDetailPageProps {
  params: Promise<{
    type: BoardType;
    boardCode: string;
    postId: string;
  }>;
}

export const revalidate = 300; // 5분마다 revalidate
export const dynamic = 'force-static'; // ISR을 위해 static 생성 강제

export default async function PostDetailPage({ params }: PostDetailPageProps) {
  const { type, boardCode, postId } = await params;

  try {
    // 게시글 상세 정보 가져오기 (이미 직렬화됨)
    const { post, comments } = await getPostDetail(postId);
    
    // 게시판 정보 가져오기
    const boards = await getBoardsByType(type);
    const board = boards.find(b => b.code === boardCode);
    
    if (!board) {
      notFound();
    }

    // 게시글이 해당 게시판에 속하는지 확인
    if ((post as Post).boardCode !== boardCode) {
      notFound();
    }

    return (
      <PostViewClient
        post={post as Post}
        initialComments={comments as Comment[]}
        boardInfo={board}
      />
    );
  } catch (error) {
    console.error('게시글 상세 페이지 오류:', error);
    notFound();
  }
}

// 메타데이터 생성
export async function generateMetadata({ params }: PostDetailPageProps) {
  const { postId } = await params;
  
  try {
    const post = await getPostBasicInfo(postId);
    
    return {
      title: `${post.title} - Inschoolz`,
      description: stripHtmlTags(post.content).slice(0, 150) + '...',
      openGraph: {
        title: post.title,
        description: stripHtmlTags(post.content).slice(0, 150) + '...',
        images: post.attachments?.length > 0 ? [post.attachments[0].url] : [],
      },
    };
  } catch {
    return {
      title: '게시글을 찾을 수 없습니다 - Inschoolz',
      description: '요청하신 게시글을 찾을 수 없습니다.',
    };
  }
} 