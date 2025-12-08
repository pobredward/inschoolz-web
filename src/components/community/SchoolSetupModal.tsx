'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { School, Search } from 'lucide-react';
import { collection, query, where, getDocs, doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { toast } from 'sonner';
import { useAuth } from '@/providers/AuthProvider';
import { useQuestTracker } from '@/hooks/useQuestTracker';
import { School as SchoolType } from '@/types';

interface SchoolSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
}

export function SchoolSetupModal({ isOpen, onClose, onComplete }: SchoolSetupModalProps) {
  const { user, refreshUser } = useAuth();
  const { trackSchoolRegister } = useQuestTracker();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SchoolType[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  // 검색 기능
  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      toast.error('학교명을 입력해주세요.');
      return;
    }

    try {
      setIsSearching(true);
      setHasSearched(true);
      
      // Firestore에서 학교 검색 (KOR_NAME 필드로 검색)
      const schoolsRef = collection(db, 'schools');
      const q = query(
        schoolsRef,
        where('KOR_NAME', '>=', searchQuery.trim()),
        where('KOR_NAME', '<=', searchQuery.trim() + '\uf8ff')
      );
      const querySnapshot = await getDocs(q);
      
      const results: SchoolType[] = querySnapshot.docs.map(doc => ({
        id: doc.id,
        name: doc.data().KOR_NAME || doc.data().name || '',
        address: doc.data().address || doc.data().ADDRESS || '',
        schoolType: doc.data().schoolType || doc.data().SCHOOL_TYPE || '학교',
        establishment: doc.data().establishment || doc.data().ESTABLISHMENT || ''
      }));
      
      setSearchResults(results);
      
      if (results.length === 0) {
        toast.info('검색 결과가 없습니다. 다른 검색어를 시도해보세요.');
      }
    } catch (error) {
      console.error('학교 검색 실패:', error);
      toast.error('학교 검색에 실패했습니다.');
    } finally {
      setIsSearching(false);
    }
  };

  // 엔터키 검색
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  // 학교 선택
  const handleSelectSchool = async (school: SchoolType) => {
    if (!user) {
      toast.error('로그인이 필요합니다.');
      return;
    }

    try {
      setIsAdding(true);
      
      // 사용자의 즐겨찾기 학교에 추가
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        'favorites.schools': arrayUnion(school.id),
        // 메인 학교로도 설정 (첫 번째 학교)
        'school.id': school.id,
        'school.name': school.name,
        updatedAt: new Date()
      });
      
      await refreshUser();
      
      // 퀘스트 트래킹: 학교 등록 (2단계)
      console.log('📍 퀘스트 트래킹: SchoolSetupModal에서 학교 추가');
      await trackSchoolRegister();
      
      toast.success(`${school.name}이 즐겨찾기에 추가되었습니다!`);
      onComplete();
      onClose();
    } catch (error) {
      console.error('학교 추가 실패:', error);
      toast.error('학교 추가에 실패했습니다.');
    } finally {
      setIsAdding(false);
    }
  };

  // 모달 초기화
  useEffect(() => {
    if (isOpen) {
      setSearchQuery('');
      setSearchResults([]);
      setHasSearched(false);
    }
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <School className="h-5 w-5 text-green-600" />
            학교 설정
          </DialogTitle>
          <DialogDescription>
            학교 커뮤니티를 이용하기 위해 학교를 검색하여 즐겨찾기에 추가해주세요.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 flex-1 min-h-0">
          {/* 검색 입력 */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="학교명을 입력하세요 (예: 가락고등학교)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={handleKeyPress}
                className="pl-10"
                disabled={isSearching}
              />
            </div>
            <Button 
              onClick={handleSearch} 
              disabled={isSearching || !searchQuery.trim()}
            >
              {isSearching ? '검색 중...' : '검색'}
            </Button>
          </div>
          
          {/* 검색 결과 */}
          <div className="flex-1 min-h-0">
            {hasSearched && (
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-gray-700">
                  검색 결과 ({searchResults.length}개)
                </h3>
                
                {searchResults.length > 0 ? (
                  <div className="max-h-60 overflow-y-auto space-y-2">
                    {searchResults.map((school) => (
                      <div
                        key={school.id}
                        className="p-3 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                        onClick={() => handleSelectSchool(school)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-gray-900 truncate">
                              {school.name}
                            </h4>
                            <p className="text-sm text-gray-500 mt-1">
                              {school.address}
                            </p>
                            <div className="flex items-center gap-2 mt-2">
                              <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded">
                                {school.schoolType}
                              </span>
                              <span className="text-xs text-gray-400">
                                {school.establishment}
                              </span>
                            </div>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={isAdding}
                            className="ml-2 shrink-0"
                          >
                            {isAdding ? '추가 중...' : '선택'}
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <School className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                    <p>검색 결과가 없습니다.</p>
                    <p className="text-sm">다른 검색어를 시도해보세요.</p>
                  </div>
                )}
              </div>
            )}
            
            {!hasSearched && (
              <div className="text-center py-8 text-gray-500">
                <Search className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                <p>학교명을 검색해보세요.</p>
                <p className="text-sm">예: 가락고등학교, 서울중학교</p>
              </div>
            )}
          </div>
          
          <div className="flex gap-2 pt-4 border-t">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1"
              disabled={isAdding}
            >
              취소
            </Button>
            <Button
              variant="ghost"
              onClick={onClose}
              className="flex-1"
              disabled={isAdding}
            >
              나중에 설정
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
