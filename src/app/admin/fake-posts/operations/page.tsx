"use client";

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Zap, Users, Calendar, Trash2, Download, AlertTriangle, RefreshCw,
  Clock, CheckCircle, XCircle, MessageCircle
} from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/providers/AuthProvider';
import Link from 'next/link';

interface BulkOperation {
  id: string;
  type: 'create_bots' | 'generate_posts' | 'delete_posts' | 'cleanup' | 'delete_bots' | 'generate_comments';
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress: number;
  total: number;
  message: string;
  startedAt: string;
  completedAt?: string;
}

export default function OperationsManagementPage() {
  const { user } = useAuth();
  const [executingOperations, setExecutingOperations] = useState<Set<string>>(new Set());


  // 특정 작업 유형이 실행 중인지 확인
  const isOperationTypeExecuting = (operationType: BulkOperation['type']): boolean => {
    return Array.from(executingOperations).some(op => op.startsWith(operationType));
  };

  // 대량 작업 실행 (확인 다이얼로그 포함)
  const executeBulkOperation = async (type: BulkOperation['type'], params: any, description: string) => {
    // 동일한 유형의 작업이 실행 중인지 확인
    if (isOperationTypeExecuting(type)) {
      toast.warning(`이미 ${type === 'create_bots' ? '봇 생성' : type === 'generate_posts' ? '게시글 생성' : type === 'generate_comments' ? '댓글 생성' : type === 'delete_posts' ? '게시글 삭제' : '데이터 정리'} 작업이 진행 중입니다.`);
      return;
    }

    // 확인 다이얼로그
    const confirmed = confirm(`정말로 "${description}" 작업을 실행하시겠습니까?\n\n이 작업은 시간이 오래 걸릴 수 있으며, 일부 작업은 되돌릴 수 없습니다.`);
    if (!confirmed) return;

    const operationKey = `${type}_${Date.now()}`;

    try {
      // 실행 중인 작업에 추가
      setExecutingOperations(prev => new Set([...prev, operationKey]));
      
      const response = await fetch('/api/admin/bulk-operations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, params })
      });
      
      const result = await response.json();
      
      if (result.success) {
        toast.success(`대량 작업이 시작되었습니다: ${description}`);
      } else {
        throw new Error(result.error || '대량 작업 시작 실패');
      }
    } catch (error) {
      console.error('대량 작업 실행 오류:', error);
      toast.error(`대량 작업을 시작할 수 없습니다: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      // 실행 완료 후 3초 뒤에 제거 (작업이 백그라운드에서 계속 진행되므로)
      setTimeout(() => {
        setExecutingOperations(prev => {
          const newSet = new Set(prev);
          newSet.delete(operationKey);
          return newSet;
        });
      }, 3000);
    }
  };


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
            <Link href="/admin/fake-posts" className="text-muted-foreground hover:text-foreground">
              AI 게시글 관리
            </Link>
            <span className="text-muted-foreground">/</span>
            <span className="font-medium">대량 작업</span>
          </div>
          <h1 className="text-3xl font-bold">⚡ 대량 작업 관리</h1>
          <p className="text-muted-foreground">필요한 대량 작업을 선택하여 실행하세요.</p>
        </div>
      </div>


      {/* 대량 작업 실행 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            대량 작업 실행
          </CardTitle>
          <CardDescription>
            필요한 대량 작업을 선택하여 실행할 수 있습니다.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h4 className="font-medium">봇 계정 관리</h4>
              <div className="space-y-2">
                <Button 
                  onClick={() => executeBulkOperation('create_bots', { schoolCount: 10 }, '10개 학교에 봇 생성 (30개 봇)')}
                  className="w-full justify-start"
                  variant="outline"
                  disabled={isOperationTypeExecuting('create_bots')}
                >
                  <Users className="h-4 w-4 mr-2" />
                  10개 학교에 봇 생성 (30개 봇)
                  <span className="text-xs text-green-600 ml-auto">~10초 소요</span>
                </Button>
                <Button 
                  onClick={() => executeBulkOperation('create_bots', { schoolCount: 500 }, '500개 학교에 봇 생성 (1,500개 봇)')}
                  className="w-full justify-start"
                  variant="outline"
                  disabled={isOperationTypeExecuting('create_bots')}
                >
                  <Users className="h-4 w-4 mr-2" />
                  500개 학교에 봇 생성 (1,500개 봇)
                  <span className="text-xs text-muted-foreground ml-auto">~5분 소요</span>
                </Button>
                <Button 
                  onClick={() => executeBulkOperation('create_bots', { schoolCount: 1000 }, '1,000개 학교에 봇 생성 (3,000개 봇)')}
                  className="w-full justify-start"
                  variant="outline"
                  disabled={isOperationTypeExecuting('create_bots')}
                >
                  <Users className="h-4 w-4 mr-2" />
                  1,000개 학교에 봇 생성 (3,000개 봇)
                  <span className="text-xs text-muted-foreground ml-auto">~10분 소요</span>
                </Button>
                <Button 
                  onClick={() => executeBulkOperation('create_bots', { schoolCount: 12525 }, '전체 학교에 봇 생성 (37,575개 봇)')}
                  className="w-full justify-start"
                  variant="outline"
                  disabled={isOperationTypeExecuting('create_bots')}
                >
                  <Users className="h-4 w-4 mr-2" />
                  전체 학교에 봇 생성 (37,575개 봇)
                  <span className="text-xs text-red-500 ml-auto">~2시간 소요</span>
                </Button>
                
                {/* 구분선 */}
                <div className="border-t pt-2 mt-4">
                  <h5 className="text-sm font-medium text-red-600 mb-2">⚠️ 위험한 작업</h5>
                  <Button 
                    onClick={() => executeBulkOperation('delete_bots', { withPosts: false }, '모든 봇 계정 삭제 (게시글 유지)')}
                    className="w-full justify-start"
                    variant="destructive"
                    disabled={isOperationTypeExecuting('delete_bots')}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    모든 봇 계정 삭제 (게시글 유지)
                    <span className="text-xs text-red-200 ml-auto">~10초 소요</span>
                  </Button>
                  <Button 
                    onClick={() => executeBulkOperation('delete_bots', { withPosts: true }, '모든 봇 + 게시글 + 댓글 삭제 (완전 삭제)')}
                    className="w-full justify-start mt-2"
                    variant="destructive"
                    disabled={isOperationTypeExecuting('delete_bots')}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    모든 봇 + 게시글 + 댓글 삭제
                    <span className="text-xs text-red-200 ml-auto">~30초 소요</span>
                  </Button>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-medium">게시글 생성</h4>
              <div className="space-y-2">
                <Button 
                  onClick={() => executeBulkOperation('generate_posts', { schoolLimit: 2, postsPerSchool: 1 }, '2개 학교 × 1개 게시글 (2개 게시글)')}
                  className="w-full justify-start"
                  variant="outline"
                  disabled={isOperationTypeExecuting('generate_posts')}
                >
                  <Calendar className="h-4 w-4 mr-2" />
                  2개 학교 × 1개 게시글
                  <span className="text-xs text-green-600 ml-auto">~5초 소요</span>
                </Button>
                <Button 
                  onClick={() => executeBulkOperation('generate_posts', { schoolLimit: 100, postsPerSchool: 1 }, '100개 학교 × 1개 게시글 (100개 게시글)')}
                  className="w-full justify-start"
                  variant="outline"
                  disabled={isOperationTypeExecuting('generate_posts')}
                >
                  <Calendar className="h-4 w-4 mr-2" />
                  100개 학교 × 1개 게시글
                  <span className="text-xs text-muted-foreground ml-auto">~3분 소요</span>
                </Button>
                <Button 
                  onClick={() => executeBulkOperation('generate_posts', { schoolLimit: 500, postsPerSchool: 2 }, '500개 학교 × 2개 게시글 (1,000개 게시글)')}
                  className="w-full justify-start"
                  variant="outline"
                  disabled={isOperationTypeExecuting('generate_posts')}
                >
                  <Calendar className="h-4 w-4 mr-2" />
                  500개 학교 × 2개 게시글
                  <span className="text-xs text-muted-foreground ml-auto">~30분 소요</span>
                </Button>
                <Button 
                  onClick={() => executeBulkOperation('generate_posts', { schoolLimit: 1000, postsPerSchool: 3 }, '1,000개 학교 × 3개 게시글 (3,000개 게시글)')}
                  className="w-full justify-start"
                  variant="outline"
                  disabled={isOperationTypeExecuting('generate_posts')}
                >
                  <Calendar className="h-4 w-4 mr-2" />
                  1,000개 학교 × 3개 게시글
                  <span className="text-xs text-orange-500 ml-auto">~1.5시간 소요</span>
                </Button>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-medium">댓글 생성</h4>
              <div className="space-y-2">
                <Button 
                  onClick={() => executeBulkOperation('generate_comments', { schoolLimit: 3, commentsPerSchool: 2, maxCommentsPerPost: 2 }, '3개 학교 × 2개 게시글 × 최대 2개 댓글 (최대 12개)')}
                  className="w-full justify-start"
                  variant="outline"
                  disabled={isOperationTypeExecuting('generate_comments')}
                >
                  <MessageCircle className="h-4 w-4 mr-2" />
                  3개 학교 × 2개 게시글 × 2개 댓글
                  <span className="text-xs text-blue-600 ml-auto">~10초 소요</span>
                </Button>
                <Button 
                  onClick={() => executeBulkOperation('generate_comments', { schoolLimit: 10, commentsPerSchool: 5, maxCommentsPerPost: 3 }, '10개 학교 × 5개 게시글 × 최대 3개 댓글 (최대 150개)')}
                  className="w-full justify-start"
                  variant="outline"
                  disabled={isOperationTypeExecuting('generate_comments')}
                >
                  <MessageCircle className="h-4 w-4 mr-2" />
                  10개 학교 × 5개 게시글 × 3개 댓글
                  <span className="text-xs text-blue-600 ml-auto">~30초 소요</span>
                </Button>
                <Button 
                  onClick={() => executeBulkOperation('generate_comments', { strategy: 'low_comments', maxPosts: 20, onlyPostsWithoutComments: true }, '댓글 없는 게시글에만 댓글 생성 (최대 20개)')}
                  className="w-full justify-start"
                  variant="outline"
                  disabled={isOperationTypeExecuting('generate_comments')}
                >
                  <MessageCircle className="h-4 w-4 mr-2" />
                  댓글 없는 게시글만 (스마트)
                  <span className="text-xs text-green-600 ml-auto">~15초 소요</span>
                </Button>
                <Button 
                  onClick={() => executeBulkOperation('generate_comments', { strategy: 'all_posts', maxPosts: 50, maxCommentsPerPost: 1 }, '모든 게시글에 댓글 생성 (최대 50개)')}
                  className="w-full justify-start"
                  variant="outline"
                  disabled={isOperationTypeExecuting('generate_comments')}
                >
                  <MessageCircle className="h-4 w-4 mr-2" />
                  모든 게시글 × 댓글 생성
                  <span className="text-xs text-orange-500 ml-auto">~1분 소요</span>
                </Button>
              </div>
            </div>
          </div>

          <Separator className="my-6" />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h4 className="font-medium">데이터 정리</h4>
              <div className="space-y-2">
                <Button 
                  onClick={() => executeBulkOperation('cleanup', { olderThanDays: 7 }, '7일 이상 된 AI 게시글 삭제')}
                  className="w-full justify-start"
                  variant="outline"
                  disabled={isOperationTypeExecuting('cleanup') || isOperationTypeExecuting('delete_posts')}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  7일 이상 된 게시글 삭제
                  <span className="text-xs text-muted-foreground ml-auto">~1분 소요</span>
                </Button>
                <Button 
                  onClick={() => executeBulkOperation('cleanup', { olderThanDays: 30 }, '30일 이상 된 AI 게시글 삭제')}
                  className="w-full justify-start"
                  variant="outline"
                  disabled={isOperationTypeExecuting('cleanup') || isOperationTypeExecuting('delete_posts')}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  30일 이상 된 게시글 삭제
                  <span className="text-xs text-muted-foreground ml-auto">~2분 소요</span>
                </Button>
                <Button 
                  onClick={() => executeBulkOperation('delete_posts', { all: true }, '모든 AI 게시글 삭제 (되돌릴 수 없음)')}
                  className="w-full justify-start"
                  variant="destructive"
                  disabled={isOperationTypeExecuting('cleanup') || isOperationTypeExecuting('delete_posts')}
                >
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  모든 AI 게시글 삭제
                  <span className="text-xs text-red-300 ml-auto">⚠️ 되돌릴 수 없음</span>
                </Button>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-medium">데이터 관리</h4>
              <div className="space-y-2">
                <Button 
                  onClick={() => window.open('/api/admin/export-data?type=posts&format=csv', '_blank')}
                  className="w-full justify-start"
                  variant="outline"
                >
                  <Download className="h-4 w-4 mr-2" />
                  게시글 데이터 내보내기 (CSV)
                  <span className="text-xs text-muted-foreground ml-auto">즉시 다운로드</span>
                </Button>
                <Button 
                  onClick={() => window.open('/api/admin/export-data?type=bots&format=csv', '_blank')}
                  className="w-full justify-start"
                  variant="outline"
                >
                  <Download className="h-4 w-4 mr-2" />
                  봇 계정 데이터 내보내기 (CSV)
                  <span className="text-xs text-muted-foreground ml-auto">즉시 다운로드</span>
                </Button>
                <Button 
                  onClick={() => window.open('/api/admin/export-data?type=schools&format=csv', '_blank')}
                  className="w-full justify-start"
                  variant="outline"
                >
                  <Download className="h-4 w-4 mr-2" />
                  학교 통계 내보내기 (CSV)
                  <span className="text-xs text-muted-foreground ml-auto">즉시 다운로드</span>
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 작업 가이드 */}
      <Card>
        <CardHeader>
          <CardTitle>대량 작업 가이드 & 주의사항</CardTitle>
          <CardDescription>
            효율적이고 안전한 대량 작업을 위한 권장사항과 주의사항입니다.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6 text-sm">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <h5 className="font-medium mb-2 flex items-center gap-2">
                    <Users className="h-4 w-4 text-blue-500" />
                    봇 계정 생성
                  </h5>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                    <li>각 학교당 3개의 봇 계정이 생성됩니다</li>
                    <li>봇 계정은 학교별로 고유한 닉네임을 가집니다</li>
                    <li>Firebase 스타일 UID로 봇임을 숨깁니다</li>
                    <li>중복 생성을 방지하는 로직이 포함되어 있습니다</li>
                    <li><span className="text-green-600 font-medium">10개 학교</span>: 테스트용 소규모 생성</li>
                  </ul>
                </div>
                
                <div>
                  <h5 className="font-medium mb-2 flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-green-500" />
                    게시글 생성
                  </h5>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                    <li>봇 계정이 있는 학교에서만 게시글이 생성됩니다</li>
                    <li>각 게시글은 OpenAI를 통해 자연스럽게 생성됩니다</li>
                    <li>생성 속도는 API 제한에 따라 조절됩니다</li>
                    <li>봇의 경험치와 레벨이 자동으로 업데이트됩니다</li>
                    <li><span className="text-green-600 font-medium">2개 학교</span>: 테스트용 소규모 생성</li>
                  </ul>
                </div>
                
                <div>
                  <h5 className="font-medium mb-2 flex items-center gap-2">
                    <MessageCircle className="h-4 w-4 text-blue-500" />
                    댓글 생성
                  </h5>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                    <li>봇이 있는 학교의 게시글에 GPT 기반 댓글을 생성합니다</li>
                    <li>게시글 내용을 분석하여 맥락에 맞는 자연스러운 댓글 작성</li>
                    <li>댓글이 적은 게시글을 우선적으로 선택합니다</li>
                    <li>같은 봇이 중복 댓글을 달지 않도록 방지합니다</li>
                    <li><span className="text-blue-600 font-medium">3개 학교 × 2개 게시글</span>: 각 학교에서 댓글 적은 게시글 2개 선택</li>
                    <li><span className="text-blue-600 font-medium">10개 학교 × 5개 게시글</span>: 대량 생성 (최대 150개 댓글)</li>
                    <li><span className="text-green-600 font-medium">댓글 없는 게시글만</span>: 전체에서 댓글 0개인 게시글만 선택</li>
                    <li><span className="text-orange-600 font-medium">모든 게시글</span>: 봇이 있는 모든 학교의 모든 게시글 대상</li>
                  </ul>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <h5 className="font-medium mb-2 flex items-center gap-2">
                    <Trash2 className="h-4 w-4 text-red-500" />
                    데이터 정리
                  </h5>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                    <li>실제 사용자 데이터는 삭제되지 않습니다</li>
                    <li>AI 데이터만 선별적으로 삭제됩니다 (fake: true)</li>
                    <li><span className="text-red-600 font-medium">완전 삭제</span>: 봇 계정 + AI 게시글 + AI 댓글 + orphan 댓글</li>
                    <li>삭제 작업은 되돌릴 수 없으니 신중히 선택하세요</li>
                    <li>대량 삭제 전 반드시 백업을 권장합니다</li>
                  </ul>
                </div>

                <div>
                  <h5 className="font-medium mb-2 flex items-center gap-2">
                    <Download className="h-4 w-4 text-purple-500" />
                    데이터 내보내기
                  </h5>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                    <li>CSV 형태로 즉시 다운로드됩니다</li>
                    <li>Excel에서 바로 열어볼 수 있습니다</li>
                    <li>정기적인 백업 용도로 활용하세요</li>
                    <li>데이터 분석 및 리포트 작성에 유용합니다</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="border-t pt-4">
              <h5 className="font-medium mb-3 flex items-center gap-2 text-orange-600">
                <AlertTriangle className="h-4 w-4" />
                중요 주의사항
              </h5>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-orange-50 p-3 rounded-lg">
                  <h6 className="font-medium text-orange-800 mb-1">작업 실행 전</h6>
                  <ul className="list-disc list-inside space-y-1 text-orange-700 text-xs">
                    <li>동일한 유형의 작업이 실행 중이면 대기해주세요</li>
                    <li>대량 작업은 서버 리소스를 많이 사용합니다</li>
                    <li>작업 중에는 브라우저를 닫지 마세요</li>
                  </ul>
                </div>
                <div className="bg-red-50 p-3 rounded-lg">
                  <h6 className="font-medium text-red-800 mb-1">삭제 작업 시</h6>
                  <ul className="list-disc list-inside space-y-1 text-red-700 text-xs">
                    <li>삭제된 데이터는 복구할 수 없습니다</li>
                    <li>실행 전 반드시 데이터를 내보내기하세요</li>
                    <li>테스트 환경에서 먼저 확인하세요</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg">
              <h5 className="font-medium mb-2 flex items-center gap-2 text-blue-800">
                <Clock className="h-4 w-4" />
                작업 모니터링
              </h5>
              <p className="text-blue-700 text-xs mb-2">
                모든 작업은 실시간으로 모니터링됩니다. 진행률, 상태, 소요 시간을 확인할 수 있습니다.
              </p>
              <div className="flex items-center gap-4 text-xs text-blue-600">
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  실행 중: 파란색 진행률 바
                </span>
                <span className="flex items-center gap-1">
                  <CheckCircle className="h-3 w-3" />
                  완료: 초록색 진행률 바
                </span>
                <span className="flex items-center gap-1">
                  <XCircle className="h-3 w-3" />
                  실패: 빨간색 진행률 바
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
