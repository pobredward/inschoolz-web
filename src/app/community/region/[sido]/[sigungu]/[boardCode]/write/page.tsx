import React from "react";
import { Metadata } from "next";
import { BoardType } from "@/types/board";
import WritePageClient from "@/components/board/WritePageClient";

interface WritePageProps {
  params: {
    sido: string;
    sigungu: string;
    boardCode: string;
  };
}

export async function generateMetadata({ params }: WritePageProps): Promise<Metadata> {
  const { sido, sigungu } = await params;
  
  return {
    title: `새 글쓰기 - ${sido} ${sigungu} 커뮤니티 - Inschoolz`,
    description: `${sido} ${sigungu} 지역 커뮤니티에서 새로운 게시글을 작성해보세요.`,
    robots: 'noindex, nofollow', // 글쓰기 페이지는 검색엔진에서 제외
  };
}

export default async function RegionalBoardWritePage({ params }: WritePageProps) {
  const { boardCode } = await params;
  
  return (
    <div className="container mx-auto py-8 px-4 md:px-6">
      <div className="max-w-4xl mx-auto">
        <WritePageClient 
          type={"regional" as BoardType} 
          code={boardCode} 
        />
      </div>
    </div>
  );
} 