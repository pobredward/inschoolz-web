import { doc, getDoc, updateDoc, increment, FieldValue } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { User } from '@/types';
import { updateUserExperience, getSystemSettings } from '@/lib/experience';
import { getKoreanDateString } from '@/lib/utils';

export type GameType = 'reactionGame' | 'tileGame' | 'flappyBird';

export interface GameResult {
  success: boolean;
  message?: string;
  xpEarned?: number;
  leveledUp?: boolean;
  oldLevel?: number;
  newLevel?: number;
  remainingAttempts?: number;
}

export interface GameStatsResponse {
  success: boolean;
  message?: string;
  data?: {
    todayPlays: Record<GameType, number>;
    maxPlays: number;
    bestReactionTimes: Record<GameType, number | null>;
    totalXpEarned: number;
  };
}

// 반응시간에 따른 경험치 계산 (Firebase 설정 기반)
const calculateGameXP = async (gameType: GameType, reactionTime: number): Promise<number> => {
  try {
    const settings = await getSystemSettings();
    
    // 디버깅을 위한 로그 추가
    console.log('calculateGameXP - gameType:', gameType, 'reactionTime:', reactionTime);
    console.log('calculateGameXP - settings.gameSettings:', settings.gameSettings);
    
    // 게임 타입에 따라 적절한 설정 선택
    if (gameType === 'reactionGame' && settings.gameSettings.reactionGame.thresholds) {
      const thresholds = settings.gameSettings.reactionGame.thresholds;
      console.log('calculateGameXP - reactionGame thresholds:', thresholds);
      
      // 반응속도 게임은 시간이 짧을수록 좋으므로 오름차순 정렬 (가장 빠른 시간부터)
      const sortedThresholds = [...thresholds].sort((a, b) => a.minScore - b.minScore);
      console.log('calculateGameXP - sorted thresholds:', sortedThresholds);
      
      // 반응시간이 임계값 이하인 첫 번째 임계값의 경험치 반환
      for (const threshold of sortedThresholds) {
        console.log(`calculateGameXP - checking: ${reactionTime} <= ${threshold.minScore} ? ${reactionTime <= threshold.minScore}`);
        if (reactionTime <= threshold.minScore) {
          console.log(`calculateGameXP - 경험치 ${threshold.xpReward} 지급! (${reactionTime}ms <= ${threshold.minScore}ms)`);
          return threshold.xpReward;
        }
      }
      console.log('calculateGameXP - 어떤 임계값도 만족하지 않음');
    } else if (gameType === 'tileGame' && settings.gameSettings.tileGame.thresholds) {
      // 타일 게임은 점수가 높을수록 좋으므로 내림차순 정렬
      const sortedThresholds = [...settings.gameSettings.tileGame.thresholds].sort((a, b) => b.minScore - a.minScore);
      
      // 점수가 임계값 이상인 첫 번째 임계값의 경험치 반환
      for (const threshold of sortedThresholds) {
        if (reactionTime >= threshold.minScore) {
          return threshold.xpReward;
        }
      }
    } else if (gameType === 'flappyBird') {
      // flappyBird는 기본 경험치 반환
      return settings.gameSettings.flappyBird.rewardAmount;
    }
    
    console.log('calculateGameXP - 0 XP 반환');
    return 0; // 어떤 threshold도 만족하지 않으면 0 XP
  } catch (error) {
    console.error('경험치 계산 중 오류:', error);
    return 0;
  }
};

