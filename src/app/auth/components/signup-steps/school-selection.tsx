'use client';

import { useState, useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Search, MapPin, Star, Users, School as SchoolIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { SignupStepProps, School } from '@/types';
import { searchSchools } from '@/lib/api/schools';
import { Switch } from '@/components/ui/switch';

const schoolSelectionSchema = z.object({
  school: z.string().min(1, { message: '학교를 선택해주세요.' }),
  favoriteSchools: z.array(z.string()).optional(),
});

type SchoolSelectionValues = z.infer<typeof schoolSelectionSchema>;

export function SchoolSelectionStep({ formData, updateFormData, nextStep }: SignupStepProps & { nextStep: () => void }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<School[]>([]);
  const [selectedSchool, setSelectedSchool] = useState<School | null>(null);
  const [favoriteSchools, setFavoriteSchools] = useState<School[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSearched, setIsSearched] = useState(false);
  const [searchErrorMessage, setSearchErrorMessage] = useState('');

  const form = useForm<SchoolSelectionValues>({
    resolver: zodResolver(schoolSelectionSchema),
    defaultValues: {
      school: formData.school || '',
      favoriteSchools: formData.favoriteSchools || [],
    },
  });

  const handleSearch = async () => {
    if (searchQuery.length < 2) {
      setSearchErrorMessage('검색어는 두 글자 이상 입력해주세요.');
      return;
    }
    setSearchErrorMessage('');
    setIsLoading(true);
    setIsSearched(true);
    try {
      const response = await searchSchools(searchQuery);
      setSearchResults(response.schools);
      if (response.schools.length === 0) {
        setSearchErrorMessage('검색 결과가 없습니다. 다른 검색어로 시도해보세요.');
      }
    } catch (error) {
      setSearchErrorMessage('학교 검색 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setSearchQuery('');
    setSearchResults([]);
    setIsSearched(false);
    setSearchErrorMessage('');
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSearch();
  };

  const handleSchoolSelect = (school: School) => {
    setSelectedSchool(school);
    form.setValue('school', school.id);
    updateFormData({ school: school.id, schoolName: school.name });
    nextStep();
  };

  const handleToggleFavorite = (school: School) => {
    let updatedFavorites: School[];
    if (favoriteSchools.some(s => s.id === school.id)) {
      updatedFavorites = favoriteSchools.filter(s => s.id !== school.id);
    } else {
      if (favoriteSchools.length >= 5) {
        alert('즐겨찾기는 최대 5개까지만 추가할 수 있습니다.');
        return;
      }
      updatedFavorites = [...favoriteSchools, school];
    }
    setFavoriteSchools(updatedFavorites);
    const favoriteSchoolIds = updatedFavorites.map(s => s.id);
    form.setValue('favoriteSchools', favoriteSchoolIds);
    updateFormData({ favoriteSchools: favoriteSchoolIds });
  };

  const isSchoolFavorited = (schoolId: string) => {
    return favoriteSchools.some(s => s.id === schoolId);
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold">학교 선택</h2>
      <div className="space-y-4">
        <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <Input
              placeholder="학교 이름을 검색하세요... (2글자 이상)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 w-full"
            />
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          </div>
          <Button type="submit" variant="default" size="sm" disabled={isLoading}>검색</Button>
          <Button type="button" variant="outline" size="sm" onClick={handleReset}>초기화</Button>
        </form>
        {searchErrorMessage && (
          <div className="text-sm text-red-500 mt-1">{searchErrorMessage}</div>
        )}
        {isLoading ? (
          <div className="text-center p-10">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent mb-4"></div>
            <p>학교 정보를 불러오는 중입니다...</p>
          </div>
        ) : !isSearched ? (
          <div className="text-center p-6 border rounded-md bg-green-50 text-green-700">
            <SchoolIcon className="h-8 w-8 mx-auto mb-2" />
            <p>학교 이름을 검색하여 찾아보세요. (검색 버튼을 클릭하세요)</p>
          </div>
        ) : searchResults.length > 0 ? (
          <div className="grid grid-cols-1 gap-4">
            {searchResults.map((school) => (
              <Card key={school.id} className={`hover:shadow-md transition-shadow ${selectedSchool?.id === school.id ? 'border-green-300 bg-green-50' : ''}`}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex justify-between">
                    <span>{school.name}</span>
                    <button
                      type="button"
                      onClick={() => handleToggleFavorite(school)}
                      className={`ml-2 p-1 rounded-full hover:bg-gray-100 ${isSchoolFavorited(school.id) ? 'text-yellow-500' : 'text-gray-400'}`}
                    >
                      <Star className={`h-4 w-4 ${isSchoolFavorited(school.id) ? 'fill-yellow-500' : ''}`} />
                    </button>
                  </CardTitle>
                </CardHeader>
                <CardContent className="pb-3">
                  <div className="text-sm space-y-1">
                    <div className="flex items-center text-gray-500">
                      <MapPin className="h-3 w-3 mr-1 flex-shrink-0" />
                      <span className="truncate">{school.address}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center text-gray-500">
                        <Users className="h-3 w-3 mr-1 flex-shrink-0" />
                        <span>가입 {school.memberCount || 0}명</span>
                      </div>
                      <div className="flex items-center text-gray-500">
                        <Star className="h-3 w-3 mr-1 text-yellow-400 flex-shrink-0" />
                        <span>즐겨찾기 {school.favoriteCount || 0}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="pt-0">
                  <Button size="sm" className="w-full" variant={selectedSchool?.id === school.id ? "default" : "outline"} onClick={() => handleSchoolSelect(school)}>
                    {selectedSchool?.id === school.id ? '선택됨' : '선택하기'}
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : isSearched ? (
          <div className="text-center p-6 border rounded-md bg-gray-50">
            <p className="text-gray-500">검색 결과가 없습니다. 다른 검색어로 시도해보세요.</p>
          </div>
        ) : null}
      </div>
    </div>
  );
} 