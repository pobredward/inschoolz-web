import React from "react";
import { BoardType } from "@/types/board";
import WritePageClient from "@/components/board/WritePageClient";

interface WritePageProps {
  params: Promise<{
    type: string;
    boardCode: string;
  }>;
}

export default async function WritePage({ params }: WritePageProps) {
  // 서버 컴포넌트에서 params 처리
  const resolvedParams = await params;
  const type = resolvedParams.type as BoardType;
  const boardCode = resolvedParams.boardCode;
  
  return <WritePageClient type={type} code={boardCode} />;
} 