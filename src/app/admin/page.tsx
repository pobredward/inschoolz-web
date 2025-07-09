"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatCard } from '@/components/admin/StatCard';
import { DashboardChart } from '@/components/admin/DashboardChart';
import { Users, MessageSquare, FileText, AlertCircle, Star, MessageCircle, Settings, BarChart3, Shield, Gamepad2 } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { migrateBoardTypes, checkBoardTypes } from '@/lib/migrate-boards';

// 더미 데이터
const userData = [
  { name: '1월', 신규: 40, 활성: 24, 휴면: 10 },
  { name: '2월', 신규: 30, 활성: 28, 휴면: 12 },
  { name: '3월', 신규: 20, 활성: 25, 휴면: 15 },
  { name: '4월', 신규: 27, 활성: 25, 휴면: 14 },
  { name: '5월', 신규: 18, 활성: 25, 휴면: 22 },
  { name: '6월', 신규: 23, 활성: 27, 휴면: 17 },
  { name: '7월', 신규: 34, 활성: 30, 휴면: 11 },
];

const contentData = [
  { name: '1월', 게시글: 240, 댓글: 320, 신고: 18 },
  { name: '2월', 게시글: 300, 댓글: 350, 신고: 24 },
  { name: '3월', 게시글: 280, 댓글: 310, 신고: 16 },
  { name: '4월', 게시글: 340, 댓글: 380, 신고: 23 },
  { name: '5월', 게시글: 390, 댓글: 430, 신고: 31 },
  { name: '6월', 게시글: 310, 댓글: 390, 신고: 25 },
  { name: '7월', 게시글: 370, 댓글: 400, 신고: 27 },
];

const schoolData = [
  { name: '서울', value: 120 },
  { name: '경기', value: 80 },
  { name: '인천', value: 45 },
  { name: '부산', value: 60 },
  { name: '대구', value: 35 },
  { name: '광주', value: 25 },
  { name: '대전', value: 30 },
];

