'use client';

import React, { useEffect, useState } from 'react';
import { useAuth } from '@/providers/AuthProvider';
import { checkSchoolAccess, getSchoolById } from '@/lib/api/schools';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Heart, AlertCircle, Lock } from 'lucide-react';
import Link from 'next/link';

interface SchoolAccessWrapperProps {
  schoolId: string;
  children: React.ReactNode;
}

export default function SchoolAccessWrapper({ schoolId, children }: SchoolAccessWrapperProps) {
  const { user } = useAuth();
  const [hasAccess, setHasAccess] = useState<boolean | null>(null);
  const [accessError, setAccessError] = useState<string>('');
  const [schoolName, setSchoolName] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAccess = async () => {
      if (!user) {
        setHasAccess(false);
        setAccessError('로그인이 필요합니다.');
        setLoading(false);
        return;
      }

      try {
        // 학교 정보 가져오기
        const school = await getSchoolById(schoolId);
        if (school) {
          setSchoolName(school.name);
        }

        // 접근 권한 확인
        const accessResult = await checkSchoolAccess(user.uid, schoolId);
        setHasAccess(accessResult.hasAccess);
        
        if (!accessResult.hasAccess) {
          setAccessError(accessResult.reason || '접근 권한이 없습니다.');
        }
      } catch (error) {
        console.error('접근 권한 확인 오류:', error);
        setHasAccess(false);
        setAccessError('접근 권한을 확인하는 중 오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    };

    checkAccess();
  }, [user, schoolId]);

  if (loading) {
    return (
      <div className="container mx-auto py-8 px-4 md:px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-muted-foreground">접근 권한을 확인하는 중...</p>
        </div>
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="container mx-auto py-8 px-4 md:px-6">
        <div className="max-w-4xl mx-auto">
          {/* 헤더 */}
          <div className="mb-8">
            <div className="flex items-center gap-4 mb-4">
              <Link href="/community">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  커뮤니티
                </Button>
              </Link>
            </div>
          </div>

          {/* 접근 제한 메시지 */}
          <Card className="border-2 border-red-200 bg-red-50">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <div className="flex items-center justify-center w-16 h-16 rounded-full bg-red-100">
                  <Lock className="w-8 h-8 text-red-600" />
                </div>
              </div>
              <CardTitle className="text-xl text-red-800">
                접근 권한이 없습니다
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <div className="bg-white rounded-lg p-4 border border-red-200">
                <div className="flex items-center justify-center gap-2 mb-3">
                  <AlertCircle className="w-5 h-5 text-red-500" />
                  <p className="text-red-700 font-medium">
                    {schoolName || '이 학교'} 커뮤니티 접근 제한
                  </p>
                </div>
                <p className="text-red-600 text-sm mb-4">
                  {accessError}
                </p>
                <div className="space-y-2 text-sm text-gray-600">
                  <p className="font-medium">💡 학교 커뮤니티 이용 방법:</p>
                  <ol className="list-decimal list-inside space-y-1 text-left max-w-md mx-auto">
                    <li>마이페이지에서 학교 검색</li>
                    <li>원하는 학교를 즐겨찾기에 추가 (최대 5개)</li>
                    <li>즐겨찾기한 학교 커뮤니티 이용 가능</li>
                  </ol>
                </div>
              </div>
              
              <div className="flex gap-3 justify-center">
                <Link href="/my">
                  <Button className="bg-primary hover:bg-primary/90">
                    <Heart className="w-4 h-4 mr-2" />
                    즐겨찾기 관리하기
                  </Button>
                </Link>
                <Link href="/community">
                  <Button variant="outline">
                    다른 커뮤니티 보기
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // 접근 권한이 있으면 원래 컨텐츠 표시
  return <>{children}</>;
} 