'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { 
  AlertTriangle, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Eye,
  Shield
} from 'lucide-react';
import { 
  getReports, 
  getReportStats, 
  processReport 
} from '@/lib/api/reports';
import { useAuthStore } from '@/store/authStore';
import { Report, ReportStatus, ReportType, ReportReason, ReportStats } from '@/types';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

export function AdminReportsClient() {
  const [reports, setReports] = useState<Report[]>([]);
  const [stats, setStats] = useState<ReportStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<ReportStatus | 'all'>('all');
  const [selectedType, setSelectedType] = useState<ReportType | 'all'>('all');
  const [processingReport, setProcessingReport] = useState<Report | null>(null);
  const [actionNote, setActionNote] = useState('');
  const [actionTaken, setActionTaken] = useState('');
  const { user } = useAuthStore();

  useEffect(() => {
    fetchData();
  }, [selectedStatus, selectedType]);

  const fetchData = async () => {
    try {
      const [reportsData, statsData] = await Promise.all([
        getReports(
          selectedStatus === 'all' ? undefined : selectedStatus,
          selectedType === 'all' ? undefined : selectedType
        ),
        getReportStats()
      ]);

      setReports(reportsData.reports);
      setStats(statsData);
    } catch (error) {
      console.error('데이터 조회 실패:', error);
      toast.error('데이터를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleProcessReport = async (
    reportId: string,
    status: ReportStatus,
    adminNote?: string,
    actionTaken?: string
  ) => {
    if (!user) return;

    try {
      await processReport(reportId, status, user.uid, adminNote, actionTaken);
      toast.success('신고가 처리되었습니다.');
      setProcessingReport(null);
      setActionNote('');
      setActionTaken('');
      fetchData();
    } catch (error) {
      console.error('신고 처리 실패:', error);
      toast.error('신고 처리에 실패했습니다.');
    }
  };

  const getStatusBadge = (status: ReportStatus) => {
    switch (status) {
      case 'pending':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800"><Clock className="w-3 h-3 mr-1" />대기중</Badge>;
      case 'reviewing':
        return <Badge variant="secondary" className="bg-blue-100 text-blue-800"><AlertTriangle className="w-3 h-3 mr-1" />검토중</Badge>;
      case 'resolved':
        return <Badge variant="secondary" className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />처리완료</Badge>;
      case 'rejected':
        return <Badge variant="secondary" className="bg-red-100 text-red-800"><XCircle className="w-3 h-3 mr-1" />반려</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getReasonLabel = (reason: ReportReason) => {
    const reasonMap: Record<ReportReason, string> = {
      spam: '스팸/도배',
      inappropriate: '부적절한 내용',
      harassment: '괴롭힘/욕설',
      fake: '허위정보',
      copyright: '저작권 침해',
      privacy: '개인정보 노출',
      violence: '폭력적 내용',
      sexual: '성적 내용',
      hate: '혐오 발언',
      other: '기타',
    };
    return reasonMap[reason] || reason;
  };

  const getTargetTypeLabel = (type: ReportType) => {
    switch (type) {
      case 'post':
        return '게시글';
      case 'comment':
        return '댓글';
      case 'user':
        return '사용자';
      default:
        return type;
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getPostUrl = (report: Report) => {
    if (!report.boardCode) return null;
    
    if (report.targetType === 'post') {
      // 게시글 URL 생성
      if (report.schoolId) {
        return `/community/school/${report.schoolId}/${report.boardCode}/${report.targetId}`;
      } else if (report.regions) {
        return `/community/region/${report.regions.sido}/${report.regions.sigungu}/${report.boardCode}/${report.targetId}`;
      } else {
        return `/community/national/${report.boardCode}/${report.targetId}`;
      }
    } else if (report.targetType === 'comment' && report.postId) {
      // 댓글이 있는 게시글 URL 생성
      if (report.schoolId) {
        return `/community/school/${report.schoolId}/${report.boardCode}/${report.postId}`;
      } else if (report.regions) {
        return `/community/region/${report.regions.sido}/${report.regions.sigungu}/${report.boardCode}/${report.postId}`;
      } else {
        return `/community/national/${report.boardCode}/${report.postId}`;
      }
    }
    return null;
  };

  if (loading) {
    return <div className="flex justify-center py-8">로딩 중...</div>;
  }

  return (
    <div className="space-y-6">
      {/* 통계 카드 */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-blue-600">{stats.totalReports}</div>
              <div className="text-sm text-gray-600">전체 신고</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-yellow-600">{stats.pendingReports}</div>
              <div className="text-sm text-gray-600">대기중</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-green-600">{stats.resolvedReports}</div>
              <div className="text-sm text-gray-600">처리완료</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold text-red-600">{stats.rejectedReports}</div>
              <div className="text-sm text-gray-600">반려</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 필터 */}
      <div className="flex gap-4">
        <div className="flex-1">
          <Select value={selectedStatus} onValueChange={(value) => setSelectedStatus(value as ReportStatus | 'all')}>
            <SelectTrigger>
              <SelectValue placeholder="상태 선택" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">전체 상태</SelectItem>
              <SelectItem value="pending">대기중</SelectItem>
              <SelectItem value="reviewing">검토중</SelectItem>
              <SelectItem value="resolved">처리완료</SelectItem>
              <SelectItem value="rejected">반려</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex-1">
          <Select value={selectedType} onValueChange={(value) => setSelectedType(value as ReportType | 'all')}>
            <SelectTrigger>
              <SelectValue placeholder="타입 선택" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">전체 타입</SelectItem>
              <SelectItem value="post">게시글</SelectItem>
              <SelectItem value="comment">댓글</SelectItem>
              <SelectItem value="user">사용자</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* 신고 목록 */}
      <div className="space-y-4">
        {reports.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-gray-500">조건에 맞는 신고가 없습니다.</p>
            </CardContent>
          </Card>
        ) : (
          reports.map((report) => (
            <Card key={report.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg flex items-center gap-2">
                      {getTargetTypeLabel(report.targetType)} 신고
                      {getStatusBadge(report.status)}
                    </CardTitle>
                    <div className="text-sm text-gray-500 mt-1 space-y-1">
                      <p>신고자: {report.reporterInfo.displayName}</p>
                      <p>신고일: {formatDate(report.createdAt)}</p>
                      {report.resolvedAt && (
                        <p>처리일: {formatDate(report.resolvedAt)}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          <Eye className="w-4 h-4 mr-1" />
                          상세보기
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="sm:max-w-[600px]">
                        <DialogHeader>
                          <DialogTitle>신고 상세 정보</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <Label className="font-medium">신고 사유</Label>
                            <p className="text-sm text-gray-600 mt-1">
                              {getReasonLabel(report.reason)}
                              {report.customReason && ` - ${report.customReason}`}
                            </p>
                          </div>

                          {report.description && (
                            <div>
                              <Label className="font-medium">상세 설명</Label>
                              <p className="text-sm text-gray-600 mt-1">{report.description}</p>
                            </div>
                          )}

                          {report.targetContent && (
                            <div>
                              <Label className="font-medium">신고 대상 내용</Label>
                              <div className="bg-gray-50 p-3 rounded-md mt-1">
                                <p className="text-sm text-gray-700">{report.targetContent}</p>
                              </div>
                            </div>
                          )}

                          {/* 원본 게시글/댓글로 이동 링크 */}
                          <div>
                            <Label className="font-medium">원본 보기</Label>
                            <div className="mt-1">
                              {report.targetType === 'post' && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    const postUrl = getPostUrl(report);
                                    if (postUrl) {
                                      window.open(postUrl, '_blank');
                                    }
                                  }}
                                >
                                  게시글 보기
                                </Button>
                              )}
                              {report.targetType === 'comment' && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    const postUrl = getPostUrl(report);
                                    if (postUrl) {
                                      window.open(postUrl, '_blank');
                                    }
                                  }}
                                >
                                  댓글이 있는 게시글 보기
                                </Button>
                              )}
                              {report.targetType === 'user' && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    window.open(`/users/${report.targetId}`, '_blank');
                                  }}
                                >
                                  사용자 프로필 보기
                                </Button>
                              )}
                            </div>
                          </div>

                          {report.boardCode && (
                            <div>
                              <Label className="font-medium">게시판</Label>
                              <p className="text-sm text-gray-600 mt-1">{report.boardCode}</p>
                            </div>
                          )}

                          {report.schoolId && (
                            <div>
                              <Label className="font-medium">학교 ID</Label>
                              <p className="text-sm text-gray-600 mt-1">{report.schoolId}</p>
                            </div>
                          )}

                          {report.regions && (
                            <div>
                              <Label className="font-medium">지역</Label>
                              <p className="text-sm text-gray-600 mt-1">
                                {report.regions.sido} {report.regions.sigungu}
                              </p>
                            </div>
                          )}

                          {report.adminNote && (
                            <div>
                              <Label className="font-medium">관리자 메모</Label>
                              <p className="text-sm text-gray-600 mt-1">{report.adminNote}</p>
                            </div>
                          )}

                          {report.actionTaken && (
                            <div>
                              <Label className="font-medium">조치 내용</Label>
                              <p className="text-sm text-gray-600 mt-1">{report.actionTaken}</p>
                            </div>
                          )}
                        </div>
                      </DialogContent>
                    </Dialog>

                    {(report.status === 'pending' || report.status === 'reviewing') && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setProcessingReport(report)}
                      >
                        <Shield className="w-4 h-4 mr-1" />
                        처리
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div>
                    <span className="font-medium">신고 사유: </span>
                    <span>{getReasonLabel(report.reason)}</span>
                    {report.customReason && (
                      <span className="text-gray-600"> - {report.customReason}</span>
                    )}
                  </div>
                  
                  {report.targetContent && (
                    <div>
                      <span className="font-medium">신고 대상: </span>
                      <p className="text-sm text-gray-600 line-clamp-2 mt-1">{report.targetContent}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* 신고 처리 모달 */}
      {processingReport && (
        <Dialog open={true} onOpenChange={() => setProcessingReport(null)}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>신고 처리</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label className="font-medium">신고 내용</Label>
                <p className="text-sm text-gray-600 mt-1">
                  {getReasonLabel(processingReport.reason)}
                  {processingReport.customReason && ` - ${processingReport.customReason}`}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="actionTaken">처리 결과</Label>
                <Textarea
                  id="actionTaken"
                  value={actionTaken}
                  onChange={(e) => setActionTaken(e.target.value)}
                  placeholder="취한 조치를 입력하세요 (예: 경고, 3일 정지, 게시글 삭제 등)"
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="adminNote">관리자 메모 (선택사항)</Label>
                <Textarea
                  id="adminNote"
                  value={actionNote}
                  onChange={(e) => setActionNote(e.target.value)}
                  placeholder="내부 메모를 입력하세요"
                  rows={2}
                />
              </div>

              <div className="flex justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={() => setProcessingReport(null)}
                >
                  취소
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleProcessReport(
                    processingReport.id,
                    'rejected',
                    actionNote || undefined
                  )}
                  className="text-red-600 hover:text-red-700"
                >
                  반려
                </Button>
                <Button
                  onClick={() => handleProcessReport(
                    processingReport.id,
                    'resolved',
                    actionNote || undefined,
                    actionTaken || undefined
                  )}
                  disabled={!actionTaken.trim()}
                  className="bg-green-600 hover:bg-green-700"
                >
                  처리완료
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
} 