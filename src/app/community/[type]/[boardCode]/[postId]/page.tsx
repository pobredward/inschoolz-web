import { notFound } from 'next/navigation';
import { cache } from 'react';
import { getPostDetailOptimized, getBoardsByType } from '@/lib/api/board';
import { PostViewClient } from '@/components/board/PostViewClient';
import type { BoardType } from '@/types/board';
import { Post, Comment } from '@/types';
import { stripHtmlTags } from '@/lib/utils';

const getPostDetailCached = cache(getPostDetailOptimized);
const getBoardsCached = cache(getBoardsByType);

interface PostDetailPageProps {
  params: Promise<{
    type: BoardType;
    boardCode: string;
    postId: string;
  }>;
}

export default async function PostDetailPage({ params }: PostDetailPageProps) {
  const { type, boardCode, postId } = await params;

  try {
    const { post, comments } = await getPostDetailCached(postId, true);
    const boards = await getBoardsCached(type);
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
    const { post } = await getPostDetailCached(postId, true);
    
    return {
      title: `${(post as Post).title} - Inschoolz`,
      description: stripHtmlTags((post as Post).content).slice(0, 150) + '...',
      openGraph: {
        title: (post as Post).title,
        description: stripHtmlTags((post as Post).content).slice(0, 150) + '...',
        images: (post as Post).attachments?.length > 0 ? [(post as Post).attachments[0].url] : [],
      },
    };
  } catch {
    return {
      title: '게시글을 찾을 수 없습니다 - Inschoolz',
      description: '요청하신 게시글을 찾을 수 없습니다.',
    };
  }
} 