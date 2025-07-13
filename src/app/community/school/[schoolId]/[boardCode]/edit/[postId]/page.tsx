import { notFound } from 'next/navigation';
import { getPostDetail, getBoardsByType } from '@/lib/api/board';
import { PostEditClient } from '@/components/board/PostEditClient';
import { BoardType } from '@/types/board';

interface PostEditPageProps {
  params: Promise<{
    schoolId: string;
    boardCode: string;
    postId: string;
  }>;
}

export default async function SchoolPostEditPage({ params }: PostEditPageProps) {
  const { boardCode, postId } = await params;
  const type: BoardType = 'school';

  try {
    // 게시글 상세 정보 가져오기
    const { post } = await getPostDetail(postId);
    
    // 게시판 정보 가져오기
    const boards = await getBoardsByType(type);
    const board = boards.find(b => b.code === boardCode);
    
    if (!board) {
      notFound();
    }

    // 게시글이 해당 게시판에 속하는지 확인
    if (post.boardCode !== boardCode) {
      notFound();
    }

    return (
      <PostEditClient
        post={post}
        board={board}
        type={type}
        boardCode={boardCode}
      />
    );
  } catch (error) {
    console.error('게시글 수정 페이지 오류:', error);
    notFound();
  }
} 