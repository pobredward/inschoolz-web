"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

import { ChevronDown, ChevronRight } from "lucide-react";
import { Board } from "@/types";

interface CategorySelectorProps {
  board: Board;
  selectedCategory?: { id: string; name: string };
  onCategorySelect: (category: { id: string; name: string }) => void;
  trigger?: React.ReactNode;
  isOpen?: boolean;
  onClose?: () => void;
}

export default function CategorySelector({ 
  board, 
  selectedCategory, 
  onCategorySelect, 
  trigger,
  isOpen: externalOpen,
  onClose: externalOnClose
}: CategorySelectorProps) {
  const [internalOpen, setInternalOpen] = useState(false);

  // 외부에서 제어되는 경우 외부 상태 사용, 아니면 내부 상태 사용
  const open = externalOpen !== undefined ? externalOpen : internalOpen;
  const setOpen = externalOnClose !== undefined 
    ? (value: boolean) => {
        if (!value) externalOnClose();
        else setInternalOpen(true);
      }
    : setInternalOpen;

  const categories = board.categories?.filter(cat => cat.isActive) || [];

  const handleCategorySelect = (category: { id: string; name: string }) => {
    onCategorySelect(category);
    setOpen(false);
  };

  const defaultTrigger = (
    <Button variant="outline" className="justify-between min-w-[200px]">
      <span>{selectedCategory?.name || "게시글 카테고리를 선택해 주세요"}</span>
      <ChevronDown className="h-4 w-4" />
    </Button>
  );

  // trigger가 없고 외부에서 제어되는 경우 (모달만 표시)
  if (!trigger && externalOpen !== undefined) {
    return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>게시글 카테고리를 선택해 주세요</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 max-h-[400px] overflow-y-auto">
            {categories.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                사용 가능한 카테고리가 없습니다.
              </div>
            ) : (
              categories.map((category) => (
                <div
                  key={category.id}
                  className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent cursor-pointer transition-colors"
                  onClick={() => handleCategorySelect({ id: category.id, name: category.name })}
                >
                  <div className="flex items-center space-x-3">
                    {category.icon && (
                      <div className="text-lg">{category.icon}</div>
                    )}
                    <div>
                      <div className="font-medium">{category.name}</div>
                      {category.description && (
                        <div className="text-sm text-muted-foreground">{category.description}</div>
                      )}
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>게시글 카테고리를 선택해 주세요</DialogTitle>
        </DialogHeader>
        <div className="space-y-2 max-h-[400px] overflow-y-auto">
          {categories.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              사용 가능한 카테고리가 없습니다.
            </div>
          ) : (
            categories.map((category) => (
              <div
                key={category.id}
                className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent cursor-pointer transition-colors"
                onClick={() => handleCategorySelect({ id: category.id, name: category.name })}
              >
                <div className="flex items-center space-x-3">
                  {category.icon && (
                    <div className="text-lg">{category.icon}</div>
                  )}
                  <div>
                    <div className="font-medium">{category.name}</div>
                    {category.description && (
                      <div className="text-sm text-muted-foreground">{category.description}</div>
                    )}
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </div>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// 카테고리 선택 버튼 컴포넌트 (게시글 작성 화면에서 사용)
interface CategoryButtonProps {
  selectedCategory?: { id: string; name: string };
  onClick: () => void;
}

export function CategoryButton({ selectedCategory, onClick }: CategoryButtonProps) {
  return (
    <Button
      variant="outline"
      className="justify-between min-w-[200px]"
      onClick={onClick}
    >
      <span className="truncate">
        {selectedCategory?.name || "게시글 카테고리를 선택해 주세요"}
      </span>
      <ChevronDown className="h-4 w-4 flex-shrink-0" />
    </Button>
  );
} 