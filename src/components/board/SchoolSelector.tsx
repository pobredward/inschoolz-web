'use client';

import React, { useState, useEffect } from 'react';
import { ChevronDown, School as SchoolIcon, Star } from 'lucide-react';
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
      
      // 기존 학교 정보에서 추가 정보 추출 (안전한 타입 체크)
      const schoolData = user.school as { 
        id?: string; 
        name?: string; 
        isGraduate?: boolean; 
        grade?: string; 
        classNumber?: string; 
        studentNumber?: string; 
      } | undefined;
      
      await selectSchool(user.uid, school.id, school.name, {
        isGraduate: schoolData?.isGraduate || false,
        grade: schoolData?.grade,
        classNumber: schoolData?.classNumber,
        studentNumber: schoolData?.studentNumber
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
        <div className="text-sm text-gray-500">
          마이페이지에서 학교를 추가해주세요
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
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
                {currentSchool ? currentSchool.name : '학교를 선택하세요'}
              </span>
            </div>
            <ChevronDown className="h-4 w-4" />
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
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
} 