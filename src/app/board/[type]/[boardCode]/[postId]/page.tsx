import React from "react";
import { PostViewClient } from "@/components/board/PostViewClient";

interface PostViewPageProps {
  params: Promise<{
    type: string;
    boardCode: string;
    postId: string;
  }>;
}

export default function PostViewPage({ params }: PostViewPageProps) {
  const resolvedParams = React.use(params);
  const { type, boardCode, postId } = resolvedParams;
  
  // 실제로는 이 위치에서 게시글 데이터를 가져올 수 있음
  
  return (
    <PostViewClient 
      type={type} 
      boardCode={boardCode} 
      postId={postId} 
    />
  );
} 