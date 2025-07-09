import React from "react";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import { PostViewClient } from "@/components/board/PostViewClient";
import { getPostDetail, getBoardsByType } from "@/lib/api/board";
import { Post, Comment } from "@/types";

interface PostViewPageProps {
  params: {
    boardCode: string;
    postId: string;
  };
}

export async function generateMetadata({ params }: PostViewPageProps): Promise<Metadata> {
  const { boardCode, postId } = await params;
  
  try {
    // 실제 게시글 데이터 가져오기
    const { post } = await getPostDetail(postId);
    const boards = await getBoardsByType('national');
    const boardInfo = boards.find(board => board.code === boardCode);
    
    if (!boardInfo || !post) {
      return {
        title: '게시글을 찾을 수 없습니다 - Inschoolz',
        description: '요청하신 게시글을 찾을 수 없습니다.',
      };
    }

    return {
      title: `${post.title} - ${boardInfo.name} - Inschoolz`,
      description: post.content.slice(0, 150) + '...',
      openGraph: {
        title: `${post.title} - ${boardInfo.name}`,
        description: post.content.slice(0, 150) + '...',
        type: 'article',
        siteName: 'Inschoolz',
      },
    };
  } catch (error) {
    console.error('메타데이터 생성 오류:', error);
    return {
      title: '게시글을 찾을 수 없습니다 - Inschoolz',
      description: '요청하신 게시글을 찾을 수 없습니다.',
    };
  }
}

export default async function NationalPostDetailPage({ params }: PostViewPageProps) {
  const { boardCode, postId } = await params;
  
  try {
    // 게시글 상세 정보 가져오기 (이미 직렬화됨)
    const { post, comments } = await getPostDetail(postId);
    
    // 게시판 정보 가져오기
    const boards = await getBoardsByType('national');
    const board = boards.find(b => b.code === boardCode);
    
    if (!board) {
      notFound();
    }

    // 게시글이 해당 게시판에 속하는지 확인
    if ((post as any).boardCode !== boardCode) {
      notFound();
    }

    return (
      <PostViewClient
        post={post as unknown as Post}
        comments={comments as unknown as Comment[]}
        board={board}
        type="national"
      />
    );
  } catch (error) {
    console.error('National 게시글 상세 페이지 오류:', error);
    notFound();
  }
} 