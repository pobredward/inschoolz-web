import React from "react";
import { PostViewClient } from "@/components/board/PostViewClient";
import { Post, Comment } from "@/types";

interface PostViewPageProps {
  params: Promise<{
    type: string;
    boardCode: string;
    postId: string;
  }>;
}

export default function PostViewPage({ params }: PostViewPageProps) {
  const resolvedParams = React.use(params);
  const { boardCode, postId } = resolvedParams;
  
  // 임시 더미 데이터 (실제로는 API에서 가져와야 함)
  const dummyPost: Post = {
    id: postId,
    title: "게시글 제목",
    content: "게시글 내용입니다.",
    type: "national",
    authorId: "author123",
    authorInfo: {
      displayName: "작성자",
      isAnonymous: false,
      profileImageUrl: ""
    },
    boardCode: boardCode,
    attachments: [],
    tags: [],
    createdAt: Date.now(),
    updatedAt: Date.now(),
    stats: {
      viewCount: 0,
      likeCount: 0,
      commentCount: 0
    },
    status: {
      isPinned: false,
      isDeleted: false,
      isHidden: false,
      isBlocked: false
    }
  };

  const dummyComments: Comment[] = [];
  
  return (
    <PostViewClient
      post={dummyPost}
      initialComments={dummyComments}
    />
  );
} 