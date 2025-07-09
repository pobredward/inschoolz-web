'use client';

import React, { useState, useEffect } from 'react';
import { ChevronDown, School as SchoolIcon, Star, Plus } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { useAuth } from '@/providers/AuthProvider';
import { getUserFavoriteSchools, selectSchool } from '@/lib/api/schools';
import { School } from '@/types';

interface SchoolSelectorProps {
  onSchoolChange?: (school: School) => void;
  className?: string;
}

export default function SchoolSelector({ onSchoolChange, className }: SchoolSelectorProps) {
  const { user, refreshUser } = useAuth();
  const [favoriteSchools, setFavoriteSchools] = useState<School[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (user?.uid) {
      loadFavoriteSchools();
    }
  }, [user?.uid]);

  const loadFavoriteSchools = async () => {
    if (!user?.uid) return;

    try {
      setIsLoading(true);
      const schools = await getUserFavoriteSchools(user.uid);
      setFavoriteSchools(schools);
    } catch (error) {
      console.error('즐겨찾기 학교 목록 로드 실패:', error);
      toast.error('즐겨찾기 학교 목록을 불러오는데 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSchoolSelect = async (school: School) => {
    if (!user?.uid) {
      toast.error('로그인이 필요합니다.');
      return;
    }

    if (user.school?.id === school.id) {
      toast.info('이미 선택된 학교입니다.');
      return;
    }

    try {
      setIsLoading(true);
      
      await selectSchool(user.uid, school.id, school.name, {
        isGraduate: user.school?.isGraduate || false,
        grade: user.school?.grade,
        classNumber: user.school?.classNumber,
        studentNumber: user.school?.studentNumber
      });

      toast.success(`${school.name}으로 메인 학교가 변경되었습니다.`);
      
      // 사용자 정보 새로고침 (새로고침 없이)
      await refreshUser();
      
      // 부모 컴포넌트에 변경 알림
      if (onSchoolChange) {
        onSchoolChange(school);
      }
      
    } catch (error) {
      console.error('학교 변경 실패:', error);
      toast.error('학교 변경에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setIsLoading(false);
      setIsOpen(false);
    }
  };

  const handleAddSchool = () => {
    // 학교 추가 페이지로 이동 (마이페이지의 즐겨찾기 학교 관리)
    window.location.href = '/mypage?tab=schools';
  };

  const currentSchool = favoriteSchools.find(school => school.id === user?.school?.id);

  if (!user) {
    return null;
  }

  if (favoriteSchools.length === 0 && !isLoading) {
    return (
      <div className={`flex items-center justify-between p-3 bg-gray-50 rounded-lg border ${className}`}>
        <div className="flex items-center space-x-2">
          <SchoolIcon className="h-4 w-4 text-gray-400" />
          <span className="text-sm text-gray-600">즐겨찾기 학교가 없습니다</span>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleAddSchool}
          className="flex items-center space-x-1"
        >
          <Plus className="h-3 w-3" />
          <span>학교 추가</span>
        </Button>
      </div>
    );
  }

  return (
    <div className={className}>
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            className="w-full justify-between"
            disabled={isLoading}
          >
            <div className="flex items-center space-x-2">
              <SchoolIcon className="h-4 w-4" />
              <span className="truncate">
                {currentSchool ? currentSchool.name : '학교 선택'}
              </span>
              {currentSchool && (
                <Badge variant="secondary" className="text-xs">
                  메인
                </Badge>
              )}
            </div>
            <ChevronDown className="h-4 w-4 opacity-50" />
          </Button>
        </DropdownMenuTrigger>
        
        <DropdownMenuContent className="w-64" align="start">
          {favoriteSchools.map((school) => (
            <DropdownMenuItem
              key={school.id}
              onClick={() => handleSchoolSelect(school)}
              className="flex items-center justify-between cursor-pointer"
            >
              <div className="flex items-center space-x-2">
                <SchoolIcon className="h-4 w-4" />
                <span className="truncate">{school.name}</span>
              </div>
              <div className="flex items-center space-x-1">
                {school.id === user?.school?.id && (
                  <Badge variant="default" className="text-xs">
                    메인
                  </Badge>
                )}
                <Star className="h-3 w-3 text-yellow-500 fill-current" />
              </div>
            </DropdownMenuItem>
          ))}
          
          <DropdownMenuItem
            onClick={handleAddSchool}
            className="border-t mt-1 pt-2 cursor-pointer text-blue-600"
          >
            <div className="flex items-center space-x-2 w-full">
              <Plus className="h-4 w-4" />
              <span>즐겨찾기 학교 관리</span>
            </div>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
} 