"use client";

import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Loader2 } from "lucide-react";
import BoardListSection from "@/components/board/BoardListSection";
import { Board } from "@/types";

type BoardType = "national" | "school" | "regional";

// 임시 목 데이터 (실제 환경에서는 API에서 가져옴)
const MOCK_BOARDS: Record<BoardType, Board[]> = {
  national: [
    {
      id: "national-1",
      code: "free",
      name: "자유게시판..",
      description: "자유롭게 대화할 수 있는 게시판입니다.",
      type: "national",
      isActive: true,
      order: 1,
      isPublic: true,
      allowAnonymous: true,
      allowPolls: true,
      createdAt: Date.now() - 86400000 * 30,
      updatedAt: Date.now(),
      stats: { postCount: 1250, viewCount: 45000, activeUserCount: 320 }
    },
    {
      id: "national-2",
      code: "qna",
      name: "질문과 답변",
      description: "궁금한 점을 질문하고 답변을 얻을 수 있는 게시판입니다.",
      type: "national",
      isActive: true,
      order: 2,
      isPublic: true,
      allowAnonymous: true,
      allowPolls: true,
      createdAt: Date.now() - 86400000 * 25,
      updatedAt: Date.now(),
      stats: { postCount: 876, viewCount: 32000, activeUserCount: 210 }
    },
    {
      id: "national-parent-1",
      code: "hobby",
      name: "취미",
      description: "다양한 취미 활동을 공유하는 카테고리입니다.",
      type: "national",
      isActive: true,
      order: 3,
      isPublic: true,
      allowAnonymous: true,
      allowPolls: true,
      createdAt: Date.now() - 86400000 * 20,
      updatedAt: Date.now(),
      stats: { postCount: 0, viewCount: 0, activeUserCount: 0 }
    },
    {
      id: "national-3",
      code: "hobby-game",
      name: "게임",
      description: "게임 관련 이야기를 나눌 수 있는 게시판입니다.",
      type: "national",
      isActive: true,
      parentCode: "hobby",
      order: 4,
      isPublic: true,
      allowAnonymous: true,
      allowPolls: true,
      createdAt: Date.now() - 86400000 * 18,
      updatedAt: Date.now(),
      stats: { postCount: 542, viewCount: 18500, activeUserCount: 150 }
    },
    {
      id: "national-4",
      code: "hobby-sports",
      name: "스포츠",
      description: "스포츠 관련 이야기를 나눌 수 있는 게시판입니다.",
      type: "national",
      isActive: true,
      parentCode: "hobby",
      order: 5,
      isPublic: true,
      allowAnonymous: true,
      allowPolls: true,
      createdAt: Date.now() - 86400000 * 15,
      updatedAt: Date.now(),
      stats: { postCount: 324, viewCount: 12000, activeUserCount: 98 }
    },
    {
      id: "national-5",
      code: "hobby-music",
      name: "음악",
      description: "음악 관련 이야기를 나눌 수 있는 게시판입니다.",
      type: "national",
      isActive: true,
      parentCode: "hobby",
      order: 6,
      isPublic: true,
      allowAnonymous: true,
      allowPolls: true,
      createdAt: Date.now() - 86400000 * 12,
      updatedAt: Date.now(),
      stats: { postCount: 410, viewCount: 15000, activeUserCount: 120 }
    }
  ],
  school: [
    {
      id: "school-1",
      code: "campus-life",
      name: "캠퍼스 라이프",
      description: "학교 생활에 관한 이야기를 나누는 게시판입니다.",
      type: "school",
      isActive: true,
      order: 1,
      isPublic: true,
      allowAnonymous: true,
      allowPolls: true,
      createdAt: Date.now() - 86400000 * 30,
      updatedAt: Date.now(),
      stats: { postCount: 752, viewCount: 25600, activeUserCount: 186 }
    },
    {
      id: "school-parent-1",
      code: "academics",
      name: "학업",
      description: "학업 관련 주제를 다루는 카테고리입니다.",
      type: "school",
      isActive: true,
      order: 2,
      isPublic: true,
      allowAnonymous: true,
      allowPolls: true,
      createdAt: Date.now() - 86400000 * 25,
      updatedAt: Date.now(),
      stats: { postCount: 0, viewCount: 0, activeUserCount: 0 }
    },
    {
      id: "school-2",
      code: "academics-exam",
      name: "시험 정보",
      description: "시험 정보와 팁을 공유하는 게시판입니다.",
      type: "school",
      isActive: true,
      parentCode: "academics",
      order: 3,
      isPublic: true,
      allowAnonymous: true,
      allowPolls: true,
      createdAt: Date.now() - 86400000 * 20,
      updatedAt: Date.now(),
      stats: { postCount: 312, viewCount: 13500, activeUserCount: 95 }
    },
    {
      id: "school-3",
      code: "academics-notes",
      name: "강의 노트",
      description: "강의 노트와 자료를 공유하는 게시판입니다.",
      type: "school",
      isActive: true,
      parentCode: "academics",
      order: 4,
      isPublic: true,
      allowAnonymous: true,
      allowPolls: true,
      createdAt: Date.now() - 86400000 * 18,
      updatedAt: Date.now(),
      stats: { postCount: 217, viewCount: 9800, activeUserCount: 73 }
    }
  ],
  regional: [
    {
      id: "regional-parent-1",
      code: "seoul",
      name: "서울",
      description: "서울 지역 관련 게시판입니다.",
      type: "regional",
      isActive: true,
      order: 1,
      isPublic: true,
      allowAnonymous: true,
      allowPolls: true,
      createdAt: Date.now() - 86400000 * 30,
      updatedAt: Date.now(),
      stats: { postCount: 0, viewCount: 0, activeUserCount: 0 }
    },
    {
      id: "regional-1",
      code: "seoul-gangnam",
      name: "강남구",
      description: "강남구 지역 관련 정보와 소식을 나누는 게시판입니다.",
      type: "regional",
      isActive: true,
      parentCode: "seoul",
      order: 2,
      isPublic: true,
      allowAnonymous: true,
      allowPolls: true,
      createdAt: Date.now() - 86400000 * 25,
      updatedAt: Date.now(),
      stats: { postCount: 214, viewCount: 8900, activeUserCount: 65 }
    },
    {
      id: "regional-2",
      code: "seoul-mapo",
      name: "마포구",
      description: "마포구 지역 관련 정보와 소식을 나누는 게시판입니다.",
      type: "regional",
      isActive: true,
      parentCode: "seoul",
      order: 3,
      isPublic: true,
      allowAnonymous: true,
      allowPolls: true,
      createdAt: Date.now() - 86400000 * 22,
      updatedAt: Date.now(),
      stats: { postCount: 186, viewCount: 7200, activeUserCount: 58 }
    },
    {
      id: "regional-parent-2",
      code: "busan",
      name: "부산",
      description: "부산 지역 관련 게시판입니다.",
      type: "regional",
      isActive: true,
      order: 4,
      isPublic: true,
      allowAnonymous: true,
      allowPolls: true,
      createdAt: Date.now() - 86400000 * 20,
      updatedAt: Date.now(),
      stats: { postCount: 0, viewCount: 0, activeUserCount: 0 }
    },
    {
      id: "regional-3",
      code: "busan-haeundae",
      name: "해운대구",
      description: "해운대구 지역 관련 정보와 소식을 나누는 게시판입니다.",
      type: "regional",
      isActive: true,
      parentCode: "busan",
      order: 5,
      isPublic: true,
      allowAnonymous: true,
      allowPolls: true,
      createdAt: Date.now() - 86400000 * 18,
      updatedAt: Date.now(),
      stats: { postCount: 142, viewCount: 5600, activeUserCount: 42 }
    }
  ]
};

