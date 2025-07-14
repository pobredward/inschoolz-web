"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2 } from "lucide-react";
import { Board } from "@/types";
import { getBoardsByType } from "@/lib/api/board";
import { useAuth } from "@/providers/AuthProvider";

interface BoardSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'national' | 'regional' | 'school';
  schoolId?: string;
  regions?: {
    sido: string;
    sigungu: string;
  };
}

export default function BoardSelector({ 
  isOpen, 
  onClose, 
  type, 
  schoolId, 
  regions 
}: BoardSelectorProps) {
  const router = useRouter();
  const { user } = useAuth();
  const [boards, setBoards] = useState<Board[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadBoards();
    }
  }, [isOpen, type, schoolId, regions]);

  const loadBoards = async () => {
    setLoading(true);
    try {
      // 앱과 동일하게 getBoardsByType 사용
      const boardList = await getBoardsByType(type);
      setBoards(boardList);
    } catch (error) {
      console.error('게시판 목록 로딩 오류:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBoardSelect = (board: Board) => {
    onClose();
    
    // 게시판 타입에 따라 적절한 URL로 이동
    let writeUrl = '';
    
    switch (type) {
      case 'national':
        writeUrl = `/community/national/${board.code}/write`;
        break;
      case 'regional':
        if (user?.regions) {
          writeUrl = `/community/region/${encodeURIComponent(user.regions.sido)}/${encodeURIComponent(user.regions.sigungu)}/${board.code}/write`;
        }
        break;
      case 'school':
        if (user?.school?.id) {
          writeUrl = `/community/school/${user.school.id}/${board.code}/write`;
        }
        break;
    }
    
    if (writeUrl) {
      router.push(writeUrl);
    }
  };

  const getTitle = () => {
    switch (type) {
      case 'national':
        return '전국 게시판 선택';
      case 'regional':
        return '지역 게시판 선택';
      case 'school':
        return '학교 게시판 선택';
      default:
        return '게시판 선택';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{getTitle()}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span className="ml-2">게시판 목록을 불러오는 중...</span>
            </div>
          ) : (
            <ScrollArea className="max-h-96">
              <div className="space-y-2">
                {boards.map((board) => (
                  <Card 
                    key={board.id} 
                    className="cursor-pointer hover:bg-gray-50 transition-colors"
                    onClick={() => handleBoardSelect(board)}
                  >
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <span className="text-lg">{board.icon}</span>
                        {board.name}
                      </CardTitle>
                      {board.description && (
                        <CardDescription className="text-xs">
                          {board.description}
                        </CardDescription>
                      )}
                    </CardHeader>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          )}
          
          {boards.length === 0 && !loading && (
            <div className="text-center py-8 text-gray-500">
              사용 가능한 게시판이 없습니다.
            </div>
          )}
        </div>
        
        <div className="flex justify-end">
          <Button variant="outline" onClick={onClose}>
            취소
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
} 