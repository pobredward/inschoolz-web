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
  params: {
    type: string;
    boardCode: string;
  };
  searchParams?: {
    page?: string;
    sort?: string;
    keyword?: string;
    filter?: string;
  };
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
  const board = await getDocument('boards', boardCode);
  
  if (!board) {
    notFound();
  }
  
  // 페이지 번호, 정렬 등 쿼리 파라미터 처리
  const page = searchParams?.page ? parseInt(searchParams.page) : 1;
  const sort = searchParams?.sort || 'latest';
  const keyword = searchParams?.keyword || '';
  const filter = searchParams?.filter || 'all';

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