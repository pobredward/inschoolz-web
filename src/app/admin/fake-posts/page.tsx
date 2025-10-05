"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, School, Bot, TrendingUp, Zap, Users, Trash2, Download, Activity, Target, RefreshCw, MessageCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/providers/AuthProvider';
import Link from 'next/link';

interface SystemStats {
  totalSchools: number;
  schoolsWithBots: number;
  totalBots: number;
  totalPosts: number;
  postsToday: number;
  averagePostsPerSchool: number;
  topActiveSchools: any[];
}

export default function FakePostsDashboardPage() {
  const { user } = useAuth();
  const [systemStats, setSystemStats] = useState<SystemStats | null>(null);

  const fetchSystemStats = async () => {
    try {
      const response = await fetch('/api/admin/system-stats');
      const result = await response.json();
      if (result.success) {
        setSystemStats(result.data);
      }
    } catch (error) {
      console.error('시스템 통계 조회 오류:', error);
      toast.error('시스템 통계를 불러오는데 실패했습니다.');
    }
  };

  useEffect(() => {
    fetchSystemStats();
  }, []);

  if (!user?.profile?.isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">접근 권한이 없습니다</h1>
          <p className="text-muted-foreground">관리자만 접근할 수 있는 페이지입니다.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Link href="/admin" className="text-muted-foreground hover:text-foreground">
              관리자
            </Link>
            <span className="text-muted-foreground">/</span>
            <span className="font-medium">AI 게시글 관리</span>
          </div>
          <h1 className="text-3xl font-bold">🤖 AI 게시글 관리 대시보드</h1>
          <p className="text-muted-foreground">AI 게시글 시스템의 전체 현황을 한눈에 확인하세요.</p>
        </div>
        <Button onClick={() => window.location.reload()}>
          <RefreshCw className="h-4 w-4 mr-2" />
          새로고침
        </Button>
      </div>

      {/* 시스템 개요 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">전체 학교</p>
                <p className="text-2xl font-bold">{systemStats?.totalSchools?.toLocaleString() || '12,525'}</p>
              </div>
              <School className="h-8 w-8 text-blue-600" />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              봇 있는 학교: {systemStats?.schoolsWithBots?.toLocaleString() || '2'}개
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">총 봇 계정</p>
                <p className="text-2xl font-bold">{systemStats?.totalBots?.toLocaleString() || '6'}</p>
              </div>
              <Bot className="h-8 w-8 text-purple-600" />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              활성 봇: {Math.floor((systemStats?.totalBots || 0) * 0.8)}개
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">총 AI 게시글</p>
                <p className="text-2xl font-bold">{systemStats?.totalPosts?.toLocaleString() || '3'}</p>
              </div>
              <Calendar className="h-8 w-8 text-green-600" />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              오늘: {systemStats?.postsToday || 0}개
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">평균 게시글/학교</p>
                <p className="text-2xl font-bold">{systemStats?.averagePostsPerSchool?.toFixed(1) || '0.0'}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-orange-600" />
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              지난 7일 평균
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 관리 메뉴 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link href="/admin/fake-posts/posts">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <Calendar className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold">게시글 관리</h3>
                  <p className="text-sm text-muted-foreground">AI 게시글 조회, 수정, 삭제</p>
                  <Badge variant="secondary" className="mt-1">
                    {systemStats?.totalPosts || 0}개
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/admin/fake-posts/bots">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-purple-100 rounded-lg">
                  <Bot className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-semibold">봇 계정 관리</h3>
                  <p className="text-sm text-muted-foreground">봇 현황 및 통계</p>
                  <Badge variant="secondary" className="mt-1">
                    {systemStats?.totalBots || 0}개
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/admin/fake-posts/comments">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-orange-100 rounded-lg">
                  <MessageCircle className="h-6 w-6 text-orange-600" />
                </div>
                <div>
                  <h3 className="font-semibold">댓글 관리</h3>
                  <p className="text-sm text-muted-foreground">AI 댓글 검토 및 승인</p>
                  <Badge variant="secondary" className="mt-1">
                    검토 필요
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/admin/fake-posts/schools">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-green-100 rounded-lg">
                  <School className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold">학교 관리</h3>
                  <p className="text-sm text-muted-foreground">학교별 봇 생성 및 관리</p>
                  <Badge variant="secondary" className="mt-1">
                    {systemStats?.totalSchools?.toLocaleString() || '12,525'}개
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/admin/fake-posts/operations">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-orange-100 rounded-lg">
                  <Zap className="h-6 w-6 text-orange-600" />
                </div>
                <div>
                  <h3 className="font-semibold">대량 작업</h3>
                  <p className="text-sm text-muted-foreground">대량 생성, 삭제, 정리</p>
                  <Badge variant="secondary" className="mt-1">
                    실시간 모니터링
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}