// 게임 점수 업데이트 및 경험치 지급
export const updateGameScore = async (userId: string, gameType: GameType, score: number, reactionTime?: number): Promise<GameResult> => {
  try {
    // 캐시 무효화하여 최신 Firebase 설정 가져오기
    const { invalidateSystemSettingsCache } = await import('../experience');
    invalidateSystemSettingsCache();
    
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      return {
        success: false,
        message: '사용자를 찾을 수 없습니다.'
      };
    }

    const userData = userDoc.data() as User;
    
    // 현재 최저 반응시간 확인 (반응속도 게임의 경우)
    const currentBestReactionTime = userData.gameStats?.[gameType]?.bestReactionTime || null;
    const isBestReactionTime = gameType === 'reactionGame' && reactionTime && 
      (currentBestReactionTime === null || reactionTime < currentBestReactionTime);
    
    // 게임 통계 업데이트
    const updateData: Record<string, number | string | FieldValue> = {};
    
    // 최저 반응시간 업데이트 (반응속도 게임의 경우)
    if (isBestReactionTime && reactionTime) {
      updateData[`gameStats.${gameType}.bestReactionTime`] = reactionTime;
    }
    
    // 일일 플레이 카운트 증가 (날짜 체크 불필요 - 접속 시점에 이미 리셋됨)
    updateData[`activityLimits.dailyCounts.games.${gameType}`] = increment(1);
    
    // Firestore 업데이트
    await updateDoc(userRef, updateData);
    
    // 경험치 계산 및 지급 (반응시간 기반)
    const xpEarned = await calculateGameXP(gameType, reactionTime || 1000);
    
    let result: { leveledUp: boolean; oldLevel?: number; newLevel?: number } = { 
      leveledUp: false, 
      oldLevel: undefined, 
      newLevel: undefined 
    };
    
    if (xpEarned > 0) {
      result = await updateUserExperience(userId, xpEarned);
    }
    
    return {
      success: true,
      leveledUp: result.leveledUp,
      oldLevel: result.oldLevel,
      newLevel: result.newLevel,
      xpEarned,
      message: '게임 점수가 성공적으로 저장되었습니다.'
    };
    
  } catch (error) {
    console.error('게임 점수 업데이트 실패:', error);
    return {
      success: false,
      message: '점수 저장 중 오류가 발생했습니다.'
    };
  }
};

// 사용자 게임 통계 조회
export const getUserGameStats = async (userId: string): Promise<GameStatsResponse> => {
  try {
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      return {
        success: false,
        message: '사용자를 찾을 수 없습니다.'
      };
    }
    
    const userData = userDoc.data() as User;
    const today = getKoreanDateString(); // 한국 시간 기준 날짜 사용
    
    // 날짜 체크 - 새로운 날이거나 데이터가 없으면 기본값 반환
    const activityLimits = userData.activityLimits;
    const isNewDay = !activityLimits || activityLimits.lastResetDate !== today;
    
    // 오늘 플레이 횟수 (새로운 날이면 모두 0으로 초기화)
    const todayPlays = isNewDay ? {
      flappyBird: 0,
      reactionGame: 0,
      tileGame: 0,
    } : {
      flappyBird: activityLimits.dailyCounts?.games?.flappyBird || 0,
      reactionGame: activityLimits.dailyCounts?.games?.reactionGame || 0,
      tileGame: activityLimits.dailyCounts?.games?.tileGame || 0,
    };
    
    // 최저 반응시간 및 최고 점수
    const bestReactionTimes = {
      flappyBird: userData.gameStats?.flappyBird?.bestReactionTime || null,
      reactionGame: userData.gameStats?.reactionGame?.bestReactionTime || null,
      tileGame: userData.gameStats?.tileGame?.bestReactionTime || null,
    };
    
    // 일일 최대 플레이 횟수
    const maxPlays = 5;
    
    // 게임별 획득 가능한 경험치 계산
    let totalXpEarned = 0;
    
    // 반응속도 게임 경험치 계산
    if (bestReactionTimes.reactionGame) {
      const reactionXp = await calculateGameXP('reactionGame', bestReactionTimes.reactionGame);
      totalXpEarned += reactionXp;
    }
    
    // 타일 게임 경험치 계산
    if (bestReactionTimes.tileGame) {
      const tileXp = await calculateGameXP('tileGame', bestReactionTimes.tileGame);
      totalXpEarned += tileXp;
    }
    
    // FlappyBird 게임 경험치 계산
    if (bestReactionTimes.flappyBird) {
      const flappyXp = await calculateGameXP('flappyBird', bestReactionTimes.flappyBird);
      totalXpEarned += flappyXp;
    }
    
    return {
      success: true,
      data: {
        todayPlays,
        maxPlays,
        bestReactionTimes,
        totalXpEarned
      }
    };
    
  } catch (error) {
    console.error('게임 통계 조회 실패:', error);
    return {
      success: false,
      message: '게임 통계를 불러오는 중 오류가 발생했습니다.'
    };
  }
}; 