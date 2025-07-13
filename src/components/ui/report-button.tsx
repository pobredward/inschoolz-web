'use client';

import { useState } from 'react';
import { Flag, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ReportModal } from './report-modal';
import { ReportType } from '@/types';
import { useAuth } from '@/providers/AuthProvider';
import { hasUserReported } from '@/lib/api/reports';
import { checkReportSpam } from '@/lib/api/reports';
import { useEffect } from 'react';
import { toast } from 'sonner';

interface ReportButtonProps {
  targetId: string;
  targetType: ReportType;
  targetContent?: string;
  postId?: string; // 댓글 신고 시 필요
  className?: string;
  variant?: 'default' | 'ghost' | 'outline';
  size?: 'sm' | 'lg';
  boardCode?: string;
  schoolId?: string;
  regions?: {
    sido: string;
    sigungu: string;
  };
}

export function ReportButton({
  targetId,
  targetType,
  targetContent,
  postId,
  className,
  variant = 'ghost',
  size = 'sm',
  boardCode,
  schoolId,
  regions,
}: ReportButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [hasReported, setHasReported] = useState(false);

  const { user } = useAuth();

  // 이미 신고했는지 확인
  useEffect(() => {
    const checkReported = async () => {
      if (!user) return;
      
      try {
        const reported = await hasUserReported(user.uid, targetId, targetType);
        setHasReported(reported);
      } catch (error) {
        console.error('신고 확인 실패:', error);
      }
    };

    checkReported();
  }, [user, targetId, targetType]);

  const handleReportClick = async () => {
    if (!user) {
      toast.error('로그인이 필요합니다.');
      return;
    }

    if (hasReported) {
      toast.warning('이미 신고한 내용입니다.');
      return;
    }

    // 신고 스팸 방지 검사
    try {
      const spamCheck = await checkReportSpam(user.uid);
      if (!spamCheck.canReport) {
        const timeMessage = spamCheck.remainingTime 
          ? ` (${spamCheck.remainingTime}${spamCheck.remainingTime > 60 ? '시간' : '분'} 후 다시 시도 가능)`
          : '';
        toast.error(`${spamCheck.reason}${timeMessage}`);
        return;
      }
    } catch (error) {
      console.error('신고 스팸 검사 실패:', error);
      // 검사 실패 시에도 신고 허용
    }

    setIsModalOpen(true);
  };

  const handleReportSuccess = () => {
    setHasReported(true);
    setIsModalOpen(false);
    toast.success('신고가 접수되었습니다.');
  };

  const getButtonText = () => {
    if (hasReported) return '신고됨';
    return '신고';
  };

  const getIcon = () => {
    if (hasReported) return AlertTriangle;
    return Flag;
  };

  const Icon = getIcon();

  return (
    <>
      <Button
        variant={variant}
        size={size}
        onClick={handleReportClick}
        disabled={hasReported}
        className={className}
      >
        <Icon className="w-4 h-4 mr-1" />
        {getButtonText()}
      </Button>

      <ReportModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        targetId={targetId}
        targetType={targetType}
        targetContent={targetContent}
        postId={postId}
        onSuccess={handleReportSuccess}
        boardCode={boardCode}
        schoolId={schoolId}
        regions={regions}
      />
    </>
  );
} 