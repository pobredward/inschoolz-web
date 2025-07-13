import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Trophy, Star, Zap, Gift } from 'lucide-react';

interface ExperienceModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: {
    expGained: number;
    activityType: 'post' | 'comment' | 'like';
    leveledUp: boolean;
    oldLevel?: number;
    newLevel?: number;
    currentExp: number;
    expToNextLevel: number;
    remainingCount: number;
    totalDailyLimit: number;
    reason?: string;
  };
}

const activityLabels = {
  post: '게시글 작성',
  comment: '댓글 작성',
  like: '좋아요'
};

const activityIcons = {
  post: <Zap className="w-5 h-5" />,
  comment: <Star className="w-5 h-5" />,
  like: <Gift className="w-5 h-5" />
};

export const ExperienceModal: React.FC<ExperienceModalProps> = ({
  isOpen,
  onClose,
  data
}) => {
  const progressPercentage = (data.currentExp / data.expToNextLevel) * 100;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-green-600">
            {data.leveledUp ? (
              <>
                <Trophy className="w-6 h-6 text-yellow-500" />
                레벨업!
              </>
            ) : (
              <>
                {activityIcons[data.activityType]}
                경험치 획득
              </>
            )}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* 경험치 획득 정보 */}
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600 mb-1">
              +{data.expGained} XP
            </div>
            <div className="text-sm text-gray-600">
              {activityLabels[data.activityType]}으로 경험치를 획득했습니다!
            </div>
          </div>

          {/* 레벨업 정보 */}
          {data.leveledUp && data.oldLevel && data.newLevel && (
            <div className="text-center p-4 bg-yellow-50 rounded-lg border border-yellow-200">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Trophy className="w-6 h-6 text-yellow-500" />
                <span className="text-lg font-bold text-yellow-700">
                  레벨 {data.oldLevel} → {data.newLevel}
                </span>
              </div>
              <div className="text-sm text-yellow-600">
                축하합니다! 레벨이 올랐습니다!
              </div>
            </div>
          )}

          {/* 현재 레벨 진행도 */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">
                레벨 {data.newLevel || data.oldLevel || 1} 진행도
              </span>
              <span className="text-sm text-gray-500">
                {data.currentExp} / {data.expToNextLevel} XP
              </span>
            </div>
            <Progress value={progressPercentage} className="h-2" />
          </div>

          {/* 남은 횟수 정보 */}
          <div className="p-3 bg-blue-50 rounded-lg">
            <div className="flex justify-between items-center">
              <span className="text-sm text-blue-700">
                오늘 {activityLabels[data.activityType]} 경험치
              </span>
              <Badge variant="outline" className="text-blue-600 border-blue-200">
                {data.remainingCount}/{data.totalDailyLimit} 남음
              </Badge>
            </div>
            {data.remainingCount === 0 && (
              <div className="text-xs text-blue-600 mt-1">
                오늘의 {activityLabels[data.activityType]} 경험치 한도를 모두 사용했습니다.
              </div>
            )}
          </div>

          {/* 확인 버튼 */}
          <Button onClick={onClose} className="w-full">
            확인
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}; 