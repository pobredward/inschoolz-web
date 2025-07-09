import { Suspense } from "react";
import { notFound } from "next/navigation";
import { BoardType } from "@/types/board";
import BoardHeader from "@/components/board/BoardHeader";
import BoardListSection from "@/components/board/BoardListSection";
import PopularPostsSection from "@/components/board/PopularPostsSection";
import { Skeleton } from "@/components/ui/skeleton";
import { getBoardsByType } from "@/lib/api/board";

interface BoardPageProps {
  params: {
    type: string;
  };
}

export default async function BoardPage({ params }: BoardPageProps) {
  // 게시판 유형 검증
  const validTypes: BoardType[] = ["national", "regional", "school"];
  const { type: typeParam } = await params;
  const type = typeParam as BoardType;
  
  if (!validTypes.includes(type)) {
    notFound();
  }
  
  // 게시판 목록 가져오기
  const boards = await getBoardsByType(type).catch(() => {
    console.error(`게시판 목록을 가져오는 중 오류가 발생했습니다: ${type}`);
    return [];
  });

  return (
    <div className="container mx-auto py-8 px-4 md:px-6">
      <BoardHeader type={type} />
      
      <div className="mt-8 space-y-8">
        <Suspense fallback={<Skeleton className="h-96 w-full" />}>
          <BoardListSection 
            boards={boards}
          />
        </Suspense>
        
        <Suspense fallback={<Skeleton className="h-64 w-full" />}>
          <PopularPostsSection type={type} />
        </Suspense>
      </div>
    </div>
  );
} 