export default function AdminDashboardPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<string>('');

  const handleMigration = async () => {
    try {
      setIsLoading(true);
      setResult('마이그레이션 진행 중...');
      
      // 현재 상황 확인
      const currentStatus = await checkBoardTypes();
      console.log('현재 게시판 상황:', currentStatus);
      
      // 마이그레이션 실행
      const migrationResult = await migrateBoardTypes();
      
      if (migrationResult.success) {
        setResult(`✅ 마이그레이션 완료: ${migrationResult.updatedCount}개 게시판 업데이트됨`);
      } else {
        setResult('❌ 마이그레이션 실패');
      }
    } catch (error) {
      console.error('마이그레이션 오류:', error);
      setResult(`❌ 오류 발생: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCheck = async () => {
    try {
      setIsLoading(true);
      setResult('게시판 현황 확인 중...');
      
      const status = await checkBoardTypes();
      setResult(`📊 게시판 타입 현황: ${JSON.stringify(status.typeCount, null, 2)}`);
    } catch (error) {
      console.error('현황 확인 오류:', error);
      setResult(`❌ 오류 발생: ${error}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">대시보드</h1>
        <p className="text-muted-foreground mt-2">주요 통계 및 현황 정보를 확인하세요.</p>
      </div>

      {/* 주요 통계 카드 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        <StatCard 
          title="총 사용자 수"
          value="12,345"
          icon={Users}
          change={{ value: 5.2, isPositive: true }}
          variant="green"
        />
        <StatCard 
          title="총 게시글 수"
          value="24,567"
          icon={FileText}
          change={{ value: 3.8, isPositive: true }}
          variant="green"
        />
        <StatCard 
          title="총 댓글 수"
          value="78,901"
          icon={MessageSquare}
          change={{ value: 7.2, isPositive: true }}
          variant="purple"
        />
        <StatCard 
          title="신고 건수"
          value="123"
          icon={AlertCircle}
          change={{ value: 2.1, isPositive: false }}
          variant="red"
        />
      </div>

      {/* 관리 메뉴 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            관리 메뉴
          </CardTitle>
          <CardDescription>
            시스템 설정 및 관리 기능에 빠르게 접근하세요.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Link href="/admin/experience">
              <Button variant="outline" className="w-full h-20 flex flex-col gap-2">
                <Star className="h-6 w-6 text-green-600" />
                <span className="font-medium">경험치 관리</span>
                <span className="text-xs text-gray-500">경험치 설정 및 레벨 관리</span>
              </Button>
            </Link>
            
            <Link href="/admin/community">
              <Button variant="outline" className="w-full h-20 flex flex-col gap-2">
                <MessageCircle className="h-6 w-6 text-blue-600" />
                <span className="font-medium">커뮤니티 관리</span>
                <span className="text-xs text-gray-500">게시판 생성 및 설정</span>
              </Button>
            </Link>

            <Button variant="outline" className="w-full h-20 flex flex-col gap-2" disabled>
              <Shield className="h-6 w-6 text-red-600" />
              <span className="font-medium">신고 관리</span>
              <span className="text-xs text-gray-500">신고 처리 및 제재</span>
            </Button>

            <Button variant="outline" className="w-full h-20 flex flex-col gap-2" disabled>
              <Users className="h-6 w-6 text-purple-600" />
              <span className="font-medium">유저 관리</span>
              <span className="text-xs text-gray-500">회원 정보 및 권한 관리</span>
            </Button>

            <Button variant="outline" className="w-full h-20 flex flex-col gap-2" disabled>
              <Gamepad2 className="h-6 w-6 text-orange-600" />
              <span className="font-medium">게임 관리</span>
              <span className="text-xs text-gray-500">미니게임 설정 및 점수</span>
            </Button>

            <Button variant="outline" className="w-full h-20 flex flex-col gap-2" disabled>
              <BarChart3 className="h-6 w-6 text-indigo-600" />
              <span className="font-medium">통계 분석</span>
              <span className="text-xs text-gray-500">상세 통계 및 분석</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 데이터 시각화 탭 */}
      <Tabs defaultValue="users" className="w-full">
        <TabsList className="grid grid-cols-3 max-w-md">
          <TabsTrigger value="users">사용자</TabsTrigger>
          <TabsTrigger value="content">콘텐츠</TabsTrigger>
          <TabsTrigger value="schools">학교</TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <DashboardChart
              title="사용자 추이"
              data={userData}
              type="line"
              dataKey="신규"
            />
            <Card>
              <CardHeader>
                <CardTitle>사용자 주요 지표</CardTitle>
                <CardDescription>최근 7일간 주요 지표 변화</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">일일 활성 사용자 (DAU)</span>
                    <span className="text-sm font-bold text-green-600">3,245</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">신규 가입자</span>
                    <span className="text-sm font-bold text-green-600">124</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">재방문율</span>
                    <span className="text-sm font-bold text-purple-600">68%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">인증 완료 비율</span>
                    <span className="text-sm font-bold text-yellow-600">72%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="content" className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <DashboardChart
              title="콘텐츠 추이"
              data={contentData}
              type="bar"
              dataKey="게시글"
            />
            <Card>
              <CardHeader>
                <CardTitle>콘텐츠 주요 지표</CardTitle>
                <CardDescription>게시판별 활동 현황</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">자유게시판</span>
                    <span className="text-sm font-bold text-green-600">1,245개</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">학교게시판</span>
                    <span className="text-sm font-bold text-green-600">981개</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">질문게시판</span>
                    <span className="text-sm font-bold text-purple-600">534개</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">공지사항</span>
                    <span className="text-sm font-bold text-yellow-600">45개</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="schools" className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <DashboardChart
              title="지역별 학교 등록 현황"
              data={schoolData}
              type="bar"
              dataKey="value"
              xAxisKey="name"
            />
            <Card>
              <CardHeader>
                <CardTitle>학교 통계</CardTitle>
                <CardDescription>등록 및 인증 현황</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">전체 등록 학교</span>
                    <span className="text-sm font-bold text-green-600">1,245</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">초등학교</span>
                    <span className="text-sm font-bold text-green-600">452</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">중학교</span>
                    <span className="text-sm font-bold text-purple-600">356</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">고등학교</span>
                    <span className="text-sm font-bold text-yellow-600">437</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      <div className="mt-6">
        <Card>
          <CardHeader>
            <CardTitle>게시판 타입 마이그레이션</CardTitle>
            <CardDescription>
              Firebase의 기존 게시판 타입을 새로운 형식으로 변경합니다.
              <br />
              common → national, region → regional
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-4">
              <Button 
                onClick={handleCheck}
                disabled={isLoading}
                variant="outline"
              >
                현황 확인
              </Button>
              <Button 
                onClick={handleMigration}
                disabled={isLoading}
              >
                {isLoading ? '처리 중...' : '마이그레이션 실행'}
              </Button>
            </div>
            
            {result && (
              <Alert>
                <AlertDescription>
                  <pre className="whitespace-pre-wrap">{result}</pre>
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 