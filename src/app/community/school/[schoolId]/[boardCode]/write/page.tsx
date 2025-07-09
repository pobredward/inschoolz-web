import React from "react";
import { Metadata } from "next";
import { BoardType } from "@/types/board";
import WritePageClient from "@/components/board/WritePageClient";

interface WritePageProps {
  params: {
    schoolId: string;
    boardCode: string;
  };
}

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: `새 글쓰기 - 학교 커뮤니티 - Inschoolz`,
    description: `학교 커뮤니티에서 새로운 게시글을 작성해보세요.`,
    robots: 'noindex, nofollow', // 글쓰기 페이지는 검색엔진에서 제외
  };
}

export default async function SchoolBoardWritePage({ params }: WritePageProps) {
  const { boardCode } = await params;
  
  return (
    <div className="container mx-auto py-8 px-4 md:px-6">
      <div className="max-w-4xl mx-auto">
        <WritePageClient 
          type={"school" as BoardType} 
          code={boardCode} 
        />
      </div>
    </div>
  );
} 