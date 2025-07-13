'use client';

import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Clock, CheckCircle, XCircle, Edit, Trash2 } from 'lucide-react';
import { getUserReports, cancelReport } from '@/lib/api/reports';
import { useAuthStore } from '@/store/authStore';
import { Report, ReportReason, ReportStatus, UserReportRecord } from '@/types';
import { toast } from 'sonner';
import { ReportModal } from '@/components/ui/report-modal';

export function ReportsPageClient() {
  const [reportRecord, setReportRecord] = useState<UserReportRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [editingReport, setEditingReport] = useState<Report | null>(null);
  const { user } = useAuthStore();

  useEffect(() => {
    const fetchReports = async () => {
      if (!user) return;

      try {
        const record = await getUserReports(user.uid);
        setReportRecord(record);
      } catch (error) {
        console.error('신고 기록 조회 실패:', error);
        toast.error('신고 기록을 불러오는데 실패했습니다.');
      } finally {
        setLoading(false);
      }
    };

    fetchReports();
  }, [user]);

  const handleEditReport = (report: Report) => {
    setEditingReport(report);
  };

  const handleCancelReport = async (reportId: string) => {
    if (!confirm('정말로 신고를 취소하시겠습니까?')) return;

    try {
      await cancelReport(reportId);
      toast.success('신고가 취소되었습니다.');
      
      // 목록 새로고침
      if (user) {
        const record = await getUserReports(user.uid);
        setReportRecord(record);
      }
    } catch (error) {
      console.error('신고 취소 실패:', error);
      toast.error('신고 취소에 실패했습니다.');
    }
  };

  const handleUpdateSuccess = async () => {
    setEditingReport(null);
    toast.success('신고가 수정되었습니다.');
    
    // 목록 새로고침
    if (user) {
      const record = await getUserReports(user.uid);
      setReportRecord(record);
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

  const getTargetTypeLabel = (type: string) => {
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

  if (loading) {
    return <div className="flex justify-center py-8">로딩 중...</div>;
  }

  if (!reportRecord) {
    return <div className="text-center py-8">신고 기록을 불러올 수 없습니다.</div>;
  }

  return (
    <div className="space-y-6">
      {/* 통계 카드 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-600">{reportRecord.stats.totalReportsMade}</div>
            <div className="text-sm text-gray-600">내가 신고한 횟수</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-red-600">{reportRecord.stats.totalReportsReceived}</div>
            <div className="text-sm text-gray-600">나를 신고한 횟수</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-yellow-600">{reportRecord.stats.warningsReceived}</div>
            <div className="text-sm text-gray-600">받은 경고</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-purple-600">{reportRecord.stats.suspensionsReceived}</div>
            <div className="text-sm text-gray-600">받은 정지</div>
          </CardContent>
        </Card>
      </div>

      {/* 신고 내역 탭 */}
      <Tabs defaultValue="made" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="made">내가 신고한 내역 ({reportRecord.reportsMade.length})</TabsTrigger>
          <TabsTrigger value="received">나를 신고한 내역 ({reportRecord.reportsReceived.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="made" className="space-y-4">
          {reportRecord.reportsMade.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <p className="text-gray-500">신고한 내역이 없습니다.</p>
              </CardContent>
            </Card>
          ) : (
            reportRecord.reportsMade.map((report) => (
              <Card key={report.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg flex items-center gap-2">
                        {getTargetTypeLabel(report.targetType)} 신고
                        {getStatusBadge(report.status)}
                      </CardTitle>
                      <p className="text-sm text-gray-500 mt-1">
                        {formatDate(report.createdAt)}
                      </p>
                    </div>
                    {report.status === 'pending' && (
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditReport(report)}
                        >
                          <Edit className="w-4 h-4 mr-1" />
                          수정
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleCancelReport(report.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4 mr-1" />
                          취소
                        </Button>
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <span className="font-medium">신고 사유: </span>
                      <span>{getReasonLabel(report.reason)}</span>
                      {report.customReason && (
                        <span className="text-gray-600"> - {report.customReason}</span>
                      )}
                    </div>
                    
                    {report.description && (
                      <div>
                        <span className="font-medium">상세 설명: </span>
                        <span className="text-gray-600">{report.description}</span>
                      </div>
                    )}

                    {report.targetContent && (
                      <div>
                        <span className="font-medium">신고 대상 내용: </span>
                        <div className="mt-1 p-2 bg-gray-50 rounded border">
                          <p className="text-sm text-gray-700 line-clamp-2">{report.targetContent}</p>
                        </div>
                      </div>
                    )}

                    {report.status === 'resolved' && report.actionTaken && (
                      <div>
                        <span className="font-medium">처리 결과: </span>
                        <span className="text-green-600">{report.actionTaken}</span>
                      </div>
                    )}

                    {report.status === 'rejected' && report.adminNote && (
                      <div>
                        <span className="font-medium">반려 사유: </span>
                        <span className="text-red-600">{report.adminNote}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="received" className="space-y-4">
          {reportRecord.reportsReceived.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <p className="text-gray-500">나를 신고한 내역이 없습니다.</p>
              </CardContent>
            </Card>
          ) : (
            reportRecord.reportsReceived.map((report) => (
              <Card key={report.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg flex items-center gap-2">
                        {getTargetTypeLabel(report.targetType)} 신고받음
                        {getStatusBadge(report.status)}
                      </CardTitle>
                      <p className="text-sm text-gray-500 mt-1">
                        {formatDate(report.createdAt)}
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <span className="font-medium">신고 사유: </span>
                      <span>{getReasonLabel(report.reason)}</span>
                      {report.customReason && (
                        <span className="text-gray-600"> - {report.customReason}</span>
                      )}
                    </div>

                    {report.targetContent && (
                      <div>
                        <span className="font-medium">신고된 내용: </span>
                        <div className="mt-1 p-2 bg-gray-50 rounded border">
                          <p className="text-sm text-gray-700 line-clamp-2">{report.targetContent}</p>
                        </div>
                      </div>
                    )}

                    {report.status === 'resolved' && report.actionTaken && (
                      <div>
                        <span className="font-medium">처리 결과: </span>
                        <span className="text-green-600">{report.actionTaken}</span>
                      </div>
                    )}

                    {report.status === 'resolved' && report.resolvedAt && (
                      <div>
                        <span className="font-medium">처리 일시: </span>
                        <span className="text-gray-600">{formatDate(report.resolvedAt)}</span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>

      {/* 신고 수정 모달 */}
      {editingReport && (
        <ReportModal
          isOpen={true}
          onClose={() => setEditingReport(null)}
          targetId={editingReport.targetId}
          targetType={editingReport.targetType}
          targetContent={editingReport.targetContent}
          onSuccess={handleUpdateSuccess}
          boardCode={editingReport.boardCode}
          schoolId={editingReport.schoolId}
          regions={editingReport.regions}
        />
      )}
    </div>
  );
} 