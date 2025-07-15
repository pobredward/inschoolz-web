"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StatCard } from '@/components/admin/StatCard';
import { Users, MessageSquare, FileText, AlertCircle, Star, MessageCircle, Settings, Shield, Gamepad2, BarChart3, RefreshCw, Bell } from 'lucide-react';
import { getAdminStats } from '@/lib/api/admin';
import { toast } from 'sonner';

interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  totalPosts: number;
  totalComments: number;
  pendingReports: number;
  totalExperience: number;
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchStats = async () => {
    try {
      setIsLoading(true);
      const adminStats = await getAdminStats();
      setStats(adminStats);
      toast.success('통계 데이터가 업데이트되었습니다.');
    } catch (error) {
      console.error('통계 조회 오류:', error);
      toast.error('통계 데이터를 가져오는 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">관리자 대시보드</h1>
          <p className="text-muted-foreground mt-2">인스쿨즈 시스템 관리 및 통계를 확인하세요.</p>
        </div>
        <Button 
          onClick={fetchStats} 
          disabled={isLoading}
          variant="outline"
          size="sm"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          {isLoading ? '로딩 중...' : '통계 새로고침'}
        </Button>
      </div>

      {/* 주요 통계 카드 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        <StatCard 
          title="총 사용자 수"
          value={isLoading ? "로딩 중..." : stats?.totalUsers.toLocaleString() || "0"}
          icon={Users}
          change={{ value: 0, isPositive: true }}
          variant="green"
        />
        <StatCard 
          title="총 게시글 수"
          value={isLoading ? "로딩 중..." : stats?.totalPosts.toLocaleString() || "0"}
          icon={FileText}
          change={{ value: 0, isPositive: true }}
          variant="green"
        />
        <StatCard 
          title="총 댓글 수"
          value={isLoading ? "로딩 중..." : stats?.totalComments.toLocaleString() || "0"}
          icon={MessageSquare}
          change={{ value: 0, isPositive: true }}
          variant="purple"
        />
        <StatCard 
          title="신고 건수"
          value={isLoading ? "로딩 중..." : stats?.pendingReports.toLocaleString() || "0"}
          icon={AlertCircle}
          change={{ value: 0, isPositive: false }}
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

            <Link href="/admin/notifications">
              <Button variant="outline" className="w-full h-20 flex flex-col gap-2">
                <Bell className="h-6 w-6 text-indigo-600" />
                <span className="font-medium">알림 설정</span>
                <span className="text-xs text-gray-500">전체 사용자 알림 발송</span>
              </Button>
            </Link>

            <Button variant="outline" className="w-full h-20 flex flex-col gap-2" disabled>
              <Shield className="h-6 w-6 text-red-600" />
              <span className="font-medium">신고 관리</span>
              <span className="text-xs text-gray-500">신고 처리 및 제재</span>
            </Button>

            <Link href="/admin/users">
              <Button variant="outline" className="w-full h-20 flex flex-col gap-2">
                <Users className="h-6 w-6 text-purple-600" />
                <span className="font-medium">유저 관리</span>
                <span className="text-xs text-gray-500">회원 정보 및 권한 관리</span>
              </Button>
            </Link>

            <Button variant="outline" className="w-full h-20 flex flex-col gap-2" disabled>
              <Gamepad2 className="h-6 w-6 text-orange-600" />
              <span className="font-medium">게임 관리</span>
              <span className="text-xs text-gray-500">미니게임 설정 및 점수</span>
            </Button>

            <Link href="/admin/schools">
              <Button variant="outline" className="w-full h-20 flex flex-col gap-2">
                <BarChart3 className="h-6 w-6 text-indigo-600" />
                <span className="font-medium">학교 관리</span>
                <span className="text-xs text-gray-500">학교 정보 및 설정 관리</span>
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 