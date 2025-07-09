import { Suspense } from "react";
import { notFound } from "next/navigation";
import { BoardType } from "@/types/board";
import { getDocument } from "@/lib/firestore";
import PostListHeader from "@/components/board/PostListHeader";
import PostListFilter from "@/components/board/PostListFilter";
import PostList from "@/components/board/PostList";
import BoardSidePanel from "@/components/board/BoardSidePanel";
import { Skeleton } from "@/components/ui/skeleton";

interface BoardDetailPageProps {
  params: Promise<{
    type: string;
    boardCode: string;
  }>;
  searchParams?: Promise<{
    page?: string;
    sort?: string;
    keyword?: string;
    filter?: string;
  }>;
}

export default async function BoardDetailPage({ params, searchParams }: BoardDetailPageProps) {
  // 게시판 유형 검증
  const validTypes: BoardType[] = ["national", "regional", "school"];
  const { type: typeParam, boardCode } = await params;
  const type = typeParam as BoardType;
  
  if (!validTypes.includes(type)) {
    notFound();
  }
  
  // 게시판 정보 가져오기
  const boardData: any = await getDocument('boards', boardCode);
  
  if (!boardData) {
    notFound();
  }

  // Board 타입에 맞는 더미 데이터 생성
  const board = {
    code: boardCode,
    name: boardData.name || "게시판",
    type: type,
    description: boardData.description || "게시판 설명",
    stats: {
      postCount: boardData.stats?.postCount || 0,
      activeUserCount: boardData.stats?.activeUserCount || 0
    }
  };
  
  // 페이지 번호, 정렬 등 쿼리 파라미터 처리
  const searchParamsData = await searchParams;
  const page = searchParamsData?.page ? parseInt(searchParamsData.page) : 1;
  const sort = searchParamsData?.sort || 'latest';
  const keyword = searchParamsData?.keyword || '';
  const filter = searchParamsData?.filter || 'all';

  return (
    <div className="container mx-auto py-8 px-4 md:px-6">
      <PostListHeader 
        board={board} 
        type={type} 
      />
      
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 mt-8">
        <div className="lg:col-span-3 space-y-6">
          <PostListFilter 
            sort={sort} 
            filter={filter}
            board={board}
          />
          
          <Suspense fallback={<Skeleton className="h-[600px] w-full" />}>
            <PostList 
              boardCode={boardCode} 
              type={type}
              page={page}
              sort={sort}
              keyword={keyword}
              filter={filter}
            />
          </Suspense>
        </div>
        
        <div>
          <Suspense fallback={<Skeleton className="h-96 w-full" />}>
            <BoardSidePanel boardCode={boardCode} type={type} />
          </Suspense>
        </div>
      </div>
    </div>
  );
} 