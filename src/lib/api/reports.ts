import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit, 
  startAfter,
  QueryDocumentSnapshot,
  DocumentData
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Report, ReportType, ReportReason, ReportStatus, ReportStats, UserReportRecord } from '@/types';
import { createReportReceivedNotification } from './notifications';

// 신고 생성
export async function createReport(data: {
  reason: ReportReason;
  customReason?: string;
  description?: string;
  targetId: string;
  targetType: ReportType;
  targetContent?: string;
  postId?: string; // 댓글 신고 시 필요
  reporterId: string;
  reporterInfo: {
    displayName: string;
    profileImageUrl?: string;
  };
  boardCode?: string;
  schoolId?: string;
  regions?: {
    sido: string;
    sigungu: string;
  };
}): Promise<Report> {
  try {
    // 신고 스팸 방지 검사
    const spamCheck = await checkReportSpam(data.reporterId);
    if (!spamCheck.canReport) {
      throw new Error(spamCheck.reason || '신고할 수 없습니다.');
    }

    const reportData: Omit<Report, 'id'> = {
      reason: data.reason,
      customReason: data.customReason,
      description: data.description,
      targetId: data.targetId,
      targetType: data.targetType,
      targetContent: data.targetContent,
      postId: data.postId, // 댓글 신고 시 어떤 게시글의 댓글인지 추적
      reporterId: data.reporterId,
      reporterInfo: data.reporterInfo,
      status: 'pending',
      createdAt: Date.now(),
      boardCode: data.boardCode,
      schoolId: data.schoolId,
      regions: data.regions,
    };

    const docRef = await addDoc(collection(db, 'reports'), reportData);
    
    const report = {
      id: docRef.id,
      ...reportData,
    };

    // 신고당한 사용자에게 알림 전송
    try {
      let targetUserId: string | null = null;

      if (data.targetType === 'user') {
        targetUserId = data.targetId;
      } else if (data.targetType === 'post') {
        // 게시글 신고 시 게시글 작성자 ID 조회
        const postDoc = await getDoc(doc(db, 'posts', data.targetId));
        if (postDoc.exists()) {
          targetUserId = postDoc.data().authorId;
        }
      } else if (data.targetType === 'comment') {
        // 댓글 신고 시 댓글 작성자 ID 조회
        if (data.postId) {
          const commentDoc = await getDoc(doc(db, 'posts', data.postId, 'comments', data.targetId));
          if (commentDoc.exists()) {
            targetUserId = commentDoc.data().authorId;
          }
        }
      }

      // 자기 자신을 신고한 경우는 알림 전송하지 않음
      if (targetUserId && targetUserId !== data.reporterId) {
        await createReportReceivedNotification(
          targetUserId,
          docRef.id,
          data.reporterInfo.displayName,
          data.targetType
        );
      }
    } catch (notificationError) {
      console.error('신고 알림 전송 실패:', notificationError);
      // 알림 전송 실패는 신고 생성 자체를 실패시키지 않음
    }
    
    return report;
  } catch (error) {
    console.error('신고 생성 실패:', error);
    throw error;
  }
}

// 신고 조회 (단일)
export async function getReport(reportId: string): Promise<Report | null> {
  try {
    const docRef = doc(db, 'reports', reportId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...docSnap.data(),
      } as Report;
    }
    
    return null;
  } catch (error) {
    console.error('신고 조회 실패:', error);
    throw error;
  }
}