export default function BoardsPage() {
  const [activeTab, setActiveTab] = useState<BoardType>("national");
  const [isLoading, setIsLoading] = useState(true);
  const [boards, setBoards] = useState<Board[]>([]);

  useEffect(() => {
    // 실제 환경에서는 API 호출을 통해 데이터를 가져옵니다
    const fetchBoards = async () => {
      setIsLoading(true);
      try {
        // 실제 API 호출 코드로 대체 예정
        // const response = await fetch(`/api/boards?type=${activeTab}`);
        // const data = await response.json();
        
        // 임시 데이터 사용
        setTimeout(() => {
          setBoards(MOCK_BOARDS[activeTab]);
          setIsLoading(false);
        }, 500); // 로딩 시뮬레이션
      } catch (error) {
        console.error("게시판 데이터를 불러오는데 실패했습니다:", error);
        setIsLoading(false);
      }
    };

    fetchBoards();
  }, [activeTab]);

  return (
    <main className="container py-6 max-w-5xl">
      <h1 className="text-3xl font-bold mb-2">게시판</h1>
      <p className="text-muted-foreground mb-6">
        다양한 주제의 게시판에서 소통하고 정보를 나눠보세요.
      </p>
      
      <Separator className="my-6" />
      
      <Tabs defaultValue="national" onValueChange={(value) => setActiveTab(value as BoardType)}>
        <TabsList className="grid w-full grid-cols-3 mb-8">
          <TabsTrigger value="national">전국 게시판</TabsTrigger>
          <TabsTrigger value="school">학교 게시판</TabsTrigger>
          <TabsTrigger value="regional">지역 게시판</TabsTrigger>
        </TabsList>
        
        {/* 전국 게시판 */}
        <TabsContent value="national" className="mt-0">
          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <BoardListSection 
              boards={boards}
            />
          )}
        </TabsContent>
        
        {/* 학교 게시판 */}
        <TabsContent value="school" className="mt-0">
          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <BoardListSection 
              boards={boards}
            />
          )}
        </TabsContent>
        
        {/* 지역 게시판 */}
        <TabsContent value="regional" className="mt-0">
          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <BoardListSection 
              boards={boards}
            />
          )}
        </TabsContent>
      </Tabs>
    </main>
  );
} 