// 사용자의 신고 내역 조회
export async function getUserReports(userId: string): Promise<UserReportRecord> {
  try {
    // 내가 신고한 내역
    const reportsMadeQuery = query(
      collection(db, 'reports'),
      where('reporterId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    const reportsMadeSnap = await getDocs(reportsMadeQuery);
    const reportsMade = reportsMadeSnap.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as Report[];

    // 나를 신고한 내역
    const reportsReceivedQuery = query(
      collection(db, 'reports'),
      where('targetId', '==', userId),
      where('targetType', '==', 'user'),
      orderBy('createdAt', 'desc')
    );
    const reportsReceivedSnap = await getDocs(reportsReceivedQuery);
    const reportsReceived = reportsReceivedSnap.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as Report[];

    // 통계 계산
    const stats = {
      totalReportsMade: reportsMade.length,
      totalReportsReceived: reportsReceived.length,
      warningsReceived: reportsReceived.filter(r => r.status === 'resolved' && r.actionTaken?.includes('경고')).length,
      suspensionsReceived: reportsReceived.filter(r => r.status === 'resolved' && r.actionTaken?.includes('정지')).length,
    };

    return {
      reportsMade,
      reportsReceived,
      stats,
    };
  } catch (error) {
    console.error('사용자 신고 내역 조회 실패:', error);
    throw error;
  }
}

// 신고 수정 (사용자가 자신의 신고를 수정)
export async function updateReport(reportId: string, data: {
  reason?: ReportReason;
  customReason?: string;
  description?: string;
}): Promise<void> {
  try {
    const docRef = doc(db, 'reports', reportId);
    await updateDoc(docRef, {
      ...data,
      updatedAt: Date.now(),
    });
  } catch (error) {
    console.error('신고 수정 실패:', error);
    throw error;
  }
}

// 신고 취소 (사용자가 자신의 신고를 삭제)
export async function cancelReport(reportId: string): Promise<void> {
  try {
    const docRef = doc(db, 'reports', reportId);
    await deleteDoc(docRef);
  } catch (error) {
    console.error('신고 취소 실패:', error);
    throw error;
  }
}

// 관리자용 - 모든 신고 조회
export async function getReports(
  status?: ReportStatus,
  type?: ReportType,
  pageSize: number = 20,
  lastDoc?: QueryDocumentSnapshot<DocumentData>
): Promise<{ reports: Report[]; lastDoc?: QueryDocumentSnapshot<DocumentData> }> {
  try {
    let q = query(
      collection(db, 'reports'),
      orderBy('createdAt', 'desc'),
      limit(pageSize)
    );

    if (status) {
      q = query(q, where('status', '==', status));
    }
    if (type) {
      q = query(q, where('type', '==', type));
    }
    if (lastDoc) {
      q = query(q, startAfter(lastDoc));
    }

    const querySnapshot = await getDocs(q);
    const reports = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as Report[];

    return {
      reports,
      lastDoc: querySnapshot.docs[querySnapshot.docs.length - 1],
    };
  } catch (error) {
    console.error('신고 목록 조회 실패:', error);
    throw error;
  }
}

// 관리자용 - 신고 처리
export async function processReport(
  reportId: string,
  status: ReportStatus,
  adminId: string,
  adminNote?: string,
  actionTaken?: string
): Promise<void> {
  try {
    const docRef = doc(db, 'reports', reportId);
    
    // 기존 신고 정보 조회
    const reportDoc = await getDoc(docRef);
    if (!reportDoc.exists()) {
      throw new Error('신고를 찾을 수 없습니다.');
    }
    
    const reportData = reportDoc.data() as Report;
    
    const updateData: Partial<Report> = {
      status,
      adminId,
      updatedAt: Date.now(),
    };

    if (adminNote) updateData.adminNote = adminNote;
    if (actionTaken) updateData.actionTaken = actionTaken;
    if (status === 'resolved') updateData.resolvedAt = Date.now();

    await updateDoc(docRef, updateData);

    // 신고 처리 완료 알림 전송
    try {
      // 1. 신고자에게 처리 완료 알림
      const { createReportResolvedNotification } = await import('./notifications');
      await createReportResolvedNotification(
        reportData.reporterId,
        reportId,
        reportData.targetType,
        actionTaken || (status === 'resolved' ? '검토 완료' : '반려')
      );

      // 2. 신고당한 사용자에게 제재 알림 (필요한 경우)
      if (status === 'resolved' && actionTaken) {
        let targetUserId: string | null = null;

        if (reportData.targetType === 'user') {
          targetUserId = reportData.targetId;
        } else if (reportData.targetType === 'post') {
          const postDoc = await getDoc(doc(db, 'posts', reportData.targetId));
          if (postDoc.exists()) {
            targetUserId = postDoc.data()?.authorId;
          }
        } else if (reportData.targetType === 'comment' && reportData.postId) {
          const commentDoc = await getDoc(doc(db, 'posts', reportData.postId, 'comments', reportData.targetId));
          if (commentDoc.exists()) {
            targetUserId = commentDoc.data()?.authorId;
          }
        }

        if (targetUserId && targetUserId !== reportData.reporterId) {
          const { createSanctionNotification } = await import('./notifications');
          
          if (actionTaken.includes('경고')) {
            await createSanctionNotification(
              targetUserId,
              'warning',
              `신고 처리 결과: ${actionTaken}`
            );
          } else if (actionTaken.includes('정지')) {
            await createSanctionNotification(
              targetUserId,
              'suspension',
              `신고 처리 결과: ${actionTaken}`,
              actionTaken.includes('일') ? actionTaken : undefined
            );
          }
        }
      }
    } catch (notificationError) {
      console.error('신고 처리 알림 전송 실패:', notificationError);
      // 알림 전송 실패는 신고 처리 자체를 실패시키지 않음
    }
  } catch (error) {
    console.error('신고 처리 실패:', error);
    throw error;
  }
}

// 관리자용 - 신고 통계 조회
export async function getReportStats(): Promise<ReportStats> {
  try {
    const allReportsQuery = query(collection(db, 'reports'));
    const allReportsSnap = await getDocs(allReportsQuery);
    const allReports = allReportsSnap.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as Report[];

    // 최근 신고 조회
    const recentReportsQuery = query(
      collection(db, 'reports'),
      orderBy('createdAt', 'desc'),
      limit(10)
    );
    const recentReportsSnap = await getDocs(recentReportsQuery);
    const recentReports = recentReportsSnap.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as Report[];

    // 통계 계산
    const totalReports = allReports.length;
    const pendingReports = allReports.filter(r => r.status === 'pending').length;
    const resolvedReports = allReports.filter(r => r.status === 'resolved').length;
    const rejectedReports = allReports.filter(r => r.status === 'rejected').length;

    // 사유별 통계
    const reportsByReason: Record<ReportReason, number> = {
      spam: 0,
      inappropriate: 0,
      harassment: 0,
      fake: 0,
      copyright: 0,
      privacy: 0,
      violence: 0,
      sexual: 0,
      hate: 0,
      other: 0,
    };

    // 타입별 통계
    const reportsByType: Record<ReportType, number> = {
      post: 0,
      comment: 0,
      user: 0,
    };

    allReports.forEach(report => {
      reportsByReason[report.reason]++;
      reportsByType[report.type]++;
    });

    return {
      totalReports,
      pendingReports,
      resolvedReports,
      rejectedReports,
      reportsByReason,
      reportsByType,
      recentReports,
    };
  } catch (error) {
    console.error('신고 통계 조회 실패:', error);
    throw error;
  }
}

// 특정 대상에 대한 신고 조회
export async function getReportsByTarget(
  targetId: string,
  targetType: ReportType
): Promise<Report[]> {
  try {
    const q = query(
      collection(db, 'reports'),
      where('targetId', '==', targetId),
      where('targetType', '==', targetType),
      orderBy('createdAt', 'desc')
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as Report[];
  } catch (error) {
    console.error('대상별 신고 조회 실패:', error);
    throw error;
  }
}

// 사용자가 이미 신고했는지 확인
export async function hasUserReported(
  reporterId: string,
  targetId: string,
  targetType: ReportType
): Promise<boolean> {
  try {
    const q = query(
      collection(db, 'reports'),
      where('reporterId', '==', reporterId),
      where('targetId', '==', targetId),
      where('targetType', '==', targetType),
      limit(1)
    );

    const querySnapshot = await getDocs(q);
    return !querySnapshot.empty;
  } catch (error) {
    console.error('중복 신고 확인 실패:', error);
    throw error;
  }
} 

// 신고 스팸 방지 검사
export async function checkReportSpam(reporterId: string): Promise<{
  canReport: boolean;
  reason?: string;
  remainingTime?: number;
}> {
  try {
    const now = Date.now();
    const oneHour = 60 * 60 * 1000;
    const oneDay = 24 * oneHour;
    
    // 최근 1시간 내 신고 횟수 확인
    const recentReportsQuery = query(
      collection(db, 'reports'),
      where('reporterId', '==', reporterId),
      where('createdAt', '>=', now - oneHour),
      orderBy('createdAt', 'desc')
    );
    
    const recentReportsSnap = await getDocs(recentReportsQuery);
    const recentReports = recentReportsSnap.docs.map(doc => doc.data() as Report);
    
    // 1시간 내 5회 이상 신고 시 제한
    if (recentReports.length >= 5) {
      const oldestReport = recentReports[recentReports.length - 1];
      const remainingTime = oneHour - (now - oldestReport.createdAt);
      
      return {
        canReport: false,
        reason: '너무 많은 신고를 했습니다. 잠시 후 다시 시도해주세요.',
        remainingTime: Math.ceil(remainingTime / (60 * 1000)) // 분 단위
      };
    }
    
    // 최근 24시간 내 신고 횟수 확인
    const dailyReportsQuery = query(
      collection(db, 'reports'),
      where('reporterId', '==', reporterId),
      where('createdAt', '>=', now - oneDay),
      orderBy('createdAt', 'desc')
    );
    
    const dailyReportsSnap = await getDocs(dailyReportsQuery);
    
    // 24시간 내 20회 이상 신고 시 제한
    if (dailyReportsSnap.size >= 20) {
      return {
        canReport: false,
        reason: '오늘 신고 한도를 초과했습니다. 내일 다시 시도해주세요.',
        remainingTime: Math.ceil((oneDay - (now - dailyReportsSnap.docs[dailyReportsSnap.docs.length - 1].data().createdAt)) / oneHour) // 시간 단위
      };
    }
    
    // 연속으로 반려된 신고가 5회 이상인 경우 제한
    const rejectedReportsQuery = query(
      collection(db, 'reports'),
      where('reporterId', '==', reporterId),
      where('status', '==', 'rejected'),
      orderBy('createdAt', 'desc'),
      limit(5)
    );
    
    const rejectedReportsSnap = await getDocs(rejectedReportsQuery);
    
    if (rejectedReportsSnap.size >= 5) {
      // 최근 5개 신고가 모두 반려된 경우
      const recentRejected = rejectedReportsSnap.docs.map(doc => doc.data() as Report);
      const allRecentlyRejected = recentRejected.every(report => 
        report.resolvedAt && (now - report.resolvedAt) < (7 * oneDay) // 7일 이내
      );
      
      if (allRecentlyRejected) {
        return {
          canReport: false,
          reason: '최근 신고가 여러 번 반려되어 일시적으로 신고 기능이 제한되었습니다.',
          remainingTime: 24 // 24시간 제한
        };
      }
    }
    
    return { canReport: true };
  } catch (error) {
    console.error('신고 스팸 검사 실패:', error);
    // 에러 발생 시 신고 허용 (안전한 기본값)
    return { canReport: true };
  }
} 